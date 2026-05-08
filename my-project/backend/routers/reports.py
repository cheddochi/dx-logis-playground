from fastapi import APIRouter, HTTPException
from schemas import ReportRequest
import httpx

router = APIRouter(tags=["reports"])

MONTH_NAMES = ["", "1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]

EXEMPTION_NOTES = {
    100: "수입 건수 약 -12% 감소",
    150: "현행 기준 유지",
    200: "수입 건수 약 +8% 증가",
    300: "수입 건수 약 +18% 증가",
    0:   "수입 건수 약 +30% 증가 (폐지)",
}


def _build_prompt(req: ReportRequest) -> str:
    pred = req.prediction
    p    = pred.params
    active_evs = [e for e in p.events if e.active]
    ev_str = ", ".join(f"{e.name}({e.month}월 +{e.spike}%)" for e in active_evs) or "없음"
    ex_note = EXEMPTION_NOTES.get(p.exemption_limit, "")
    monthly_detail = "\n".join(
        f"  {m.month}월: 수입 {m.imp/1e5:,.0f}억원(YoY {m.imp_yoy:+.1f}%), 수출 {m.exp/1e5:,.0f}억원(YoY {m.exp_yoy:+.1f}%)"
        for m in pred.predictions
    )

    return f"""당신은 한국 전자상거래 무역 전문가입니다. 아래 예측 결과를 바탕으로 한국어 분석 보고서를 작성해주세요.

[파라미터]
- 수입 YoY: {p.imp_growth:+.1f}%, 수출 YoY: {p.exp_growth:+.1f}%
- 환율 변동: {p.exchange_rate:+.1f}%, 면세 한도: {"폐지" if p.exemption_limit==0 else "$"+str(p.exemption_limit)} ({ex_note})
- 활성 이벤트: {ev_str}

[예측 결과 (2026년 3~12월)]
- 수입 합계: {pred.imp_total/1e9:.2f}조원 (YoY {pred.imp_total_yoy:+.1f}%)
- 수출 합계: {pred.exp_total/1e9:.2f}조원 (YoY {pred.exp_total_yoy:+.1f}%)

[월별 상세]
{monthly_detail}

보고서 형식 (각 섹션 400자 내외):
### 1. 종합 예측 요약
### 2. 수입 동향 분석
### 3. 수출 동향 분석
### 4. 리스크 및 업사이드 요인
### 5. 시사점 및 정책 제언"""


@router.post("/local")
async def generate_local_report(req: ReportRequest) -> dict:
    """파라미터 기반 자동 보고서 생성 (API 키 불필요)"""
    pred = req.prediction
    p    = pred.params
    preds = pred.predictions

    peak_imp = max(preds, key=lambda x: x.imp)
    peak_exp = max(preds, key=lambda x: x.exp)
    active_evs = [e for e in p.events if e.active]

    report = {
        "type": "local",
        "sections": {
            "summary": (
                f"2026년 3~12월 전자상거래 수입은 {pred.imp_total/1e9:.2f}조원(YoY {pred.imp_total_yoy:+.1f}%), "
                f"수출은 {pred.exp_total/1e9:.2f}조원(YoY {pred.exp_total_yoy:+.1f}%)으로 예측됩니다. "
                f"수출 성장률이 수입을 크게 상회하며 전자상거래 무역수지 개선이 기대됩니다."
            ),
            "import_analysis": (
                f"수입 최고치는 {MONTH_NAMES[peak_imp.month]}({peak_imp.imp/1e5:,.0f}억원)으로 전망됩니다. "
                f"환율 {p.exchange_rate:+.1f}% 변동과 면세 한도 "
                f"{'폐지' if p.exemption_limit==0 else '$'+str(p.exemption_limit)} 시나리오가 반영되었습니다. "
                + (f"{', '.join(e.name for e in active_evs if e.ev_type in ('imp','both'))} 이벤트 효과가 포함됩니다."
                   if any(e.ev_type in ('imp','both') for e in active_evs) else "")
            ),
            "export_analysis": (
                f"수출 최고치는 {MONTH_NAMES[peak_exp.month]}({peak_exp.exp/1e5:,.0f}억원)입니다. "
                f"2026년 1~2월 실측 YoY +30.6%의 강세 흐름이 주요 근거이며, "
                + (f"{', '.join(e.name for e in active_evs if e.ev_type in ('exp','both'))} 이벤트 스파이크가 반영되었습니다."
                   if any(e.ev_type in ('exp','both') for e in active_evs) else "K-뷰티·패션 직판 채널 확대 추세가 지속될 것으로 전망됩니다.")
            ),
            "risk": (
                "상방 리스크: 원/달러 추가 약세 시 수입 금액 증가, K-콘텐츠 연계 소비재 수출 가속화. "
                "하방 리스크: 글로벌 경기 둔화, 중국 플랫폼 규제 강화, 면세 한도 축소 정책. "
                "본 예측은 추세 기반 통계 모델이며 돌발 정책 변화에 취약합니다."
            ),
            "implications": (
                f"수출 성장률({p.exp_growth:+.1f}%)이 수입({p.imp_growth:+.1f}%)을 상회하는 구조는 "
                "전자상거래 무역수지 개선을 시사합니다. 해외직판 플랫폼 고도화 및 "
                "물류 인프라 투자 확대가 지속 필요하며, 면세 한도 정책의 신중한 설계가 요구됩니다."
            ),
        },
        "table": [
            {
                "month": m.month,
                "imp_100m": round(m.imp / 1e5),
                "exp_100m": round(m.exp / 1e5),
                "imp_yoy": m.imp_yoy,
                "exp_yoy": m.exp_yoy,
            }
            for m in preds
        ],
    }
    return report


@router.post("/ai")
async def generate_ai_report(req: ReportRequest) -> dict:
    """Claude API를 통한 AI 분석 보고서 생성"""
    if not req.api_key:
        raise HTTPException(status_code=400, detail="API 키가 필요합니다.")

    prompt = _build_prompt(req)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": req.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}],
            },
        )

    if response.status_code != 200:
        err = response.json().get("error", {})
        raise HTTPException(
            status_code=response.status_code,
            detail=err.get("message", "Claude API 오류"),
        )

    data = response.json()
    text = data["content"][0]["text"] if data.get("content") else ""
    return {"type": "ai", "text": text}
