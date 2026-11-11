import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { assertTransition, trackerCreateSchema, trackerTransitionSchema } from '@talea/shared';
import type { TrackerStatus } from '@talea/shared';
import { requireUser } from '../auth.js';
import { prisma } from '../db.js';
import { conflict, notFound } from '../errors.js';
import { toListingDto } from '../services/listings.js';

type EntryWithRelations = Prisma.TrackerEntryGetPayload<{
  include: { listing: true; events: true };
}>;

function toTrackerDto(entry: EntryWithRelations) {
  return {
    id: entry.id,
    listingId: entry.listingId,
    status: entry.status as TrackerStatus,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    listing: toListingDto(entry.listing),
    events: [...entry.events]
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map((event) => ({
        id: event.id,
        fromStatus: (event.fromStatus as TrackerStatus | null) ?? null,
        toStatus: event.toStatus as TrackerStatus,
        note: event.note,
        at: event.at.toISOString(),
      })),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function trackerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/tracker', async (request) => {
    const user = await requireUser(request);

    const entries = await prisma.trackerEntry.findMany({
      where: { userId: user.id },
      include: { listing: true, events: true },
      orderBy: { updatedAt: 'desc' },
    });

    return { items: entries.map(toTrackerDto) };
  });

  app.post('/api/tracker', async (request, reply) => {
    const user = await requireUser(request);
    const input = trackerCreateSchema.parse(request.body);

    const listing = await prisma.listing.findUnique({ where: { id: input.listingId } });
    if (!listing || !listing.isActive) throw notFound('That listing is not available.');

    try {
      const entry = await prisma.trackerEntry.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          status: 'saved',
          events: { create: { toStatus: 'saved' } },
        },
        include: { listing: true, events: true },
      });
      return reply.code(201).send({ entry: toTrackerDto(entry) });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict('ALREADY_TRACKED', 'That listing is already in your tracker.');
      }
      throw error;
    }
  });

  app.patch('/api/tracker/:id', async (request) => {
    const user = await requireUser(request);
    const { id } = request.params as { id: string };
    const input = trackerTransitionSchema.parse(request.body);

    const entry = await prisma.trackerEntry.findUnique({ where: { id } });
    // Another student's entry is reported as missing, not forbidden: no existence leak.
    if (!entry || entry.userId !== user.id) throw notFound('Tracker entry not found.');

    const from = entry.status as TrackerStatus;
    assertTransition(from, input.to);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.statusEvent.create({
        data: {
          entryId: entry.id,
          fromStatus: from,
          toStatus: input.to,
          note: input.note ?? null,
        },
      });
      return tx.trackerEntry.update({
        where: { id: entry.id },
        data: { status: input.to },
        include: { listing: true, events: true },
      });
    });

    return { entry: toTrackerDto(updated) };
  });
}
