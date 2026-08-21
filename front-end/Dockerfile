FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY front-end/package.json front-end/package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY front-end/package.json front-end/package-lock.json* ./
RUN npm ci
COPY front-end/ ./
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /run/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /run/nginx && \
    chmod -R 755 /usr/share/nginx/html
RUN apk add --no-cache curl
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
