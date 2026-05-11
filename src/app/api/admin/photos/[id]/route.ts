import fs from "fs/promises";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { photos } from "~/server/db/schema";
import { logAdminAction } from "~/lib/audit";
import { auth } from "~/server/auth";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/webp", "image/png"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function PATCH(
  req: NextRequest,
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

  const contentType = req.headers.get("content-type") ?? "";
  let altText: string;
  let newBlobUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const rawAlt = formData.get("alt_text");
    altText = typeof rawAlt === "string" ? rawAlt.trim() : "";
    if (!altText || altText.length > 255) {
      return NextResponse.json({ error: "INVALID_ALT_TEXT" }, { status: 400 });
    }

    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
        return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
      }

      // Fetch old URL for deletion
      const [oldPhoto] = await db
        .select({ blob_url: photos.blob_url })
        .from(photos)
        .where(eq(photos.id, id))
        .limit(1);

      // Upload new file
      const isDevMock =
        !process.env.BLOB_READ_WRITE_TOKEN ||
        process.env.BLOB_READ_WRITE_TOKEN === "placeholder";

      if (isDevMock) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));
        newBlobUrl = `/uploads/${filename}`;
      } else {
        try {
          const blob = await put(file.name, file, { access: "public" });
          newBlobUrl = blob.url;
        } catch (err) {
          return NextResponse.json({ error: "BLOB_FAILED", detail: String(err) }, { status: 500 });
        }
      }

      // Delete old blob
      if (oldPhoto?.blob_url.startsWith("https://")) {
        try { await del(oldPhoto.blob_url); } catch { /* ignore */ }
      }
    }
  } else {
    const { alt_text } = (await req.json()) as { alt_text?: string };
    altText = alt_text?.trim() ?? "";
    if (!altText || altText.length > 255) {
      return NextResponse.json({ error: "INVALID_ALT_TEXT" }, { status: 400 });
    }
  }

  const [updated] = await db
    .update(photos)
    .set(newBlobUrl ? { alt_text: altText, blob_url: newBlobUrl } : { alt_text: altText })
    .where(eq(photos.id, id))
    .returning({ id: photos.id, blob_url: photos.blob_url });

  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    await logAdminAction({
      action: "PHOTO_EDIT",
      entityType: "photo",
      entityId: id,
      details: { alt_text: altText, replaced: !!newBlobUrl, admin_email: session.user?.email },
    });
  } catch { /* audit never blocks */ }

  return NextResponse.json({ id: updated.id, blob_url: updated.blob_url });
}

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
