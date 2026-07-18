FROM node:26-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY back-end/package.json back-end/package-lock.json* ./
RUN npm ci --only=production

FROM node:26-alpine AS builder
WORKDIR /app
COPY back-end/package.json back-end/package-lock.json* ./
RUN npm ci
COPY back-end/ ./
RUN npx sequelize db:migrate
RUN npm run build

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/package.json ./
USER nodejs
EXPOSE 8000
CMD ["node", "src/app.js"]
