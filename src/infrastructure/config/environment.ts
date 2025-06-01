import path from 'path';

import dotenv from 'dotenv';
import { z } from 'zod';

// Función para cargar archivos .env en orden (menor prioridad a mayor prioridad)
function loadEnvFiles() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // 1. Cargar archivo .env base
  dotenv.config({
    path: path.resolve(process.cwd(), '.env')
  });
  
  // 2. Cargar archivo específico de entorno (.env.development o .env.production)
  dotenv.config({
    path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
    override: true
  });
  
  // 3. Cargar archivo .env.local si existe (mayor prioridad, no se sube a git)
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.local'),
    override: true
  });
}

// Cargar archivos .env
loadEnvFiles();

// Esquema de validación para variables de entorno
const envSchema = z.object({
  COOKIE_MAX_AGE: z.string().default('86400000'),
  COOKIE_SECRET: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_SECRET: z.string().min(32),
  MAIL_FROM: z.string().optional(),
  MAIL_HOST: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_PORT: z.string().optional(),
  MAIL_USER: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  SESSION_SECRET: z.string().min(32).optional(),
});

// Extraer variables de process.env
const env = envSchema.safeParse(process.env);

// Manejar errores de validación
if (!env.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(env.error.format());
  throw new Error('Variables de entorno inválidas');
}

// Exportar configuración tipada
export const config = env.data;