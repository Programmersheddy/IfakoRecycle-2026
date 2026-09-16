# EAS — Earn And Save (IfakoRecycle 2026)

> **Earn While You Clean.** A recycling-rewards mobile app for Ifako-Ijaye LGA, Lagos State —
> residents ("spotters") drop off sorted recyclables (PET, cans, nylon, paper, e-waste) at verified
> collection points or book home pickups; every kilogram is logged, priced in naira, and credited to
> an in-app wallet cashable to a Nigerian bank account via Paystack.
>
> Scope, features, and data model are defined in [`docs/PRD.md`](docs/PRD.md).

This repository is the **scaffolded pnpm monorepo** (PRD §7.4). Dependencies are **not installed yet**.

## Stack (PRD §7.1)

| Layer | Choice |
| --- | --- |
| Mobile | React Native + Expo (TypeScript) |
| API | Node.js + Express (TypeScript) |
| Database | PostgreSQL + Prisma (managed: Neon / Render / RDS) |
| Auth | Phone + OTP (Termii SMS), JWT access/refresh |
| Payments | Paystack Transfer + Recipient APIs |
| Maps | Mapbox / Google Maps SDK |
| Files | Cloudinary (trash-report photos) |
| Push | Expo Notifications (FCM/APNs) |

## Structure

```
.
├── apps/
│   └── mobile/          # React Native + Expo (TypeScript) — spotters & collectors
├── services/
│   └── api/             # Node.js + Express REST API (src/app.ts + src/index.ts)
├── packages/
│   ├── types/           # @eas/types — shared domain + API-contract types (mirrors the Prisma schema)
│   └── config/          # @eas/config — shared tsconfig.base.json + ESLint flat config
├── prisma/
│   └── schema.prisma    # Initial schema per PRD §8.1 (users, wallets, wallet_transactions,
│                        #   collection_points, materials, dropoffs, cashouts,
│                        #   pickup_requests, trash_reports, cdas)
├── docs/
│   └── PRD.md           # Product Requirements Document (canonical spec)
├── package.json         # Monorepo root (pnpm workspaces)
└── pnpm-workspace.yaml
```

## Prerequisites

- **Node.js ≥ 20** (v26.7.0 detected on this machine ✔)
- **pnpm ≥ 9** — *not currently installed on this machine.* Enable it with corepack (bundled with Node):

  ```bash
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
  # or: npm i -g pnpm@9
  ```
- **PostgreSQL 15+** locally (Docker) or a managed connection string (Neon/Render).

## Quickstart (after `pnpm install`)

```bash
corepack enable                    # once, if pnpm is missing
pnpm install                       # install all workspace deps (not done yet)

cp services/api/.env.example services/api/.env
pnpm db:generate                   # prisma generate (schema lives at /prisma/schema.prisma)
pnpm db:migrate                    # prisma migrate dev (needs DATABASE_URL)

pnpm api                           # Express API on http://localhost:4000 (GET /v1/health)
pnpm mobile                        # Expo dev server
```

## Workspace packages

| Package | Path | Purpose |
| --- | --- | --- |
| `@eas/mobile` | `apps/mobile` | Expo app: auth (§4.1), map + collection points (§4.2), trash reports (§4.3), wallet (§4.4), pickups (§4.5) |
| `@eas/api` | `services/api` | Express REST API (`/v1/...` per PRD §8.3) with Prisma against `/prisma/schema.prisma` |
| `@eas/types` | `packages/types` | Shared domain types, API DTOs, business-rule constants |
| `@eas/config` | `packages/config` | Shared `tsconfig.base.json` + ESLint flat config consumed by every workspace |

## Conventions

- **Money is kobo — NGN is the sole currency.** All monetary values are integers in kobo (`NGN × 100`) — e.g. `netPayoutKobo: 38640` = ₦386.40 (PRD §8.2/§8.4). Never floats. Every Prisma monetary field is suffixed `Kobo`, typed `Int`, and documented `/// Amount in kobo (1 NGN = 100 kobo)`. Display/conversion goes through the `@eas/types` money helpers (`formatNaira`, `parseNairaToKobo`, …) — never hardcode ₦ or call `toLocaleString()` on money.
- **DB naming:** Prisma models use `camelCase`; tables/columns are `snake_case` in Postgres via `@map`/`@@map`, matching PRD §8.1 (`user_id`, `created_at`, …).
- **`@eas/types` and `prisma/schema.prisma` must stay in sync** — the shared types mirror the schema enums/entities.
- API routes are versioned under `/v1/...` (PRD §8.3).

## Next steps (PRD §9.1 — Phase 1, Days 1–30)

1. Install dependencies (`pnpm install`) and align Expo package versions with `npx expo install --fix`.
2. Stand up Postgres and run the first migration.
3. Implement `/v1/auth/otp/request` + `/v1/auth/otp/verify` (Termii) and the phone-input + OTP screens.
4. Add collection-point seed data (≥10 verified points in Ifako-Ijaye).
