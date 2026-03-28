import type { Context } from "hono";
import { AppError } from "../lib/error";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      {
        errorCode: err.errorCode,
        message: err.message,
      },
      err.status
    );
  }

  // Log unexpected errors for debugging
  console.error("Unexpected error:", err);

  return c.json(
    {
      errorCode: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    500
  );
}
