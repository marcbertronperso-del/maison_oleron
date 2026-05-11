"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadModal } from "./UploadModal";

export type PhotoRow = {
  id: string;
  blob_url: string;
  alt_text: string;
  display_order: number;
};

function SortablePhotoCard({
  photo,
  onDelete,
}: {
  photo: PhotoRow;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Drag handle — only this element triggers the drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1.5 z-10 cursor-grab touch-none rounded bg-black/40 p-0.5 text-white transition-opacity active:cursor-grabbing hover:bg-black/60"
        aria-label="Déplacer"
      >
        <GripVertical className="h-4 w-4 drop-shadow" />
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(photo.id)}
        aria-label={`Supprimer ${photo.alt_text}`}
        className="absolute right-1.5 top-1.5 z-10 rounded-md bg-black/50 p-1 text-white transition-colors hover:bg-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        <Image
          src={photo.blob_url}
          alt={photo.alt_text}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </div>

      {/* Alt text label */}
      <div className="px-2.5 py-2">
        <p className="truncate text-xs text-muted-foreground">{photo.alt_text}</p>
      </div>
    </div>
  );
}

export function PhotoManagement({ initialPhotos }: { initialPhotos: PhotoRow[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);
    void patchReorder(reordered.map((p) => p.id));
  }

  async function patchReorder(ids: string[]) {
    const res = await fetch("/api/admin/photos/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      setPhotos(initialPhotos);
    }
  }

  function handleAllUploaded() {
    setUploadModalOpen(false);
    router.refresh();
  }

  function openDeleteDialog(id: string) {
    setConfirmDeleteId(id);
    setDeleteError(null);
  }

  function closeDeleteDialog() {
    if (isDeleting) return;
    setConfirmDeleteId(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/photos/${confirmDeleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setDeleteError("La suppression a échoué. Veuillez réessayer.");
        setIsDeleting(false);
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch {
      setDeleteError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl text-foreground">Galerie photos</h1>
        <div className="flex items-center gap-2">
          <a
            href="/?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Prévisualiser
          </a>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ImagePlus className="h-4 w-4" />
            Ajouter des photos
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div
          className="cursor-pointer rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center hover:border-primary/50"
          onClick={() => setUploadModalOpen(true)}
        >
          <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Aucune photo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cliquez pour importer la galerie.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  onDelete={openDeleteDialog}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onAllUploaded={handleAllUploaded}
      />

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteDialog();
          }}
        >
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="font-heading text-base font-semibold text-foreground">
              Supprimer cette photo ?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Cette action est irréversible. La photo sera supprimée de la galerie et du stockage.
            </p>

            {deleteError && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression…
                  </>
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
