"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle, ImagePlus, Loader2, X } from "lucide-react";

type FileEntry = {
  file: File;
  preview: string;
  altText: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 10;

function isValidFile(file: File) {
  return ALLOWED_TYPES.has(file.type) && file.size > 0 && file.size <= MAX_BYTES;
}

export function UploadModal({
  open,
  onClose,
  onAllUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onAllUploaded: () => void;
}) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const slots = MAX_FILES - entries.length;
    if (slots <= 0) return;
    const incoming = Array.from(files)
      .filter(isValidFile)
      .slice(0, slots);
    if (incoming.length === 0) return;
    setEntries((prev) => [
      ...prev,
      ...incoming.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        altText: "",
        status: "pending" as const,
      })),
    ]);
  }

  function removeEntry(idx: number) {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[idx]!.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function updateAltText(idx: number, value: string) {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, altText: value } : e)),
    );
  }

  function handleClose() {
    if (isSubmitting) return;
    entries.forEach((e) => URL.revokeObjectURL(e.preview));
    setEntries([]);
    setProgress({ sent: 0, total: 0 });
    onClose();
  }

  async function handleSubmit() {
    const toUpload = entries.filter((e) => e.status !== "done");
    if (toUpload.length === 0) return;

    setIsSubmitting(true);
    setProgress({ sent: 0, total: toUpload.length });

    const updated = [...entries];

    for (let i = 0; i < updated.length; i++) {
      const entry = updated[i]!;
      if (entry.status === "done") continue;

      updated[i] = { ...entry, status: "uploading" };
      setEntries([...updated]);

      try {
        const fd = new FormData();
        fd.append("file", entry.file);
        fd.append("alt_text", entry.altText.trim());
        const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
        if (res.ok) {
          updated[i] = { ...entry, status: "done" };
        } else {
          const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
          updated[i] = {
            ...entry,
            status: "error",
            errorMsg: body.error ?? "Échec de l'upload",
          };
        }
      } catch {
        updated[i] = { ...entry, status: "error", errorMsg: "Erreur réseau" };
      }

      setEntries([...updated]);
      setProgress((p) => ({ ...p, sent: p.sent + 1 }));
    }

    setIsSubmitting(false);

    if (!updated.some((e) => e.status === "error")) {
      onAllUploaded();
    }
  }

  if (!open) return null;

  const pendingEntries = entries.filter((e) => e.status !== "done");
  const allPendingAltFilled = pendingEntries.every((e) => e.altText.trim().length > 0);
  const doneCount = entries.filter((e) => e.status === "done").length;
  const errorCount = entries.filter((e) => e.status === "error").length;
  const hasPending = pendingEntries.length > 0;
  const canSubmit = !isSubmitting && hasPending && allPendingAltFilled;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Ajouter des photos
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Drop zone */}
          {!isSubmitting && entries.length < MAX_FILES && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                Glissez vos photos ici
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG ou WebP · max 10 Mo · jusqu'à{" "}
                {MAX_FILES - entries.length} fichier
                {MAX_FILES - entries.length > 1 ? "s" : ""}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* Progress */}
          {isSubmitting && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-foreground">
                {progress.sent} / {progress.total} photo
                {progress.total > 1 ? "s" : ""} uploadée
                {progress.total > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* File previews */}
          {entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={entry.preview}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                        {entry.file.name}
                      </p>
                      {entry.status === "done" && (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                      )}
                      {entry.status === "uploading" && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      )}
                      {entry.status === "error" && (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {entry.errorMsg}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Description de la photo (obligatoire)"
                      maxLength={100}
                      value={entry.altText}
                      onChange={(e) => updateAltText(idx, e.target.value)}
                      disabled={isSubmitting || entry.status === "done"}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                    />
                  </div>

                  {!isSubmitting && entry.status !== "done" && (
                    <button
                      type="button"
                      onClick={() => removeEntry(idx)}
                      aria-label="Retirer"
                      className="self-start rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {!isSubmitting && entries.length > 0 && (
              <>
                {doneCount > 0 && (
                  <span className="text-green-700">
                    {doneCount} réussie{doneCount > 1 ? "s" : ""}{" "}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-destructive">
                    {errorCount} échec{errorCount > 1 ? "s" : ""}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Annuler
            </button>

            {hasPending && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upload en cours…
                  </>
                ) : errorCount > 0 ? (
                  "Réessayer les échecs"
                ) : (
                  `Publier ${entries.length > 1 ? `${entries.length} photos` : "la photo"}`
                )}
              </button>
            )}

            {!hasPending && doneCount > 0 && (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
