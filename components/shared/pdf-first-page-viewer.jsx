"use client";

import * as React from "react";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  RotateCw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} PdfFirstPageViewerProps
 * @property {string} [src="/sample-document.pdf"] - URL du fichier PDF numérisé
 * @property {string} [title="Première page numérisée"] - Titre du document
 * @property {string} [reference] - Référence du dossier ou numéro officiel de la note
 * @property {boolean} [showNotice=true] - Affiche la mention obligatoire « Seule la première page est numérisée »
 * @property {boolean} [allowDownload=true] - Affiche le bouton de téléchargement
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Visionneuse simple de première page de document PDF (Dossier ou Note signée).
 * Conforme aux sections 4.4, 4.5 et 4.11 :
 * « Seule la première page est numérisée ».
 *
 * @param {PdfFirstPageViewerProps} props
 */
export function PdfFirstPageViewer({
  src = "/sample-document.pdf",
  title = "Première page numérisée",
  reference,
  showNotice = true,
  allowDownload = true,
  className,
}) {
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 180));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col rounded-xl border bg-card overflow-hidden shadow-xs transition-all",
        isFullscreen ? "p-4 bg-background fixed inset-0 z-50 rounded-none border-none" : "",
        className
      )}
    >
      {/* En-tête de la visionneuse avec outils */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground">{title}</span>
            {reference && (
              <Badge variant="outline" className="text-[10px] font-mono h-4 px-1 bg-background">
                {reference}
              </Badge>
            )}
          </div>
        </div>

        {/* Barre d'outils (Zoom, Rotation, Téléchargement, Plein écran) */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-md border bg-background p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="size-6 p-0 h-6"
              title="Zoom arrière"
              disabled={zoom <= 60}
            >
              <ZoomOut className="size-3" />
            </Button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 text-[10px] font-mono hover:text-primary transition-colors tabular-nums"
              title="Réinitialiser l'affichage"
            >
              {zoom}%
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="size-6 p-0 h-6"
              title="Zoom avant"
              disabled={zoom >= 180}
            >
              <ZoomIn className="size-3" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRotate}
            className="size-7 p-0 h-7"
            title="Pivoter de 90°"
          >
            <RotateCw className="size-3" />
          </Button>

          {allowDownload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-7 px-2 text-xs gap-1"
              title="Télécharger la première page"
            >
              <a href={src} download="premiere-page-besd.pdf" target="_blank" rel="noreferrer">
                <Download className="size-3" />
                <span className="hidden sm:inline">Télécharger</span>
              </a>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="size-7 p-0 h-7"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Mention réglementaire obligatoire */}
      {showNotice && (
        <div className="flex items-center justify-between gap-2 bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Eye className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Mention officielle : Seule la première page est numérisée.</span>
          </div>
          <span className="text-[10px] text-muted-foreground hidden md:inline">
            Document papier archivé au secrétariat
          </span>
        </div>
      )}

      {/* Cadre de visualisation de la première page */}
      <div className="relative flex-1 min-h-[380px] max-h-[640px] bg-muted/20 overflow-auto p-4 flex items-center justify-center">
        <div
          className="transition-transform duration-200 shadow-md border rounded-md bg-white dark:bg-zinc-900 overflow-hidden"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
            width: "595px",
            height: "842px",
            maxWidth: "100%",
          }}
        >
          <iframe
            src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
            title={title}
            className="w-full h-full border-none pointer-events-auto"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

export default PdfFirstPageViewer;

