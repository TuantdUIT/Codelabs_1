"""Cau hinh toan he thong, doc tu backend/.env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # bo qua cac key la trong .env (vd GEMINI_API_KEY)
    )

    # Tro toi Postgres RIENG cua project (backend/docker-compose.yml), khong phai
    # instance 5432 mac dinh tren may — cong do co the thuoc ve project khac.
    DATABASE_URL: str = "postgresql+asyncpg://chemgame:chemgame@127.0.0.1:5433/chemgame"

    JWT_SECRET: str = "dev-only-doi-truoc-khi-deploy"
    SESSION_SECRET: str = "dev-only-doi-truoc-khi-deploy"
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 30

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    COOKIE_SECURE: bool = False

    TEST_DATABASE_URL: str = ""

    @property
    def cors_origins(self) -> list[str]:
        """Cho phep ca `localhost` lan `127.0.0.1`.

        Hai ten nay tro ve cung mot may nhung trinh duyet coi la hai origin khac
        nhau. Luu y: cookie refresh chi di theo dung mot ten — frontend va backend
        phai dung CUNG mot ten host, khong duoc tron.
        """
        origins = [self.FRONTEND_URL]
        twin = (
            self.FRONTEND_URL.replace("localhost", "127.0.0.1")
            if "localhost" in self.FRONTEND_URL
            else self.FRONTEND_URL.replace("127.0.0.1", "localhost")
        )
        if twin != self.FRONTEND_URL:
            origins.append(twin)
        return origins

    @property
    def refresh_cookie_name(self) -> str:
        return "refresh_token"

    @property
    def refresh_cookie_path(self) -> str:
        """Cookie chi gui kem cho cac endpoint /auth/*, khong lo ra toan site."""
        return "/auth"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
