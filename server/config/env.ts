import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory first, fallback to root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('veritygraph_local_dev_secret_key_38f92b74c892819a8421098e721'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().default('10').transform(val => parseInt(val, 10)),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const isSupabaseConfigured = Boolean(
  env.SUPABASE_URL &&
  env.SUPABASE_ANON_KEY &&
  !env.SUPABASE_URL.includes('your-project-id') &&
  env.SUPABASE_URL.startsWith('http')
);
