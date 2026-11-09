"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  MessageSquarePlus,
  Send,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatDateTime, getInitials } from "@/lib/utils";

/**
 * @typedef {Object} ObservationItem
 * @property {string} id - Identifiant de l'observation
 * @property {string} [auteurNom] - Nom de l'auteur
 * @property {string} [auteurRole] - Rôle de l'auteur
 * @property {string|Date} dateCreation - Date de publication
 * @property {string} texte - Contenu de la remarque
 * @property {boolean} resolue - Statut résolu
 * @property {string|Date} [dateResolution] - Date de résolution
 * @property {string} [resolueParNom] - Auteur de la résolution
 */

/**
 * @typedef {Object} ObservationThreadProps
 * @property {ObservationItem[]} observations - Liste des remarques
 * @property {(texte: string) => Promise<void>|void} [onAddObservation] - Callback à l'ajout
 * @property {(id: string, resolue: boolean) => Promise<void>|void} [onToggleResolve] - Callback au changement d'état
 * @property {boolean} [readOnly=false] - Mode lecture seule
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Fil de remarques courtes avec case de résolution et ajout rapide.
 * Conforme à la section 4.8 de docs/BESD_structure_interfaces.md.
 *
 * @param {ObservationThreadProps} props
 */
export function ObservationThread({
  observations = [],
  onAddObservation,
  onToggleResolve,
  readOnly = false,
  className,
}) {
  const [newText, setNewText] = React.useState("");
  const [filter, setFilter] = React.useState("ALL"); // "ALL", "PENDING", "RESOLVED"
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const filteredObservations = React.useMemo(() => {
    return observations.filter((obs) => {
      if (filter === "PENDING") return !obs.resolue;
      if (filter === "RESOLVED") return obs.resolue;
      return true;
    });
  }, [observations, filter]);

  const pendingCount = observations.filter((o) => !o.resolue).length;
  const resolvedCount = observations.filter((o) => o.resolue).length;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (onAddObservation) {
        await onAddObservation(newText.trim());
      }
      setNewText("");
      setSubmitError("");
    } catch (error) {
      setSubmitError(error?.message || "L'observation n'a pas pu être publiée.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* En-tête avec compteur et onglets de filtre */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <span className="font-semibold text-xs text-foreground">
            Observations et remarques ({observations.length})
          </span>
          {pendingCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono h-4 px-1.5"
            >
              {pendingCount} en suspens
            </Badge>
          )}
        </div>

        {/* Boutons de filtre */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors",
              filter === "ALL"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Toutes ({observations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("PENDING")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors",
              filter === "PENDING"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            En suspens ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("RESOLVED")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors",
              filter === "RESOLVED"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Résolues ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout rapide */}
      {!readOnly && (
        <form onSubmit={handleAddSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Rédiger une observation pour le rédacteur ou le chef de cellule..."
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Les participants au dossier seront notifiés de votre remarque.
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!newText.trim() || isSubmitting}
              className="h-7 text-xs gap-1.5 px-3"
            >
              <Send className="size-3" />
              <span>{isSubmitting ? "Publication..." : "Ajouter l'observation"}</span>
            </Button>
          </div>
          {submitError && (
            <p className="text-xs font-medium text-destructive" role="alert">
              {submitError}
            </p>
          )}
        </form>
      )}

      {/* Liste des observations */}
      {filteredObservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/20 text-center">
          <CheckCircle2 className="size-6 text-muted-foreground/60 mb-1" />
          <span className="text-xs font-medium text-foreground">
            {filter === "PENDING"
              ? "Toutes les observations ont été résolues !"
              : "Aucune observation dans ce dossier."}
          </span>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {filteredObservations.map((obs) => {
            const author = obs.auteurNom || obs.auteur || "Conseiller";
            return (
              <div
                key={obs.id}
                className={cn(
                  "p-3 rounded-lg border transition-all text-xs space-y-2",
                  obs.resolue
                    ? "bg-muted/30 border-border opacity-85"
                    : "bg-card border-border shadow-2xs"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6 bg-primary/10 text-primary">
                      <AvatarFallback className="text-[10px] font-semibold">
                        {getInitials(author)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground">{author}</span>
                        {obs.auteurRole && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({obs.auteurRole})
                          </span>
                        )}
                      </div>
                      <time
                        dateTime={obs.dateCreation}
                        className="text-[10px] text-muted-foreground font-mono"
                      >
                        {formatDateTime(obs.dateCreation)}
                      </time>
                    </div>
                  </div>

                  {/* Case à cocher résolue */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox
                      checked={obs.resolue}
                      onCheckedChange={(checked) =>
                        !readOnly && onToggleResolve?.(obs.id, Boolean(checked))
                      }
                      disabled={readOnly}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        obs.resolue
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {obs.resolue ? "Résolue" : "Marquer résolue"}
                    </span>
                  </label>
                </div>

                {/* Contenu de la remarque */}
                <p
                  className={cn(
                    "text-xs leading-relaxed pl-8",
                    obs.resolue && "text-muted-foreground line-through"
                  )}
                >
                  {obs.texte}
                </p>

                {/* Détails de résolution */}
                {obs.resolue && obs.dateResolution && (
                  <div className="pl-8 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="size-3" />
                    <span>
                      Résolue le {formatDateTime(obs.dateResolution)}
                      {obs.resolueParNom && ` par ${obs.resolueParNom}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ObservationThread;
