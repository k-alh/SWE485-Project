import type { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from '@talea/shared';
import {
  endSession,
  getCurrentUser,
  hashPassword,
  startSession,
  toPublicUser,
  verifyPassword,
} from '../auth.js';
import { prisma } from '../db.js';
import { conflict, unauthorized } from '../errors.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw conflict('EMAIL_TAKEN', 'An account with that email already exists.');
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: 'student',
        academicYear: String(input.academicYear),
      },
    });

    await startSession(reply, user.id);
    return reply.code(201).send({ user: toPublicUser(user) });
  });

  app.post('/api/auth/session', async (request, reply) => {
    const input = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Same message for unknown email and wrong password: no account enumeration.
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw unauthorized('Email or password is incorrect.');
    }

    await startSession(reply, user.id);
    return reply.send({ user: toPublicUser(user) });
  });

  app.get('/api/auth/session', async (request) => {
    const user = await getCurrentUser(request);
    return { user };
  });

  app.delete('/api/auth/session', async (request, reply) => {
    await endSession(request, reply);
    return reply.code(204).send();
  });
}
