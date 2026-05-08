from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Trade Data ───────────────────────────────────────────────
class TradeDataOut(BaseModel):
    id: int
    year: int
    month: int
    trade_type: str
    amount: int
    transaction_count: int
    total_amount: Optional[int]
    total_count: Optional[int]

    class Config:
        from_attributes = True


# ── Seasonal Index ────────────────────────────────────────────
class SeasonalIndexOut(BaseModel):
    month: int
    imp_index: float
    exp_index: float

    class Config:
        from_attributes = True


# ── Events ────────────────────────────────────────────────────
class EventParam(BaseModel):
    id: str
    name: str
    month: int
    month_idx: int
    ev_type: str = Field(..., alias="type")   # imp | exp | both
    spike: float = 0
    active: bool = False

    class Config:
        populate_by_name = True


# ── Prediction Params ─────────────────────────────────────────
class PredictionRequest(BaseModel):
    imp_growth: float = 2.1
    exp_growth: float = 16.5
    exchange_rate: float = 0.0
    exemption_limit: int = 150
    monthly_imp_adj: list[float] = Field(default=[0.0] * 10)
    monthly_exp_adj: list[float] = Field(default=[0.0] * 10)
    events: list[EventParam] = []


class PredictionMonth(BaseModel):
    month: int
    imp: int
    exp: int
    imp_cnt: int
    exp_cnt: int
    imp_base: int
    exp_base: int
    imp_yoy: float
    exp_yoy: float


class PredictionResponse(BaseModel):
    params: PredictionRequest
    predictions: list[PredictionMonth]
    imp_total: int
    exp_total: int
    imp_base_total: int
    exp_base_total: int
    imp_total_yoy: float
    exp_total_yoy: float


# ── Save/Load Params ─────────────────────────────────────────
class SaveParamsRequest(BaseModel):
    param_name: str
    params: PredictionRequest


class SavedParamsOut(BaseModel):
    id: int
    param_name: str
    imp_growth: float
    exp_growth: float
    exchange_rate: float
    exemption_limit: int
    monthly_imp_adj: list
    monthly_exp_adj: list
    events: list
    created_at: datetime

    class Config:
        from_attributes = True


# ── Report ────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    prediction: PredictionResponse
    api_key: Optional[str] = None     # AI 보고서 생성 시 사용
