# core/errors

Every domain error the API can return, in one file: `error-codes.ts`. Each code maps to an HTTP
status and a default message. **To change a status, edit it there.**

- `AppException(code, { message?, details? })` is what code throws. The status is looked up, never
  passed at the call site.
- `ErrorResponseDto` is the body of every error. It publishes the codes to OpenAPI as the named
  `ErrorCode` enum, so the frontend's generated client has them as a type.
- Clients branch on `code`, never on the numeric status.

Status rule of thumb: 400 malformed/invalid input, 422 contradicts something the client sent
before, 409 conflicts with the current state, 404 not found or not yours. Authentication errors
come from `@nestjs/authentication` and are not redefined here.
