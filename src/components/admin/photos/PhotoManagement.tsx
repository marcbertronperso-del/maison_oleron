"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ExternalLink, GripVertical, ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react";
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
  selectionMode,
  isSelected,
  onToggleSelect,
  onDelete,
  onEdit,
}: {
  photo: PhotoRow;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (photo: PhotoRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id, disabled: selectionMode });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`group relative overflow-hidden rounded-xl border bg-card ${
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
      }`}
    >
      {selectionMode ? (
        <button
          type="button"
          onClick={() => onToggleSelect(photo.id)}
          aria-label={isSelected ? "Désélectionner" : "Sélectionner"}
          className={`absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            isSelected ? "border-primary bg-primary" : "border-white bg-black/40"
          }`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </button>
      ) : (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-1.5 top-1.5 z-10 cursor-grab touch-none rounded bg-black/40 p-0.5 text-white transition-opacity active:cursor-grabbing hover:bg-black/60"
          aria-label="Déplacer"
        >
          <GripVertical className="h-4 w-4 drop-shadow" />
        </div>
      )}

      {!selectionMode && (
        <div className="absolute right-1.5 top-1.5 z-10 flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(photo)}
            aria-label={`Modifier ${photo.alt_text}`}
            className="rounded-md bg-black/50 p-1 text-white transition-colors hover:bg-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(photo.id)}
            aria-label={`Supprimer ${photo.alt_text}`}
            className="rounded-md bg-black/50 p-1 text-white transition-colors hover:bg-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div
        className={`relative aspect-4/3 w-full bg-muted ${selectionMode ? "cursor-pointer" : ""}`}
        onClick={selectionMode ? () => onToggleSelect(photo.id) : undefined}
      >
        <Image
          src={photo.blob_url}
          alt={photo.alt_text}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
        {isSelected && <div className="absolute inset-0 bg-primary/20" />}
      </div>

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

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Single delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bulk delete
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  // Edit
  const [editingPhoto, setEditingPhoto] = useState<PhotoRow | null>(null);
  const [editAltText, setEditAltText] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
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
    if (!res.ok) setPhotos(initialPhotos);
  }

  function handleAllUploaded() {
    setUploadModalOpen(false);
    router.refresh();
  }

  // ── Selection ───────────────────────────────────────────────────────────
  function toggleSelectionMode() {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Bulk delete ─────────────────────────────────────────────────────────
  async function handleBulkDelete() {
    setIsBulkDeleting(true);
    setBulkDeleteError(null);
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/admin/photos/${id}`, { method: "DELETE" })),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        setBulkDeleteError(`${failed} suppression(s) ont échoué.`);
      }
      const succeeded = ids.filter((_, i) => results[i]?.ok);
      setPhotos((prev) => prev.filter((p) => !succeeded.includes(p.id)));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      if (failed === 0) setSelectionMode(false);
    } catch {
      setBulkDeleteError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // ── Single delete ───────────────────────────────────────────────────────
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
      const res = await fetch(`/api/admin/photos/${confirmDeleteId}`, { method: "DELETE" });
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

  // ── Edit ────────────────────────────────────────────────────────────────
  function openEditModal(photo: PhotoRow) {
    setEditingPhoto(photo);
    setEditAltText(photo.alt_text);
    setEditError(null);
  }

  function closeEditModal() {
    if (isEditSaving) return;
    setEditingPhoto(null);
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editingPhoto) return;
    const trimmed = editAltText.trim();
    if (!trimmed) {
      setEditError("La légende ne peut pas être vide.");
      return;
    }
    setIsEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/photos/${editingPhoto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt_text: trimmed }),
      });
      if (!res.ok) {
        setEditError("La modification a échoué. Veuillez réessayer.");
        setIsEditSaving(false);
        return;
      }
      setPhotos((prev) =>
        prev.map((p) => (p.id === editingPhoto.id ? { ...p, alt_text: trimmed } : p)),
      );
      setEditingPhoto(null);
    } catch {
      setEditError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsEditSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="flex-1 font-heading text-xl text-foreground">Galerie photos</h1>

        {selectionMode ? (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIds(
                  selectedIds.size === photos.length
                    ? new Set()
                    : new Set(photos.map((p) => p.id)),
                )
              }
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              {selectedIds.size === photos.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => { setBulkDeleteConfirm(true); setBulkDeleteError(null); }}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedIds.size})
              </button>
            )}
            <button
              type="button"
              onClick={toggleSelectionMode}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <a
              href="/?preview=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Prévisualiser
            </a>
            {photos.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectionMode}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Sélectionner
              </button>
            )}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ImagePlus className="h-4 w-4" />
              Ajouter des photos
            </button>
          </>
        )}
      </div>

      {/* ── Grid ── */}
      {photos.length === 0 ? (
        <div
          className="cursor-pointer rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center hover:border-primary/50"
          onClick={() => setUploadModalOpen(true)}
        >
          <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Aucune photo</p>
          <p className="mt-1 text-xs text-muted-foreground">Cliquez pour importer la galerie.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(photo.id)}
                  onToggleSelect={toggleSelect}
                  onDelete={openDeleteDialog}
                  onEdit={openEditModal}
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

      {/* ── Single delete dialog ── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeDeleteDialog(); }}
        >
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="font-heading text-base font-semibold text-foreground">
              Supprimer cette photo ?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Cette action est irréversible.
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
                  <><Loader2 className="h-4 w-4 animate-spin" />Suppression…</>
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk delete dialog ── */}
      {bulkDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBulkDeleting) setBulkDeleteConfirm(false);
          }}
        >
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="font-heading text-base font-semibold text-foreground">
              Supprimer {selectedIds.size} photo{selectedIds.size > 1 ? "s" : ""} ?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">Cette action est irréversible.</p>
            {bulkDeleteError && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {bulkDeleteError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Suppression…</>
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Modifier la photo
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isEditSaving}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-4 aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={editingPhoto.blob_url}
                alt={editingPhoto.alt_text}
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-foreground" htmlFor="edit-alt-text">
                Légende / description
              </label>
              <input
                id="edit-alt-text"
                type="text"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                maxLength={255}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Description de la photo"
              />
            </div>

            {editError && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {editError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isEditSaving}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={isEditSaving || !editAltText.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isEditSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
