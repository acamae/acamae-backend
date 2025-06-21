# SSL Certificates

This directory contains the SSL certificates used to enable HTTPS in the project.

## Required files

For production use, you need the following files:

- `selfsigned.crt`: SSL certificate
- `selfsigned.key`: Private key for the certificate

## Generating development certificates

For development environments you can generate self-signed certificates with the following command:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout selfsigned.key -out selfsigned.crt
```

## Security notes

- **Do not commit**: Certificates and keys should never be added to version control
- **Permissions**: Make sure only the appropriate users have access to private keys
- **Production**: In production, use certificates issued by a trusted Certificate Authority (CA)

## Nginx configuration

The certificates are mounted inside the Nginx container at `/etc/nginx/ssl/` and referenced in `docker/nginx/default.conf`.
