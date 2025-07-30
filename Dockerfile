FROM node:22-alpine

WORKDIR /app

# Define NODE_ENV variable
ARG NODE_ENV=development

# Install curl for health checks and create non-privileged user
RUN apk add --no-cache curl && addgroup -S appuser && adduser -S appuser -G appuser

# Copy configuration files
COPY package*.json ./
COPY prisma ./prisma/
COPY ./src /app/src
# Copy specific environment file, excluding .env.local
COPY .env.${NODE_ENV} /app/.env.${NODE_ENV}

# Create logs directory and change owner
RUN mkdir -p logs \
  && npm install -g --ignore-scripts nodemon \
  && npm install --save-dev --ignore-scripts prisma \
  && npx prisma generate

# Copy remaining code
COPY . .

# Change ownership of all files
RUN chown -R appuser:appuser /app

# Configure Prisma to use the binary engine
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Environment variables for development
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT

# Switch to non-privileged user
USER appuser

# Expose port
EXPOSE $PORT
