import { z } from "zod";

/** POST /v1/wallet/cashout (PRD §4.4, §5.4). Amounts are kobo integers. */
export const cashoutSchema = z.object({
  amountKobo: z.coerce
    .number()
    .int("amountKobo must be an integer (kobo)")
    .positive("amountKobo must be positive"),
  bankCode: z
    .string()
    .trim()
    .min(3, "bankCode looks too short — use the Paystack bank code, e.g. 058")
    .max(10)
    .optional(),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Nigerian NUBAN account numbers are exactly 10 digits")
    .optional(),
  bvn: z.string().trim().regex(/^\d{11}$/, "BVN must be exactly 11 digits").optional()
});

export type CashoutInput = z.infer<typeof cashoutSchema>;