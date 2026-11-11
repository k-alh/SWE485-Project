import type { Listing } from '@prisma/client';
import type { AcademicYear, ListingDto, ListingType } from '@talea/shared';

export function parseEligibility(value: string): AcademicYear[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part === 'graduate' ? 'graduate' : (Number(part) as AcademicYear)))
    .filter((year) => year === 'graduate' || year === 3 || year === 4 || year === 5);
}

export function serializeEligibility(years: readonly AcademicYear[]): string {
  const order = (year: AcademicYear) => (year === 'graduate' ? 99 : year);
  return [...new Set(years)].sort((a, b) => order(a) - order(b)).join(',');
}

/** A deadline is a day, not an instant — stored at UTC midnight. */
export function deadlineToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function toListingDto(listing: Listing): ListingDto {
  return {
    id: listing.id,
    title: listing.title,
    organisation: listing.organisation,
    type: listing.type as ListingType,
    city: listing.city,
    description: listing.description,
    deadline: listing.deadline.toISOString(),
    eligibilityYears: parseEligibility(listing.eligibilityYears),
    isActive: listing.isActive,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}
