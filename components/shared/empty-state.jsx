"use client";

import * as React from "react";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} EmptyStateAction
 * @property {string} label - Libellé du bouton
 * @property {() => void} [onClick] - Action au clic
 * @property {string} [href] - Lien de redirection
 * @property {React.ElementType} [icon] - Icône du bouton
 * @property {string} [variant="default"] - Variante visuelle du bouton
 */

/**
 * @typedef {Object} EmptyStateProps
 * @property {React.ElementType} [icon=FolderOpen] - Icône d'illustration
 * @property {string} [title="Aucun résultat"] - Titre de l'état vide
 * @property {string} [description="Aucun élément ne correspond aux critères."] - Description
 * @property {EmptyStateAction | React.ReactNode} [action] - Bouton ou composant d'action
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * État vide harmonisé pour les listes, tableaux et fiches du BESD.
 *
 * @param {EmptyStateProps} props
 */
export function EmptyState({
  icon: Icon = FolderOpen,
  title = "Aucun élément à afficher",
  description = "Aucune donnée n'est disponible pour le moment.",
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center transition-colors",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3 ring-6 ring-muted/50">
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground mt-1 leading-relaxed">
        {description}
      </p>

      {/* Action optionnelle */}
      {action && (
        <div className="mt-4">
          {React.isValidElement(action) ? (
            action
          ) : action?.href ? (
            <Button size="sm" asChild className="h-8 text-xs gap-1.5">
              <Link href={action.href}>
                {action.icon ? <action.icon className="size-3.5" /> : <Plus className="size-3.5" />}
                <span>{action.label}</span>
              </Link>
            </Button>
          ) : action?.onClick ? (
            <Button
              size="sm"
              onClick={action.onClick}
              variant={action.variant || "default"}
              className="h-8 text-xs gap-1.5"
            >
              {action.icon ? <action.icon className="size-3.5" /> : <Plus className="size-3.5" />}
              <span>{action.label}</span>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default EmptyState;

