"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { STATUT_DOSSIER_CONFIG, STATUT_NOTE_CONFIG } from "@/config/statuses";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} StatusBadgeProps
 * @property {"dossier" | "note"} [type="dossier"] - Type d'entité dont on affiche le statut
 * @property {string} status - Clé de statut (StatutDossier ou StatutNote)
 * @property {"sm" | "default" | "lg"} [size="default"] - Taille du badge
 * @property {boolean} [showIcon=true] - Affiche l'icône associée
 * @property {boolean} [showDot=false] - Affiche une puce colorée
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Composant réutilisable pour afficher un badge de statut harmonisé (Dossier ou Note).
 * Conforme à la section 5 de docs/BESD_structure_interfaces.md.
 *
 * @param {StatusBadgeProps} props
 */
export function StatusBadge({
  type = "dossier",
  status,
  size = "default",
  showIcon = true,
  showDot = false,
  className,
}) {
  const configMap = type === "note" ? STATUT_NOTE_CONFIG : STATUT_DOSSIER_CONFIG;
  const config = configMap[status] || {
    label: status || "Inconnu",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
    icon: null,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0 h-4.5 gap-1 font-medium",
    default: "text-xs px-2 py-0.5 h-5.5 gap-1.5 font-medium",
    lg: "text-sm px-2.5 py-1 h-7 gap-2 font-semibold",
  }[size] || "text-xs px-2 py-0.5 gap-1.5";

  const iconSizes = {
    sm: "size-3",
    default: "size-3.5",
    lg: "size-4",
  }[size] || "size-3.5";

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center rounded-md border tracking-tight transition-colors whitespace-nowrap shadow-xs select-none",
        config.badgeClass,
        sizeClasses,
        className
      )}
      title={`${type === "note" ? "Statut note" : "Statut dossier"} : ${config.label}`}
    >
      {showDot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", config.dotClass)}
          aria-hidden="true"
        />
      )}
      {showIcon && Icon && (
        <Icon className={cn(iconSizes, "shrink-0")} aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

export default StatusBadge;

