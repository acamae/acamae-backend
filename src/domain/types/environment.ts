// Interfaz para variables de entorno del backend
export type BackendEnvironment = {
  COOKIE_MAX_AGE: string;
  COOKIE_SECRET?: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  JWT_EXPIRES_IN: string;
  JWT_SECRET: string;
  MAIL_FROM?: string;
  MAIL_HOST?: string;
  MAIL_PASSWORD?: string;
  MAIL_PORT?: string;
  MAIL_USER?: string;
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: string;
  SESSION_SECRET?: string;
}; 