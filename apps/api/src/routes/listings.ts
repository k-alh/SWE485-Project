import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { deadlineStatus, listingQuerySchema } from '@talea/shared';
import { getCurrentUser } from '../auth.js';
import { prisma } from '../db.js';
import { notFound } from '../errors.js';
import { toListingDto } from '../services/listings.js';

export async function listingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/listings', async (request) => {
    const query = listingQuerySchema.parse(request.query);
    const user = await getCurrentUser(request);
    const includeArchived = query.includeArchived === true && user?.role === 'admin';

    const where: Prisma.ListingWhereInput = {};
    if (!includeArchived) where.isActive = true;
    if (query.type) where.type = query.type;
    if (query.city) where.city = { contains: query.city };
    if (query.q) {
      where.OR = [
        { title: { contains: query.q } },
        { organisation: { contains: query.q } },
        { description: { contains: query.q } },
        { city: { contains: query.q } },
      ];
    }

    const rows = await prisma.listing.findMany({ where });

    let items = rows.map(toListingDto);
    if (query.deadlineStatus) {
      items = items.filter((item) => deadlineStatus(item.deadline) === query.deadlineStatus);
    }

    if (query.sort === 'recent') {
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (query.sort === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Open opportunities first, then by how soon they close.
      items.sort((a, b) => {
        const rank = deadlineStatus(a.deadline) === 'closed' ? 1 : 0;
        const rankB = deadlineStatus(b.deadline) === 'closed' ? 1 : 0;
        return rank - rankB || a.deadline.localeCompare(b.deadline);
      });
    }

    return { items, total: items.length };
  });

  app.get('/api/listings/:id', async (request) => {
    const { id } = request.params as { id: string };
    const user = await getCurrentUser(request);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw notFound('That listing does not exist.');
    if (!listing.isActive && user?.role !== 'admin') throw notFound('That listing does not exist.');

    return { listing: toListingDto(listing) };
  });
}
