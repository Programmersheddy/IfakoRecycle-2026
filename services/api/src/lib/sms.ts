import { env } from "../env";

/**
 * Termii SMS adapter (PRD §7.1 — Termii for Nigerian deliverability; §7.2 —
 * external integrations live behind adapter modules so the provider can be
 * swapped without touching auth business logic).
 *
 * Behaviour:
 *  - Dev (no TERMII_API_KEY) or OTP_DEBUG_LOG: log the code to the console.
 *  - SMS send failure → automatic WhatsApp fallback over Termii's unified API.
 *  - SMS_RETRIEVER_HASH (optional): appends the Android SMS Retriever app hash
 *    ("\n<#> 11-char hash") so Play Services can auto-read the OTP. The SMS
 *    body must stay ≤ 140 bytes for the retriever to accept it.
 */

export interface SmsSendResult {
  delivered: boolean;
  /** Channel that delivered (or last attempted) the message. */
  channel: "sms" | "whatsapp";
  /** Termii message id — "debug" in dev mode. */
  providerRef?: string;
  /** Set when delivery failed on both channels. */
  error?: string;
}

const TERMII_ENDPOINT = "https://api.ng.termii.com/api/sms/send";
const SMS_TIMEOUT_MS = 10_000;

function composeOtpMessage(code: string): string {
  const base = `EAS: Your login code is ${code}. Valid for 5 min. Never share it.`;
  const hash = env.SMS_RETRIEVER_HASH.trim();
  return hash ? `${base}\n<#> ${hash}` : base;
}

export async function sendOtpSms(phone: string, code: string): Promise<SmsSendResult> {
  // Dev / no-API-key mode: log instead of sending so the flow is testable.
  if (!env.TERMII_API_KEY || env.OTP_DEBUG_LOG) {
     
    console.log(`[eas-api][otp:debug] -> ${phone}: ${code}`);
    return { delivered: true, channel: "sms", providerRef: "debug" };
  }

  const message = composeOtpMessage(code);

  const sms = await postTermii({ phone, message, channel: "generic" });
  if (sms.ok) {
    return { delivered: true, channel: "sms", providerRef: sms.messageId };
  }

  // §4.1 edge case — SMS delivery failure → WhatsApp fallback (same provider).
   
  console.error(`[eas-api][otp] SMS send failed (${sms.error ?? "unknown"}) — trying WhatsApp fallback`);
  const wa = await postTermii({ phone, message, channel: "whatsapp" });
  if (wa.ok) {
    return { delivered: true, channel: "whatsapp", providerRef: wa.messageId };
  }
  return { delivered: false, channel: "whatsapp", error: wa.error ?? sms.error };
}

interface TermiiPostArgs {
  phone: string;
  message: string;
  /** "generic" = SMS, "whatsapp" = WhatsApp channel (Termii unified API). */
  channel: "generic" | "whatsapp";
}

interface TermiiPostResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

async function postTermii({ phone, message, channel }: TermiiPostArgs): Promise<TermiiPostResult> {
  try {
    const res = await fetch(TERMII_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel,
        api_key: env.TERMII_API_KEY
      }),
      signal: AbortSignal.timeout(SMS_TIMEOUT_MS)
    });

    if (!res.ok) {
      return { ok: false, error: `Termii HTTP ${res.status}` };
    }
    const data = (await res.json()) as { message_id?: string };
    return { ok: true, messageId: data.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Termii request failed" };
  }
}
