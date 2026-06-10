from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres.lijslvcfpdhghwmuhxhm:[Dpslrmak81!!]@aws-1-ap-northeast-2.pooler.supabase.com:5432/ecommerce_forecast"
    anthropic_api_key: str = ""
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    ax_html_dir: str = "static_html"

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()

class Base(DeclarativeBase):
    pass

def create_engine():
    settings = get_settings()

    db_url = settings.database_url \
        .replace("postgres://", "postgresql+asyncpg://") \
        .replace("postgresql://", "postgresql+asyncpg://")

    return create_async_engine(
        db_url,
        poolclass=NullPool,
        echo=False,
        connect_args={
            "ssl": "require",
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
