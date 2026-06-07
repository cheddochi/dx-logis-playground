from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import EcommerceTrade, PredictionParams
from schemas import PredictionRequest, PredictionResponse, SaveParamsRequest, SavedParamsOut
from utils.prediction_engine import compute_predictions

router = APIRouter(tags=["predictions"])

# 2025년 3~12월 기준 데이터 캐시 (첫 요청 시 DB에서 로드)
_base_cache: dict = {}


async def _load_base_data(db: AsyncSession) -> dict:
    """2025년 수출입 기준 데이터 로드 (캐시)"""
    if _base_cache:
        return _base_cache

    result = await db.execute(
        select(EcommerceTrade)
        .where(EcommerceTrade.year == 2025)
        .order_by(EcommerceTrade.month, EcommerceTrade.trade_type)
    )
    rows = result.scalars().all()

    imp_amt  = {r.month: r.amount            for r in rows if r.trade_type == "import"}
    exp_amt  = {r.month: r.amount            for r in rows if r.trade_type == "export"}
    imp_cnt  = {r.month: r.transaction_count for r in rows if r.trade_type == "import"}
    exp_cnt  = {r.month: r.transaction_count for r in rows if r.trade_type == "export"}

    # 3~12월 (index 0~9)
    months = list(range(3, 13))
    _base_cache.update({
        "imp_amt":  [imp_amt.get(m, 0) for m in months],
        "exp_amt":  [exp_amt.get(m, 0) for m in months],
        "imp_cnt":  [imp_cnt.get(m, 0) for m in months],
        "exp_cnt":  [exp_cnt.get(m, 0) for m in months],
    })
    return _base_cache


@router.post("/compute", response_model=PredictionResponse)
async def compute(
    body: PredictionRequest,
    db: AsyncSession = Depends(get_db),
):
    """파라미터를 받아 2026년 3~12월 예측값 계산"""
    base = await _load_base_data(db)
    return compute_predictions(
        params=body,
        base_imp=base["imp_amt"],
        base_exp=base["exp_amt"],
        base_imp_cnt=base["imp_cnt"],
        base_exp_cnt=base["exp_cnt"],
    )


@router.post("/save", response_model=SavedParamsOut)
async def save_params(body: SaveParamsRequest, db: AsyncSession = Depends(get_db)):
    """예측 파라미터 저장"""
    p = body.params
    record = PredictionParams(
        param_name=body.param_name,
        imp_growth=p.imp_growth,
        exp_growth=p.exp_growth,
        exchange_rate=p.exchange_rate,
        exemption_limit=p.exemption_limit,
        monthly_imp_adj=p.monthly_imp_adj,
        monthly_exp_adj=p.monthly_exp_adj,
        events=[e.model_dump(by_alias=True) for e in p.events],
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/saved", response_model=list[SavedParamsOut])
async def list_saved_params(db: AsyncSession = Depends(get_db)):
    """저장된 파라미터 목록"""
    result = await db.execute(
        select(PredictionParams).order_by(PredictionParams.created_at.desc())
    )
    return result.scalars().all()


@router.get("/saved/{param_id}", response_model=SavedParamsOut)
async def get_saved_params(param_id: int, db: AsyncSession = Depends(get_db)):
    """저장된 파라미터 조회"""
    result = await db.execute(
        select(PredictionParams).where(PredictionParams.id == param_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="파라미터를 찾을 수 없습니다.")
    return record
