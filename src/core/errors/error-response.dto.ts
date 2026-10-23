import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_CODES, type ErrorCode } from './error-codes';

// Body of every error response. `enumName` makes the generated frontend client export a named
// `ErrorCode` type, which is how the frontend refers to these codes.
export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({
    enum: ERROR_CODES,
    enumName: 'ErrorCode',
    example: 'SOLD_OUT',
  })
  code: ErrorCode;

  @ApiProperty({ example: 'Not enough tickets left in this tier.' })
  message: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description:
      'Extra data specific to the code (e.g. how many tickets are left).',
  })
  details?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Quote this when reporting a problem; it matches the log entries.',
  })
  correlationId?: string;
}
