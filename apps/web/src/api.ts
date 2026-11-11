import type {
  ExtractionDraftDto,
  ListingDto,
  ListingInput,
  PublicUser,
  TrackerEntryDto,
  TrackerStatus,
} from '@talea/shared';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const body = payload as { error?: { code?: string; message?: string; details?: unknown } } | null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? 'Request failed.',
      body?.error?.details,
    );
  }

  return payload as T;
}

export interface ListingFilters {
  q?: string;
  type?: 'coop' | 'gdp';
  city?: string;
  deadlineStatus?: 'open' | 'closing_soon' | 'closed';
  includeArchived?: boolean;
  sort?: 'deadline' | 'recent' | 'title';
}

function toQuery(filters: ListingFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || value === false) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const api = {
  session: () => request<{ user: PublicUser | null }>('/auth/session'),

  login: (email: string, password: string) =>
    request<{ user: PublicUser }>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (input: {
    name: string;
    email: string;
    password: string;
    academicYear: number | 'graduate';
  }) =>
    request<{ user: PublicUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () => request<void>('/auth/session', { method: 'DELETE' }),

  listings: (filters: ListingFilters = {}) =>
    request<{ items: ListingDto[]; total: number }>(`/listings${toQuery(filters)}`),

  listing: (id: string) => request<{ listing: ListingDto }>(`/listings/${id}`),

  tracker: () => request<{ items: TrackerEntryDto[] }>('/tracker'),

  track: (listingId: string) =>
    request<{ entry: TrackerEntryDto }>('/tracker', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    }),

  transition: (entryId: string, to: TrackerStatus, note?: string) =>
    request<{ entry: TrackerEntryDto }>(`/tracker/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ to, ...(note ? { note } : {}) }),
    }),

  adminCreateListing: (listing: ListingInput, draftId?: string) =>
    request<{ listing: ListingDto }>('/admin/listings', {
      method: 'POST',
      body: JSON.stringify({ ...listing, ...(draftId ? { draftId } : {}) }),
    }),

  adminUpdateListing: (id: string, patch: Partial<ListingInput>) =>
    request<{ listing: ListingDto }>(`/admin/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  adminExtract: (rawText: string) =>
    request<{ draft: ExtractionDraftDto }>('/admin/extractions', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),
};
