/**
 * Typed error hierarchy for DevCollab v2 API.
 *
 * All errors that should produce a structured HTTP response extend AppError.
 * The global Fastify error handler in index.ts maps these to { error, message }.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(statusCode: number, message: string, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = this.constructor.name
    // Maintains correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(400, message, 'VALIDATION_ERROR')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'UNAUTHORIZED')
  }
}
