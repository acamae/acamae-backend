# Configuración de Base de Datos

## Problema Resuelto

Los volúmenes de Docker no se incluyen en el repositorio por razones de seguridad y tamaño. Esto causaba que la base de datos no se mantuviera entre diferentes PCs.

## Solución Implementada

### 1. Volúmenes Nombrados

- Cambiamos de bind mounts (`./volumes/mariadb_data`) a volúmenes nombrados (`mariadb_data`)
- Los volúmenes nombrados son manejados por Docker y son más consistentes

### 2. Uso de Prisma (Recomendado)

- **`npm run prisma:reset`**: Resetea la base de datos y ejecuta migraciones + seed
- **`npm run prisma:migrate`**: Crea y aplica nuevas migraciones
- **`npm run prisma:deploy`**: Aplica migraciones existentes
- **`npm run prisma:seed`**: Ejecuta solo el seed

### 3. Scripts de Inicialización

- **`npm run db:init`**: Inicializa la base de datos con datos de ejemplo
- **`npm run db:export:prisma`**: Exporta datos usando Prisma (JSON)
- **`npm run db:import:prisma`**: Importa datos usando Prisma (JSON)

### 4. Seed Automático

- Archivo `prisma/seed.js` con datos de ejemplo
- Usuarios predefinidos con diferentes roles
- Equipos de ejemplo

## Comandos Disponibles

### Inicialización (Recomendado)

```bash
# Inicializar base de datos con datos de ejemplo
npm run db:init

# Solo resetear base de datos (migraciones + seed)
npm run prisma:reset

# Solo ejecutar migraciones
npm run prisma:deploy:dev

# Solo ejecutar seed
npm run prisma:seed
```

### Exportación/Importación con Prisma (Recomendado)

```bash
# Exportar datos actuales (JSON)
npm run db:export:prisma

# Importar datos desde archivo JSON
npm run db:import:prisma database-exports/prisma_export_20241201_143022.json
```

### Exportación/Importación SQL (Alternativo)

```bash
# Exportar datos actuales (SQL)
npm run db:export

# Importar datos desde archivo SQL
npm run db:import database-exports/db_export_20241201_143022.sql
```

### Docker

```bash
# Levantar contenedores
npm run docker:up

# Detener contenedores
npm run docker:down

# Ver logs
npm run docker:logs

# Reiniciar
npm run docker:restart
```

## Datos de Ejemplo

### Usuarios Creados

- **Admin**: `admin@acamae.com` / `password123`
- **Manager**: `manager@acamae.com` / `password123`
- **Player**: `player@acamae.com` / `password123`

### Equipos Creados

- **Equipo Alpha**: Equipo profesional
- **Equipo Beta**: Equipo amateur

## Flujo de Trabajo Recomendado

### Primera vez en un PC

```bash
npm run env:setup
npm run db:init
```

### Cambiar de PC (Método Prisma - Recomendado)

```bash
# En PC origen
npm run db:export:prisma

# Copiar archivo JSON al nuevo PC
# En PC destino
npm run db:import:prisma database-exports/prisma_export_YYYYMMDD_HHMMSS.json
```

### Cambiar de PC (Método SQL - Alternativo)

```bash
# En PC origen
npm run db:export

# Copiar archivo SQL al nuevo PC
# En PC destino
npm run db:import database-exports/db_export_YYYYMMDD_HHMMSS.sql
```

### Desarrollo Diario

```bash
npm run docker:up    # Levantar contenedores
# ... desarrollar ...
npm run docker:down  # Detener contenedores
```

### Resetear Base de Datos

```bash
npm run prisma:reset  # Resetea y ejecuta seed
```

## Ventajas de Usar Prisma

### ✅ Método Prisma (Recomendado)

- **Más seguro**: Maneja relaciones correctamente
- **Más rápido**: Exporta solo datos, no estructura
- **Más pequeño**: Archivos JSON más pequeños
- **Más confiable**: Usa el ORM directamente

### ⚠️ Método SQL (Alternativo)

- **Más completo**: Incluye estructura y datos
- **Más lento**: Archivos más grandes
- **Menos seguro**: Puede tener problemas con relaciones

## Acceso a la Base de Datos

### Conexión Directa

- **Host**: localhost
- **Puerto**: 3306
- **Usuario**: root
- **Contraseña**: rootpassword
- **Base de datos**: gestion_esports

### PhpMyAdmin

- **URL**: http://localhost:8080
- **Usuario**: root
- **Contraseña**: rootpassword

### Backend API

- **URL**: http://localhost:4000
- **Documentación**: http://localhost:4000/api/docs

## Troubleshooting

### Base de datos no se conecta

```bash
# Verificar que contenedores estén corriendo
docker compose -p acamae-backend -f docker/docker-compose.yml ps

# Reiniciar contenedores
npm run docker:restart
```

### Error de migraciones

```bash
# Resetear base de datos completamente
npm run prisma:reset

# O solo aplicar migraciones
npm run prisma:deploy:dev
```

### Volumen corrupto

```bash
# Eliminar volumen y recrear
docker volume rm acamae-backend_mariadb_data
npm run db:init
```

## Notas Importantes

1. **Seguridad**: Los volúmenes no se incluyen en el repositorio por seguridad
2. **Backup**: Usar `npm run db:export:prisma` regularmente para backups
3. **Consistencia**: Los volúmenes nombrados son más consistentes entre PCs
4. **Desarrollo**: Los datos de ejemplo facilitan el desarrollo y testing
5. **Prisma**: Usar comandos de Prisma cuando sea posible para mayor confiabilidad
