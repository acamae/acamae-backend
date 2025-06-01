FROM node:20-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package.json ./
# COPY package-lock.json ./
COPY prisma ./prisma/
COPY ./src /app/src
COPY ./tsconfig.json /app/tsconfig.json

# Crear directorio para logs
RUN mkdir -p logs \
  && npm install -g nodemon typescript ts-node \
  && npm install --save-dev prisma \
  && npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Variables de entorno para desarrollo
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT

# Exponer puerto
EXPOSE $PORT

# Iniciar la aplicación en modo desarrollo
CMD ["npm", "run", "dev"] 