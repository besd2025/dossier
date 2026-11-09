"use client";

import * as React from "react";
import {
  Clock,
  Download,
  FileCheck,
  FileCode,
  FileText,
  GitCompare,
  HardDrive,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * @typedef {Object} VersionItem
 * @property {string} id - Identifiant de la version
 * @property {number} numeroVersion - Numéro (1 pour V1, 2 pour V2...)
 * @property {string} [nomFichier] - Nom du document .docx
 * @property {string} [auteurNom] - Nom du rédacteur / modificateur
 * @property {string|Date} dateCreation - Date de dépôt
 * @property {string} [tailleFichier="145 Ko"] - Taille du fichier
 * @property {string} [commentaire] - Commentaire accompagnant le dépôt
 * @property {boolean} [isLatest=false] - Indique s'il s'agit de la dernière version active
 */

/**
 * @typedef {Object} VersionListProps
 * @property {VersionItem[]} versions - Liste chronologique des versions
 * @property {(version: VersionItem) => void} [onDownload] - Callback au téléchargement
 * @property {(v1: VersionItem, v2: VersionItem) => void} [onCompare] - Callback à la comparaison
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Liste des versions Word d'une note.
 * Conforme à la section 4.8 :
 * « Liste des versions (V1, V2, …) : auteur, date, taille, boutons Télécharger,
 * Comparer (désactivé / phase 2), badge « dernière version ». Base visuelle : File Manager. »
 *
 * @param {VersionListProps} props
 */
export function VersionList({
  versions = [],
  onDownload,
  onCompare,
  className,
}) {
  // Tri pour afficher la version la plus récente en tête
  const sortedVersions = React.useMemo(() => {
    return [...versions].sort((a, b) => b.numeroVersion - a.numeroVersion);
  }, [versions]);

  if (sortedVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20 text-center">
        <FileText className="size-8 text-muted-foreground/60 mb-1.5" />
        <span className="text-xs font-medium text-foreground">Aucune version déposée</span>
        <span className="text-[11px] text-muted-foreground mt-0.5">
          Déposez la première version Word (.docx) ci-dessous.
        </span>
      </div>
    );
  }

  const latestVersionNumber = sortedVersions[0]?.numeroVersion;

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="font-semibold text-foreground">
          Historique des versions ({sortedVersions.length})
        </span>
        <span className="text-[11px] font-mono">Format Word (.docx)</span>
      </div>

      <div className="space-y-2">
        {sortedVersions.map((version) => {
          const isLatest =
            version.isLatest !== undefined
              ? version.isLatest
              : version.numeroVersion === latestVersionNumber;

          return (
            <div
              key={version.id || version.numeroVersion}
              className={cn(
                "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all",
                isLatest
                  ? "border-primary/40 bg-primary/5 shadow-xs ring-1 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/30"
              )}
            >
              {/* Informations du fichier */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-2xs",
                    isLatest
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span className="font-bold text-xs font-mono">
                    V{version.numeroVersion}
                  </span>
                </div>

                <div className="flex flex-col min-w-0 gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {version.nomFichier || `Note_de_synthese_V${version.numeroVersion}.docx`}
                    </span>

                    {isLatest && (
                      <Badge
                        variant="default"
                        className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-medium"
                      >
                        Dernière version
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <User className="size-3 text-muted-foreground" />
                      {version.auteurNom || version.auteur || "Conseiller rédacteur"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      {formatDateTime(version.dateCreation)}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <HardDrive className="size-3 text-muted-foreground" />
                      {version.tailleFichier || "148 Ko"}
                    </span>
                  </div>

                  {/* Commentaire de version */}
                  {version.commentaire && (
                    <div className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground/90 italic bg-muted/40 rounded px-2 py-1 border border-border/40">
                      <MessageSquare className="size-3 shrink-0 mt-0.5 text-muted-foreground" />
                      <span>« {version.commentaire} »</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Télécharger & Comparer */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload?.(version)}
                  className="h-8 text-xs gap-1.5 bg-background shadow-2xs"
                >
                  <Download className="size-3.5 text-primary" />
                  <span>Télécharger</span>
                </Button>

                {/* Bouton Comparer (désactivé / phase 2 selon le cahier 4.8) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-8 text-xs gap-1.5 opacity-50 cursor-not-allowed"
                      >
                        <GitCompare className="size-3.5" />
                        <span className="hidden md:inline">Comparer</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Comparaison automatique Word prévue en Phase 2
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VersionList;

