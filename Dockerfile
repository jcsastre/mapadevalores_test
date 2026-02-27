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
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma

EXPOSE 80
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# Crear directorio de BD, ejecutar migraciones, arrancar servidor
CMD sh -c "mkdir -p /data && node node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma && node server.js"
