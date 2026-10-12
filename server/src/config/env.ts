import { z } from 'zod';

const commaSeparated = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.url()).min(1));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: commaSeparated.default(['http://localhost:3000']),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: 'DATABASE_URL must be a postgresql:// URL' }),
  REDIS_URL: z.url({ protocol: /^rediss?$/, error: 'REDIS_URL must be a redis:// or rediss:// URL' }),
  QUEUE_PREFIX: z.string().min(1).default('msefunded'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  TAVILY_API_KEY: z.string().optional(),
  EXA_API_KEY: z.string().optional(),
  JINA_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(3).default('MseFunded <onboarding@resend.dev>'),
  API_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
