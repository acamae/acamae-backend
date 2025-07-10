#!/bin/bash

# Script para importar datos de la base de datos
# Uso: npm run db:import [archivo.sql]

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Debes especificar un archivo SQL para importar"
    echo "Uso: npm run db:import database-exports/db_export_YYYYMMDD_HHMMSS.sql"
    exit 1
fi

IMPORT_FILE="$1"

echo "📥 Importando datos de la base de datos..."

# Verificar que el archivo existe
if [ ! -f "$IMPORT_FILE" ]; then
    echo "❌ Error: El archivo $IMPORT_FILE no existe"
    exit 1
fi

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

# Verificar que el contenedor de la base de datos esté corriendo
if ! docker compose -p acamae-backend -f docker/docker-compose.yml ps db | grep -q "Up"; then
    echo "❌ Error: El contenedor de la base de datos no está corriendo"
    echo "Ejecuta: npm run docker:up"
    exit 1
fi

# Confirmar importación
echo "⚠️  ADVERTENCIA: Esto sobrescribirá todos los datos existentes en la base de datos"
echo "📁 Archivo a importar: $IMPORT_FILE"
read -p "¿Estás seguro de que quieres continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Importación cancelada"
    exit 1
fi

# Importar datos
echo "🔄 Importando datos desde ${IMPORT_FILE}..."
docker compose -p acamae-backend -f docker/docker-compose.yml exec -T db mysql \
  -u root -p${MYSQL_ROOT_PASSWORD:-rootpassword} \
  gestion_esports < "$IMPORT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Importación completada exitosamente!"
    echo ""
    echo "📊 La base de datos ha sido actualizada con los datos importados"
    echo "🌐 PhpMyAdmin: http://localhost:8080"
    echo "🔗 Backend API: http://localhost:4000"
else
    echo "❌ Error durante la importación"
    exit 1
fi
