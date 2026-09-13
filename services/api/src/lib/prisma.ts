import { PrismaClient } from "@prisma/client";

/** Singleton Prisma client shared across the API (adapted per PRD §7.2). */
export const prisma = new PrismaClient();
