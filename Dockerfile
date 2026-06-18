FROM node:20-alpine AS base

# Этап установки зависимостей
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Этап сборки
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install --dev
RUN npm run build

# Этап production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем public напрямую из исходников
COPY public ./public

# Копируем standalone сборку
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Копируем статические файлы Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
