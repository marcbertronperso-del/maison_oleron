import fs from "fs/promises";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { max } from "drizzle-orm";
import { db } from "~/server/db";
import { photos } from "~/server/db/schema";
import { logAdminAction } from "~/lib/audit";
import { auth } from "~/server/auth";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const altText = formData.get("alt_text");

  if (
    !(file instanceof File) ||
    !ALLOWED_TYPES.has(file.type) ||
    file.size === 0 ||
    file.size > MAX_BYTES
  ) {
    return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
  }

  if (typeof altText !== "string" || !altText.trim()) {
    return NextResponse.json({ error: "INVALID_ALT_TEXT" }, { status: 400 });
  }

  let blob: { url: string };
  const isDevMock =
    !process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN === "placeholder";

  if (isDevMock) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, filename), buffer);
    blob = { url: `/uploads/${filename}` };
  } else {
    try {
      blob = await put(file.name, file, { access: "public" });
    } catch (err) {
      console.error("[photos] blob upload failed:", err);
      return NextResponse.json(
        { error: "BLOB_FAILED", detail: String(err) },
        { status: 500 },
      );
    }
  }

  const [row] = await db
    .select({ maxOrder: max(photos.display_order) })
    .from(photos);
  const nextOrder = (row?.maxOrder ?? -1) + 1;

  const [inserted] = await db
    .insert(photos)
    .values({
      blob_url: blob.url,
      alt_text: altText.trim().slice(0, 255),
      display_order: nextOrder,
    })
    .returning({ id: photos.id });

  try {
    await logAdminAction({
      action: "PHOTO_UPLOAD",
      entityType: "photo",
      entityId: inserted?.id,
      details: { url: blob.url, admin_email: session.user?.email },
    });
  } catch { /* audit never blocks */ }

  return NextResponse.json({ id: inserted?.id, url: blob.url }, { status: 201 });
}
