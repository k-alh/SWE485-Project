export * from './domain.js';
export * from './schemas.js';

import type { AcademicYear, ListingType, TrackerStatus, UserRole } from './domain.js';

/** Shapes the API returns. Dates are ISO-8601 strings on the wire. */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  academicYear: AcademicYear | null;
}

export interface ListingDto {
  id: string;
  title: string;
  organisation: string;
  type: ListingType;
  city: string;
  description: string;
  /** ISO-8601 date, e.g. "2026-12-01T00:00:00.000Z" */
  deadline: string;
  eligibilityYears: AcademicYear[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerEventDto {
  id: string;
  fromStatus: TrackerStatus | null;
  toStatus: TrackerStatus;
  note: string | null;
  at: string;
}

export interface TrackerEntryDto {
  id: string;
  listingId: string;
  status: TrackerStatus;
  createdAt: string;
  updatedAt: string;
  listing: ListingDto;
  events: TrackerEventDto[];
}

export interface ExtractionDraftDto {
  id: string;
  rawText: string;
  provider: string;
  /** Field-by-field result the admin reviews before approving. */
  fields: {
    title: string;
    organisation: string;
    type: ListingType;
    city: string;
    description: string;
    deadline: string;
    eligibilityYears: AcademicYear[];
  };
  /** Fields the extractor could not fill from the pasted text. */
  missing: string[];
  /** Text that looked like an instruction to the model rather than listing data. */
  flaggedInstructions: string[];
  createdAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
