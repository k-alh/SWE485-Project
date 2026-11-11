import { PrismaClient } from '@prisma/client';

/**
 * One client per process. Tests import this too, after pointing DATABASE_URL at a
 * throwaway file, so nothing in the suite touches the development database.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
