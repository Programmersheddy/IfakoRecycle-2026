import { Platform } from "react-native";

/**
 * Safe wrapper around react-native-sms-retriever (Android SMS Retriever API).
 *
 * The native module only exists in dev-client / production builds (Expo
 * autolinking) — NOT in Expo Go, where importing it throws (its index.js
 * dereferences NativeModules at import time). Every entry point therefore
 * loads the module lazily and degrades gracefully to manual OTP entry.
 *
 * For auto-read to fire, the SMS body must END with the app's 11-char hash —
 * services/api appends it when SMS_RETRIEVER_HASH is set (see termii.ts).
 */

interface SmsListenerEvent {
  message?: string;
  extras?: string;
  status?: string;
  timeout?: string;
}

interface SmsRetrieverNative {
  startSmsRetriever: () => Promise<boolean>;
  addSmsListener: (callback: (event: SmsListenerEvent) => void) => Promise<boolean>;
  removeSmsListener: () => void;
}

// Metro injects `require` per-module; it's not in the TS lib scope here.
declare const require: (id: string) => unknown;

let cached: SmsRetrieverNative | null | undefined;

function loadModule(): SmsRetrieverNative | null {
  if (cached !== undefined) return cached;
  try {
    // Lazy require keeps Expo Go from crashing at import time.
    const mod = require("react-native-sms-retriever") as
      | { default?: SmsRetrieverNative }
      | SmsRetrieverNative;
    const resolved =
      (mod as { default?: SmsRetrieverNative }).default ?? (mod as SmsRetrieverNative);
    cached = typeof resolved?.startSmsRetriever === "function" ? resolved : null;
  } catch {
    cached = null; // Expo Go or unsupported platform
  }
  return cached;
}

/** Whether auto-read can work in this build (native module present + Android). */
export function isSmsAutoReadSupported(): boolean {
  return Platform.OS === "android" && loadModule() !== null;
}

let active = false;

/**
 * Start listening for the verification SMS. Resolves `true` when listening —
 * `false` means "unavailable here, let the user type the code manually".
 */
export async function startSmsAutoRead(onCode: (code: string) => void): Promise<boolean> {
  const mod = loadModule();
  if (Platform.OS !== "android" || !mod) return false;
  if (active) return true;

  try {
    const started = await mod.startSmsRetriever();
    if (!started) return false;

    await mod.addSmsListener((event) => {
      const code = event?.message?.match(/\b(\d{6})\b/)?.[1];
      if (code) {
        stopSmsAutoRead();
        onCode(code);
      }
    });
    active = true;
    return true;
  } catch (err) {
    console.warn("[smsAutoRead] unavailable — falling back to manual entry:", err);
    return false;
  }
}

export function stopSmsAutoRead(): void {
  if (!active) return;
  try {
    loadModule()?.removeSmsListener();
  } catch {
    // noop — native module gone mid-session
  }
  active = false;
}