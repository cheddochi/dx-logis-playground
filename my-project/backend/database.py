from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres.lijslvcfpdhghwmuhxhm:[Dpslrmak81!!]@aws-1-ap-northeast-2.pooler.supabase.com:6543/ecommerce_forecast"
    anthropic_api_key: str = ""
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


class Base(DeclarativeBase):
    pass


def create_engine():
    settings = get_settings()

    # 환경변수가 postgresql:// 또는 postgres:// 로 오는 경우 asyncpg로 변환
    db_url = settings.database_url \
        .replace("postgres://", "postgresql+asyncpg://") \
        .replace("postgresql://", "postgresql+asyncpg://")

    return create_async_engine(
        db_url,
        poolclass=NullPool,   # pgbouncer transaction mode 호환
        echo=False,
        connect_args={
            "ssl": "require",
            "statement_cache_size": 0    # Supabase pgbouncer 필수
        }
    )


engine = create_engine()
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
