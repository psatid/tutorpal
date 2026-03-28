/**
 * AppError is a custom error class that extends the built-in Error class.
 * Example usage:
 * throw AppError.notFound("USER_NOT_FOUND", "User not found");
 * throw AppError.badRequest("VALIDATION_ERROR", "Validation error");
 * throw AppError.conflict("CONFLICT_ERROR", "Conflict error");
 * throw AppError.unauthorized("UNAUTHORIZED_ERROR", "Unauthorized error");
 * throw AppError.forbidden("FORBIDDEN_ERROR", "Forbidden error");
 */
export class AppError extends Error {
  /**
   * @param errorCode - internal error code, frontend can use this to handle the error
   * @param message - error message to be returned to the frontend
   * @param status - HTTP status code
   */
  constructor(
    public errorCode: string,
    message: string,
    public status: 200 | 400 | 401 | 403 | 404 | 409 | 500 = 500
  ) {
    super(message);
    this.name = "AppError";
  }

  static notFound(errorCode: string, msg: string) {
    return new AppError(errorCode, msg, 404);
  }

  static badRequest(errorCode: string, msg: string) {
    return new AppError(errorCode, msg, 400);
  }

  static conflict(errorCode: string, msg: string) {
    return new AppError(errorCode, msg, 409);
  }

  static unauthorized(errorCode: string, msg: string) {
    return new AppError(errorCode, msg, 401);
  }

  static forbidden(errorCode: string, msg: string) {
    return new AppError(errorCode, msg, 403);
  }
}
