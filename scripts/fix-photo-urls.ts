import "dotenv/config";
import { db } from "../src/server/db";
import { photos } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

const RENAMES: Record<string, string> = {
  "/uploads/Chambre%201%20dressing.jpg": "/uploads/chambre-1-dressing.jpg",
  "/uploads/Chambre%201.jpg":            "/uploads/chambre-1.jpg",
  "/uploads/Chambre%202%20lit.jpg":      "/uploads/chambre-2-lit.jpg",
  "/uploads/Chambre%202.jpg":            "/uploads/chambre-2.jpg",
  "/uploads/Chambre%203.jpg":            "/uploads/chambre-3.jpg",
  "/uploads/maison%20ext.png":           "/uploads/maison-ext.png",
  "/uploads/salon.png":                  "/uploads/salon.png",
};

async function main() {
  for (const [oldUrl, newUrl] of Object.entries(RENAMES)) {
    const result = await db
      .update(photos)
      .set({ blob_url: newUrl })
      .where(eq(photos.blob_url, oldUrl));
    console.log(`${oldUrl} → ${newUrl}`);
  }
  console.log("\nURLs mises à jour.");
}

main().catch(console.error).finally(() => process.exit());
