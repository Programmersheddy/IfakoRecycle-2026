import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema
} from "./auth.schema";
import { AuthError, refresh, requestOtp, verifyOtp } from "./auth.service";

/**
 * Auth controller (PRD §8.3): thin HTTP layer — Zod validation, delegate to
 * the service, map errors to JSON. No business logic lives here.
 */

export async function postOtpRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = otpRequestSchema.parse(req.body);
    const result = await requestOtp(phone);
    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postOtpVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, code } = otpVerifySchema.parse(req.body);
    const result = await verifyOtp(phone, code);
    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function postRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refresh(refreshToken);
    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** Shared error mapper: AuthError / ZodError -> JSON envelope. */
export function authErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AuthError) {
    res.status(err.status).json({ ok: false, error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Request body is invalid",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      }
    });
    return;
  }
  next(err);
}
