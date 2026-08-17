# Build context la GOC REPO (khong phai backend/) vi image can shared/chemistry.json
#   docker build -f backend/Dockerfile .

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Cai phu thuoc truoc, tach thanh layer rieng de sua code khong phai cai lai
COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir . && rm -rf /root/.cache

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./
# Danh muc ion/hop chat/dong phan sinh tu TypeScript — lenh seed doc file nay.
COPY shared/chemistry.json /shared/chemistry.json
ENV CHEMISTRY_JSON=/shared/chemistry.json

# Khong chay bang root
RUN useradd --create-home --uid 10001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# --proxy-headers: tin X-Forwarded-Proto tu nginx, neu khong FastAPI se tuong
# minh dang chay http va sinh URL sai khi dung sau HTTPS.
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips", "*"]
