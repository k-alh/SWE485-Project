import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// apps/api/src -> apps/api
const apiRoot = path.resolve(here, '..');

loadEnv({ path: path.join(apiRoot, '.env'), quiet: true });

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const sessionSecret = process.env.SESSION_SECRET ?? '';

if (isProduction && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to at least 32 characters in production.');
}

export const config = {
  nodeEnv,
  isProduction,
  port: intFromEnv('PORT', 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  session: {
    cookieName: 'talea_session',
    // Dev fallback keeps a fresh clone runnable; production requires a real secret.
    secret: sessionSecret || 'dev-only-insecure-secret-do-not-ship',
    ttlDays: 7,
  },
  ai: {
    provider: (process.env.AI_PROVIDER ?? 'mock').toLowerCase(),
    openAiKey: process.env.OPENAI_API_KEY ?? '',
    openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@talea.test',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin12345',
    studentEmail: process.env.SEED_STUDENT_EMAIL ?? 'student@talea.test',
    studentPassword: process.env.SEED_STUDENT_PASSWORD ?? 'student12345',
  },
} as const;
