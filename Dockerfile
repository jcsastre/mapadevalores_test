# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Prisma: schema, migrations y CLI necesarios en runtime
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 80
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# Construir DATABASE_URL desde vars individuales si no se proporciona directamente
# Ejecutar migraciones y arrancar servidor
CMD sh -c "\
  if [ -z \"$DATABASE_URL\" ]; then \
    export DATABASE_URL=\"postgresql://${POSTGRES_USER:-mapadevalores}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-mapadevalores}\"; \
  fi && \
  npx prisma migrate deploy --schema=prisma/schema.prisma && \
  node server.js"
