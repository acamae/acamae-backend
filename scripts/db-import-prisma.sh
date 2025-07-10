#!/bin/bash

# Script para importar datos usando Prisma
# Uso: npm run db:import:prisma [archivo.json]

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Debes especificar un archivo JSON para importar"
    echo "Uso: npm run db:import:prisma database-exports/prisma_export_YYYYMMDD_HHMMSS.json"
    exit 1
fi

IMPORT_FILE="$1"

echo "📥 Importando datos usando Prisma..."

# Verificar que el archivo existe
if [ ! -f "$IMPORT_FILE" ]; then
    echo "❌ Error: El archivo $IMPORT_FILE no existe"
    exit 1
fi

# Verificar que el proyecto esté configurado
if [ ! -f ".env.development" ]; then
    echo "❌ Error: Archivo .env.development no encontrado"
    echo "Ejecuta: npm run env:setup"
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

# Crear script temporal para importar con Prisma
TEMP_SCRIPT="temp_import.js"
cat > "$TEMP_SCRIPT" << EOF
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('🔄 Importando datos...');

    const importData = JSON.parse(fs.readFileSync('$IMPORT_FILE', 'utf8'));

    // Limpiar datos existentes
    await prisma.sessionToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.team.deleteMany();

    // Importar equipos primero
    for (const team of importData.teams) {
      const { manager, players, ...teamData } = team;
      await prisma.team.create({
        data: {
          ...teamData,
          managerId: manager?.id || null,
        },
      });
    }

    // Importar usuarios
    for (const user of importData.users) {
      const { team, ...userData } = user;
      await prisma.user.create({
        data: {
          ...userData,
          teamId: team?.id || null,
        },
      });
    }

    // Importar tokens de sesión
    for (const token of importData.sessionTokens) {
      await prisma.sessionToken.create({
        data: token,
      });
    }

    console.log('✅ Importación completada exitosamente!');
    console.log(\`📊 Datos importados: \${importData.users.length} usuarios, \${importData.teams.length} equipos, \${importData.sessionTokens.length} tokens\`);
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

importData();
EOF

# Ejecutar importación
echo "🔄 Importando datos desde ${IMPORT_FILE}..."
node "$TEMP_SCRIPT"

# Limpiar script temporal
rm "$TEMP_SCRIPT"

if [ $? -eq 0 ]; then
    echo ""
    echo "📊 La base de datos ha sido actualizada con los datos importados"
    echo "🌐 PhpMyAdmin: http://localhost:8080"
    echo "🔗 Backend API: http://localhost:4000"
else
    echo "❌ Error durante la importación"
    exit 1
fi
