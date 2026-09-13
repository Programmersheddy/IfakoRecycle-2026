# EAS — Earn While You Clean

**Product Requirements Document — EAS Recycling Rewards App**
*Product Requirements and Technical Architecture for the Ifako-Ijaye Pilot*

| | |
| --- | --- |
| **Prepared by** | Shadrach Emem Ekemini |
| **Location** | Ifako-Ijaye LGA, Lagos State, Nigeria |
| **Document version** | 1.0 (Draft) |
| **Date** | September 2026 |
| **Distribution** | Confidential |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Market Opportunity](#2-problem--market-opportunity)
3. [Product Vision & User Personas](#3-product-vision--user-personas)
4. [MVP Feature Specifications](#4-mvp-feature-specifications)
5. [Monetization and Payout Model](#5-monetization-and-payout-model)
6. [LAWMA and CDA Partnership Strategy](#6-lawma-and-cda-partnership-strategy)
7. [Technical Architecture and Recommended Stack](#7-technical-architecture-and-recommended-stack)
8. [Data Model and API Specifications](#8-data-model-and-api-specifications)
9. [Implementation Roadmap (30 / 60 / 90 Days)](#9-implementation-roadmap-30--60--90-days)
10. [Risks, Assumptions and Mitigation](#10-risks-assumptions-and-mitigation)
11. [Conclusion and Next Steps](#11-conclusion-and-next-steps)

---

## 1. Executive Summary

EAS (Earn And Save) is a mobile application that converts household waste into cash income for residents of Ifako-Ijaye Local Government Area (LGA) in Lagos State. The app enables registered users, referred to as spotters, to monetize their everyday recyclables — PET bottles, aluminum cans, nylon, paper, and e-waste — by dropping them off at verified collection points or scheduling home pickups. Each kilogram is logged, priced in real time, and credited to the spotter's in-app wallet, which can be cashed out to a Nigerian bank account via Paystack once a minimum threshold is reached. The product is designed for both iOS and Android and is scoped to launch in Ifako-Ijaye LGA only for the pilot phase.

Lagos State generates an estimated 13,000 tonnes of solid waste daily, of which less than 30 percent is formally collected and under five percent is recycled. Ifako-Ijaye, with a population of approximately 900,000 residents across dense, low-to-middle income neighborhoods, represents a microcosm of this crisis: high waste generation, limited LAWMA (Lagos State Waste Management Authority) coverage in inner streets, and an underused pool of informal waste pickers who currently earn below subsistence wages. EAS addresses both the environmental gap and the income gap in a single product loop, by turning every resident into a paid waste spotter.

The MVP described in this document focuses on five features selected by the founder: phone-based authentication with OTP, a geolocated map of verified collection points, a digital wallet with transaction history and Paystack cashout, a pickup scheduling module, and a trash pile reporting feature that lets spotters flag illegal dumpsites for community action. The recommended technology stack is React Native with Expo for cross-platform deployment, a custom Node.js (Express) backend backed by PostgreSQL, and Paystack for payment processing. The pilot launch will be scoped to Ifako-Ijaye LGA only, targeting 1,000 active spotters and 5 tonnes of recyclables diverted monthly by month six.

Revenue is generated through a combination of transaction fees (5 to 10 percent of cashouts), B2B margins on material sold to off-take recyclers, and a LAWMA partnership subsidy once the pilot proves measurable diversion. The 90-day implementation roadmap is structured in three phases: discovery and infrastructure (days 1 to 30), closed beta with 50 spotters (days 31 to 60), and public launch (days 61 to 90). The strategic partners are LAWMA (legitimacy and infrastructure), local Community Development Associations (CDAs) for community trust and on-the-ground mobilization, and Paystack for wallet cashouts. This document is intentionally hybrid in tone: the first half speaks to investors and partners, the second half to the builder (you).

---

## 2. Problem & Market Opportunity

### 2.1 The Lagos Waste Crisis

Lagos is the most populous city in Africa and one of its fastest-growing megacities. The Lagos State Waste Management Authority (LAWMA) and its private-sector partners (PSP operators) collect roughly 30 to 40 percent of the 13,000 tonnes of municipal solid waste generated daily. The remainder accumulates in drainage channels, informal dumpsites, street corners, and vacant lots, contributing to annual flooding, public health hazards, and lost economic value. Recycling rates across the state remain below five percent, despite a robust informal waste-picking economy that already extracts material of significant commercial value.

Ifako-Ijaye LGA, located in the mainland north of Lagos, has a population of approximately 900,000 residents spread across dense, mixed-income neighborhoods including Fagba, Iju, Obawole, and College Road. The LGA is characterized by fragmented road access in inner streets, irregular PSP coverage, and a high share of informal economy participants. These conditions make it an ideal pilot zone for a community-driven recycling model: there is enough density to make pickup routes efficient, enough waste generation to sustain throughput, and enough economic pressure to make additional household income attractive to residents.

### 2.2 Existing Solutions and Their Gaps

Nigeria already has a handful of recycling-rewards ventures, most notably WeCyclers (founded 2012), RecyclePoints (founded 2012), and the more recent Scrapays. These players have proven demand for the model but their geographic coverage is uneven, concentrated in higher-density, higher-income, or commercially zoned areas where logistics are easier. Low-income residential LGAs like Ifako-Ijaye remain underserved, and existing platforms often use points or voucher-based rewards that reduce perceived value for cash-strapped households. Onboarding typically requires in-person registration events that do not scale, weight verification is opaque creating trust friction between resident and collector, and there is no ward-level dataset of waste generation that LAWMA can use for planning.

EAS addresses these gaps by leading with naira-denominated rewards (not points), phone-based onboarding (no in-person events required), transparent weight logging with photo evidence, and a data layer designed from day one to produce ward-level intelligence for LAWMA. The competitive positioning is therefore not "cheaper WeCyclers" but "the most transparent, most naira-native recycling rewards app, built first for under-served LGAs."

### 2.3 Market Opportunity Sizing

Using conservative bottom-up assumptions for Ifako-Ijaye alone: an addressable population of approximately 250,000 adults across roughly 60,000 households; an average household recyclable generation of 2 kg per week; a conservative capture rate target of 10 percent in Year One. This implies an annual addressable volume of approximately 624 tonnes of recyclable material with a gross material value (at Nigerian recycler offtake prices) between NGN 7 million and NGN 12 million depending on mix. The platform's 5 to 10 percent transaction fee translates into NGN 350,000 to NGN 1.2 million in Year One transaction revenue from Ifako-Ijaye alone — modest, but the same engine scales 8 to 10 times when extended to neighboring LGAs.

**Table 2.1 — Ifako-Ijaye Market Sizing Assumptions**

| Parameter | Value | Source / Assumption |
| --- | --- | --- |
| Adult population | ~250,000 | Ifako-Ijaye LGA total ~900k, ~28% adult |
| Households | ~60,000 | Average household size 4.5 |
| Recyclable generation per HH/week | 2 kg | Conservative; PET + cans + nylon |
| Year 1 capture rate target | 10% | Pilot benchmark for hyper-local apps |
| Annual addressable volume | ~624 tonnes | Calculated from above |
| Gross material value range | NGN 7M – 12M | Mixed material at Lagos offtake prices |
| Platform transaction revenue (Y1) | NGN 350K – 1.2M | 5–10% fee on payouts |

*Figures are illustrative planning estimates, not committed projections.*

---

## 3. Product Vision & User Personas

### 3.1 Product Vision

EAS exists to make waste a household asset rather than a neighborhood liability. The product vision is simple: every resident of Ifako-Ijaye should be able to open the EAS app, find the nearest place to monetize their sorted waste within ten minutes, and receive naira in their wallet the same day. By doing this at scale, EAS shifts the city's relationship with waste — from a service the government must provide, to a market households voluntarily participate in because it pays. The long-term vision is for EAS to become the canonical ward-level waste intelligence layer for Lagos State, feeding anonymized data back to LAWMA for planning, drainage management, and climate reporting.

### 3.2 Core Value Propositions

- **For Spotters (residents):** immediate, transparent naira payment for sorted recyclables, with no minimum onboarding friction and a cashout path that respects their bank account or Paystack recipient code.
- **For Collectors (PSPs, private recyclers, scrap dealers):** a steady, geolocated pipeline of pre-sorted material, reducing their pickup logistics cost and improving yield per trip.
- **For LAWMA:** ward-level waste generation data, hotspot mapping for illegal dumps, and a community-led channel that complements formal PSP operations without competing with them.
- **For CDAs:** a transparent revenue-share mechanism that lets the association earn a referral commission for every active spotter in their ward, mobilizing community trust.
- **For the environment:** verified tonnes diverted from landfill and open burning, with audit-grade traceability suitable for carbon-credit or CSR reporting.

### 3.3 Primary User Personas

**Table 3.1 — Core User Personas**

| Persona | Demographic | Primary Pain | Goal with EAS |
| --- | --- | --- | --- |
| Aisha the Trader | F, 34, market woman, Fagba | Empty PET cartons piling up in shop, no time to dispose | Convert cartons to NGN 500–1,000 weekly cash |
| Tunde the Student | M, 21, UNILAG part-time, Iju | Needs side income, owns Android phone, data-conscious | Schedule weekend pickups for his hostel block |
| Mama Chidi, CDA Chair | F, 52, housewife, Ifako | Worried about kids' health from neighborhood dump | Mobilize her street to recycle as a community |
| Emeka the Collector | M, 38, PSP sub-contractor | Inconsistent material supply, long idle routes | Receive pre-sorted pickup jobs within his zone |
| LAWMA Zonal Officer | M/F, 40s, government | No real-time data on informal waste hotspots | Get weekly ward-level heatmap and tonnage reports |

*Personas are composites based on publicly documented Lagos demographics; they will be refined during pilot interviews.*

---

## 4. MVP Feature Specifications

Based on the founder's selected priorities, the v1 MVP will ship with five core features: Auth (phone + OTP), Map + Collection Points, Report Trash Pile, Wallet & Earnings, and Pickup Scheduling. Each feature is specified below with user stories, acceptance criteria, and notable edge cases. Non-MVP features (material scanner, leaderboard, educational content) are explicitly deferred to v2.

### 4.1 Authentication (Phone + OTP)

User story: As a new spotter, I want to log in with my Nigerian phone number so I do not have to remember a password and so my account is tied to a verifiable identity. Acceptance criteria: phone number validated against Nigerian format (e.g., +234 803, 805, 701, etc.); OTP delivered via SMS within 30 seconds p95; OTP auto-fills on Android via SMS Retriever API; retry cooldown of 60 seconds after third attempt; device-binding to prevent account sharing abuse. Edge cases: SMS delivery failures in low-signal areas (fallback to WhatsApp Business API via Termii), users without a bank account (allow wallet-only mode, cashout requires BVN verification at threshold).

### 4.2 Map & Collection Points

User story: As a spotter, I want to see the nearest verified collection points on a map so I can decide where to drop off my sorted recyclables. Acceptance criteria: map shows collection points within 5 km of the user's GPS location; each point displays name, accepted materials, opening hours, and current queue length (if available); tapping a point opens a detail card with directions (deep-link to Google Maps); points are color-coded by partner type (LAWMA hub, private recycler, scrap dealer, CDA collection drive). Edge cases: GPS accuracy in dense urban canyons (fallback to manual LGA/ward selection), points temporarily closed (collector-side toggle with auto-notification to spotters with saved preferences).

### 4.3 Report Trash Pile

User story: As a spotter, I want to report an illegal trash pile near my home so that collectors, LAWMA, or my CDA can be alerted to clear it — and so I can earn a small bounty if a pickup results from my report. Acceptance criteria: spotter takes a photo in-app (no gallery upload allowed, to prevent fraud); GPS coordinates auto-tagged with accuracy indicator; spotter selects estimated size (small / medium / large) and optional description; report is queued in the admin dashboard and broadcast to collectors within 3 km of the location; if a pickup job is created from the report and completed, the reporting spotter receives a NGN 100 referral bounty in their wallet. Edge cases: duplicate reports for the same location (deduplicate within 50 meters and 24 hours), false reports (three strikes policy: account suspended after three verified false reports).

### 4.4 Wallet & Earnings

User story: As a spotter, I want to see my current balance, transaction history, and a clear cashout path so I trust the money is real. Acceptance criteria: balance displayed in naira with two decimal places; transaction history shows date, material, weight, partner, and amount for the last 90 days; cashout button is enabled when balance is at least NGN 1,000; cashout flow uses Paystack Transfer API to send funds to a bank account verified with BVN; cashout settles within 10 minutes during business hours, next morning otherwise. Edge cases: Paystack downtime (queue cashouts and retry with exponential backoff), fraud attempts (per-account daily cashout cap of NGN 50,000, anomaly detection on weight-per-visit).

### 4.5 Pickup Scheduling

User story: As a spotter with too much material to carry, I want to schedule a home or business pickup so a collector comes to me. Acceptance criteria: spotter selects pickup address (auto-filled from saved profile or manually entered), preferred time window (morning / afternoon / evening), and material type plus estimated volume; request is broadcast to collectors within 3 km; first collector to accept locks the job; spotter receives ETA and collector phone number; after pickup, collector logs actual weight and spotter's wallet is credited. Edge cases: no collector accepts within 30 minutes (auto-escalate to wider radius, then notify spotter to retry later), disputes over weight (photo evidence at pickup, optional second-weigher verification).

**Table 4.1 — MVP Feature Summary**

| Feature | Effort (PD) | External Dependencies | Risk |
| --- | --- | --- | --- |
| Auth (Phone + OTP) | 5 | Termii/Twilio SMS, Node Auth | Low — well-trodden path |
| Map + Collection Points | 8 | Mapbox/Google Maps, partner data | Medium — data acquisition |
| Report Trash Pile | 6 | Photo upload, GPS, admin dashboard | Medium — fraud controls |
| Wallet & Earnings | 6 | Paystack Transfer, BVN verify | Medium — fraud controls |
| Pickup Scheduling | 10 | Collector onboarding, GPS | High — ops-heavy |

*PD = person-days for an experienced solo developer.*

---

## 5. Monetization and Payout Model

### 5.1 Pricing Structure (NGN per kg by Material)

Payout rates are set per kilogram and per material type, with the platform publishing transparent rates that adjust quarterly based on recycler offtake prices. The rates below reflect current Lagos market rates as of late 2025, sourced from publicly available recycler pricing where possible. The platform's commission is deducted from the gross payout, not added on top — so the rate a spotter sees is the rate they receive, with the commission shown separately in the transaction history for full transparency.

**Table 5.1 — Material Payout Rates (illustrative, Year One)**

| Material | Gross NGN/kg | Platform fee | Spotter receives NGN/kg |
| --- | --- | --- | --- |
| PET bottles (clear, baled) | 120 | 8% | 110 |
| Aluminum cans | 650 | 8% | 598 |
| HDPE (milk jugs, shampoo) | 180 | 8% | 166 |
| Nylon / sachet water bags | 40 | 8% | 37 |
| Clean paper / cartons | 60 | 8% | 55 |
| Mixed plastics (low grade) | 30 | 8% | 28 |
| E-waste (per item, manual) | Negotiated | 10% | Negotiated |

*Rates adjust quarterly. Spotters see the current rate at the moment of drop-off, locked for that transaction.*

### 5.2 Revenue Streams

EAS generates revenue from three deliberately diversified streams. The first is the transaction fee: 8 percent of gross payouts for individual spotters, 10 percent for commercial-scale pickups (shops, schools, small businesses). The second is the LAWMA data subsidy: a negotiated monthly fee in exchange for ward-level waste generation reports, hotspot mapping, and pilot participation data — proposed at NGN 150,000 to NGN 300,000 per month during the formal pilot phase. The third is the B2B recycler margin: EAS aggregates material at verified collection points and sells in bulk to formal recyclers, capturing a 5 to 15 percent margin on the wholesale transaction. This third stream activates only once monthly throughput exceeds 2 tonnes.

### 5.3 Unit Economics

**Table 5.2 — Year One Unit Economics (per active spotter per month)**

| Metric | Low estimate | High estimate | Notes |
| --- | --- | --- | --- |
| Avg kg recycled/spotter/month | 4 kg | 8 kg | Conservative; weekly ~1–2 kg |
| Avg gross payout/spotter/month | NGN 300 | NGN 700 | Mixed material rate |
| Platform fee at 8% | NGN 24 | NGN 56 | Direct revenue |
| Data subsidy allocation | NGN 15 | NGN 15 | NGN 200K / 1,000 spotters |
| B2B margin allocation | NGN 10 | NGN 20 | Activates above 2T/month |
| Total revenue/spotter/month | NGN 49 | NGN 91 | Blended |
| CAC (customer acquisition) | NGN 200 | NGN 350 | CDA + radio + referral |
| Payback period | 4 months | 6 months | Healthy for consumer app |

### 5.4 Cashout Flow

The cashout flow is intentionally simple to maximize trust: from the wallet screen, the spotter taps Cashout, enters or selects a saved bank account, confirms the amount, and the funds land in their bank within minutes during business hours. Paystack's Transfer API handles the bank-side settlement. A BVN verification step is required only the first time a bank account is added, after which it is stored securely (encrypted at rest) for future cashouts. Spotters without a bank account — still a meaningful share of the target demographic — can cash out to airtime (network operators: MTN, Airtel, Glo, 9mobile) with no additional verification, removing the largest friction point in the funnel.

---

## 6. LAWMA and CDA Partnership Strategy

Formal partnership with the Lagos State Waste Management Authority is the single most important external dependency for EAS. LAWMA provides legitimacy (residents trust the LAWMA brand more than an unknown startup), infrastructure access (existing PSP routes, authorized collection hubs, transfer loading stations), and a regulatory safe harbour that pre-empts future policy changes. Local Community Development Associations (CDAs) provide the grassroots trust layer: CDAs are the most credible local institution in many Ifako-Ijaye neighborhoods and are the fastest channel for spotter acquisition. The strategy below covers both partners in sequence.

### 6.1 LAWMA Outreach Sequence

**Step 1 — Desk research and warm introduction.** Identify the LAWMA Managing Director's office and the relevant department head for PSP operations and community waste programmes. Use professional networks (Lagos tech ecosystem, alumni associations, NBCC) to find a warm introduction rather than cold outreach. **Step 2 — One-page concept note.** A concise PDF covering problem, proposed solution, Ifako-Ijaye scope, what EAS is asking from LAWMA (letter of support, data-sharing agreement, pilot ward endorsement), and what LAWMA receives in return (ward-level data, community engagement, no capital cost to LAWMA). **Step 3 — Pitch meeting.** 30-minute slot, focus on the data opportunity and the community-engagement angle. **Step 4 — Pilot MoU.** A short-form MoU (5 to 8 pages) covering pilot scope, duration (6 months initial), data-sharing terms, LAWMA logo usage, and an exit clause for either party.

### 6.2 CDA Mobilization Strategy

Ifako-Ijaye has an active network of CDAs across its wards, including Fagba, Iju-Ishaga, Obawole, and others. EAS will approach CDAs through a structured mobilization plan: attend monthly CDA meetings to present the platform, offer each CDA a referral commission (proposed at NGN 50 per active spotter per month, for the first three months of that spotter's activity) to incentivize grassroots promotion, and designate one CDA member per ward as the EAS Community Champion with a small monthly stipend (NGN 5,000 to 10,000) for onboarding support. This is significantly cheaper than paid digital marketing in the same demographic and produces higher-quality retention because the trust transfer is personal, not algorithmic.

### 6.3 Compliance and Regulatory Checklist

- **CAC registration:** EAS to be registered as a limited liability company (LTD) with the Corporate Affairs Commission before any public launch or payment processing.
- **Lagos State environmental laws:** confirm alignment with the Lagos State Environmental Protection Law and PSP regulations; EAS positions itself as a digital layer over PSP operations, not a replacement.
- **NDPR (Nigeria Data Protection Regulation):** full compliance required — privacy policy, consent flows, data retention schedule, data subject access request process.
- **Paystack KYC:** business verification, director BVN, bank statement — Paystack onboarding typically takes 2 to 4 weeks for a Nigerian LTD.
- **SCUML registration:** only required if classified as a Designated Non-Financial Institution; legal counsel to confirm classification during pilot.

---

## 7. Technical Architecture and Recommended Stack

Although the founder selected "Let me decide later" for the mobile tech stack, this section makes a clear recommendation based on the founder's existing skills as a full-stack web developer and the requirements of the MVP. The recommendation below is justified, but the founder may swap any component without invalidating the rest of the architecture — the API contract is the layer of abstraction.

### 7.1 Recommended Stack

**Table 7.1 — Recommended Technology Stack**

| Layer | Recommendation | Rationale |
| --- | --- | --- |
| Mobile | React Native + Expo (TypeScript) | JS/TS native to web devs; one codebase iOS + Android; Expo handles native builds via EAS Build |
| Backend API | Node.js + Express (or NestJS) + TypeScript | Matches frontend language; huge ecosystem; Express for MVP simplicity, NestJS for scale |
| Database | PostgreSQL (managed — Neon, Render, or AWS RDS) | Relational fits transactions; JSON columns for flexible metadata; mature, free-tier options |
| Auth | Custom JWT + Twilio or Termii for SMS OTP | Full control; Termii for Nigerian SMS deliverability; JWT with refresh tokens |
| Maps | Mapbox GL JS (mobile) or Google Maps SDK | Mapbox has generous free tier; Google Maps easier for Nigerian geocoding |
| Payments | Paystack (Transfer + Recipient APIs) | Nigerian market leader; BVN verification built-in; bank transfers settle fast |
| File Storage | Cloudinary or AWS S3 + CloudFront | Photos from trash pile reports; Cloudinary for image transforms |
| Push Notifications | Expo Notifications (FCM/APNs underneath) | Free with Expo; covers iOS + Android from one API |
| Hosting | Render or Railway for API; Vercel if Next.js admin | Free tiers generous; one-click deploys; no DevOps burden |
| Observability | Sentry (errors) + Logtail (logs) + Posthog (product) | All have free tiers; covers crash, log, and product analytics |

### 7.2 Architecture Diagram (Description)

The architecture is a standard three-tier client-server model with no premature microservices. The mobile client (React Native + Expo) communicates over HTTPS with a single Node.js + Express API gateway, which handles auth, business logic, and validation. The API reads and writes to a single PostgreSQL database with strict Row Level Security for multi-tenant data isolation. External integrations — Paystack for payments, Termii for SMS, Mapbox for geocoding, Cloudinary for image uploads — are wrapped in adapter modules so they can be swapped without touching business logic. A background worker (BullMQ on Redis, or a simple cron via node-cron) handles asynchronous jobs: cashout retries, weekly LAWMA report generation, trash-pile-report deduplication, and CDA referral commission payouts.

### 7.3 Why a Custom Node API (not Supabase or Firebase)

The founder selected a custom Node API, and the recommendation honors that choice. The trade-offs are: (1) more initial setup work — the founder must build auth, validation, and CRUD boilerplate that Supabase would have given for free; (2) more operational burden — the founder must monitor uptime, backups, and security patches; (3) significantly more flexibility — any business rule can be implemented in code without fighting a managed-backend abstraction; (4) lower cost at scale — Postgres on Neon/Render free tier beats Supabase's per-request pricing once usage grows. The custom API is the right choice if the founder intends to own the entire stack long-term and is comfortable with TypeScript.

### 7.4 Repository Structure (Recommended)

```text
/eas-app
  /apps
    /mobile          # React Native + Expo (TypeScript)
    /admin           # Next.js admin dashboard (optional, v2)
  /services
    /api             # Node.js + Express API
    /worker          # Background jobs (BullMQ)
  /packages
    /types           # Shared TypeScript types
    /ui              # Shared React Native + Web components
    /config          # ESLint, TS config, env schemas
  /prisma            # Prisma schema + migrations
  /docs              # PRD, API specs, runbooks
  package.json       # Monorepo root (pnpm workspaces)
```

---

## 8. Data Model and API Specifications

### 8.1 Core Data Entities

The schema below is intentionally lean for MVP — seven tables, all in third normal form. Prisma is the recommended ORM for the Node.js backend because it generates type-safe queries from the schema, eliminating a whole class of runtime bugs. The schema can be ported to TypeORM or Drizzle with minimal changes if the founder prefers.

**Table 8.1 — Core Database Entities**

| Table | Purpose | Key Fields |
| --- | --- | --- |
| users | Spotter accounts | id, phone, role, created_at, bvn_verified, bank_account_ref |
| collection_points | Verified drop-off locations | id, name, lat, lng, partner_type, accepted_materials[], opening_hours, is_active |
| materials | Material type catalog | id, name, unit, current_rate_ngn, last_updated |
| dropoffs | Drop-off transactions | id, user_id, point_id, material_id, weight_kg, gross_payout, fee, net_payout, photo_url, created_at |
| wallets | Per-user balance | id, user_id, balance_ngn, updated_at |
| wallet_transactions | Wallet ledger | id, wallet_id, type (credit/debit), amount, ref_type, ref_id, created_at |
| cashouts | Paystack transfer requests | id, user_id, amount, bank_account, status, paystack_ref, created_at |
| pickup_requests | Scheduled home pickups | id, user_id, address, lat, lng, material, est_volume, window, status, accepted_by |
| trash_reports | Illegal dumpsite reports | id, user_id, photo_url, lat, lng, size, status, bounty_paid, created_at |
| cdas | Community Development Associations | id, name, ward, contact_phone, commission_balance |

### 8.2 Prisma Schema Sample

```prisma
model User {
  id              String   @id @default(cuid())
  phone           String   @unique
  role            Role     @default(SPOTTER)
  bvnVerified     Boolean  @default(false)
  wallet          Wallet?
  dropoffs        Dropoff[]
  createdAt       DateTime @default(now())
}

model Dropoff {
  id            String   @id @default(cuid())
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  point         CollectionPoint @relation(fields: [pointId], references: [id])
  pointId       String
  material      Material @relation(fields: [materialId], references: [id])
  materialId    String
  weightKg      Decimal  @db.Decimal(8,3)
  grossPayout   Int      // in kobo (NGN * 100)
  feePercent    Int      // e.g., 8
  netPayout     Int      // in kobo
  photoUrl      String?
  createdAt     DateTime @default(now())
}
```

### 8.3 Key API Endpoints (REST)

**Table 8.2 — API Endpoint Summary**

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /v1/auth/otp/request | Send OTP to phone number |
| POST | /v1/auth/otp/verify | Verify OTP, return JWT + refresh |
| POST | /v1/auth/refresh | Exchange refresh token for new JWT |
| GET | /v1/collection-points?lat=&lng=&radius= | List nearby collection points |
| POST | /v1/dropoffs | Log a drop-off transaction (collector-side) |
| GET | /v1/wallet | Get current balance + last 90d transactions |
| POST | /v1/wallet/cashout | Initiate Paystack transfer |
| POST | /v1/pickup-requests | Schedule a pickup |
| GET | /v1/pickup-requests/mine | List user's pickup requests |
| POST | /v1/trash-reports | Submit a trash pile report (photo + GPS) |
| GET | /v1/materials/prices | Get current payout rates per material |

### 8.4 Sample Request and Response

```json
// POST /v1/dropoffs — Request:
{
  "userId": "usr_abc",
  "pointId": "pt_xyz",
  "materialId": "mat_pet",
  "weightKg": 3.5,
  "photoUrl": "https://cdn.cloudinary.com/.../xyz.jpg"
}

// Response (201):
{
  "id": "dp_001",
  "grossPayoutKobo": 42000,
  "feePercent": 8,
  "feeKobo": 3360,
  "netPayoutKobo": 38640,
  "walletBalanceKobo": 95240,
  "createdAt": "2026-09-10T12:34:56Z"
}
```

---

## 9. Implementation Roadmap (30 / 60 / 90 Days)

The roadmap assumes a solo founder with full-stack web development experience, working full-time on EAS. All timelines are calendar days, not business days, and assume a 5-day work week with sustained focus. If the founder is part-time, multiply by 2x.

### 9.1 Phase 1 — Discovery and Infrastructure (Days 1–30)

Goal: stand up the foundation — business registration, partner conversations, dev environment, schema, auth. Deliverables: CAC business name registration submitted; warm introduction to LAWMA made; first CDA meeting attended; monorepo scaffolded with pnpm workspaces; PostgreSQL schema committed; Express API skeleton with health check and auth endpoints deployed; Expo app scaffolded with phone-input screen and OTP flow working end-to-end with Termii.

### 9.2 Phase 2 — Closed Beta (Days 31–60)

Goal: ship the MVP to 50 invited spotters from one CDA. Deliverables: collection-point data for at least 10 verified points in Ifako-Ijaye entered into the database; map screen functional with current location and routing to nearest point; wallet screen functional with balance and transaction history; dropoff endpoint working with photo upload to Cloudinary; Paystack cashout flow functional in sandbox then live; pickup request flow working end-to-end with at least 3 collectors onboarded; trash pile report flow functional with admin dashboard review queue; Sentry + Posthog instrumented.

### 9.3 Phase 3 — Public Launch (Days 61–90)

Goal: open the app to all Ifako-Ijaye residents and hit 1,000 spotters. Deliverables: App Store and Google Play submissions via EAS Build; press release to local Lagos tech media (TechCabal, Guardian Nigeria); CDA mobilization plan executed across 5 priority CDAs; weekly LAWMA report automated and emailed; fraud controls (per-account daily cashout cap, weight anomaly detection) live; customer support channel (WhatsApp Business) staffed; first monthly impact report published publicly. Success criteria for go/no-go at day 90: at least 1,000 active spotters, at least 3 tonnes diverted in month three, cashout failure rate below 2 percent, NPS above 30.

### 9.4 Resource Requirements and Budget

**Table 9.1 — Pre-Launch Budget Estimate (NGN)**

| Item | One-off | Monthly | Notes |
| --- | --- | --- | --- |
| CAC registration | 50,000 | – | Business name + LTD upgrade later |
| Domain + email (Google Workspace) | 5,000 | 3,000 | eas.ng + 2 mailboxes |
| Termii SMS (OTP) | – | 15,000 | ~5,000 OTPs at NGN 3 each |
| Paystack onboarding | – | – | Free, but KYC takes 2–4 weeks |
| Supabase alternative: Neon/Railway | – | 5,000 | Free tier covers pilot; upgrade after |
| Mapbox (free tier 50k loads) | – | – | Free for MVP |
| Cloudinary (free tier) | – | – | Free for MVP |
| Expo EAS Build | – | 10,000 | Standard tier for native builds |
| Part-time designer (3 months) | – | 75,000 | For app UI and marketing assets |
| Community ops lead (1 month, beta) | – | 60,000 | Onboard 50 beta spotters |
| CDA referral commissions (3 mo) | – | 50,000 | NGN 50 per active spotter |
| Sensitization flyers + radio | 30,000 | 20,000 | Local FM + street posters |
| Contingency (10%) | – | 25,000 | Buffer |
| **TOTAL** | **85,000** | **268,000** | |

3-month pre-launch total: ~NGN 890,000.
Budget assumes solo founder working full-time at zero salary during pilot.

---

## 10. Risks, Assumptions and Mitigation

Every pilot has failure modes. The table below lists the most material risks, their likelihood and impact, and the mitigation action. The risk register should be reviewed weekly during the 90-day pilot and updated as new failure modes surface.

**Table 10.1 — Risk Register**

| Risk | Likelihood | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| LAWMA delays MoU beyond 60 days | Medium | High | Start CDA pilot in parallel; LAWMA letter of support sufficient for v1 | Founder |
| Low spotter adoption (<500 by day 90) | Medium | High | Increase CDA referral commission to NGN 100 for months 2–3 | Founder |
| Collector no-shows on pickup jobs | Medium | High | 30-min auto-escalation; SLA report card on collectors | Ops |
| Paystack cashout fraud | Low | High | BVN verify, NGN 50K daily cap, anomaly detection | Founder |
| SMS OTP delivery failure (rural) | Medium | Medium | Termii + WhatsApp fallback via Termii unified API | Founder |
| GPS accuracy in dense urban canyons | Medium | Low | Manual LGA/ward fallback; photo evidence required | Founder |
| Recycler offtake price drops >20% | Low | Medium | Quarterly rate adjustment; multi-offtaker portfolio | Founder |
| Founder burnout (solo) | High | High | Part-time designer + ops lead by month 2; weekly review with advisor | Founder |
| Regulatory reclassification (SCUML) | Low | Medium | Legal counsel review before any cashout goes live | Founder |
| Data breach (NDPR) | Low | High | Encrypted at rest, RLS, monthly security audit, NDPR-compliant policy | Founder |

### 10.1 Go / No-Go Criteria (Day 90)

The pilot will be considered a go for scale-up if all of the following are true at day 90: at least 1,000 active spotters (active = at least one dropoff in the last 30 days); at least 3 tonnes diverted in month three; cashout failure rate below 2 percent; at least 3 collectors with SLA report card above 80 percent; LAWMA MoU signed or letter of support in hand; net promoter score above 30; CAC > NGN 350 per spotter; payback period below 6 months. If fewer than 4 of these 8 criteria are met, the recommendation is to extend the pilot for another 30 days rather than scale.

---

## 11. Conclusion and Next Steps

EAS solves a real Lagos problem — waste piling up in under-served LGAs while informal waste pickers earn below subsistence wages — and it does so with a model that is both economically viable (transaction fees, B2B margin, LAWMA subsidy) and operationally lean (no collection infrastructure to own, partner-led ground game). The MVP is intentionally narrow: five features, one LGA, one currency, one payment provider. The recommended technology stack honors the founder's full-stack web background by leading with TypeScript across the entire codebase — React Native + Expo on the front, Node.js + Express on the back, PostgreSQL with Prisma for persistence, and Paystack for payouts. The 90-day roadmap is aggressive but achievable for a focused solo founder with a part-time designer and ops lead.

Concrete next steps for the founder, in order: (1) register the business name with CAC this week; (2) book a LAWMA pitch meeting via the warmest available introduction; (3) open a Paystack business account and start KYC; (4) scaffold the monorepo and ship the auth flow within 14 days; (5) attend the next CDA meeting in Fagba or Iju-Ishaga to introduce the concept and recruit the first Community Champion. A separate investor deck will be prepared once the LAWMA pilot MoU is in hand — until then, this PRD is the canonical document for all internal and external conversations.

---

*EAS — Earn While You Clean | Lagos, Nigeria — PRD v1.0 (Draft), September 2026. Confidential.*

