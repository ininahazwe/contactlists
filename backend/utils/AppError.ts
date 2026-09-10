export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 404);
  }

  static forbidden(message = "You do not have access to this resource"): AppError {
    return new AppError(message, 403);
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(message, 401);
  }
}
