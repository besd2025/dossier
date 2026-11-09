"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { evaluatePermission } from "@/config/permissions";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session/session-store";

/**
 * Composant de contrôle d'accès conditionnel PermissionGate
 *
 * Conforme à la règle 4.5 et consigne 4 :
 * « Composant PermissionGate à trois modes : afficher, désactiver avec infobulle (« Prise en charge requise »), masquer. »
 *
 * @param {Object} props
 * @param {string} props.ability - Capacité testée (ex: "signer", "valider", "affecter", "imprimer", etc.)
 * @param {string} [props.role] - Rôle explicite (optionnel, utilise par défaut le rôle actif du store)
 * @param {Object} [props.context] - Contexte d'évaluation { dossier, dossierId, note, user }
 * @param {"afficher"|"desactiver"|"masquer"|"show"|"disable"|"hide"} [props.mode="desactiver"] - Mode d'affichage si non autorisé
 * @param {string} [props.tooltip] - Message d'infobulle personnalisé en mode désactivé
 * @param {React.ReactNode} [props.fallback=null] - Élément de remplacement en mode masquer
 * @param {React.ReactNode} props.children - Élément à protéger
 */
export function PermissionGate({
  ability,
  role: explicitRole,
  context,
  mode = "desactiver",
  tooltip,
  fallback = null,
  children,
}) {
  const currentRole = useSessionStore((s) => s.role);
  const currentUser = useSessionStore((s) => s.user);

  const activeRole = explicitRole || currentRole;
  const evaluationContext = React.useMemo(() => {
    return {
      user: currentUser,
      ...context,
    };
  }, [currentUser, context]);

  const evaluation = React.useMemo(() => {
    return evaluatePermission(activeRole, ability, evaluationContext);
  }, [activeRole, ability, evaluationContext]);

  // Si l'action est autorisée, rendre le composant normalement
  if (evaluation.allowed) {
    return <>{children}</>;
  }

  // Normalisation du mode
  const normalizedMode = mode.toLowerCase();

  // Mode 1 : Afficher quand même
  if (normalizedMode === "afficher" || normalizedMode === "show") {
    return <>{children}</>;
  }

  // Mode 2 : Masquer complètement
  if (normalizedMode === "masquer" || normalizedMode === "hide") {
    return <>{fallback}</>;
  }

  // Mode 3 : Désactiver avec infobulle (Défaut pour la règle des adjoints 4.5)
  const tooltipMessage =
    tooltip || evaluation.reason || "Prise en charge requise";

  // Si l'enfant est un élément React valide (ex: <Button>), on le clone avec disabled
  if (React.isValidElement(children)) {
    const disabledChild = React.cloneElement(children, {
      disabled: true,
      "aria-disabled": "true",
      tabIndex: -1,
      className: cn(
        children.props.className,
        "opacity-60 cursor-not-allowed pointer-events-none select-none"
      ),
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
    });

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex cursor-not-allowed items-center"
            tabIndex={0}
            role="button"
            aria-disabled="true"
          >
            {disabledChild}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
            <span>{tooltipMessage}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Si c'est un fragment ou texte
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex cursor-not-allowed opacity-60 text-muted-foreground"
          tabIndex={0}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
          <span>{tooltipMessage}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Hook utilitaire pour tester une capacité directement dans la logique d'un composant
 * @param {string} ability
 * @param {Object} [context]
 * @returns {{ allowed: boolean, reason?: string, can: boolean }}
 */
export function usePermission(ability, context) {
  const role = useSessionStore((s) => s.role);
  const user = useSessionStore((s) => s.user);

  return React.useMemo(() => {
    const evaluation = evaluatePermission(role, ability, { user, ...context });
    return {
      ...evaluation,
      can: evaluation.allowed,
    };
  }, [role, user, ability, context]);
}

