import { type NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { photos } from "~/server/db/schema";
import { logAdminAction } from "~/lib/audit";
import { auth } from "~/server/auth";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  const [photo] = await db
    .select({ id: photos.id, blob_url: photos.blob_url })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  if (!photo) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (photo.blob_url.startsWith("https://")) {
    await del(photo.blob_url);
  }
  await db.delete(photos).where(eq(photos.id, id));

  try {
    await logAdminAction({
      action: "PHOTO_DELETE",
      entityType: "photo",
      entityId: id,
      details: { url: photo.blob_url, admin_email: session.user?.email },
    });
  } catch { /* audit never blocks */ }

  return NextResponse.json({ deleted: id });
}
