# Build context la GOC REPO:
#   docker build -f frontend/Dockerfile .

# ---------- giai doan build ----------
FROM node:22-alpine AS build

WORKDIR /src

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
COPY shared/ ../shared/

# Duong dan API duoc NHUNG VAO LUC BUILD, khong doc duoc luc chay.
# Mac dinh '/api' vi nginx o cung image nay proxy /api sang backend — nho vay
# mot image dung duoc cho moi ten mien, khong phai build lai theo moi truong.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------- giai doan chay ----------
FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://localhost/healthz || exit 1
