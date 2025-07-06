FROM node:22-alpine

WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/
COPY ./src /app/src
COPY .env.${NODE_ENV:-development} /app/.env.${NODE_ENV:-development}

# Crear directorio para logs
RUN mkdir -p logs \
  && npm install -g nodemon \
  && npm install --save-dev prisma \
  && npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Configurar Prisma para usar el motor binario
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Variables de entorno para desarrollo
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT

# Exponer puerto
EXPOSE $PORT
