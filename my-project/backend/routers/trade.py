from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from database import get_db
from models import EcommerceTrade, SeasonalIndex
from schemas import TradeDataOut, SeasonalIndexOut

router = APIRouter(tags=["trade"])


@router.get("/", response_model=list[TradeDataOut])
async def get_trade_data(
    year:       Optional[int] = Query(None),
    trade_type: Optional[str] = Query(None, regex="^(import|export)$"),
    db: AsyncSession = Depends(get_db),
):
    """수출입 데이터 조회 - 연도·유형 필터 가능"""
    stmt = select(EcommerceTrade).order_by(EcommerceTrade.year, EcommerceTrade.month, EcommerceTrade.trade_type)
    if year:
        stmt = stmt.where(EcommerceTrade.year == year)
    if trade_type:
        stmt = stmt.where(EcommerceTrade.trade_type == trade_type)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/years", response_model=list[int])
async def get_available_years(db: AsyncSession = Depends(get_db)):
    """데이터가 있는 연도 목록 반환"""
    result = await db.execute(
        select(EcommerceTrade.year).distinct().order_by(EcommerceTrade.year)
    )
    return [r[0] for r in result.fetchall()]


@router.get("/summary", response_model=list[dict])
async def get_annual_summary(db: AsyncSession = Depends(get_db)):
    """연도별 수출입 합계 요약"""
    result = await db.execute(
        select(
            EcommerceTrade.year,
            EcommerceTrade.trade_type,
            func.sum(EcommerceTrade.amount).label("total_amount"),
            func.sum(EcommerceTrade.transaction_count).label("total_count"),
        )
        .group_by(EcommerceTrade.year, EcommerceTrade.trade_type)
        .order_by(EcommerceTrade.year, EcommerceTrade.trade_type)
    )
    return [
        {"year": r.year, "trade_type": r.trade_type,
         "total_amount": r.total_amount, "total_count": r.total_count}
        for r in result.fetchall()
    ]


@router.get("/seasonal-index", response_model=list[SeasonalIndexOut])
async def get_seasonal_index(db: AsyncSession = Depends(get_db)):
    """월별 계절지수 반환"""
    result = await db.execute(select(SeasonalIndex).order_by(SeasonalIndex.month))
    return result.scalars().all()
