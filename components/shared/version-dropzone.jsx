"use client";

import * as React from "react";
import {
  FileUp,
  HardDrive,
  Info,
  Paperclip,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} VersionDropzoneProps
 * @property {(file: File, comment: string) => Promise<void>|void} [onUpload] - Callback déclenché lors du dépôt
 * @property {boolean} [disabled=false] - Désactive le dépôt
 * @property {boolean} [isUploading=false] - Indique un téléversement en cours
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Zone de dépôt glisser-déposer pour une nouvelle version Word (.docx).
 * Conforme à la section 4.8 :
 * « Zone de dépôt d'une nouvelle version (glisser-déposer .docx) avec champ de commentaire facultatif ;
 * aide : « Téléchargez la dernière version, travaillez-la dans Word avec le suivi des modifications, puis redéposez-la ». »
 *
 * @param {VersionDropzoneProps} props
 */
export function VersionDropzone({
  onUpload,
  disabled = false,
  isUploading = false,
  className,
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file) => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".docx")) {
      setError("Seuls les fichiers Word au format .docx sont autorisés.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || disabled || isUploading) return;

    try {
      if (onUpload) {
        await onUpload(selectedFile, comment);
      }
    } catch (uploadError) {
      setError(uploadError?.message || "Le dépôt du fichier a échoué. Réessayez.");
      return;
    }
    // Réinitialisation après succès
    setSelectedFile(null);
    setComment("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Ko";
    const k = 1024;
    const sizes = ["Octets", "Ko", "Mo"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <form id="version-dropzone-form" onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      {/* Zone de glisser-déposer */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Zone de dépôt de nouvelle version Word"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center",
          dragOver
            ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/20 bg-muted/5",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          selectedFile && "border-primary/50 bg-primary/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3 w-full max-w-md p-2.5 rounded-lg border bg-background shadow-xs">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Paperclip className="size-4.5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-semibold text-foreground truncate">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
              className="size-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
              title="Retirer ce fichier"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
              <UploadCloud className="size-6" />
            </div>
            <div className="text-xs font-semibold text-foreground">
              Glissez-déposez la nouvelle version Word (.docx)
            </div>
            <div className="text-[11px] text-muted-foreground">
              ou <span className="text-primary underline font-medium">parcourez vos fichiers</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">
              Format accepté : .docx (Max 25 Mo)
            </div>
          </div>
        )}
      </div>

      {/* Message d'erreur format */}
      {error && (
        <p className="text-xs text-destructive font-medium px-1">
          {error}
        </p>
      )}

      {/* Aide officielle BESD (Section 4.8) */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground leading-relaxed">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Méthode de travail :</strong> Téléchargez la dernière version disponible, travaillez-la dans Word en activant le suivi des modifications, puis redéposez-la ici.
        </span>
      </div>

      {/* Champ de commentaire facultatif */}
      {selectedFile && (
        <div className="space-y-1.5 pt-1">
          <label htmlFor="version-comment" className="text-xs font-medium text-foreground">
            Commentaire de version (facultatif) :
          </label>
          <textarea
            id="version-comment"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex : Prise en compte des remarques du Chef de cellule, correction du paragraphe 3..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={disabled || isUploading}
          />
        </div>
      )}

      {/* Bouton de confirmation du dépôt */}
      {selectedFile && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearFile}
            disabled={isUploading}
            className="h-8 text-xs"
          >
            Annuler
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={disabled || isUploading}
            className="h-8 text-xs gap-1.5"
          >
            <FileUp className="size-3.5" />
            <span>{isUploading ? "Dépôt en cours..." : "Déposer cette nouvelle version"}</span>
          </Button>
        </div>
      )}
    </form>
  );
}

export default VersionDropzone;
