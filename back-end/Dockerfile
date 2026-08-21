FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY back-end/package.json back-end/package-lock.json* ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY back-end/package.json back-end/package-lock.json* ./
RUN npm ci
COPY back-end/ ./

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    npm install -g pm2
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config
COPY --from=builder /app/src/db/migrations ./migrations
COPY --from=builder /app/package.json ./
COPY --from=builder /app/ecosystem.config.js ./
RUN mkdir -p logs
USER nodejs
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:8000/api/v1/health',(r)=>{process.exit(r.statusCode===200?0:1);}).on('error',()=>process.exit(1));"
CMD ["node", "./src/app.js"]
