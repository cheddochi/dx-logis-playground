"""
예측 엔진 - HTML 시스템의 JS 예측 로직을 Python으로 구현
예측 공식: base_2025 × YoY성장률 × 환율보정 × 면세한도 × 월별보정 × 이벤트스파이크
"""
from schemas import PredictionRequest, PredictionMonth, PredictionResponse

# 면세 한도별 수입 건수/금액 보정 계수 (추정치)
EXEMPTION_MAP: dict[int, dict] = {
    100: {"cnt_mult": 0.88, "amt_mult": 0.94},
    150: {"cnt_mult": 1.00, "amt_mult": 1.00},
    200: {"cnt_mult": 1.08, "amt_mult": 1.04},
    300: {"cnt_mult": 1.18, "amt_mult": 1.09},
    0:   {"cnt_mult": 1.30, "amt_mult": 1.15},   # 폐지
}


def compute_predictions(
    params: PredictionRequest,
    base_imp: list[int],        # 2025년 3~12월 수입 금액 (10개, 단위: 천원)
    base_exp: list[int],        # 2025년 3~12월 수출 금액 (10개, 단위: 천원)
    base_imp_cnt: list[int],    # 2025년 3~12월 수입 건수
    base_exp_cnt: list[int],    # 2025년 3~12월 수출 건수
) -> PredictionResponse:

    ig  = params.imp_growth    / 100
    eg  = params.exp_growth    / 100
    er  = params.exchange_rate / 100
    em  = EXEMPTION_MAP.get(params.exemption_limit, EXEMPTION_MAP[150])

    predictions: list[PredictionMonth] = []

    for i in range(10):
        month     = i + 3
        mia       = params.monthly_imp_adj[i] / 100
        mea       = params.monthly_exp_adj[i] / 100

        # 이벤트 스파이크 합산
        ev_imp = ev_exp = 0.0
        for ev in params.events:
            if ev.active and ev.month_idx == i:
                sp = ev.spike / 100
                if ev.ev_type in ("imp", "both"):
                    ev_imp += sp
                if ev.ev_type in ("exp", "both"):
                    ev_exp += sp

        bi, be     = base_imp[i],     base_exp[i]
        bi_cnt, be_cnt = base_imp_cnt[i], base_exp_cnt[i]

        pred_imp     = round(bi     * (1+ig) * (1+er) * (1+mia) * (1+ev_imp) * em["amt_mult"])
        pred_exp     = round(be     * (1+eg)           * (1+mea) * (1+ev_exp))
        pred_imp_cnt = round(bi_cnt * (1+ig) * em["cnt_mult"] * (1+mia) * (1+ev_imp))
        pred_exp_cnt = round(be_cnt * (1+eg)           * (1+mea) * (1+ev_exp))

        imp_yoy = round((pred_imp - bi) / bi * 100, 2) if bi else 0
        exp_yoy = round((pred_exp - be) / be * 100, 2) if be else 0

        predictions.append(PredictionMonth(
            month=month,
            imp=pred_imp, exp=pred_exp,
            imp_cnt=pred_imp_cnt, exp_cnt=pred_exp_cnt,
            imp_base=bi, exp_base=be,
            imp_yoy=imp_yoy, exp_yoy=exp_yoy,
        ))

    imp_total      = sum(p.imp      for p in predictions)
    exp_total      = sum(p.exp      for p in predictions)
    imp_base_total = sum(p.imp_base for p in predictions)
    exp_base_total = sum(p.exp_base for p in predictions)

    return PredictionResponse(
        params=params,
        predictions=predictions,
        imp_total=imp_total,
        exp_total=exp_total,
        imp_base_total=imp_base_total,
        exp_base_total=exp_base_total,
        imp_total_yoy=round((imp_total - imp_base_total) / imp_base_total * 100, 2) if imp_base_total else 0,
        exp_total_yoy=round((exp_total - exp_base_total) / exp_base_total * 100, 2) if exp_base_total else 0,
    )
