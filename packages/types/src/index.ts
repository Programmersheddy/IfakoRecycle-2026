/**
 * @eas/types — shared domain & API-contract types for the EAS monorepo.
 *
 * Mirrors prisma/schema.prisma (PRD §8.1) — keep both in sync.
 * Money: every amount is an integer in KOBO (NGN × 100), per PRD §8.2/§8.4.
 */

// ---------------------------------------------------------------------------
// Enums (string-literal unions mirroring the Prisma enums)
// ---------------------------------------------------------------------------

export type Role = "SPOTTER" | "COLLECTOR" | "ADMIN";

export type PartnerType =
  | "LAWMA_HUB"
  | "PRIVATE_RECYCLER"
  | "SCRAP_DEALER"
  | "CDA_DRIVE";

export type WalletTxType = "CREDIT" | "DEBIT";

/** Ledger reference types (wallet_transactions.ref_type, §8.1). */
export type WalletTxRefType =
  | "DROP_OFF"
  | "CASH_OUT"
  | "PICKUP"
  | "TRASH_BOUNTY"
  | "CDA_COMMISSION"
  | "ADJUSTMENT";

export type CashoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

export type PickupStatus =
  | "PENDING"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "COLLECTED"
  | "CANCELLED"
  | "EXPIRED";

export type PickupWindow = "MORNING" | "AFTERNOON" | "EVENING";

export type TrashSize = "SMALL" | "MEDIUM" | "LARGE";

export type TrashReportStatus = "OPEN" | "DISPATCHED" | "CLEARED" | "REJECTED";

/** All monetary amounts, in kobo (NGN × 100). */
export type Kobo = number;

// ---------------------------------------------------------------------------
// Domain entities (PRD §8.1, Table 8.1)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  /** Nigerian MSISDN, e.g. "+2348031234567" (§4.1). */
  phone: string;
  fullName?: string;
  role: Role;
  /** Manual LGA/ward fallback when GPS is unreliable (§4.2 edge case). */
  ward?: string;
  /** CDA that recruited this spotter (drives §6.2 referral commissions). */
  cdaId?: string;
  bvnVerified: boolean;
  /** Encrypted Paystack recipient / bank-account reference. */
  bankAccountRef?: string;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

export interface Cda {
  id: string;
  name: string;
  ward: string;
  contactPhone?: string;
  /** Accrued referral commission, in kobo (§6.2: NGN 50/active spotter/month). */
  commissionBalanceKobo: Kobo;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balanceKobo: Kobo;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxType;
  amountKobo: Kobo;
  refType?: WalletTxRefType;
  refId?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  /** e.g. "PET bottles (clear, baled)" (§5.1). */
  name: string;
  /** "kg", or "item" for negotiated e-waste. */
  unit: "kg" | "item";
  currentRateKobo: Kobo;
  /** 8 for most materials, 10 for e-waste (§5.1). */
  feePercent: number;
  isActive: boolean;
  lastUpdated: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  partnerType: PartnerType;
  openingHours?: string;
  isActive: boolean;
  acceptedMaterials: Material[];
  createdAt: string;
}

export interface Dropoff {
  id: string;
  userId: string;
  pointId: string;
  materialId: string;
  weightKg: number;
  grossPayoutKobo: Kobo;
  feePercent: number;
  netPayoutKobo: Kobo;
  photoUrl?: string;
  createdAt: string;
}

export interface Cashout {
  id: string;
  userId: string;
  amountKobo: Kobo;
  /** Encrypted bank account / Paystack recipient reference. */
  bankAccount: string;
  status: CashoutStatus;
  paystackRef?: string;
  failureReason?: string;
  createdAt: string;
}

export interface PickupRequest {
  id: string;
  userId: string;
  address: string;
  lat: number;
  lng: number;
  materialId?: string;
  estVolumeKg?: number;
  window: PickupWindow;
  status: PickupStatus;
  /** Collector (role=COLLECTOR) who locked the job (§4.5). */
  acceptedById?: string;
  actualWeightKg?: number;
  /** Photo evidence at pickup — dispute resolution (§4.5 edge case). */
  photoUrl?: string;
  collectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrashReport {
  id: string;
  userId: string;
  /** In-app camera only — no gallery upload (§4.3, fraud control). */
  photoUrl: string;
  lat: number;
  lng: number;
  /** GPS accuracy indicator, metres (§4.3). */
  gpsAccuracyM?: number;
  size: TrashSize;
  description?: string;
  status: TrashReportStatus;
  /** NGN 100 bounty paid when a completed pickup results (§4.3). */
  bountyPaidKobo: Kobo;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

// ---------------------------------------------------------------------------
// API contracts (PRD §8.3 endpoints + §8.4 sample shapes)
// ---------------------------------------------------------------------------

/** POST /v1/auth/otp/request */
export interface OtpRequestDto {
  phone: string;
}

/** POST /v1/auth/otp/verify */
export interface OtpVerifyDto {
  phone: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
  user: User;
}

/** POST /v1/auth/refresh */
export interface RefreshTokenDto {
  refreshToken: string;
}

/** GET /v1/collection-points?lat=&lng=&radius= (§4.2: default 5 km). */
export interface NearbyCollectionPointsQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
}

/** POST /v1/dropoffs (collector-side; §8.4 request/response). */
export interface CreateDropoffDto {
  userId: string;
  pointId: string;
  materialId: string;
  weightKg: number;
  photoUrl?: string;
}

export interface CreateDropoffResponse {
  id: string;
  grossPayoutKobo: Kobo;
  feePercent: number;
  feeKobo: Kobo;
  netPayoutKobo: Kobo;
  walletBalanceKobo: Kobo;
  createdAt: string;
}

/** GET /v1/wallet — balance + last 90 days of ledger entries (§4.4). */
export interface WalletSummary {
  balanceKobo: Kobo;
  transactions: WalletTransaction[];
}

/** POST /v1/wallet/cashout (min NGN 1,000; daily cap NGN 50,000). */
export interface CreateCashoutDto {
  amountKobo: Kobo;
  bankAccount: string;
}

export interface CreateCashoutResponse {
  id: string;
  status: CashoutStatus;
  paystackRef?: string;
}

/** POST /v1/pickup-requests (§4.5). */
export interface CreatePickupRequestDto {
  address: string;
  lat: number;
  lng: number;
  materialId?: string;
  estVolumeKg?: number;
  window: PickupWindow;
}

/** POST /v1/trash-reports (§4.3). */
export interface CreateTrashReportDto {
  photoUrl: string;
  lat: number;
  lng: number;
  gpsAccuracyM?: number;
  size: TrashSize;
  description?: string;
}

/** GET /v1/materials/prices (§5.1 — rate locked per transaction at drop-off). */
export interface MaterialPrice {
  materialId: string;
  name: string;
  unit: "kg" | "item";
  rateKobo: Kobo;
  feePercent: number;
}

// ---------------------------------------------------------------------------
// Business rules (single source of truth for cross-cutting constants)
// ---------------------------------------------------------------------------

export const BUSINESS_RULES = {
  /** Minimum wallet balance before cashout is enabled (§4.4). */
  MIN_CASHOUT_KOBO: 100_000, // NGN 1,000
  /** Per-account daily cashout cap (§4.4 fraud control). */
  DAILY_CASHOUT_CAP_KOBO: 5_000_000, // NGN 50,000
  /** Bounty paid to the reporting spotter (§4.3). */
  TRASH_REPORT_BOUNTY_KOBO: 10_000, // NGN 100
  /** Platform fee, individual spotters (§5.1). */
  FEE_PERCENT_INDIVIDUAL: 8,
  /** Platform fee, commercial-scale pickups (§5.2). */
  FEE_PERCENT_COMMERCIAL: 10,
  /** Collector broadcast radius for pickups/trash reports (§4.3, §4.5). */
  COLLECTOR_BROADCAST_RADIUS_KM: 3,
  /** No-accepter escalation window (§4.5). */
  PICKUP_ESCALATION_MINUTES: 30,
  /** Duplicate trash-report dedupe window (§4.3). */
  TRASH_DEDUPE_RADIUS_M: 50,
  TRASH_DEDUPE_WINDOW_HOURS: 24,
  /** False-report suspension threshold (§4.3 three-strikes). */
  TRASH_REPORT_MAX_STRIKES: 3
} as const;

