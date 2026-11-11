import { DomainError } from '@talea/shared';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'BAD_REQUEST', message, details);

export const unauthorized = (message = 'Sign in to continue.') =>
  new HttpError(401, 'UNAUTHENTICATED', message);

export const forbidden = (message = 'You do not have access to this resource.') =>
  new HttpError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Not found.') => new HttpError(404, 'NOT_FOUND', message);

export const conflict = (code: string, message: string, details?: unknown) =>
  new HttpError(409, code, message, details);

/** Maps a domain rule violation onto the status the client should see. */
export function domainErrorToHttp(error: DomainError): HttpError {
  if (error.code === 'INVALID_TRANSITION' || error.code === 'SAME_STATUS') {
    return new HttpError(409, error.code, error.message);
  }
  return badRequest(error.message);
}
