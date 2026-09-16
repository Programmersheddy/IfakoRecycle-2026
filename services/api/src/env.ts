import { z } from "zod";

/**
 * Zod-validated environment (PRD §7.4 packages/config: "env schemas").
 * Fails fast at boot if a required secret is missing.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(900), // 15 min (§4.1)
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(604800), // 7 days (§4.1)

  TERMII_API_KEY: z.string().default(""),
  TERMII_SENDER_ID: z.string().default("EAS"),
  /** Android SMS Retriever app hash — appended to OTP SMS so the app can
   *  auto-read the code (optional; generate with Google's AppHash tool). */
  SMS_RETRIEVER_HASH: z.string().default(""),

  // Paystack (PRD §5.4 — cashouts). Empty secret key → mock mode so local dev
  // never hits the network; set sk_test_… for sandbox transfers.
  PAYSTACK_SECRET_KEY: z.string().default(""),
  PAYSTACK_MOCK: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  /** Dev convenience: log OTP codes to console instead of sending SMS. */
  OTP_DEBUG_LOG: z
    .string()
    .default("development" === process.env.NODE_ENV ? "true" : "false")
    .transform((v) => v === "true")
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
