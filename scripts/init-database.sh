#!/bin/bash

# Script para inicializar la base de datos con datos de ejemplo
# Uso: npm run db:init

set -e

echo "🚀 Inicializando base de datos con datos de ejemplo..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

# Verificar que el proyecto esté configurado
if [ ! -f ".env.development" ]; then
    echo "❌ Error: Archivo .env.development no encontrado"
    echo "Ejecuta: npm run env:setup"
    exit 1
fi

# Detener contenedores si están corriendo
echo "📦 Deteniendo contenedores existentes..."
docker compose -p acamae-backend -f docker/docker-compose.yml down

# Limpiar volumen de base de datos si existe
echo "🧹 Limpiando volumen de base de datos..."
docker volume rm acamae-backend_mariadb_data 2>/dev/null || true

# Levantar contenedores
echo "🚀 Levantando contenedores..."
npm run docker:up

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 30

# Usar Prisma para resetear y inicializar la base de datos
echo "🔄 Inicializando base de datos con Prisma..."
npm run prisma:reset

echo "✅ Base de datos inicializada correctamente!"
echo ""
echo "📊 Acceso a la base de datos:"
echo "   - Host: localhost"
echo "   - Puerto: 3306"
echo "   - Usuario: root"
echo "   - Contraseña: rootpassword"
echo "   - Base de datos: gestion_esports"
echo ""
echo "🌐 PhpMyAdmin: http://localhost:8080"
echo "🔗 Backend API: http://localhost:4000"
echo ""
echo "📝 Comandos útiles:"
echo "   - Ver logs: npm run docker:logs"
echo "   - Reiniciar: npm run docker:restart"
echo "   - Detener: npm run docker:down"
echo "   - Resetear DB: npm run prisma:reset"
