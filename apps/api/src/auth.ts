import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AcademicYear, PublicUser, UserRole } from '@talea/shared';
import { config } from './config.js';
import { prisma } from './db.js';
import { forbidden, unauthorized } from './errors.js';

const COOKIE = config.session.cookieName;
const BCRYPT_ROUNDS = 10;

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  academicYear: string | null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseAcademicYear(value: string | null): AcademicYear | null {
  if (value === null) return null;
  if (value === 'graduate') return 'graduate';
  const parsed = Number(value);
  return parsed === 3 || parsed === 4 || parsed === 5 ? parsed : null;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : ('student' satisfies UserRole),
    academicYear: parseAcademicYear(user.academicYear),
  };
}

/**
 * Issues an opaque session token. Only its SHA-256 hash is stored, so a database
 * leak does not hand over usable sessions.
 */
export async function startSession(reply: FastifyReply, userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + config.session.ttlDays * 24 * 60 * 60 * 1000);

  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });

  reply.setCookie(COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    signed: true,
    maxAge: config.session.ttlDays * 24 * 60 * 60,
  });
}

export async function endSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = request.cookies[COOKIE];
  if (raw) {
    const unsigned = request.unsignCookie(raw);
    if (unsigned.valid && unsigned.value) {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(unsigned.value) } });
    }
  }
  reply.clearCookie(COOKIE, { path: '/' });
}

export async function getCurrentUser(request: FastifyRequest): Promise<PublicUser | null> {
  const raw = request.cookies[COOKIE];
  if (!raw) return null;

  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(unsigned.value) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return toPublicUser(session.user);
}

export async function requireUser(request: FastifyRequest): Promise<PublicUser> {
  const user = await getCurrentUser(request);
  if (!user) throw unauthorized();
  return user;
}

/** Role is checked on the server for every admin route; the UI is not trusted. */
export async function requireAdmin(request: FastifyRequest): Promise<PublicUser> {
  const user = await requireUser(request);
  if (user.role !== 'admin') throw forbidden('Admin access required.');
  return user;
}
