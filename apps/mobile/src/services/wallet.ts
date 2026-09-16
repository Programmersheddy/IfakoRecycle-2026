import {
  BUSINESS_RULES,
  type CreateCashoutDto,
  type CreateCashoutResponse,
  type WalletSummary
} from "@eas/types";
import { authedRequest } from "./auth";

/**
 * Wallet service (PRD §4.4, §5.4, §8.3 — Step 5, the money layer).
 *   GET  /v1/wallet         → WalletSummary (balance + last 90 days ledger)
 *   POST /v1/wallet/cashout → CreateCashoutResponse (Paystack transfer)
 * All calls ride `authedRequest`, which transparently refreshes the token
 * pair on a 401 before retrying.
 */

export { BUSINESS_RULES };

export async function getWallet(): Promise<WalletSummary> {
  return authedRequest<WalletSummary>("/v1/wallet");
}

export async function cashout(dto: CreateCashoutDto): Promise<CreateCashoutResponse> {
  return authedRequest<CreateCashoutResponse>("/v1/wallet/cashout", { method: "POST", body: dto });
}

// Naira (NGN) formatting & kobo ⇄ naira conversion are centralized in
// @eas/types (packages/types/src/money.ts) — never display raw kobo math.
export {
  CURRENCY,
  CURRENCY_SYMBOL,
  CURRENCY_LOCALE,
  formatNaira,
  formatNairaNumber,
  parseNairaToKobo,
  koboToNaira,
  nairaToKobo
} from "@eas/types";

/** Friendly label for a ledger ref type (wallet_transactions.ref_type). */
export const REF_TYPE_LABELS: Record<string, string> = {
  DROP_OFF: "Drop-off earnings",
  CASH_OUT: "Cashout",
  PICKUP: "Pickup earnings",
  TRASH_BOUNTY: "Trash-report bounty",
  CDA_COMMISSION: "CDA commission",
  ADJUSTMENT: "Adjustment"
};