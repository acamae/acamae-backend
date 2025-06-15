# Scripts SQL de Inicialización

Esta carpeta contiene los scripts SQL que se ejecutan automáticamente cuando el contenedor de MariaDB se inicia por primera vez. Los scripts se ejecutan en orden alfabético, por lo que es recomendable usar prefijos numéricos si se requiere un orden específico.

## Archivos Principales

- `db_schema.sql`: Esquema completo de la base de datos con la definición de tablas y relaciones.

## Estructura de la Base de Datos

El esquema actual incluye las siguientes tablas:

- **users**: Almacena la información de usuarios registrados en el sistema
- **teams**: Equipos de esports asociados a usuarios
- **email_verification_tokens**: Tokens para verificación de correos electrónicos
- **session_tokens**: Tokens de sesión para la autenticación de usuarios

## Ejecución Automática

Los scripts en esta carpeta se ejecutan automáticamente al iniciar el contenedor de MariaDB por primera vez gracias al volumen montado en el archivo `docker-compose.yml`:

```yaml
volumes:
  - ./db/init:/docker-entrypoint-initdb.d
```

## Consideraciones Importantes

1. **Orden de ejecución**: Los scripts se ejecutan en orden alfabético.
2. **Idempotencia**: Es recomendable que los scripts manejen su propia idempotencia (verificar si las estructuras ya existen).
3. **Cambios posteriores**: Para cambios posteriores a la estructura, se recomienda utilizar scripts de migración separados.
4. **Datos de prueba**: Si se desean cargar datos de prueba, crear un script separado (ej: `99_test_data.sql`).

## Buenas Prácticas

- Prefijo los archivos con números para controlar el orden de ejecución:
  - `01_schema.sql`
  - `02_functions.sql`
  - `03_initial_data.sql`
- Incluya comentarios descriptivos en los scripts
- Maneje errores adecuadamente con instrucciones condicionales
- Separe la definición de estructura (DDL) de la inserción de datos (DML)

## Ejecutar Scripts Manualmente

Si necesita ejecutar manualmente estos scripts, puede hacerlo conectándose al contenedor de base de datos:

```bash
# Conectarse al contenedor
docker exec -it gestion-esports-db bash

# Ejecutar script directamente
mysql -u root -p < /docker-entrypoint-initdb.d/db_schema.sql

# O conectarse a MySQL y ejecutar el script
mysql -u root -p
source /docker-entrypoint-initdb.d/db_schema.sql
```
