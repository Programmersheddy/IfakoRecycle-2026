import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Thin HTTP client for the EAS API (services/api — PRD §8.3).
 *
 * The API answers every route with a JSON envelope:
 *   success → { ok: true,  data: T }
 *   failure → { ok: false, error: { code, message, details? } }
 * Failures are normalized into ApiError so screens can render friendly copy.
 */

const TIMEOUT_MS = 15_000;

/** Machine-readable API failure — `code` mirrors the server's error codes. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/**
 * Base URL resolution order:
 *   1. EXPO_PUBLIC_API_URL (.env — inlined at build time by babel-preset-expo)
 *   2. app.json extra.apiBaseUrl
 *   3. Android-emulator default http://10.0.2.2:4000 (10.0.2.2 = host loopback)
 * `localhost` / `127.0.0.1` is rewritten to 10.0.2.2 on Android so the
 * checked-in config works in the emulator out of the box. Physical devices
 * need the host's LAN IP via EXPO_PUBLIC_API_URL in apps/mobile/.env.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromConfig = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;
  let base = fromEnv ?? fromConfig ?? "http://10.0.2.2:4000";
  if (Platform.OS === "android") {
    base = base.replace(/\/\/(?:localhost|127\.0\.0\.1)(:)/, "//10.0.2.2$1");
  }
  return base.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveBaseUrl();

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, accessToken, signal } = options;

  // Manual timeout — AbortSignal.timeout is not available on all Hermes builds.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? controller.signal,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Cannot reach the EAS API (${API_BASE_URL}). Start it with: pnpm --filter @eas/api dev`
    );
  } finally {
    clearTimeout(timer);
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON body (proxy error page, empty 502…) — handled via status below.
  }

  if (!res.ok) {
    const failure =
      (payload as ApiFailure | null)?.ok === false ? (payload as ApiFailure).error : undefined;
    throw new ApiError(
      res.status,
      failure?.code ?? "HTTP_ERROR",
      failure?.message ?? `Request failed with status ${res.status}`,
      failure?.details
    );
  }

  const envelope = payload as ApiEnvelope<T> | null;
  if (!envelope || envelope.ok !== true) {
    throw new ApiError(res.status, "BAD_RESPONSE", "Unexpected response from the EAS API");
  }
  return envelope.data;
}