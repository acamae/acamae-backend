# Configuración de Base de Datos

Este directorio contiene la configuración y archivos relacionados con la base de datos del proyecto.

## Estructura

- `init/`: Scripts SQL que se ejecutan automáticamente al inicializar el contenedor
  - `db_schema.sql`: Esquema completo de la base de datos con definición de tablas y relaciones
- `data/`: Directorio donde se almacenan los datos persistentes de la base de datos (no commitear)

## Uso de los Scripts SQL

### Inicialización Automática

Docker ejecutará automáticamente los scripts SQL en orden alfabético que se encuentren en la carpeta `init/` cuando el contenedor de la base de datos se inicie por primera vez o cuando no exista una base de datos previa.

Para que esto funcione, es necesario montar la carpeta en el contenedor a través de docker-compose:

```yaml
services:
  db:
    image: mariadb
    volumes:
      - ./db/init:/docker-entrypoint-initdb.d
      - ./volumes/mariadb_data:/var/lib/mysql
```

### Scripts de Migración

Para ejecutar scripts de migración manualmente:

```bash
# Desde el host
docker exec -i container_name mysql -uroot -ppassword database_name < /path/to/script.sql

# O usando la línea de comandos dentro del contenedor
docker exec -it container_name mysql -uroot -ppassword database_name
mysql> source /path/to/script.sql
```

## Respaldos

Para crear un respaldo de la base de datos:

```bash
docker exec -i container_name mysqldump -uroot -ppassword database_name > backup.sql
```

Para restaurar un respaldo:

```bash
docker exec -i container_name mysql -uroot -ppassword database_name < backup.sql
```

## Notas importantes

- Los scripts SQL en `init/` solo se ejecutan cuando el volumen de datos está vacío
- Para forzar la ejecución de los scripts, elimina el volumen: `docker-compose down -v` 