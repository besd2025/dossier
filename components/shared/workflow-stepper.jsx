"use client";

import * as React from "react";
import { Check, Clock, AlertTriangle, AlertOctagon } from "lucide-react";
import { StatutNote } from "@/types";
import { STATUT_NOTE_CONFIG, WORKFLOW_STEPS } from "@/config/statuses";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * @typedef {Object} WorkflowStepData
 * @property {string} status - Clé StatutNote
 * @property {string} [author] - Nom de l'auteur de l'action
 * @property {string | Date} [date] - Horodatage de l'action
 * @property {string} [comment] - Remarque ou mention
 */

/**
 * @typedef {Object} WorkflowStepperProps
 * @property {string} currentStatus - Statut courant de la note
 * @property {Record<string, { author?: string, date?: string|Date, comment?: string }>} [stepHistory] - Données d'auteur et date par statut
 * @property {boolean} [showReopenedBanner=false] - Affiche un avertissement si rouverte
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Stepper horizontal du circuit de validation de la note.
 * Conforme à la section 4.8 :
 * « Brouillon → Relecture cellule → Relecture bureau → Validée → Imprimée → Signée → Cachetée → Transmise.
 * L'étape courante est mise en évidence ; auteur et date sous chaque étape franchie. »
 *
 * @param {WorkflowStepperProps} props
 */
export function WorkflowStepper({
  currentStatus,
  stepHistory = {},
  showReopenedBanner = false,
  className,
}) {
  const isReopened = currentStatus === StatutNote.ROUVERTE;

  // Calcul de l'index de l'étape courante
  const effectiveStatus =
    currentStatus === StatutNote.EN_ATTENTE_IMPRESSION
      ? StatutNote.VALIDEE
      : currentStatus;
  const currentStepConfig = STATUT_NOTE_CONFIG[effectiveStatus];
  const currentIndex = isReopened ? 5 : currentStepConfig?.stepIndex ?? 0;

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Alerte si la note est rouverte */}
      {isReopened && showReopenedBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
          <AlertOctagon className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          <span className="font-semibold">
            Circuit suspendu : cette note a été rouverte après signature pour correction.
          </span>
        </div>
      )}

      {/* Stepper responsive avec scroll horizontal fluide */}
      <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <ol
          className="flex min-w-[760px] items-start justify-between relative px-2"
          role="list"
          aria-label="Étapes du circuit de traitement de la note"
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = !isReopened && index < currentIndex;
            const isCurrent = !isReopened && index === currentIndex;
            const isPending = !isReopened && index > currentIndex;
            const isReopenedStep = isReopened && index === 5;

            const history = stepHistory[step.id] || {};
            const author = history.author;
            const date = history.date;

            const Icon = step.icon;

            return (
              <li
                key={step.id}
                className="flex-1 relative flex flex-col items-center group text-center px-1"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Ligne de connexion entre les étapes */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-4 left-1/2 w-full h-[2px] -z-0 transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Pastille numérotée / Icône */}
                <div
                  className={cn(
                    "relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200 shadow-xs",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary ring-4 ring-primary/20 scale-110 font-bold",
                    isPending &&
                      "border-muted bg-muted/40 text-muted-foreground",
                    isReopenedStep &&
                      "border-red-500 bg-red-500 text-white ring-4 ring-red-500/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4 stroke-[2.5]" aria-hidden="true" />
                  ) : isReopenedStep ? (
                    <AlertTriangle className="size-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Libellé de l'étape */}
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={cn(
                      "text-xs font-medium tracking-tight",
                      isCurrent && "font-bold text-primary",
                      isCompleted && "text-foreground font-semibold",
                      isPending && "text-muted-foreground",
                      isReopenedStep && "text-red-600 dark:text-red-400 font-bold"
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Auteur et date sous chaque étape franchie */}
                  {(author || date) && (
                    <div className="mt-1 flex flex-col text-[10px] text-muted-foreground leading-tight max-w-[100px]">
                      {author && (
                        <span className="truncate font-medium text-foreground/80" title={author}>
                          {author}
                        </span>
                      )}
                      {date && (
                        <span className="font-mono text-muted-foreground/75">
                          {formatDateTime(date)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Statut En cours si pas d'historique */}
                  {isCurrent && !date && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary font-mono bg-primary/10 px-1.5 py-0.2 rounded-full">
                      <Clock className="size-2.5 animate-spin" />
                      En cours
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default WorkflowStepper;
