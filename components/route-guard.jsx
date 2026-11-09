"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
  const currentRole = useSessionStore((s) => s.role);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, mounted, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <span className="text-sm text-muted-foreground">Vérification de la session…</span>
      </div>
    );
  }

  const isAllowed = canAccessRoute(currentRole, pathname);

  if (!isAllowed) {
    return <UnauthorizedPage pathname={pathname} role={currentRole} />;
  }

  return <>{children}</>;
}
