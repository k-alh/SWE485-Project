import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  buildDedupeKey,
  extractionRequestSchema,
  listingInputSchema,
  listingPatchSchema,
} from '@talea/shared';
import type { AcademicYear } from '@talea/shared';
import { requireAdmin } from '../auth.js';
import { prisma } from '../db.js';
import { conflict, notFound } from '../errors.js';
import { extractListing } from '../services/extractor.js';
import type { ExtractionResult } from '../services/extractor.js';
import {
  deadlineToDate,
  serializeEligibility,
  toListingDto,
} from '../services/listings.js';

const createListingSchema = listingInputSchema.extend({
  /** When present, the draft that produced this listing is marked approved. */
  draftId: z.string().trim().min(1).optional(),
});

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function duplicateConflict(key: string) {
  const existing = await prisma.listing.findUnique({ where: { dedupeKey: key } });
  return conflict(
    'DUPLICATE_LISTING',
    'A listing with the same organisation, title and deadline already exists.',
    { existingListingId: existing?.id ?? null },
  );
}

function toDraftDto(
  draft: { id: string; rawText: string; provider: string; extractedJson: string; createdAt: Date },
  result: ExtractionResult,
) {
  return {
    id: draft.id,
    rawText: draft.rawText,
    provider: draft.provider,
    fields: result.fields,
    missing: result.missing,
    flaggedInstructions: result.flaggedInstructions,
    createdAt: draft.createdAt.toISOString(),
  };
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/admin/listings', async (request, reply) => {
    const admin = await requireAdmin(request);
    const input = createListingSchema.parse(request.body);

    const deadline = deadlineToDate(input.deadline);
    const key = buildDedupeKey(input.organisation, input.title, deadline);

    try {
      const listing = await prisma.listing.create({
        data: {
          title: input.title,
          organisation: input.organisation,
          type: input.type,
          city: input.city,
          description: input.description,
          deadline,
          eligibilityYears: serializeEligibility(input.eligibilityYears as AcademicYear[]),
          dedupeKey: key,
          isActive: input.isActive ?? true,
        },
      });

      if (input.draftId) {
        await prisma.aiExtractionDraft.updateMany({
          where: { id: input.draftId, adminId: admin.id, status: 'draft' },
          data: { status: 'approved', listingId: listing.id, reviewedAt: new Date() },
        });
      }

      return reply.code(201).send({ listing: toListingDto(listing) });
    } catch (error) {
      if (isUniqueViolation(error)) throw await duplicateConflict(key);
      throw error;
    }
  });

  app.patch('/api/admin/listings/:id', async (request) => {
    await requireAdmin(request);
    const { id } = request.params as { id: string };
    const patch = listingPatchSchema.parse(request.body);

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) throw notFound('That listing does not exist.');

    const title = patch.title ?? existing.title;
    const organisation = patch.organisation ?? existing.organisation;
    const deadline = patch.deadline ? deadlineToDate(patch.deadline) : existing.deadline;
    const key = buildDedupeKey(organisation, title, deadline);

    try {
      const listing = await prisma.listing.update({
        where: { id },
        data: {
          title,
          organisation,
          deadline,
          dedupeKey: key,
          type: patch.type ?? existing.type,
          city: patch.city ?? existing.city,
          description: patch.description ?? existing.description,
          eligibilityYears: patch.eligibilityYears
            ? serializeEligibility(patch.eligibilityYears as AcademicYear[])
            : existing.eligibilityYears,
          isActive: patch.isActive ?? existing.isActive,
        },
      });
      return { listing: toListingDto(listing) };
    } catch (error) {
      if (isUniqueViolation(error)) throw await duplicateConflict(key);
      throw error;
    }
  });

  app.post('/api/admin/extractions', async (request, reply) => {
    const admin = await requireAdmin(request);
    const input = extractionRequestSchema.parse(request.body);

    const result = await extractListing(input.rawText);

    const draft = await prisma.aiExtractionDraft.create({
      data: {
        adminId: admin.id,
        rawText: input.rawText,
        extractedJson: JSON.stringify(result),
        provider: result.provider,
      },
    });

    return reply.code(201).send({ draft: toDraftDto(draft, result) });
  });
}
