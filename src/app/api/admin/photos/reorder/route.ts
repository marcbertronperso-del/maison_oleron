import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { photos } from "~/server/db/schema";
import { logAdminAction } from "~/lib/audit";
import { auth } from "~/server/auth";

const ReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const { ids } = parsed.data;

  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(photos)
        .set({ display_order: i })
        .where(eq(photos.id, ids[i]!));
    }
  });

  try {
    await logAdminAction({
      action: "PHOTO_REORDER",
      entityType: "photo",
      details: { order: ids, admin_email: session.user?.email },
    });
  } catch { /* audit never blocks */ }

  return NextResponse.json({ reordered: ids.length });
}
