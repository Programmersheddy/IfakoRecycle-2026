// prisma/seed.ts
// Seed data for EAS — Ifako-Ijaye pilot (data package: SETUP.md).
// All monetary values are in KOBO (1 NGN = 100 kobo), per the money.ts
// helper convention. Rates sourced from PRD §5.1 / material-prices.2025-Q4.
//
// Mapped onto the ACTUAL prisma/schema.prisma (now aligned with SETUP.md):
//   - Material: code/category/gross/net rates as in SETUP.md.
//   - CollectionPoint: address + contactPhone columns.
//   - User uses `displayName`; spotters get a Wallet.
//
// Idempotent: reference data is cleared+recreated; users are upserted and
// wallets only funded when they hold no ledger entries yet.
// Run with:   pnpm db:seed

import { PrismaClient, PartnerType } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// 1. MATERIALS — with current NGN/kobo payout rates (SETUP.md)
//    grossRateKoboPerKg = the gross payout per kg BEFORE platform fee.
//    feePercent = platform commission deducted at drop-off (§5.1).
//    netRateKoboPerKg = what the spotter receives per kg.
// ─────────────────────────────────────────────────────────────
const materials = [
  {
    code: "PET_CLEAR",
    name: "PET bottles (clear, baled)",
    category: "PLASTIC" as const,
    grossRateKoboPerKg: 12000,   // ₦120/kg
    feePercent: 8,
    description: "Clear PET water and soda bottles, caps removed, baled or loose.",
    acceptedByDefault: true,
  },
  {
    code: "ALU_CANS",
    name: "Aluminum cans",
    category: "METAL" as const,
    grossRateKoboPerKg: 65000,   // ₦650/kg
    feePercent: 8,
    description: "Aluminum drink cans (Coca-Cola, Pepsi, malt drinks). Crushed preferred.",
    acceptedByDefault: true,
  },
  {
    code: "HDPE",
    name: "HDPE (milk jugs, shampoo)",
    category: "PLASTIC" as const,
    grossRateKoboPerKg: 18000,   // ₦180/kg
    feePercent: 8,
    description: "High-density polyethylene: milk jugs, shampoo bottles, detergent containers.",
    acceptedByDefault: true,
  },
  {
    code: "NYLON_SACHET",
    name: "Nylon / sachet water bags",
    category: "PLASTIC" as const,
    grossRateKoboPerKg: 4000,    // ₦40/kg
    feePercent: 8,
    description: "Pure water sachets, shopping nylons. Must be clean and dry.",
    acceptedByDefault: true,
  },
  {
    code: "PAPER_CARTON",
    name: "Clean paper / cartons",
    category: "PAPER" as const,
    grossRateKoboPerKg: 6000,    // ₦60/kg
    feePercent: 8,
    description: "Cardboard cartons, newspapers, office paper. No grease, no water damage.",
    acceptedByDefault: true,
  },
  {
    code: "PLASTIC_MIXED",
    name: "Mixed plastics (low grade)",
    category: "PLASTIC" as const,
    grossRateKoboPerKg: 3000,    // ₦30/kg
    feePercent: 8,
    description: "Mixed low-grade plastics: toys, broken buckets, PVC scraps.",
    acceptedByDefault: true,
  },
  {
    code: "E_WASTE",
    name: "E-waste (per item, manual)",
    category: "E_WASTE" as const,
    grossRateKoboPerKg: 0,       // negotiated per item
    feePercent: 10,
    description: "Scrap phones, chargers, small appliances. Price negotiated per item at drop-off.",
    acceptedByDefault: false,
  },
];

// ─────────────────────────────────────────────────────────────
// 2. COLLECTION POINTS — Ifako-Ijaye LGA
//    Geocoded to ward-level landmarks. Lat/lng approximate;
//    refine by visiting each location with the EAS app and re-tagging.
// ─────────────────────────────────────────────────────────────
const collectionPoints = [
  {
    name: "Fagba Junction Recycling Hub",
    partnerType: PartnerType.LAWMA_HUB,
    address: "Fagba Junction, off Iju Road, Ifako-Ijaye, Lagos",
    lat: 6.6541,
    lng: 3.3267,
    openingHours: "Mon-Sat 08:00-17:00",
    contactPhone: "+2348012345678",
    acceptedMaterialCodes: ["PET_CLEAR", "ALU_CANS", "HDPE", "NYLON_SACHET", "PAPER_CARTON", "PLASTIC_MIXED"],
  },
  {
    name: "Iju-Ishaga Scrap Dealers Association",
    partnerType: PartnerType.SCRAP_DEALER,
    address: "Iju-Ishaga Bus Stop, Agege Motor Road, Ifako-Ijaye, Lagos",
    lat: 6.6489,
    lng: 3.3184,
    openingHours: "Mon-Sat 07:30-18:00",
    contactPhone: "+2348023456789",
    acceptedMaterialCodes: ["ALU_CANS", "HDPE", "E_WASTE", "PLASTIC_MIXED"],
  },
  {
    name: "Obawole CDA Collection Drive",
    partnerType: PartnerType.CDA_HUB,
    address: "Obawole Community Hall, Obawole Street, Ifako-Ijaye, Lagos",
    lat: 6.6612,
    lng: 3.3298,
    openingHours: "Sat 09:00-14:00",
    contactPhone: "+2348034567890",
    acceptedMaterialCodes: ["PET_CLEAR", "NYLON_SACHET", "PAPER_CARTON"],
  },
  {
    name: "College Road LAWMA PSP Depot",
    partnerType: PartnerType.LAWMA_HUB,
    address: "College Road, near Ifako General Hospital, Lagos",
    lat: 6.6587,
    lng: 3.3345,
    openingHours: "Mon-Fri 08:00-16:00",
    contactPhone: "+2348045678901",
    acceptedMaterialCodes: ["PET_CLEAR", "ALU_CANS", "HDPE", "NYLON_SACHET", "PAPER_CARTON", "PLASTIC_MIXED"],
  },
  {
    name: "Agege Motor Road Recycler",
    partnerType: PartnerType.PRIVATE_RECYCLER,
    address: "Agege Motor Road, by Iju bus stop, Ifako-Ijaye, Lagos",
    lat: 6.6475,
    lng: 3.3201,
    openingHours: "Mon-Sat 08:00-18:00",
    contactPhone: "+2348056789012",
    acceptedMaterialCodes: ["PET_CLEAR", "ALU_CANS", "PAPER_CARTON", "PLASTIC_MIXED"],
  },
  {
    name: "Fagba PET Aggregation Point",
    partnerType: PartnerType.PRIVATE_RECYCLER,
    address: "Fagba Road, opposite Fagba Railway Crossing, Lagos",
    lat: 6.6558,
    lng: 3.3271,
    openingHours: "Mon-Sat 09:00-17:00",
    contactPhone: "+2348067890123",
    acceptedMaterialCodes: ["PET_CLEAR", "HDPE", "NYLON_SACHET"],
  },
  {
    name: "Ifako General Hospital Enviro Drive",
    partnerType: PartnerType.CDA_HUB,
    address: "Ifako General Hospital premises, College Road, Lagos",
    lat: 6.6591,
    lng: 3.3348,
    openingHours: "First Saturday of month 09:00-13:00",
    contactPhone: "+2348078901234",
    acceptedMaterialCodes: ["PET_CLEAR", "NYLON_SACHET", "PAPER_CARTON"],
  },
  {
    name: "Iju Train Station Drop-off",
    partnerType: PartnerType.LAWMA_HUB,
    address: "Iju Train Station, Iju Road, Ifako-Ijaye, Lagos",
    lat: 6.6468,
    lng: 3.3178,
    openingHours: "Mon-Sat 07:00-19:00",
    contactPhone: "+2348089012345",
    acceptedMaterialCodes: ["PET_CLEAR", "ALU_CANS", "NYLON_SACHET", "PAPER_CARTON"],
  },
  {
    name: "Obawole Scrap Yard",
    partnerType: PartnerType.SCRAP_DEALER,
    address: "Obawole Junction, behind St. Theresa's Church, Lagos",
    lat: 6.6623,
    lng: 3.3305,
    openingHours: "Mon-Sat 08:00-18:00",
    contactPhone: "+2348090123456",
    acceptedMaterialCodes: ["ALU_CANS", "E_WASTE", "PLASTIC_MIXED"],
  },
  {
    name: "Tollgate CDA Eco Corner",
    partnerType: PartnerType.CDA_HUB,
    address: "Lagos-Abeokuta Expressway, Tollgate area, Ifako-Ijaye",
    lat: 6.6412,
    lng: 3.3101,
    openingHours: "Sat 10:00-15:00",
    contactPhone: "+2348101234567",
    acceptedMaterialCodes: ["PET_CLEAR", "ALU_CANS", "NYLON_SACHET", "PAPER_CARTON", "PLASTIC_MIXED"],
  },
];

// ─────────────────────────────────────────────────────────────
// 3. CDAs — Community Development Associations in Ifako-Ijaye
// ─────────────────────────────────────────────────────────────
const cdas = [
  { name: "Fagba CDA", ward: "Fagba", contactPhone: "+2348011111111", commissionBalanceKobo: 0 },
  { name: "Iju-Ishaga CDA", ward: "Iju", contactPhone: "+2348022222222", commissionBalanceKobo: 0 },
  { name: "Obawole CDA", ward: "Obawole", contactPhone: "+2348033333333", commissionBalanceKobo: 0 },
  { name: "College Road CDA", ward: "College Road", contactPhone: "+2348044444444", commissionBalanceKobo: 0 },
  { name: "Tollgate CDA", ward: "Tollgate", contactPhone: "+2348055555555", commissionBalanceKobo: 0 },
];

// ─────────────────────────────────────────────────────────────
// 4. TEST USERS — beta spotters for closed-beta testing
//    Phone numbers use the +234 test prefix (replace before production).
// ─────────────────────────────────────────────────────────────
const testUsers = [
  { phone: "+2348091110001", role: "SPOTTER", displayName: "Aisha (Beta Tester 1)", openingKobo: 250_000 },   // ₦2,500
  { phone: "+2348091110002", role: "SPOTTER", displayName: "Tunde (Beta Tester 2)", openingKobo: 38_640 },    // ₦386.40
  { phone: "+2348091110003", role: "SPOTTER", displayName: "Mama Chidi (Beta Tester 3)", openingKobo: 0 },
  { phone: "+2348091110004", role: "COLLECTOR", displayName: "Emeka (Collector)" },
  { phone: "+2348091110005", role: "ADMIN", displayName: "Shadrach (Admin)" },
];

// Dev spotter used by the Step 5 cashout smoke tests (₦25,000 opening balance).
const DEV_SPOTTER = { phone: "+2348031234599", displayName: "EAS Dev Wallet", openingKobo: 2_500_000 };

// ─────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding EAS database (all amounts in kobo)...");

  // Reference data is cleared + recreated (idempotent); user wallets and their
  // ledger entries are preserved — only empty wallets get their opening credit.
  await prisma.collectionPoint.deleteMany();
  await prisma.material.deleteMany();

  // 1. Materials (rate card: SETUP.md / material-prices.2025-Q4)
  console.log("  → Materials...");
  for (const m of materials) {
    const netRateKoboPerKg = Math.round(m.grossRateKoboPerKg * (1 - m.feePercent / 100));
    await prisma.material.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        category: m.category,
        grossRateKoboPerKg: m.grossRateKoboPerKg,
        feePercent: m.feePercent,
        netRateKoboPerKg,
        description: m.description,
        acceptedByDefault: m.acceptedByDefault
      },
      create: {
        code: m.code,
        name: m.name,
        category: m.category,
        grossRateKoboPerKg: m.grossRateKoboPerKg,
        feePercent: m.feePercent,
        netRateKoboPerKg,
        description: m.description,
        acceptedByDefault: m.acceptedByDefault
      }
    });
  }

  // 2. Collection points + accepted-materials matrix
  console.log("  → Collection Points...");
  const allMaterials = await prisma.material.findMany();
  for (const cp of collectionPoints) {
    const accepted = allMaterials
      .filter((m) => cp.acceptedMaterialCodes.includes(m.code))
      .map((m) => ({ id: m.id }));
    await prisma.collectionPoint.create({
      data: {
        name: cp.name,
        address: cp.address,
        partnerType: cp.partnerType,
        lat: cp.lat,
        lng: cp.lng,
        openingHours: cp.openingHours,
        contactPhone: cp.contactPhone,
        isActive: true,
        acceptedMaterials: { connect: accepted }
      }
    });
  }

  // 3. CDAs
  console.log("  → CDAs...");
  for (const cda of cdas) {
    await prisma.cda.upsert({
      where: { name: cda.name },
      update: { ward: cda.ward, contactPhone: cda.contactPhone },
      create: { name: cda.name, ward: cda.ward, contactPhone: cda.contactPhone }
    });
  }

  // 4. Test users + wallets (spotters get a one-time opening credit)
  console.log("  → Test users + wallets...");
  for (const u of testUsers) {
    const role = "SPOTTER" === u.role ? "SPOTTER" : ("COLLECTOR" === u.role ? "COLLECTOR" : "ADMIN");
    const user = await prisma.user.upsert({
      where: { phone: u.phone },
      update: { role, displayName: u.displayName },
      create: {
        phone: u.phone,
        displayName: u.displayName,
        role,
        bvnVerified: "ADMIN" === u.role || "COLLECTOR" === u.role, // staff pre-verified
        wallet: "SPOTTER" === u.role ? { create: {} } : undefined
      }
    });
    if ("SPOTTER" === u.role && u.openingKobo > 0) {
      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
      const ledgerCount = await prisma.walletTransaction.count({ where: { walletId: wallet.id } });
      if (ledgerCount === 0) {
        await prisma.$transaction([
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "CREDIT",
              amountKobo: u.openingKobo,
              refType: "ADJUSTMENT",
              refId: "seed-opening-balance"
            }
          }),
          prisma.wallet.update({ where: { id: wallet.id }, data: { balanceKobo: { increment: u.openingKobo } } })
        ]);
        console.log(`    ✓ ${u.phone} funded — ₦${(u.openingKobo / 100).toLocaleString("en-NG")}`);
      }
    }
  }

  // 5. Dev spotter for the Step 5 cashout flow (₦25,000 opening balance)
  const devUser = await prisma.user.upsert({
    where: { phone: DEV_SPOTTER.phone },
    update: {},
    create: {
      phone: DEV_SPOTTER.phone,
      displayName: DEV_SPOTTER.displayName,
      role: "SPOTTER",
      wallet: { create: {} }
    }
  });
  const devWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: devUser.id } });
  if ((await prisma.walletTransaction.count({ where: { walletId: devWallet.id } })) === 0) {
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          walletId: devWallet.id,
          type: "CREDIT",
          amountKobo: DEV_SPOTTER.openingKobo,
          refType: "ADJUSTMENT",
          refId: "seed-dev-opening-balance"
        }
      }),
      prisma.wallet.update({ where: { id: devWallet.id }, data: { balanceKobo: { increment: DEV_SPOTTER.openingKobo } } })
    ]);
    console.log(`    ✓ ${DEV_SPOTTER.phone} funded — ₦${(DEV_SPOTTER.openingKobo / 100).toLocaleString("en-NG")}`);
  }

  // 6. Summary
  const counts = {
    materials: await prisma.material.count(),
    collectionPoints: await prisma.collectionPoint.count(),
    cdas: await prisma.cda.count(),
    users: await prisma.user.count(),
    wallets: await prisma.wallet.count()
  };
  console.log("✅ Seed complete:");
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
