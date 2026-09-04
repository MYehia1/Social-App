/**
 * Base class for every error the application throws deliberately.
 *
 * `code` is a stable, machine-readable identifier the client can branch on;
 * `message` is human-facing text that may change without breaking callers.
 */
export class ApplicationException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    override readonly cause?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}
