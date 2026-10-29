# ==========================================
# Aşama 1: Web Üretim Derlemesi (Node.js)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Paket bağımlılıklarını kopyala ve yükle
COPY package*.json ./
RUN npm ci

# Kaynak kodları ve konfigürasyonları kopyala
COPY . .

# Web bundle derlemesini çalıştır (Vite Web Build)
RUN npm run build:web

# ==========================================
# Aşama 2: Üretim Sunucusu (Nginx Alpine)
# ==========================================
FROM nginx:alpine AS runner

# Özel Nginx SPA konfigürasyonunu ekle
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Derlenen statik web dosyalarını Nginx dizinine kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Port 80'i dışa aç
EXPOSE 80

# Sağlık kontrolü (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx'i ön planda başlat
CMD ["nginx", "-g", "daemon off;"]
