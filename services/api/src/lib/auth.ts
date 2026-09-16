import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { AppError } from "./http";

/**
 * JWT auth guard (PRD §4.1). Access tokens are short-lived (15 min) and carry
 * { sub, role, typ: "access" }. Route groups mount this via `router.use`.
 */

export interface AuthedUser {
  id: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

/** 401 unless a valid access token is presented as `Authorization: Bearer …`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "UNAUTHORIZED", "Missing bearer token — log in first"));
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as {
      sub?: string;
      role?: string;
      typ?: string;
    };
    if (payload.typ !== "access" || !payload.sub) throw new Error("not an access token");
    req.user = { id: payload.sub, role: payload.role ?? "SPOTTER" };
    next();
  } catch {
    next(new AppError(401, "UNAUTHORIZED", "Access token is invalid or expired"));
  }
}

/** Authenticated user id — for use inside handlers mounted behind requireAuth. */
export function requireUserId(req: Request): string {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Missing authenticated user");
  return req.user.id;
}