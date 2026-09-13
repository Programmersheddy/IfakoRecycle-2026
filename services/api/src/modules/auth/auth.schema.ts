import { z } from "zod";

/**
 * Zod request-validation schemas for the auth module (PRD §4.1, §8.3).
 */

/**
 * Nigerian MSISDN format (PRD §4.1: "+234 803, 805, 701, etc.").
 * After +234 the subscriber number is 10 digits whose prefix is one of
 * 70x, 80x, 81x, 90x, 91x (NCC mobile allocations).
 * Examples: +2348031234567, +2347019988776, +2349051122334
 */
export const NIGERIAN_PHONE_REGEX = /^\+234(70[13]|80[2358]|81[014]|90[1259]|91[02])\d{7}$/;

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    NIGERIAN_PHONE_REGEX,
    "Phone must be a valid Nigerian number in +234 format, e.g. +2348031234567"
  );

/** 6-digit OTP, exactly six digits 0-9. */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

/** POST /v1/auth/otp/request */
export const otpRequestSchema = z.object({
  phone: phoneSchema
});

/** POST /v1/auth/otp/verify */
export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema
});

/** POST /v1/auth/refresh */
export const refreshSchema = z.object({
  refreshToken: z.string().min(16, "Refresh token missing or malformed")
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
