import { db } from "./index";
import { pricingPeriods } from "./schema";

const DEFAULT_PRICING: (typeof pricingPeriods.$inferInsert)[] = [
  {
    name: "Hors saison",
    start_month: 1,
    end_month: 5,
    price_per_night: 8000, // 80.00 EUR
  },
  {
    name: "Juin",
    start_month: 6,
    end_month: 6,
    price_per_night: 10000, // 100.00 EUR
  },
  {
    name: "Juillet",
    start_month: 7,
    end_month: 7,
    price_per_night: 15000, // 150.00 EUR
  },
  {
    name: "Août",
    start_month: 8,
    end_month: 8,
    price_per_night: 20000, // 200.00 EUR
  },
];

async function seed() {
  console.log("Seeding pricing_periods...");

  await db
    .insert(pricingPeriods)
    .values(DEFAULT_PRICING)
    .onConflictDoNothing();

  console.log("✓ pricing_periods seeded (4 default periods)");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
