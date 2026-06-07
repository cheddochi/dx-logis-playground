from sqlalchemy import Integer, BigInteger, String, Numeric, ARRAY, JSON, DateTime, CheckConstraint, UniqueConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from database import Base

class EcommerceTrade(Base):
    __tablename__ = "ecommerce_trade"
    __table_args__ = (
        UniqueConstraint("year", "month", "trade_type", name="uq_trade"),
        CheckConstraint("trade_type IN ('import', 'export')", name="ck_trade_type"),
        CheckConstraint("month BETWEEN 1 AND 12", name="ck_month"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    trade_type: Mapped[str] = mapped_column(String(10), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, default=0)
    transaction_count: Mapped[int] = mapped_column(BigInteger, default=0)
    total_amount: Mapped[int] = mapped_column(BigInteger, nullable=True)
    total_count: Mapped[int] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class SeasonalIndex(Base):
    __tablename__ = "seasonal_index"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    imp_index: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    exp_index: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class PredictionParams(Base):
    __tablename__ = "prediction_params"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    param_name: Mapped[str] = mapped_column(String(100), nullable=False)
    imp_growth: Mapped[float] = mapped_column(Numeric(6, 2), default=2.1)
    exp_growth: Mapped[float] = mapped_column(Numeric(6, 2), default=16.5)
    exchange_rate: Mapped[float] = mapped_column(Numeric(6, 2), default=0.0)
    exemption_limit: Mapped[int] = mapped_column(Integer, default=150)
    monthly_imp_adj: Mapped[list] = mapped_column(ARRAY(Numeric), default=[0]*10)
    monthly_exp_adj: Mapped[list] = mapped_column(ARRAY(Numeric), default=[0]*10)
    events: Mapped[dict] = mapped_column(JSON, default=list)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class AXProject(Base):
    """AX 과제 관리 테이블"""
    __tablename__ = "ax_projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    developer: Mapped[str] = mapped_column(String(200), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
