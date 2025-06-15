FROM node:22-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
# COPY package-lock.json ./
COPY prisma ./prisma/
COPY ./src /app/src

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

# Iniciar la aplicación en modo desarrollo
CMD ["npm", "run", "dev"]
