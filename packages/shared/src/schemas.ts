import { z } from 'zod';
import { ACADEMIC_YEARS, LISTING_TYPES, TRACKER_STATUSES } from './domain.js';

/**
 * Input contracts. The same schemas validate in the API and drive the web
 * forms, so a rule cannot be enforced on one side only.
 */

export const academicYearSchema = z.union([
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal('graduate'),
]);

export const listingTypeSchema = z.enum(LISTING_TYPES);
export const trackerStatusSchema = z.enum(TRACKER_STATUSES);

const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email('Enter a valid email address.')
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(200, 'Password is too long.');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email: emailSchema,
  password: passwordSchema,
  academicYear: academicYearSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
    message: 'That date does not exist.',
  });

export const listingInputSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short.').max(160),
  organisation: z.string().trim().min(2, 'Organisation is too short.').max(160),
  type: listingTypeSchema,
  city: z.string().trim().min(2, 'City is required.').max(80),
  description: z.string().trim().min(20, 'Description needs at least 20 characters.').max(4000),
  deadline: isoDay,
  eligibilityYears: z
    .array(academicYearSchema)
    .min(1, 'Pick at least one eligible year.')
    .max(ACADEMIC_YEARS.length),
  isActive: z.boolean().optional(),
});

export const listingPatchSchema = listingInputSchema.partial();

export const trackerCreateSchema = z.object({
  listingId: z.string().trim().min(1),
});

export const trackerTransitionSchema = z.object({
  to: trackerStatusSchema,
  note: z.string().trim().max(280).optional(),
});

export const listingQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: listingTypeSchema.optional(),
  city: z.string().trim().max(80).optional(),
  deadlineStatus: z.enum(['open', 'closing_soon', 'closed']).optional(),
  includeArchived: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((value) => value === true || value === 'true')
    .optional(),
  sort: z.enum(['deadline', 'recent', 'title']).optional(),
});

/** Admin AI ingestion — the pasted text is the only grounding source. */
export const extractionRequestSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(20, 'Paste at least 20 characters of listing text.')
    .max(8000, 'Paste at most 8000 characters.'),
});

export const extractionApproveSchema = z.object({
  listing: listingInputSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingInput = z.infer<typeof listingInputSchema>;
export type ListingPatch = z.infer<typeof listingPatchSchema>;
export type ListingQuery = z.infer<typeof listingQuerySchema>;
export type ExtractionRequest = z.infer<typeof extractionRequestSchema>;
