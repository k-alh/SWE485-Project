import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import { DomainError } from '@talea/shared';
import { ZodError } from 'zod';
import { config } from './config.js';
import { HttpError, domainErrorToHttp } from './errors.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { listingRoutes } from './routes/listings.js';
import { trackerRoutes } from './routes/tracker.js';

export interface BuildAppOptions {
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? config.nodeEnv !== 'test',
    trustProxy: config.isProduction,
  });

  await app.register(cookie, {
    secret: config.session.secret,
    hook: 'onRequest',
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some fields need attention.',
          details: error.issues,
        },
      });
    }

    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    if (error instanceof DomainError) {
      const mapped = domainErrorToHttp(error);
      return reply.code(mapped.statusCode).send({
        error: { code: mapped.code, message: mapped.message, details: mapped.details },
      });
    }

    request.log.error({ err: error }, 'unhandled error');
    return reply.code(500).send({
      error: { code: 'INTERNAL', message: 'Something went wrong on our side.' },
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `No route for ${request.method} ${request.url}.` },
    }),
  );

  await app.register(authRoutes);
  await app.register(listingRoutes);
  await app.register(trackerRoutes);
  await app.register(adminRoutes);

  return app;
}
