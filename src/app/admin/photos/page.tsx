import { asc } from "drizzle-orm";
import { db } from "~/server/db";
import { photos } from "~/server/db/schema";
import { PhotoManagement } from "~/components/admin/photos/PhotoManagement";

export const metadata = { title: "Galerie photos — Administration" };

export default async function PhotosPage() {
  const allPhotos = await db
    .select({
      id: photos.id,
      blob_url: photos.blob_url,
      alt_text: photos.alt_text,
      display_order: photos.display_order,
    })
    .from(photos)
    .orderBy(asc(photos.display_order));

  return <PhotoManagement initialPhotos={allPhotos} />;
}
