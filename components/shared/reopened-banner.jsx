"use client";

import * as React from "react";
import {
  AlertOctagon,
  ArrowRight,
  ExternalLink,
  FileCheck2,
  FileText,
  History,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * @typedef {Object} ReouvertureData
 * @property {string} motif - Motif obligatoire de la réouverture
 * @property {string} [autorisePar] - Autorité ayant autorisé (ex: Chef de bureau)
 * @property {string|Date} [date] - Date de réouverture
 * @property {number} [versionOrigineNumero] - Numéro de la version signée originale
 * @property {string} [versionOrigineFichierUrl] - Lien vers la version signée archivée
 */

/**
 * @typedef {Object} ReopenedBannerProps
 * @property {Object} [note] - Objet note contenant statut et réouverture
 * @property {ReouvertureData} [reouverture] - Détails de la réouverture
 * @property {() => void} [onViewOriginalVersion] - Action d'ouverture de la version signée archivée
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Bandeau d'avertissement persistant pour les notes rouvertes après signature.
 * Conforme aux sections 4.8 et 4.13 de docs/BESD_structure_interfaces.md :
 * « Bandeau d'avertissement rouge persistant si la note a été rouverte après signature,
 * avec lien vers la version signée d'origine et rappel de conservation. »
 *
 * @param {ReopenedBannerProps} props
 */
export function ReopenedBanner({
  note,
  reouverture: propReouverture,
  onViewOriginalVersion,
  className,
}) {
  const data = propReouverture || note?.reouverture || {
    motif: "Correction demandée sur les annexes financières suite aux échanges avec le cabinet.",
    autorisePar: "Colonel Alexandre Martin (Chef de bureau)",
    date: new Date().toISOString(),
    versionOrigineNumero: 1,
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative rounded-xl border border-destructive/40 bg-destructive/10 p-4 shadow-sm text-destructive dark:bg-destructive/15 space-y-3",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow-2xs">
            <AlertOctagon className="size-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-foreground">
                Note rouverte après signature officielle
              </span>
              <Badge
                variant="destructive"
                className="text-[10px] uppercase font-mono px-1.5 py-0 h-4.5"
              >
                Procédure exceptionnelle
              </Badge>
            </div>

            <p className="text-xs text-foreground/90 font-medium">
              Motif : « {data.motif} »
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
              {data.autorisePar && (
                <span>
                  Autorisée par : <strong>{data.autorisePar}</strong>
                </span>
              )}
              {data.date && (
                <span>
                  Le : <strong>{formatDateTime(data.date)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bouton vers la version signée d'origine */}
        {onViewOriginalVersion && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onViewOriginalVersion}
            className="h-8 text-xs gap-1.5 shrink-0 border-destructive/30 hover:bg-destructive/10 text-foreground bg-background"
          >
            <FileCheck2 className="size-3.5 text-destructive" />
            <span>Voir version signée V{data.versionOrigineNumero || 1}</span>
            <ArrowRight className="size-3" />
          </Button>
        )}
      </div>

      {/* Règle de conservation légale du cahier des charges */}
      <div className="rounded-lg border border-destructive/20 bg-background/60 p-2.5 text-[11px] text-muted-foreground leading-relaxed flex items-center justify-between gap-2">
        <span>
          <strong>Règle de traçabilité :</strong> La version signée d&apos;origine est intégralement conservée aux archives. La nouvelle version issue de cette réouverture fera l&apos;objet de son propre circuit de relecture, validation, signature, numéro officiel et cachet.
        </span>
      </div>
    </div>
  );
}

export default ReopenedBanner;
