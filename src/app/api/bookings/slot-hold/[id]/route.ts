import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { slotHolds } from "~/server/db/schema";

const UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await db.delete(slotHolds).where(eq(slotHolds.id, id));
  return new NextResponse(null, { status: 204 });
}
