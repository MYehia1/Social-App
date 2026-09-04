import { ApplicationException } from './application.exceptions'

export class BadRequestException extends ApplicationException {
  constructor(message = 'Bad request', cause?: unknown) {
    super(message, 400, 'BAD_REQUEST', cause)
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message = 'Unauthorized', cause?: unknown) {
    super(message, 401, 'UNAUTHORIZED', cause)
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message = 'Forbidden', cause?: unknown) {
    super(message, 403, 'FORBIDDEN', cause)
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message = 'Not found', cause?: unknown) {
    super(message, 404, 'NOT_FOUND', cause)
  }
}

export class ConflictException extends ApplicationException {
  constructor(message = 'Conflict', cause?: unknown) {
    super(message, 409, 'CONFLICT', cause)
  }
}

export class PayloadTooLargeException extends ApplicationException {
  constructor(message = 'Payload too large', cause?: unknown) {
    super(message, 413, 'PAYLOAD_TOO_LARGE', cause)
  }
}

export class ServiceUnavailableException extends ApplicationException {
  constructor(message = 'Service unavailable', cause?: unknown) {
    super(message, 503, 'SERVICE_UNAVAILABLE', cause)
  }
}
