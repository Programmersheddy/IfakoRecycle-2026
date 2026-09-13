import { Router } from "express";
import {
  authErrorHandler,
  postOtpRequest,
  postOtpVerify,
  postRefresh
} from "./auth.controller";

/**
 * Auth routes (PRD §8.3, Table 8.2):
 *   POST /v1/auth/otp/request — send OTP to phone (Nigerian format validated)
 *   POST /v1/auth/otp/verify  — verify OTP, return JWT + refresh
 *   POST /v1/auth/refresh     — exchange refresh token for a new JWT
 */
export const authRouter: Router = Router();

authRouter.post("/otp/request", postOtpRequest);
authRouter.post("/otp/verify", postOtpVerify);
authRouter.post("/refresh", postRefresh);

authRouter.use(authErrorHandler);
