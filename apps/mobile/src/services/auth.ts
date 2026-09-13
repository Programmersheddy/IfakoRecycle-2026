/**
 * Auth session service — talks to the real EAS API (PRD §8.3):
 *   POST /v1/auth/otp/request  { phone: "+234XXXXXXXXXX" }
 *   POST /v1/auth/otp/verify   { phone, code } → access + refresh tokens
 *   POST /v1/auth/refresh      { refreshToken } → rotated token pair
 *
 * Both tokens live in AsyncStorage: the access token drives the auth guard,
 * the refresh token powers silent renewal (§4.1 — access 15 min, refresh 7 d).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, apiRequest } from "./api";

const AUTH_TOKEN_KEY = "@eas:authToken";
const AUTH_REFRESH_KEY = "@eas:refreshToken";
const AUTH_PHONE_KEY = "@eas:phone";
const AUTH_USER_KEY = "@eas:user";

/** 10-digit local number ("8012345678") → MSISDN the API expects ("+2348012345678"). */
export function toMsisdn(localPhone: string): string {
  return `+234${localPhone.replace(/\D/g, "").slice(-10)}`;
}

export interface SessionUser {
  id: string;
  phone: string;
  role: string;
  isNewUser: boolean;
}

// ---------------------------------------------------------------------------
// Session storage
// ---------------------------------------------------------------------------

export async function saveSession(
  accessToken: string,
  refreshToken: string,
  phone: string,
  user?: SessionUser
): Promise<void> {
  const entries: Array<[string, string]> = [
    [AUTH_TOKEN_KEY, accessToken],
    [AUTH_REFRESH_KEY, refreshToken],
    [AUTH_PHONE_KEY, phone],
  ];
  if (user) entries.push([AUTH_USER_KEY, JSON.stringify(user)]);
  await Promise.all(entries.map(([key, value]) => AsyncStorage.setItem(key, value)));
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_REFRESH_KEY);
}

export async function getStoredPhone(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_PHONE_KEY);
}

export async function getStoredUser(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_REFRESH_KEY),
    AsyncStorage.removeItem(AUTH_PHONE_KEY),
    AsyncStorage.removeItem(AUTH_USER_KEY),
  ]);
}

// ---------------------------------------------------------------------------
// POST /v1/auth/otp/request
// ---------------------------------------------------------------------------

export interface SendOtpResult {
  phone: string;
  resendCooldownSec: number;
  expiresAt: string;
  /** Dev only — present when the API runs with OTP_DEBUG_LOG (no Termii key). */
  debugCode?: string;
}

export async function sendOtp(localPhone: string): Promise<SendOtpResult> {
  return apiRequest<SendOtpResult>("/v1/auth/otp/request", {
    method: "POST",
    body: { phone: toMsisdn(localPhone) },
  });
}

// ---------------------------------------------------------------------------
// POST /v1/auth/otp/verify — persists both tokens on success
// ---------------------------------------------------------------------------

export interface VerifyOtpResult {
  user: SessionUser;
  accessToken: string;
  expiresInSec: number;
}

export async function verifyOtp(localPhone: string, code: string): Promise<VerifyOtpResult> {
  const data = await apiRequest<{
    accessToken: string;
    refreshToken: string;
    expiresInSec: number;
    user: SessionUser;
  }>("/v1/auth/otp/verify", {
    method: "POST",
    body: { phone: toMsisdn(localPhone), code },
  });

  await saveSession(data.accessToken, data.refreshToken, localPhone, data.user);
  return {
    user: data.user,
    accessToken: data.accessToken,
    expiresInSec: data.expiresInSec,
  };
}

// ---------------------------------------------------------------------------
// POST /v1/auth/refresh — rotate the pair; clear the session when rejected
// ---------------------------------------------------------------------------

export async function refreshSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const data = await apiRequest<{ accessToken: string; refreshToken: string; expiresInSec: number }>(
      "/v1/auth/refresh",
      { method: "POST", body: { refreshToken } }
    );
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, data.accessToken),
      AsyncStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken),
    ]);
    return true;
  } catch (err) {
    // Refresh rejected → the session is dead; wipe it so the auth guard
    // in app/_layout.tsx routes back to the phone screen.
    if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
      await clearSession();
    }
    return false;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Refresh the token pair — single-flight, concurrent callers share one request. */
export async function ensureFreshTokens(): Promise<boolean> {
  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Authenticated request helper — future /v1 endpoints go through here; a 401
// transparently refreshes the token pair once, then retries the request.
// ---------------------------------------------------------------------------

export async function authedRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}
): Promise<T> {
  try {
    return await apiRequest<T>(path, { ...options, accessToken: await getToken() });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && (await ensureFreshTokens())) {
      return apiRequest<T>(path, { ...options, accessToken: await getToken() });
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Friendly error copy for the screens
// ---------------------------------------------------------------------------

export function friendlyAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "NETWORK_ERROR" || err.status === 0) return err.message;
    if (err.status >= 500) return "The server had a hiccup — please try again shortly.";
    // Server-provided copy (cooldown, invalid OTP, …) already reads well.
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong — please try again.";
}
