"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} ErrorStateProps
 * @property {string} [title="Erreur de chargement"] - Titre de l'erreur
 * @property {string} [message="Impossible de récupérer les informations demandées."] - Description utilisateur
 * @property {Error | string} [error] - Détail technique de l'erreur
 * @property {() => void} [onRetry] - Fonction de réessai
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * État d'erreur standardisé pour les écrans et composants BESD.
 *
 * @param {ErrorStateProps} props
 */
export function ErrorState({
  title = "Erreur de chargement",
  message = "Une anomalie s'est produite lors de la récupération des données.",
  error,
  onRetry,
  className,
}) {
  const errorMessage =
    typeof error === "string" ? error : error?.message || null;

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3 ring-6 ring-destructive/5">
        <AlertCircle className="size-6" />
      </div>

      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <p className="max-w-md text-xs text-muted-foreground mt-1 leading-relaxed">
        {message}
      </p>

      {errorMessage && (
        <pre className="mt-2.5 max-w-lg rounded-md bg-muted/60 p-2 font-mono text-[11px] text-destructive/90 overflow-x-auto text-left">
          {errorMessage}
        </pre>
      )}

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 h-8 text-xs gap-1.5 border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="size-3.5" />
          <span>Réessayer</span>
        </Button>
      )}
    </div>
  );
}

export default ErrorState;

