import {
  BUSINESS_RULES,
  formatNaira,
  type CashoutStatus,
  type CreateCashoutResponse,
  type WalletSummary,
  type WalletTransaction,
  type WalletTxRefType
} from "@eas/types";
import { AppError } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { createTransferRecipient, initiateTransfer, verifyBankAccount } from "../../lib/paystack";
import type { CashoutInput } from "./wallet.schema";

/**
 * Wallet service (PRD §4.4, §5.4, §8.3 — Step 5, the money layer).
 * Money is stored in KOBO (NGN × 100) — integers only, never floats.
 */

const LEDGER_WINDOW_DAYS = 90;
const LEDGER_MAX_ROWS = 100;
const MIN_CASHOUT_KOBO = BUSINESS_RULES.MIN_CASHOUT_KOBO; // ₦1,000
const DAILY_CAP_KOBO = BUSINESS_RULES.DAILY_CASHOUT_CAP_KOBO; // ₦50,000

interface LedgerRow {
  id: string;
  walletId: string;
  type: "CREDIT" | "DEBIT";
  amountKobo: number;
  refType: string | null;
  refId: string | null;
  createdAt: Date;
}

function toLedgerEntry(row: LedgerRow): WalletTransaction {
  return {
    id: row.id,
    walletId: row.walletId,
    type: row.type,
    amountKobo: row.amountKobo,
    refType: (row.refType as WalletTxRefType | null) ?? undefined,
    refId: row.refId ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

// ---------------------------------------------------------------------------
// GET /v1/wallet
// ---------------------------------------------------------------------------

export async function getWalletSummary(userId: string): Promise<WalletSummary> {
  const [wallet, user] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { bvnVerified: true, bankAccountRef: true }
    })
  ]);
  if (!wallet) throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user");

  const rows = await prisma.walletTransaction.findMany({
    where: {
      walletId: wallet.id,
      createdAt: { gte: new Date(Date.now() - LEDGER_WINDOW_DAYS * 24 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: "desc" },
    take: LEDGER_MAX_ROWS
  });

  return {
    balanceKobo: wallet.balanceKobo,
    bvnVerified: user?.bvnVerified ?? false,
    hasSavedAccount: Boolean(user?.bankAccountRef),
    transactions: rows.map(toLedgerEntry)
  };
}

// ---------------------------------------------------------------------------
// POST /v1/wallet/cashout
// ---------------------------------------------------------------------------

export async function createCashout(userId: string, input: CashoutInput): Promise<CreateCashoutResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { wallet: true } });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  if (!user.wallet) throw new AppError(404, "WALLET_NOT_FOUND", "No wallet exists for this user");
  const wallet = user.wallet;
  const amount = input.amountKobo;

  if (amount < MIN_CASHOUT_KOBO) {
    throw new AppError(422, "CASHOUT_TOO_SMALL", `Minimum cashout is ${formatNaira(MIN_CASHOUT_KOBO)}`);
  }
  if (amount > wallet.balanceKobo) {
    throw new AppError(422, "INSUFFICIENT_FUNDS", `Insufficient balance — ${formatNaira(wallet.balanceKobo)} available`);
  }

  // Daily cap (§4.4 fraud control) — pending/processing/paid cashouts count.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const usedToday = await prisma.cashout.aggregate({
    _sum: { amountKobo: true },
    where: { userId, status: { not: "FAILED" }, createdAt: { gte: startOfDay } }
  });
  const used = usedToday._sum.amountKobo ?? 0;
  if (used + amount > DAILY_CAP_KOBO) {
    throw new AppError(
      422,
      "DAILY_CAP_EXCEEDED",
      `Daily cap is ${formatNaira(DAILY_CAP_KOBO)} — ${formatNaira(used)} already cashed out today`
    );
  }

  // BVN gate (§5.4) — required only the first time, then stored on the user.
  let bvnVerified = user.bvnVerified;
  if (!bvnVerified) {
    if (!input.bvn) {
      throw new AppError(403, "BVN_REQUIRED", "BVN verification is required the first time you cash out");
    }
    if (!/^\d{11}$/.test(input.bvn)) {
      throw new AppError(422, "BVN_INVALID", "BVN must be exactly 11 digits");
    }
    bvnVerified = true;
  }

  // Recipient resolution — the saved Paystack recipient wins; otherwise verify
  // the provided account, create a recipient, and save it for future cashouts.
  let recipientCode = user.bankAccountRef;
  let accountLabel: string;
  if (recipientCode) {
    accountLabel = recipientCode;
  } else {
    if (!input.bankCode || !input.accountNumber) {
      throw new AppError(
        422,
        "BANK_ACCOUNT_REQUIRED",
        "Provide bankCode + accountNumber for your first cashout (it is saved for next time)"
      );
    }
    const verified = await verifyBankAccount({ bankCode: input.bankCode, accountNumber: input.accountNumber });
    if (!verified.ok) {
      throw new AppError(422, "ACCOUNT_VERIFICATION_FAILED", verified.error ?? "Account verification failed");
    }
    const recipient = await createTransferRecipient({
      name: verified.accountName ?? "EAS Spotter",
      bankCode: input.bankCode,
      accountNumber: input.accountNumber
    });
    if (!recipient.ok || !recipient.recipientCode) {
      throw new AppError(502, "RECIPIENT_CREATE_FAILED", recipient.error ?? "Could not create transfer recipient");
    }
    recipientCode = recipient.recipientCode;
    accountLabel = `${input.bankCode} ••••${input.accountNumber.slice(-4)}`;
  }

  // Atomic debit: a guarded decrement makes concurrent overdrafts impossible.
  const cashout = await prisma.$transaction(async (tx) => {
    const debited = await tx.wallet.updateMany({
      where: { id: wallet.id, balanceKobo: { gte: amount } },
      data: { balanceKobo: { decrement: amount } }
    });
    if (debited.count !== 1) {
      throw new AppError(422, "INSUFFICIENT_FUNDS", "Insufficient balance");
    }
    const created = await tx.cashout.create({
      data: { userId, amountKobo: amount, bankAccount: accountLabel, status: "PENDING" }
    });
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, type: "DEBIT", amountKobo: amount, refType: "CASH_OUT", refId: created.id }
    });
    const userUpdate: { bvnVerified?: boolean; bankAccountRef?: string } = {};
    if (bvnVerified && !user.bvnVerified) userUpdate.bvnVerified = true;
    if (recipientCode !== user.bankAccountRef) userUpdate.bankAccountRef = recipientCode;
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({ where: { id: userId }, data: userUpdate });
    }
    return created;
  });

  // Transfer outside the DB transaction (no connections held during I/O);
  // on failure the debit is refunded inside a second atomic transaction.
  const transfer = await initiateTransfer({
    amountKobo: amount,
    recipientCode,
    reason: `EAS cashout ${cashout.id}`
  });

  let status: CashoutStatus;
  let paystackRef: string | undefined;
  if (transfer.ok) {
    status = transfer.status === "PAID" ? "PAID" : "PROCESSING";
    paystackRef = transfer.reference ?? transfer.transferCode;
    await prisma.cashout.update({ where: { id: cashout.id }, data: { status, paystackRef } });
  } else {
    status = "FAILED";
    const reason = transfer.error ?? "Transfer failed";
    await prisma.$transaction([
      prisma.cashout.update({ where: { id: cashout.id }, data: { status, failureReason: reason } }),
      prisma.wallet.update({ where: { id: wallet.id }, data: { balanceKobo: { increment: amount } } }),
      prisma.walletTransaction.create({
        data: { walletId: wallet.id, type: "CREDIT", amountKobo: amount, refType: "CASH_OUT", refId: cashout.id }
      })
    ]);
  }

  const finalWallet = await prisma.wallet.findUniqueOrThrow({
    where: { id: wallet.id },
    select: { balanceKobo: true }
  });
  const response: CreateCashoutResponse = { id: cashout.id, status, walletBalanceKobo: finalWallet.balanceKobo };
  if (paystackRef) response.paystackRef = paystackRef;
  if (status === "FAILED") response.failureReason = transfer.error ?? "Transfer failed";
  return response;
}