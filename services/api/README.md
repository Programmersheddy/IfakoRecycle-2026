# @eas/api

Node.js + Express + TypeScript + Prisma REST API for EAS (PRD §7.4 `services/api`).

- Entry: `src/index.ts` (bootstrap) → `src/app.ts` (Express app)
- Health check: `GET /v1/health`
- Prisma schema lives at the repo root: [`/prisma/schema.prisma`](../../prisma/schema.prisma)
  (all `db:*` scripts pass `--schema=../../prisma/schema.prisma`)

## Run

```bash
cp .env.example .env          # set DATABASE_URL first
pnpm db:generate              # generate Prisma client
pnpm db:migrate               # create/apply the initial migration
pnpm dev                      # http://localhost:4000 (from repo root: pnpm api)
```

## Planned endpoints (PRD §8.3)

`/v1/auth/otp/request`, `/v1/auth/otp/verify`, `/v1/auth/refresh`,
`/v1/collection-points`, `/v1/dropoffs`, `/v1/wallet`, `/v1/wallet/cashout`,
`/v1/pickup-requests`, `/v1/pickup-requests/mine`, `/v1/trash-reports`,
`/v1/materials/prices`.
