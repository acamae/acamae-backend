##############################
# Base deps layer (cacheable)
##############################
FROM node:22-alpine AS deps

WORKDIR /app

# Build args (can be overridden at build time)
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Install minimal tools
RUN apk add --no-cache curl tzdata

# Install dependencies first (better cache reuse)
COPY package*.json ./
# If BuildKit is enabled, this uses a persistent cache; otherwise it behaves as a normal RUN
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

##############################
# Prisma client generation
##############################
FROM deps AS prisma
WORKDIR /app
COPY prisma ./prisma
# Generate Prisma client during build (no DB access needed)
RUN npx prisma generate

##############################
# Final runtime image
##############################
FROM node:22-alpine AS runner

WORKDIR /app

# Non-root user and tzdata for full IANA coverage
RUN apk add --no-cache curl tzdata && addgroup -S appuser && adduser -S appuser -G appuser

# Copy node_modules with generated @prisma/client from prisma stage
COPY --from=prisma /app/node_modules ./node_modules

# App sources
COPY package*.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# Optional: logs directory
RUN mkdir -p logs && chown -R appuser:appuser /app

# Env
ARG PORT=4000
ENV PORT=${PORT}
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

USER appuser
EXPOSE ${PORT}

# Note: no CMD defined here; docker-compose controls the command.
# For a clean build from zero, run with: --no-cache and/or disable BuildKit.
