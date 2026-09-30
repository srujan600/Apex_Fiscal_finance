import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  DATABASE_PATH: z.string().default('./data/apex_fiscal.db'),
  AUTH_SECRET: z.string().default('apex_fiscal_default_secret_key_2026'),
  // Aczen Nova API Configuration (Never exposed to client)
  NOVA_API_KEY: z.string().optional().default(''),
  NOVA_BASE_URL: z.string().url().default('https://www.aczen.in/nova-api/v1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

/**
 * Returns safe environment representation without secrets for logging/audit
 */
export function getSanitizedConfig() {
  return {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DATABASE_PATH: env.DATABASE_PATH,
    NOVA_BASE_URL: env.NOVA_BASE_URL,
    NOVA_CONFIGURED: Boolean(env.NOVA_API_KEY && env.NOVA_API_KEY.trim().length > 0),
  };
}
