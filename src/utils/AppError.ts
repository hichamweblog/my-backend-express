export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Object.setPrototypeOf(this, AppError.prototype);
  }
  static badRequest(message: string = "Bad Request") {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message: string = "Not Found") {
    return new AppError(message, 404);
  }

  static internal(message: string = "Internal Server Error") {
    return new AppError(message, 500);
  }
}
