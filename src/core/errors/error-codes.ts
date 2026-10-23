import { HttpStatus } from '@nestjs/common';

type ErrorDefinition = { status: HttpStatus; message: string };

// The single place that decides which HTTP status each domain error uses. To change a status, edit
// it here; nothing else hard-codes one.
//
// Clients (the frontend included) must branch on the string `code`, never on the numeric status:
// the code is the contract and is exported to the OpenAPI spec as the `ErrorCode` enum, so the
// generated client gets it as a type. Messages are English defaults for logs and debugging; the UI
// maps `code` to its own text.
//
// Rule of thumb for the status:
//   400  the request itself is malformed or fails validation
//   422  well-formed, but contradicts something the client sent before (idempotency key reuse)
//   409  the request is fine but conflicts with the CURRENT state (sold out, limit, expired, ...)
//   404  the thing does not exist, or is not yours (the two look the same on purpose)
export const ERRORS = {
  // --- generic ---
  VALIDATION_FAILED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The request is invalid.',
  },
  RATE_LIMITED: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests. Try again shortly.',
  },
  INTERNAL_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Something went wrong on our side.',
  },
  SERVICE_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'A required service is temporarily unavailable.',
  },

  // --- catalog ---
  EVENT_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Event not found.',
  },
  TICKET_TIER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Ticket tier not found.',
  },
  EVENT_NOT_ON_SALE: {
    status: HttpStatus.CONFLICT,
    message: 'This event is not on sale.',
  },

  // --- reservations: create ---
  IDEMPOTENCY_KEY_REQUIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The Idempotency-Key header is required.',
  },
  IDEMPOTENCY_KEY_REUSED: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'This Idempotency-Key was already used with a different request.',
  },
  SOLD_OUT: {
    status: HttpStatus.CONFLICT,
    message: 'Not enough tickets left in this tier.',
  },
  USER_EVENT_LIMIT_EXCEEDED: {
    status: HttpStatus.CONFLICT,
    message: 'Ticket limit per user for this event exceeded.',
  },

  // --- reservations: lifecycle ---
  RESERVATION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Reservation not found.',
  },
  RESERVATION_EXPIRED: {
    status: HttpStatus.CONFLICT,
    message: 'The hold on this reservation has expired.',
  },
  INVALID_RESERVATION_STATE: {
    status: HttpStatus.CONFLICT,
    message: 'This action is not allowed in the reservation current state.',
  },

  // --- payment webhook ---
  WEBHOOK_SIGNATURE_INVALID: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The webhook signature is invalid.',
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ERRORS;

export const ERROR_CODES = Object.keys(ERRORS) as ErrorCode[];
