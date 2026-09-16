import express, { type Express, type Request, type Response } from "express";
import { errorHandler } from "./lib/http";
import { authRouter } from "./modules/auth/auth.routes";
import { walletRouter } from "./modules/wallet/wallet.routes";

/**
 * EAS Express app factory (PRD §8.3 — routes are versioned under /v1).
 * Route modules (collection-points, dropoffs, wallet, pickups,
 * trash-reports, materials) get mounted here in Phase 1 (PRD §9.1).
 */
const app: Express = express();

app.use(express.json({ limit: "1mb" }));

// Auth routes (PRD §8.3, §9.1 Phase 1):
//   POST /v1/auth/otp/request — send OTP via Termii SMS
//   POST /v1/auth/otp/verify  — verify OTP, return JWT + refresh
//   POST /v1/auth/refresh     — exchange refresh token for a new JWT pair
app.use("/v1/auth", authRouter);

// Wallet routes (PRD §4.4, §5.4, §8.3 — Step 5, the money layer):
//   GET  /v1/wallet        — balance + last 90 days of ledger entries
//   POST /v1/wallet/cashout — Paystack transfer (mock in dev) with
//                            ₦1,000 min, ₦50K/day cap, first-time BVN gate
app.use("/v1/wallet", walletRouter);

// GET /v1/health — liveness probe (PRD §9.1: "health check and auth endpoints")
app.get("/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "eas-api",
    version: "0.1.0"
  });
});

// Placeholder 404 for not-yet-implemented /v1 routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not implemented yet"
    }
  });
});

// Global error middleware (lib/http.ts) — must stay last. Catches anything
// the module-scoped handlers don't (e.g. malformed JSON bodies, Prisma errors).
app.use(errorHandler);

export default app;
