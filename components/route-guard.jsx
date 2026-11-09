"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { canAccessRoute } from "@/config/permissions";
import { useSessionStore } from "@/stores/session/session-store";
import { UnauthorizedPage } from "./unauthorized-page";

const emptySubscribe = () => () => {};

/**
 * Gardien de route côté client pour le App Router
 * Vérifie si la route courante est autorisée pour le rôle simulé actif.
 * Si la route est interdite, affiche directement la page « Accès non autorisé ».
 */
export function RouteGuard({ children }) {
  const pathname = usePathname();
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
  const currentRole = useSessionStore((s) => s.role);

  // Pendant l'hydratation initiale, rendre les enfants sans flash
  if (!mounted) {
    return <>{children}</>;
  }

  const isAllowed = canAccessRoute(currentRole, pathname);

  if (!isAllowed) {
    return <UnauthorizedPage pathname={pathname} role={currentRole} />;
  }

  return <>{children}</>;
}
