"use client";

import * as React from "react";
import { Check, FlaskConical, ShieldAlert, Sparkles, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_ACCOUNTS } from "@/config/permissions";
import { useSessionStore } from "@/stores/session/session-store";

const emptySubscribe = () => () => {};

/**
 * Composant RoleSwitcher
 * Permet de basculer en un clic entre les 8 comptes de démonstration BESD.
 * Conforme à la consigne 5 de la section 0 :
 * « visible seulement en mode dev pour tester chaque profil sans authentification réelle ».
 */
export function RoleSwitcher() {
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
  const currentRole = useSessionStore((s) => s.role);
  const currentUser = useSessionStore((s) => s.user);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const setRole = useSessionStore((s) => s.setRole);

  if (process.env.NODE_ENV !== "development" || !isAuthenticated) {
    return null;
  }

  // Évite les sauts d'hydratation avant montage client
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs opacity-70">
        <FlaskConical className="size-3.5 text-amber-500 animate-pulse" />
        <span className="hidden sm:inline">Chargement profil...</span>
      </Button>
    );
  }

  const activeAccount = DEMO_ACCOUNTS.find((acc) => acc.role === currentRole);
  if (!activeAccount) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-foreground"
          title="Bascule de compte simulé (Mode développement)"
        >
          <FlaskConical className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold text-primary hidden md:inline">
            {activeAccount.shortLabel}
          </span>
          <span className="text-muted-foreground hidden lg:inline truncate max-w-[140px]">
            ({currentUser?.nom || activeAccount.user.nom})
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1 py-0 h-4 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none font-mono"
          >
            Dev
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-4 shrink-0" />
              <span>Profils simulés (8 comptes de démo)</span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
              Zustand
            </Badge>
          </DropdownMenuLabel>
          <p className="px-2 pb-2 text-[11px] leading-relaxed text-muted-foreground">
            Basculez de rôle pour tester instantanément le filtrage de la navigation et les droits d&apos;action.
          </p>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <div className="max-h-[360px] overflow-y-auto py-0.5 space-y-0.5">
          {DEMO_ACCOUNTS.map((account) => {
            const isSelected = currentRole === account.role;
            return (
              <DropdownMenuItem
                key={account.role}
                onClick={() => setRole(account.role)}
                className={`flex items-start justify-between gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      {account.label}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0 leading-tight">
                        Actif
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {account.rank}
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 font-mono">
                    {account.cell}
                  </span>
                </div>
                {isSelected && (
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>Choix persisté en mémoire locale</span>
          <span className="font-mono text-primary/80">BESD v2.1</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
