# Backend — Chem Game API

FastAPI + SQLAlchemy 2.0 (async) + Alembic, chia module theo DDD.
Module hien co: `auth`. Sap co: `gameplay`, `inorganic`, `organic`.

## Chay lan dau

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows;  macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"

copy .env.example .env            # macOS/Linux: cp
# dien JWT_SECRET, SESSION_SECRET, GOOGLE_CLIENT_ID/SECRET
# (DATABASE_URL da tro san toi Postgres rieng cua project)

docker compose up -d              # Postgres rieng, cong 5433, volume chemgame_postgres_data
alembic upgrade head
python -m app.seed                # nap ion / hop chat / dong phan / nhac nen
uvicorn app.main:app --reload --port 8001   # http://localhost:8001/docs
```

Cong 8001 chu khong phai 8000: tren may dev hien tai cong 8000 dang bi mot app khac
chiem. Doi cong thi phai sua CA `BACKEND_URL` trong `backend/.env`, `VITE_API_BASE_URL`
trong `frontend/.env`, VA redirect URI da dang ky ben Google Console.

Sinh secret: `python -c "import secrets; print(secrets.token_hex(32))"`

## Google OAuth

Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web):

- Authorized redirect URI: `http://localhost:8001/auth/google/callback`
- Dan Client ID/Secret vao `backend/.env`

Luong: `GET /auth/google/login` → Google → `GET /auth/google/callback` (dat cookie
refresh `HttpOnly`, path `/auth`) → chuyen huong ve `FRONTEND_URL/auth/callback` →
frontend goi `POST /auth/refresh` de lay access token (giu trong bo nho, khong
luu localStorage).

Phia frontend: `src/feature/auth/auth.ts` (kieu + hang so) va
`src/feature/auth/auth-client.ts` (`AuthClient` — giu token, tu refresh khi 401).
Cac module goi API sau nay dung `AuthClient.authorizedFetch`.

## Lenh hay dung

| Viec | Lenh |
|---|---|
| Test domain (khong can DB) | `pytest tests/unit` |
| Test tich hop (can Postgres) | dat `TEST_DATABASE_URL` roi `pytest -m integration` |
| Kiem tra rang buoc kien truc | `lint-imports` |
| Tao migration moi | `alembic revision --autogenerate -m "..."` (ra soat file sinh ra bang tay) |
| Ha migration | `alembic downgrade base` |

## Module va endpoint

| Module | Endpoint |
|---|---|
| `auth` | `GET /auth/{provider}/login`, `GET /auth/{provider}/callback`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| `gameplay` | `POST /runs`, `POST /runs/{id}/finish`, `GET /runs/me`, `GET /leaderboard` |
| `inorganic` | `GET /inorganic/compounds`, `GET /inorganic/mastery` |
| `organic` | chua co endpoint rieng — cham diem qua `POST /runs/{id}/finish` |

Luong choi (2 pha): `POST /runs` (server sinh `seed`, ghi `started_at`) → choi →
`POST /runs/{id}/finish` voi `payload` cua che do tuong ung. **Diem luu vao DB luon
la diem server tinh lai**; diem client gui len chi de doi chieu, lech thi
`score_verified = false` va van do khong len bang xep hang.

## Du lieu hoa hoc

Luat hoa hoc chi dinh nghia MOT noi: TypeScript o `frontend/src/feature/`.

```bash
cd ../frontend && npm run export:chemistry   # sinh shared/chemistry.json
cd ../backend  && python -m app.seed         # nap vao bang ion/compound/isomer
```

Sua `ions.ts` / `chemistry.ts` / `organic.ts` thi chay lai hai lenh tren. Khong bao
gio go tay cong thuc hoa hoc trong code Python.

## Database

Project co Postgres **rieng** trong `docker-compose.yml` (compose project `chemgame`):

| | |
|---|---|
| Host/cong | `127.0.0.1:5433` (chi bind loopback, khong lo ra LAN) |
| User/pass/db | `chemgame` / `chemgame` / `chemgame` |
| DB cho test | `chemgame_test` (tao boi `docker/initdb/01-create-test-database.sql`) |
| Volume | `chemgame_postgres_data` |

Khong dung chung Postgres 5432 tren may — cong do thuoc ve mot project khac.
`docker compose down` giu nguyen du lieu; `docker compose down -v` moi xoa volume.

## Quy tac kien truc

1. `domain/` khong import sqlalchemy / fastapi / pydantic / authlib.
2. Module khac chi import qua `app.modules.<ten>.public`.
3. Khong `relationship()` xuyen module — chi tham chieu bang id.
4. Router khong chua nghiep vu, chi goi use case.

`lint-imports` (cau hinh trong `.importlinter`) ep bon quy tac nay trong CI.
