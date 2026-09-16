import { Router } from "express";
import { requireAuth } from "../../lib/auth";
import { asyncHandler, validate } from "../../lib/http";
import { getWallet, postCashout } from "./wallet.controller";
import { cashoutSchema } from "./wallet.schema";

/**
 * Wallet routes (PRD §8.3, Step 5):
 *   GET  /v1/wallet         — balance + last 90 days of ledger entries
 *   POST /v1/wallet/cashout — Paystack transfer with min/cap/BVN rules
 */
export const walletRouter: Router = Router();

walletRouter.use(requireAuth);

walletRouter.get("/", asyncHandler(getWallet));
walletRouter.post("/cashout", validate(cashoutSchema), asyncHandler(postCashout));