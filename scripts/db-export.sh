#!/bin/bash

# Script para exportar datos de la base de datos
# Uso: npm run db:export

set -e

EXPORT_DIR="database-exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_FILE="${EXPORT_DIR}/db_export_${TIMESTAMP}.sql"

echo "📤 Exportando datos de la base de datos..."

# Crear directorio de exportación si no existe
mkdir -p "$EXPORT_DIR"

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

# Exportar datos
echo "🔄 Exportando datos a ${EXPORT_FILE}..."
docker compose -p acamae-backend -f docker/docker-compose.yml exec -T db mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD:-rootpassword} \
  --single-transaction \
  --routines \
  --triggers \
  gestion_esports > "$EXPORT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Exportación completada exitosamente!"
    echo "📁 Archivo: ${EXPORT_FILE}"
    echo ""
    echo "📝 Para importar en otro PC:"
    echo "   1. Copia el archivo ${EXPORT_FILE} al otro PC"
    echo "   2. Ejecuta: npm run db:import ${EXPORT_FILE}"
else
    echo "❌ Error durante la exportación"
    exit 1
fi
