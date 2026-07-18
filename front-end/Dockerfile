FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY front-end/package.json front-end/package-lock.json* ./
RUN npm ci

FROM node:26-alpine AS builder
WORKDIR /app
COPY front-end/package.json front-end/package-lock.json* ./
RUN npm ci
COPY front-end/ ./
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
