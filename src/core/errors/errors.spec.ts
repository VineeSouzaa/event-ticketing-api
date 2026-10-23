import { AppException } from './app-exception';
import { ERROR_CODES, ERRORS } from './error-codes';

describe('ERRORS', () => {
  it.each(ERROR_CODES)('%s has an error status and a message', (code) => {
    expect(ERRORS[code].status).toBeGreaterThanOrEqual(400);
    expect(ERRORS[code].message.length).toBeGreaterThan(0);
  });

  it('exports every key as a code', () => {
    expect(ERROR_CODES).toEqual(Object.keys(ERRORS));
  });
});

describe('AppException', () => {
  it('takes the status from the central map', () => {
    const error = new AppException('SOLD_OUT');
    expect(error.getStatus()).toBe(ERRORS.SOLD_OUT.status);
    expect(error.getResponse()).toEqual({
      statusCode: ERRORS.SOLD_OUT.status,
      code: 'SOLD_OUT',
      message: ERRORS.SOLD_OUT.message,
      details: undefined,
    });
  });

  it('accepts a custom message and details', () => {
    const error = new AppException('SOLD_OUT', {
      message: 'Only 2 left.',
      details: { available: 2 },
    });
    expect(error.getResponse()).toMatchObject({
      message: 'Only 2 left.',
      details: { available: 2 },
    });
  });
});
