import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../env";
import { prisma } from "../../lib/prisma";
import { sendOtpSms } from "../../lib/sms";

/**
 * Auth service layer (PRD §4.1 — phone + OTP; §8.3 endpoints).
 *
 * Hashing: bcryptjs for OTP codes (low-entropy, brute-forceable); SHA-256 for
 * refresh tokens — they are high-entropy JWTs, and bcrypt's 72-byte input
 * truncation would make every token for a user hash identically, defeating
 * replay detection.
 * JWTs: jsonwebtoken — access 15 min, refresh 7 days with rotation.
 */

// TTLs (PRD §4.1).
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 60; // §4.1 anti-abuse cooldown
const BCRYPT_ROUNDS = 10;

export interface OtpRequestResult {
  phone: string;
  resendCooldownSec: number;
  expiresAt: string;
  /** Dev/test only — never expose in production responses. */
  debugCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
}

export interface OtpVerifyResult extends AuthTokens {
  user: {
    id: string;
    phone: string;
    role: string;
    isNewUser: boolean;
  };
}

export class AuthError extends Error {
  constructor(
    public code:
      | "PHONE_INVALID"
      | "OTP_SEND_FAILED"
      | "RESEND_COOLDOWN"
      | "OTP_NOT_FOUND"
      | "OTP_EXPIRED"
      | "OTP_MAX_ATTEMPTS"
      | "OTP_INVALID"
      | "REFRESH_INVALID",
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role, typ: "access" }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL_SEC
  });
}

/** Exact, full-length digest — refresh JWTs exceed bcrypt's 72-byte limit. */
function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function issueRefreshToken(userId: string): Promise<string> {
  // Opaque random token; only its hash is persisted (rotation support).
  // jti makes each token unique even when minted in the same second —
  // otherwise iat/exp granularity yields byte-identical JWTs, which would
  // let a revoked token pass as its own replacement.
  const raw = jwt.sign(
    { sub: userId, typ: "refresh", jti: randomBytes(24).toString("hex") },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL_SEC }
  );
  const tokenHash = hashRefreshToken(raw);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL_SEC * 1000)
    }
  });
  return raw;
}

// ---------------------------------------------------------------------------
// POST /v1/auth/otp/request
// ---------------------------------------------------------------------------

export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  // §4.1 anti-abuse: cooldown since the last OTP for this phone.
  const last = await prisma.otpCode.findFirst({
    where: { phone, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_SEC * 1000) } },
    orderBy: { createdAt: "desc" }
  });
  if (last) {
    const waited = Math.floor((Date.now() - last.createdAt.getTime()) / 1000);
    throw new AuthError(
      "RESEND_COOLDOWN",
      `An OTP was already requested — wait ${RESEND_COOLDOWN_SEC - waited}s before retrying`,
      429
    );
  }

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpCode.create({ data: { phone, codeHash, channel: "sms", expiresAt } });

  const sms = await sendOtpSms(phone, code);
  if (!sms.delivered) {
    throw new AuthError(
      "OTP_SEND_FAILED",
      "Could not deliver OTP — both SMS and WhatsApp fallback failed",
      502
    );
  }

  return {
    phone,
    resendCooldownSec: RESEND_COOLDOWN_SEC,
    expiresAt: expiresAt.toISOString(),
    debugCode: env.OTP_DEBUG_LOG ? code : undefined // dev/test only
  };
}

// ---------------------------------------------------------------------------
// POST /v1/auth/otp/verify
// ---------------------------------------------------------------------------

export async function verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumed: false },
    orderBy: { createdAt: "desc" }
  });

  if (!otp) throw new AuthError("OTP_NOT_FOUND", "No active OTP for this phone — request a new one", 404);
  if (otp.expiresAt.getTime() < Date.now()) {
    throw new AuthError("OTP_EXPIRED", "OTP expired — request a new one", 410);
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AuthError("OTP_MAX_ATTEMPTS", "Too many failed attempts — request a new OTP", 429);
  }

  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    const remaining = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
    throw new AuthError("OTP_INVALID", `Incorrect OTP — ${remaining} attempt(s) remaining`);
  }

  // Single-use: consume the code, then create-or-find the user (phone-first signup).
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  const existing = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !existing;
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        phone,
        wallet: { create: {} } // §8.1 — every spotter gets a wallet at signup
      }
    }));

  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: await issueRefreshToken(user.id),
    expiresInSec: env.JWT_ACCESS_TTL_SEC,
    user: { id: user.id, phone: user.phone, role: user.role, isNewUser }
  };
}

// ---------------------------------------------------------------------------
// POST /v1/auth/refresh
// ---------------------------------------------------------------------------

export async function refresh(raw: string): Promise<AuthTokens> {
  let payload: { sub?: string; typ?: string };
  try {
    payload = jwt.verify(raw, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw new AuthError("REFRESH_INVALID", "Refresh token is invalid or expired", 401);
  }
  if (payload.typ !== "refresh" || !payload.sub) {
    throw new AuthError("REFRESH_INVALID", "Refresh token is invalid", 401);
  }

  // Exact hash-lookup: token must match a stored, non-revoked, unexpired hash.
  const match = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashRefreshToken(raw),
      revoked: false,
      expiresAt: { gt: new Date() }
    }
  });
  if (!match || match.userId !== payload.sub) {
    throw new AuthError("REFRESH_INVALID", "Refresh token not recognized", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AuthError("REFRESH_INVALID", "User no longer exists", 401);

  // Rotation: revoke the used token so it can never be replayed (§4.1).
  await prisma.refreshToken.update({ where: { id: match.id }, data: { revoked: true } });

  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: await issueRefreshToken(user.id),
    expiresInSec: env.JWT_ACCESS_TTL_SEC
  };
}
