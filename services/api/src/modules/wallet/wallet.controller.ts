import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/http";
import { requireUserId } from "../../lib/auth";
import { createCashout, getWalletSummary } from "./wallet.service";
import type { CashoutInput } from "./wallet.schema";

/**
 * Wallet controller (PRD §4.4, §5.4, §8.3). Thin HTTP layer — responses keep
 * the { ok, data | error } envelope used across the API.
 */

/** GET /v1/wallet — balance + last 90 days of ledger entries. */
export const getWallet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const summary = await getWalletSummary(requireUserId(req));
  res.status(200).json({ ok: true, data: summary });
});

/** POST /v1/wallet/cashout — initiate a Paystack transfer (mock in dev). */
export const postCashout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await createCashout(requireUserId(req), req.body as CashoutInput);
  res.status(201).json({ ok: true, data: result });
});