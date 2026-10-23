import 'reflect-metadata';
import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiResponse, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ERROR_CODES } from './error-codes';
import { ErrorResponseDto } from './error-response.dto';

@Controller('probe')
class ProbeController {
  @Get()
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  probe() {}
}

// The frontend generates its client from this spec, so the named `ErrorCode` enum is part of the
// contract: if it stops being published, the frontend loses its type.
describe('ErrorResponseDto in the OpenAPI spec', () => {
  it('publishes ErrorCode as a named enum with every code', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    await app.close();

    const schemas = document.components?.schemas as Record<
      string,
      { enum?: string[] }
    >;
    expect(schemas.ErrorCode.enum).toEqual(ERROR_CODES);
  });
});
