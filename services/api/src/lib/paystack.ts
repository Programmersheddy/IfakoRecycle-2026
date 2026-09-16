import { randomBytes } from "node:crypto";
import { CURRENCY, formatNaira, type Kobo } from "@eas/types";
import { env } from "../env";

/**
 * Paystack Transfers + Recipients adapter (PRD §5.4, §7.1 — §7.2 keeps
 * external integrations behind adapter modules).
 *
 * Mock mode (local dev, Step 5): when PAYSTACK_SECRET_KEY is empty or
 * PAYSTACK_MOCK=true, every call succeeds locally without touching the
 * network — except account number 0000000000, which fails exactly like
 * Paystack's test-mode failure account, so the failure + auto-refund path
 * is testable without a Paystack account.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_TIMEOUT_MS = 15_000;

/** Account number Paystack's test env always rejects — mirrored by the mock. */
export const PAYSTACK_TEST_FAILURE_ACCOUNT = "0000000000";

export interface VerifyAccountArgs {
  bankCode: string;
  accountNumber: string;
}

export interface VerifyAccountResult {
  ok: boolean;
  accountName?: string;
  accountNumber?: string;
  error?: string;
}

export interface CreateRecipientArgs {
  name: string;
  bankCode: string;
  accountNumber: string;
}

export interface CreateRecipientResult {
  ok: boolean;
  recipientCode?: string;
  error?: string;
}

export interface InitiateTransferArgs {
  /** Amount in kobo (1 NGN = 100 kobo) — Paystack's native subunit for NGN. */
  amountKobo: Kobo;
  recipientCode: string;
  reason: string;
}

export interface InitiateTransferResult {
  ok: boolean;
  /** PROCESSING = accepted, settles async; PAID = settled (mock instant). */
  status?: "PROCESSING" | "PAID";
  reference?: string;
  transferCode?: string;
  error?: string;
}

export function isPaystackMockMode(): boolean {
  return env.PAYSTACK_MOCK || !env.PAYSTACK_SECRET_KEY;
}

export async function verifyBankAccount({ bankCode, accountNumber }: VerifyAccountArgs): Promise<VerifyAccountResult> {
  if (isPaystackMockMode()) {
    if (accountNumber === PAYSTACK_TEST_FAILURE_ACCOUNT) {
      return { ok: false, error: "The account number was not found (test-mode failure account)" };
    }
    return { ok: true, accountName: `MOCK ACCOUNT OWNER ••${accountNumber.slice(-4)}`, accountNumber };
  }
  return getJson<{ account_name?: string; account_number?: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    "GET"
  ).then((r) => ({
    ok: r.ok,
    accountName: r.data?.account_name,
    accountNumber: r.data?.account_number,
    error: r.error
  }));
}

export async function createTransferRecipient({
  name,
  bankCode,
  accountNumber
}: CreateRecipientArgs): Promise<CreateRecipientResult> {
  if (isPaystackMockMode()) {
    return { ok: true, recipientCode: `RCP_mock_${randomBytes(8).toString("hex")}` };
  }
  const r = await postJson<{ recipient_code?: string }>("/transferrecipient", {
    type: "nuban",
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: "NGN"
  });
  return { ok: r.ok, recipientCode: r.data?.recipient_code, error: r.error };
}

export async function initiateTransfer({
  amountKobo,
  recipientCode,
  reason
}: InitiateTransferArgs): Promise<InitiateTransferResult> {
  // Paystack's `amount` is in KOBO for NGN — EAS money is already stored in
  // kobo, so the integer passes through unchanged after this sanity guard.
  if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
    return { ok: false, error: `Transfer amount must be a positive integer in kobo, received ${amountKobo}` };
  }
  if (isPaystackMockMode()) {
    console.log(`[paystack:mock] transfer ${formatNaira(amountKobo)} -> ${recipientCode} (${reason})`);
    return {
      ok: true,
      status: "PAID",
      reference: `mock_tr_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`
    };
  }
  const r = await postJson<{ transfer_code?: string; reference?: string; status?: string }>("/transfer", {
    source: "balance",
    amount: amountKobo, // kobo — Paystack's native subunit for NGN
    currency: CURRENCY, // "NGN" — the app's sole currency
    recipient: recipientCode,
    reason
  });
  if (!r.ok) return { ok: false, error: r.error };
  const status = r.data?.status;
  if (status === "success") return { ok: true, status: "PAID", reference: r.data?.reference, transferCode: r.data?.transfer_code };
  if (status === "pending" || status === "otp" || status === "open_or_pending") {
    return { ok: true, status: "PROCESSING", reference: r.data?.reference, transferCode: r.data?.transfer_code };
  }
  return { ok: false, error: `Paystack transfer status "${status ?? "unknown"}"` };
}

// ---------------------------------------------------------------------------
// HTTP plumbing (real mode only)
// ---------------------------------------------------------------------------

interface PaystackEnvelope<T> {
  status?: boolean;
  message?: string;
  data?: T;
}

interface FetchOutcome<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

function getJson<T>(path: string, method: "GET"): Promise<FetchOutcome<PaystackEnvelope<T>["data"]>> {
  return paystackFetch<T>(path, method);
}

function postJson<T>(path: string, body: unknown): Promise<FetchOutcome<T>> {
  return paystackFetch<T>(path, "POST", body);
}

async function paystackFetch<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<FetchOutcome<T>> {
  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS)
    });
    const payload = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
    if (!res.ok || !payload?.status) {
      return { ok: false, error: payload?.message ?? `Paystack HTTP ${res.status}` };
    }
    return { ok: true, data: payload.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Paystack request failed" };
  }
}