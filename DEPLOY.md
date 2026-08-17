# Đưa lên production bằng Docker

Toàn bộ hệ thống chạy bằng một lệnh, gồm 4 service:

| Service | Vai trò | Có lộ ra ngoài |
|---|---|---|
| `postgres` | Database | ❌ chỉ trong mạng nội bộ compose |
| `migrate` | Chạy `alembic upgrade head` + `python -m app.seed` rồi thoát | ❌ |
| `backend` | Uvicorn (FastAPI) | ❌ |
| `web` | Nginx: phục vụ file tĩnh **và** proxy `/api` sang backend | ✅ cổng `WEB_PORT` |

Chỉ **một cổng** duy nhất mở ra ngoài. Postgres và backend không publish cổng nào.

## Vì sao gộp về một origin

Web và API dùng chung tên miền, chỉ khác tiền tố `/api`. Nhờ vậy:

- Không cần CORS.
- Cookie refresh là same-site thật sự, không phải nới `SameSite=None`.
- Chỉ phải đăng ký **một** redirect URI với Google.
- Frontend gọi `/api/...` nên **một image dùng được cho mọi tên miền**, đổi domain không phải build lại.

```
trình duyệt  ──►  https://ten-mien/            ──►  web (nginx) ──► file tĩnh
             ──►  https://ten-mien/api/auth/…  ──►  web (nginx) ──► backend:8000/auth/…
                                                                    (nginx cắt tiền tố /api)
```

## Các bước

### 1. Chuẩn bị file môi trường trên máy chủ

```bash
cp .env.production.example .env.production
openssl rand -hex 32      # dán vào JWT_SECRET
openssl rand -hex 32      # dán vào SESSION_SECRET (giá trị KHÁC)
openssl rand -base64 24   # dán vào POSTGRES_PASSWORD
```

Sửa cho khớp tên miền thật:

```
FRONTEND_URL=https://ten-mien-cua-ban
BACKEND_URL=https://ten-mien-cua-ban/api
COOKIE_SECURE=true
DATABASE_URL=postgresql+asyncpg://chemgame:<mật khẩu vừa tạo>@postgres:5432/chemgame
```

`DATABASE_URL` trỏ tới **`postgres`** — tên service trong compose, không phải `localhost`.

### 2. Đăng ký redirect URI production với Google

Google Console → Credentials → OAuth client → **Authorized redirect URIs** → thêm:

```
https://ten-mien-cua-ban/api/auth/google/callback
```

Giữ cả dòng `http://localhost:8001/auth/google/callback` để vẫn dev được ở máy.

Nếu app còn ở chế độ *Testing* thì chỉ tài khoản trong *Test users* đăng nhập được — muốn mở cho mọi người phải **Publish app** (cần trang chính sách quyền riêng tư).

### 3. Cập nhật dữ liệu hoá học (nếu vừa sửa luật chơi)

```bash
cd frontend && npm run export:chemistry && cd ..
git add shared/chemistry.json && git commit -m "chore: cập nhật dữ liệu hoá học"
```

Image backend copy `shared/chemistry.json` vào lúc build; service `migrate` seed từ đó.

### 4. Chạy

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f migrate   # xem migration có chạy xong không
```

Kiểm tra:

```bash
curl http://localhost:8080/healthz          # nginx  -> ok
curl http://localhost:8080/api/health       # backend -> {"status":"ok"}
curl http://localhost:8080/api/inorganic/compounds | head -c 200
```

### 5. HTTPS

Compose này cố tình **không** tự lo TLS — nó nghe HTTP ở `WEB_PORT`. Đặt sau một
trong các lớp sau:

- **Caddy / Traefik** trên cùng máy chủ: tự xin chứng chỉ Let's Encrypt, proxy về `localhost:8080`.
- **Nginx của hệ thống** đã có sẵn chứng chỉ.
- **Cloudflare Tunnel**: không cần mở cổng nào ra Internet.

Lớp ngoài cùng phải chuyển tiếp `X-Forwarded-Proto: https` — backend đã chạy với
`--proxy-headers` nên sẽ hiểu đúng là đang ở HTTPS.

⚠️ `COOKIE_SECURE=true` mà truy cập bằng HTTP thuần thì trình duyệt sẽ **âm thầm
bỏ cookie refresh** → đăng nhập xong lại bị đăng xuất ngay. Chỉ đặt `true` khi đã có HTTPS.

## Vận hành

```bash
# cập nhật phiên bản mới
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# xem log
docker compose -f docker-compose.prod.yml logs -f backend

# sao lưu database
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U chemgame chemgame | gzip > backup-$(date +%F).sql.gz

# phục hồi
gunzip -c backup-2026-08-17.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U chemgame -d chemgame

# dừng (giữ dữ liệu)
docker compose -f docker-compose.prod.yml down
```

`docker compose down -v` sẽ **xoá volume** `chemgame_prod_postgres_data` — mất toàn bộ tài khoản và ván chơi.

## Những điểm đã xử lý sẵn về bảo mật

- Container backend chạy bằng user `appuser` (uid 10001), không phải root.
- `.dockerignore` loại mọi `.env` khỏi build context — bí mật chỉ nạp lúc chạy.
- Postgres không publish cổng ra host.
- `server_tokens off` để nginx không khoe phiên bản.
- Cookie refresh: `HttpOnly`, `Secure`, `SameSite=Lax`, path giới hạn ở `/api/auth`.

## Việc còn nên làm trước khi mở cho người thật

1. **Rate limit** cho `/api/auth/*` (nginx `limit_req`) — hiện chưa có gì chặn thử token liên tục.
2. **Job dọn phiên hết hạn** trong bảng `auth_session` — hiện chỉ đánh dấu, không xoá.
3. **Job dọn ván `abandoned`** — ván mở rồi đóng tab sẽ nằm mãi ở trạng thái `playing`.
4. Đổi `ACCESS_TOKEN_MINUTES` nếu muốn phiên ngắn hơn.
