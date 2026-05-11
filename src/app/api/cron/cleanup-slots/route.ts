import { type NextRequest, NextResponse } from "next/server";
import { lte } from "drizzle-orm";
import { db } from "~/server/db";
import { slotHolds } from "~/server/db/schema";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Vercel sets CRON_SECRET automatically; if present, validate it
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db
    .delete(slotHolds)
    .where(lte(slotHolds.expires_at, new Date()))
    .returning({ id: slotHolds.id });

  console.log(`[cron:cleanup-slots] deleted ${deleted.length} expired slot holds`);

  return NextResponse.json({ deleted: deleted.length });
}
