import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../src/server/db";
import { photos } from "../src/server/db/schema";
import { max } from "drizzle-orm";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function fileToAltText(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXT.has(ext);
  });

  if (files.length === 0) {
    console.log("Aucune image trouvée dans public/uploads/");
    return;
  }

  const existing = await db.select({ blob_url: photos.blob_url }).from(photos);
  const existingUrls = new Set(existing.map((r) => r.blob_url));

  const toInsert = files.filter((f) => {
    const url = `/uploads/${encodeURIComponent(f)}`;
    return !existingUrls.has(url);
  });

  if (toInsert.length === 0) {
    console.log("Toutes les photos sont déjà en base. Rien à faire.");
    return;
  }

  const [row] = await db.select({ maxOrder: max(photos.display_order) }).from(photos);
  let nextOrder = (row?.maxOrder ?? -1) + 1;

  for (const filename of toInsert) {
    const url = `/uploads/${encodeURIComponent(filename)}`;
    const alt = fileToAltText(filename);
    await db.insert(photos).values({ blob_url: url, alt_text: alt, display_order: nextOrder });
    console.log(`✓ Ajouté : ${filename} → ordre ${nextOrder}`);
    nextOrder++;
  }

  console.log(`\n${toInsert.length} photo(s) ajoutée(s) en base.`);
}

main().catch(console.error).finally(() => process.exit());
