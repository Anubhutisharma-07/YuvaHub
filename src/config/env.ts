import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('yuvahub'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

  REDIS_URL: z.string().url().optional(),

  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT_BASE64 is required'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  
  ENABLE_MOCK_AUTH: z.enum(['true', 'false']).default('false'),
  MOCK_VALID_TOKEN: z.string().default('MOCK_VALID_TOKEN'),

  SENTRY_DSN: z.string().url().optional(),

  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('â Œ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const config = _env.data;
