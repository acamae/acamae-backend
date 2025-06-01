# Certificados SSL

Este directorio contiene los certificados SSL para habilitar HTTPS en el proyecto.

## Archivos necesarios

Para funcionamiento en producción, se requieren los siguientes archivos:

- `selfsigned.crt`: Certificado SSL
- `selfsigned.key`: Clave privada del certificado

## Generación de certificados de desarrollo

Para entornos de desarrollo, puedes generar certificados autofirmados con el siguiente comando:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout selfsigned.key -out selfsigned.crt
```

## Notas de seguridad

- **No commitear**: Los certificados y claves no deben añadirse al control de versiones
- **Permisos**: Asegúrate de que solo los usuarios adecuados tengan acceso a las claves privadas
- **Producción**: Para entornos de producción, se recomienda usar certificados de una Autoridad Certificadora reconocida

## Configuración en Nginx

Los certificados se montan en el contenedor Nginx en la ruta `/etc/nginx/ssl/` y se referencian en el archivo `docker/nginx/default.conf`. 