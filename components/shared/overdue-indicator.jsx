"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} OverdueIndicatorProps
 * @property {number} [days] - Nombre de jours sans avancement
 * @property {Object} [dossier] - Objet dossier (extrait automatiquement joursSansAvancement)
 * @property {number} [threshold=7] - Seuil d'alerte en jours (défaut 7 jours)
 * @property {boolean} [compact=false] - Format court (icône + chiffre)
 * @property {boolean} [showNormal=true] - Affiche aussi l'indicateur lorsque le dossier est dans les temps
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Indicateur visuel de retard sur les dossiers sans avancement.
 * Conforme aux sections 4.3 et 5 de docs/BESD_structure_interfaces.md :
 * « Jours sans avancement (rouge au-delà de 7 jours). »
 *
 * @param {OverdueIndicatorProps} props
 */
export function OverdueIndicator({
  days: propDays,
  dossier,
  threshold = 7,
  compact = false,
  showNormal = true,
  className,
}) {
  const days = propDays !== undefined ? propDays : dossier?.joursSansAvancement ?? 0;
  const isOverdue = days > threshold || dossier?.enRetard === true;

  const tooltipText = isOverdue
    ? `Dossier en retard : ${days} jour(s) sans avancement (seuil d'alerte : ${threshold} jours).`
    : `Dossier dans les délais : ${days} jour(s) écoulé(s) depuis le dernier mouvement.`;

  if (!isOverdue && !showNormal) {
    return null;
  }

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 text-xs select-none font-mono tabular-nums transition-colors",
        isOverdue
          ? "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20 font-bold animate-pulse"
          : "border-border bg-muted/40 text-muted-foreground font-normal",
        compact ? "px-1.5 py-0 h-4.5 text-[10px]" : "px-2 py-0.5 h-5",
        className
      )}
    >
      {isOverdue ? (
        <AlertTriangle className={cn("shrink-0", compact ? "size-2.5" : "size-3 text-destructive")} />
      ) : (
        <Clock className={cn("shrink-0 text-muted-foreground", compact ? "size-2.5" : "size-3")} />
      )}

      {compact ? (
        <span>{days}j</span>
      ) : (
        <span>
          {isOverdue ? `En retard (${days} j)` : `${days} j sans avancement`}
        </span>
      )}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help">{badgeContent}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <div className="flex items-center gap-1.5">
          {isOverdue ? (
            <AlertCircle className="size-3.5 text-destructive shrink-0" />
          ) : (
            <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
          )}
          <span>{tooltipText}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default OverdueIndicator;

