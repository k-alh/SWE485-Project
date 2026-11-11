/**
 * Talea domain rules — pure functions with no I/O.
 *
 * Everything here is shared by the API and the web client so that a rule can
 * never drift between the two. Nothing in this file may import from `apps/`.
 */

export const TRACKER_STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export const LISTING_TYPES = ['coop', 'gdp'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const ACADEMIC_YEARS = [3, 4, 5, 'graduate'] as const;
export type AcademicYear = (typeof ACADEMIC_YEARS)[number];

export const USER_ROLES = ['student', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  coop: 'CO-OP',
  gdp: 'GDP',
};

export const TRACKER_STATUS_LABELS: Record<TrackerStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

/**
 * The tracker pipeline. Forward moves are one step at a time; `rejected` is an
 * exit that any non-terminal stage may take. `offer` is terminal apart from
 * being declined, which is also recorded as `rejected`.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<TrackerStatus, readonly TrackerStatus[]>> = {
  saved: ['applied', 'rejected'],
  applied: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['rejected'],
  rejected: [],
};

export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function canTransition(from: TrackerStatus, to: TrackerStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TrackerStatus, to: TrackerStatus): void {
  if (from === to) {
    throw new DomainError('SAME_STATUS', `Entry is already "${from}".`);
  }
  if (!canTransition(from, to)) {
    const allowed = ALLOWED_TRANSITIONS[from];
    const hint = allowed.length === 0 ? 'no further moves are allowed' : `allowed: ${allowed.join(', ')}`;
    throw new DomainError(
      'INVALID_TRANSITION',
      `Cannot move from "${from}" to "${to}" — ${hint}.`,
    );
  }
}

export function isTerminalStatus(status: TrackerStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

/** Days within which a deadline counts as "closing soon". */
export const CLOSING_SOON_DAYS = 7;

export type DeadlineStatus = 'open' | 'closing_soon' | 'closed';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight UTC of the given instant, so day arithmetic ignores clock time. */
function startOfDayUTC(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

/**
 * Whole days from `now` to `deadline`. Negative means the deadline has passed.
 * A deadline of today returns 0.
 */
export function daysUntil(deadline: Date | string, now: Date = new Date()): number {
  const end = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (Number.isNaN(end.getTime())) {
    throw new DomainError('INVALID_DATE', 'Deadline is not a valid date.');
  }
  return Math.round((startOfDayUTC(end) - startOfDayUTC(now)) / MS_PER_DAY);
}

/**
 * Status computed from the deadline alone — never stored, so it cannot go stale.
 * `closed` once the deadline day has passed; `closing_soon` inside the window.
 */
export function deadlineStatus(deadline: Date | string, now: Date = new Date()): DeadlineStatus {
  const days = daysUntil(deadline, now);
  if (days < 0) return 'closed';
  if (days <= CLOSING_SOON_DAYS) return 'closing_soon';
  return 'open';
}

export type EligibilityHint = 'eligible' | 'not_yet' | 'unknown';

/**
 * A hint, never a blocker: the catalogue shows it, and the student can still
 * save anything. `unknown` when the student has not told us their year.
 */
export function eligibilityHint(
  listingYears: readonly AcademicYear[],
  studentYear: AcademicYear | null | undefined,
): EligibilityHint {
  if (studentYear === null || studentYear === undefined) return 'unknown';
  return listingYears.includes(studentYear) ? 'eligible' : 'not_yet';
}

/**
 * Stable key used to block duplicate listings.
 *
 * Two listings collide when they share organisation, title and deadline day
 * after normalisation. Deliberately excludes city and description: the same
 * posting republished with a corrected city is still the same opportunity.
 */
export function buildDedupeKey(
  organisation: string,
  title: string,
  deadline: Date | string,
): string {
  const date = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (Number.isNaN(date.getTime())) {
    throw new DomainError('INVALID_DATE', 'Deadline is not a valid date.');
  }
  const day = date.toISOString().slice(0, 10);
  return `${normalise(organisation)}|${normalise(title)}|${day}`;
}

function normalise(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Sort key for the catalogue: open first, then closing soon, then closed. */
export const DEADLINE_STATUS_ORDER: Record<DeadlineStatus, number> = {
  open: 0,
  closing_soon: 1,
  closed: 2,
};
