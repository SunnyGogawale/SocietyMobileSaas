import { createHash } from 'node:crypto'
import { z } from 'zod'

const developmentSecret = 'local-only-not-for-production-123456'
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGINS: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/society_management_saas'),
  REDIS_URL: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().min(32).default(developmentSecret),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(3600).max(7776000).default(2592000),
  SUPER_ADMIN_BOOTSTRAP_SECRET: z.string().default('').refine((value) => !value || value.length >= 32),
  SENSITIVE_DATA_ENCRYPTION_KEY: z.string().default(''),
  COOKIE_DOMAIN: z.string().default(''),
  AUTH_WEB_URL: z.string().url().default('http://localhost:5173'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.string().default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().default(''),
  S3_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string().default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

const parsedEnv = envSchema.safeParse(process.env)
if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`)
}

if (parsedEnv.data.NODE_ENV === 'production' && (
  parsedEnv.data.JWT_ACCESS_SECRET === developmentSecret || parsedEnv.data.JWT_ACCESS_SECRET.startsWith('replace_')
)) {
  throw new Error('JWT_ACCESS_SECRET must be set to a unique secret in production.')
}
if (parsedEnv.data.NODE_ENV === 'production' && (!parsedEnv.data.SMTP_HOST || !parsedEnv.data.SMTP_FROM)) {
  throw new Error('SMTP_HOST and SMTP_FROM are required in production for account verification and recovery.')
}
const configuredEncryptionKey = parsedEnv.data.SENSITIVE_DATA_ENCRYPTION_KEY
  ? Buffer.from(parsedEnv.data.SENSITIVE_DATA_ENCRYPTION_KEY, 'base64')
  : null
if (configuredEncryptionKey && configuredEncryptionKey.length !== 32) {
  throw new Error('SENSITIVE_DATA_ENCRYPTION_KEY must be base64-encoded 32-byte key material.')
}
if (parsedEnv.data.NODE_ENV === 'production' && !configuredEncryptionKey) {
  throw new Error('SENSITIVE_DATA_ENCRYPTION_KEY is required in production.')
}

export const env = Object.freeze({
  ...parsedEnv.data,
  WEB_ORIGINS: parsedEnv.data.WEB_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  SENSITIVE_DATA_ENCRYPTION_KEY: configuredEncryptionKey ?? createHash('sha256')
    .update(`${developmentSecret}:sensitive-data`)
    .digest(),
  IS_PRODUCTION: parsedEnv.data.NODE_ENV === 'production',
})