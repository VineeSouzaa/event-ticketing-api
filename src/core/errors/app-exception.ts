import { HttpException } from '@nestjs/common';
import { ERRORS, ErrorCode } from './error-codes';

// Throw this for every domain error. The status always comes from ERRORS, so a call site only
// names the code: `throw new AppException('SOLD_OUT', { details: { available: 3 } })`.
// The body is the ErrorResponseDto shape, which Nest sends as-is.
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    options: { message?: string; details?: Record<string, unknown> } = {},
  ) {
    const { status, message } = ERRORS[code];
    super(
      {
        statusCode: status,
        code,
        message: options.message ?? message,
        details: options.details,
      },
      status,
    );
  }
}
