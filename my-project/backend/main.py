from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base, get_settings
from routers import trade, predictions, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 테이블 자동 생성 (운영환경에서는 Alembic 마이그레이션 권장)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="전자상거래 수출입 예측 시스템 API",
    description="한국 전자상거래 수출입 통계 기반 2026년 예측 시스템",
    version="2.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trade.router,       prefix="/api/trade",       tags=["trade"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(reports.router,     prefix="/api/reports",     tags=["reports"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/db-check")
async def db_check():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
