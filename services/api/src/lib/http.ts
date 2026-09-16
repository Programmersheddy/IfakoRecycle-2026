import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

/** Typed application error with an HTTP status and machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

type RouteHandler = (req: Request, res: Response, next: NextFunction) => unknown;

/** Wrap route handlers so async rejections reach the error middleware. */
export const asyncHandler =
  (fn: RouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Zod request validation middleware for a given property of the request.
 * The parsed (and coerced/normalized) value replaces the raw one.
 */
export const validate =
  (schema: ZodTypeAny, property: "body" | "query" | "params" = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
      next(
        new AppError(422, "VALIDATION_ERROR", "Invalid request payload", flattenZod(result.error))
      );
      return;
    }
    Object.defineProperty(req, property, { value: result.data, writable: true, configurable: true });
    next();
  };

export function flattenZod(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    out[issue.path.join(".") || "_root"] = issue.message;
  }
  return out;
}

/** Final error middleware — keeps responses in the { error: {...} } envelope. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) }
    });
    return;
  }
  // Safety net for controllers that bypass the validate() middleware and
  // forward a raw ZodError (e.g. via next(err) after schema.parse).
  if (err instanceof ZodError) {
    res.status(422).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: flattenZod(err)
      }
    });
    return;
  }
  if (err instanceof SyntaxError && "body" in (err as { body?: unknown })) {
    res.status(400).json({
      ok: false,
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON" }
    });
    return;
  }
   
  console.error("[eas-api] unhandled error:", err);
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" }
  });
}
