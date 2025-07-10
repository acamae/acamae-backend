#!/bin/bash

# Script para exportar datos usando Prisma
# Uso: npm run db:export:prisma

set -e

EXPORT_DIR="database-exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_FILE="${EXPORT_DIR}/prisma_export_${TIMESTAMP}.json"

echo "📤 Exportando datos usando Prisma..."

# Crear directorio de exportación si no existe
mkdir -p "$EXPORT_DIR"

# Verificar que el proyecto esté configurado
if [ ! -f ".env.development" ]; then
    echo "❌ Error: Archivo .env.development no encontrado"
    echo "Ejecuta: npm run env:setup"
    exit 1
fi

# Crear script temporal para exportar con Prisma
TEMP_SCRIPT="temp_export.js"
cat > "$TEMP_SCRIPT" << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('🔄 Exportando datos...');

    const users = await prisma.user.findMany({
      include: {
        team: true,
      },
    });

    const teams = await prisma.team.findMany({
      include: {
        manager: true,
        players: true,
      },
    });

    const sessionTokens = await prisma.sessionToken.findMany();

    const exportData = {
      users,
      teams,
      sessionTokens,
      exportedAt: new Date().toISOString(),
    };

    console.log(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('❌ Error durante la exportación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
EOF

# Ejecutar exportación
echo "🔄 Exportando datos a ${EXPORT_FILE}..."
node "$TEMP_SCRIPT" > "$EXPORT_FILE"

# Limpiar script temporal
rm "$TEMP_SCRIPT"

if [ $? -eq 0 ]; then
    echo "✅ Exportación completada exitosamente!"
    echo "📁 Archivo: ${EXPORT_FILE}"
    echo ""
    echo "📝 Para importar en otro PC:"
    echo "   1. Copia el archivo ${EXPORT_FILE} al otro PC"
    echo "   2. Ejecuta: npm run db:import:prisma ${EXPORT_FILE}"
else
    echo "❌ Error durante la exportación"
    exit 1
fi
