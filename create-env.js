const fs = require('fs');
const path = require('path');

const envContent = `# Variables de entorno para el backend
COOKIE_MAX_AGE=86400000
COOKIE_SECRET=clave_super_secreta_para_cookies
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=mysql://root:root@database:3306/gestion_esports
FRONTEND_URL=http://localhost:3000
JWT_EXPIRES_IN=1d
JWT_SECRET=clave_super_secreta_para_jwt_que_tenga_32_caracteres_o_mas
VERIFICATION_EXPIRATION=10m
PASSWORD_RESET_EXPIRATION=10m
MAIL_FROM=notificaciones@tu-dominio.com
MAIL_HOST=smtp.tu-dominio.com
MAIL_PASSWORD=contraseña
MAIL_PORT=587
MAIL_USER=usuario
NODE_ENV=development
PORT=3001
SESSION_SECRET=clave_super_secreta_para_sesiones_que_tenga_32_caracteres_o_mas`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('Archivo .env creado exitosamente con la variable JWT_SECRET');
