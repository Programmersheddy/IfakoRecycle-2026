-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "role" AS ENUM ('SPOTTER', 'COLLECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "partner_type" AS ENUM ('LAWMA_HUB', 'PRIVATE_RECYCLER', 'SCRAP_DEALER', 'CDA_DRIVE');

-- CreateEnum
CREATE TYPE "wallet_tx_type" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "cashout_status" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "pickup_status" AS ENUM ('PENDING', 'ACCEPTED', 'EN_ROUTE', 'COLLECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "pickup_window" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "trash_size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "trash_report_status" AS ENUM ('OPEN', 'DISPATCHED', 'CLEARED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "role" NOT NULL DEFAULT 'SPOTTER',
    "ward" TEXT,
    "cda_id" TEXT,
    "bvn_verified" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cdas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "contact_phone" TEXT,
    "commission_balance_kobo" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance_kobo" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "wallet_tx_type" NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "channel" TEXT NOT NULL DEFAULT 'sms',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "replaced_by" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "current_rate_kobo" INTEGER NOT NULL,
    "fee_percent" INTEGER NOT NULL DEFAULT 8,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_points" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "partner_type" "partner_type" NOT NULL DEFAULT 'PRIVATE_RECYCLER',
    "opening_hours" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropoffs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "point_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "weightKg" DECIMAL(8,3) NOT NULL,
    "gross_payout_kobo" INTEGER NOT NULL,
    "fee_percent" INTEGER NOT NULL,
    "net_payout_kobo" INTEGER NOT NULL,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dropoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_kobo" INTEGER NOT NULL,
    "bank_account" TEXT NOT NULL,
    "status" "cashout_status" NOT NULL DEFAULT 'PENDING',
    "paystack_ref" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "material_id" TEXT,
    "est_volume_kg" DECIMAL(8,3),
    "window" "pickup_window" NOT NULL,
    "status" "pickup_status" NOT NULL DEFAULT 'PENDING',
    "accepted_by" TEXT,
    "actual_weight_kg" DECIMAL(8,3),
    "photo_url" TEXT,
    "collected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trash_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "gps_accuracy_m" DOUBLE PRECISION,
    "size" "trash_size" NOT NULL,
    "description" TEXT,
    "status" "trash_report_status" NOT NULL DEFAULT 'OPEN',
    "bounty_paid_kobo" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trash_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionPointToMaterial" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionPointToMaterial_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "cdas_name_key" ON "cdas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "otp_codes_phone_created_at_idx" ON "otp_codes"("phone", "created_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "materials_name_key" ON "materials"("name");

-- CreateIndex
CREATE INDEX "collection_points_lat_lng_idx" ON "collection_points"("lat", "lng");

-- CreateIndex
CREATE INDEX "dropoffs_user_id_created_at_idx" ON "dropoffs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "dropoffs_point_id_created_at_idx" ON "dropoffs"("point_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cashouts_paystack_ref_key" ON "cashouts"("paystack_ref");

-- CreateIndex
CREATE INDEX "cashouts_user_id_created_at_idx" ON "cashouts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "pickup_requests_status_created_at_idx" ON "pickup_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "pickup_requests_user_id_idx" ON "pickup_requests"("user_id");

-- CreateIndex
CREATE INDEX "trash_reports_lat_lng_idx" ON "trash_reports"("lat", "lng");

-- CreateIndex
CREATE INDEX "trash_reports_user_id_created_at_idx" ON "trash_reports"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "_CollectionPointToMaterial_B_index" ON "_CollectionPointToMaterial"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cda_id_fkey" FOREIGN KEY ("cda_id") REFERENCES "cdas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropoffs" ADD CONSTRAINT "dropoffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropoffs" ADD CONSTRAINT "dropoffs_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "collection_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropoffs" ADD CONSTRAINT "dropoffs_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashouts" ADD CONSTRAINT "cashouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trash_reports" ADD CONSTRAINT "trash_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionPointToMaterial" ADD CONSTRAINT "_CollectionPointToMaterial_A_fkey" FOREIGN KEY ("A") REFERENCES "collection_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionPointToMaterial" ADD CONSTRAINT "_CollectionPointToMaterial_B_fkey" FOREIGN KEY ("B") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
