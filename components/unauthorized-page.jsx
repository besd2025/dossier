"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert, Sparkles, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BESD_ROLES_CONFIG,
  DEMO_ACCOUNTS,
  normalizePathname,
  ROUTE_PERMISSIONS,
} from "@/config/permissions";
import { useSessionStore } from "@/stores/session/session-store";

/**
 * Page et composant d'affichage « Accès non autorisé »
 * Rendu lorsqu'un utilisateur navigue vers une route interdite pour son profil.
 * Référence : Consigne 5 de la tâche « contrôle d'accès côté interface ».
 */
export function UnauthorizedPage({ pathname: propPathname, role: propRole }) {
  const currentRole = useSessionStore((s) => s.role);
  const currentUser = useSessionStore((s) => s.user);
  const setRole = useSessionStore((s) => s.setRole);

  const activeRole = propRole || currentRole;
  const currentAccount =
    DEMO_ACCOUNTS.find((a) => a.role === activeRole) || DEMO_ACCOUNTS[0];

  const targetPath = normalizePathname(propPathname || "");
  const authorizedRoles = ROUTE_PERMISSIONS[targetPath] || [];

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl border-destructive/20 shadow-lg bg-card">
        <CardHeader className="text-center pb-3 pt-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3 ring-8 ring-destructive/5">
            <ShieldAlert className="size-7" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Badge
              variant="destructive"
              className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5"
            >
              Accès non autorisé (403)
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Accès restreint
          </CardTitle>
          <CardDescription className="max-w-md mx-auto text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Votre profil actuel ne dispose pas des droits requis pour consulter cet écran conformément à la matrice de sécurité BESD.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2 pb-6 text-xs">
          {/* Détails du profil connecté */}
          <div className="rounded-lg border bg-muted/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-mono block">
                Votre profil actif
              </span>
              <span className="font-semibold text-foreground text-sm">
                {currentAccount.label}
              </span>
              <span className="text-muted-foreground block text-[11px]">
                {currentUser?.prenom} {currentUser?.nom} — {currentAccount.cell}
              </span>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] self-start sm:self-center">
              {activeRole}
            </Badge>
          </div>

          {/* Profils habilités pour cette route */}
          {authorizedRoles.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <Lock className="size-3.5" />
                <span>Profils habilités pour cet écran :</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {authorizedRoles.map((r) => {
                  const cfg = BESD_ROLES_CONFIG[r];
                  return (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="text-[10px] bg-background border text-foreground"
                    >
                      {cfg?.label || r}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Raccourci de test en mode dev */}
          {process.env.NODE_ENV !== "production" && authorizedRoles.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <span className="text-[11px] font-semibold text-primary block">
                Astuce démonstration (Mode dev) :
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Basculez directement vers l&apos;un des comptes habilités pour débloquer cet écran :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {authorizedRoles.map((r) => {
                  const targetAcc = DEMO_ACCOUNTS.find((a) => a.role === r);
                  if (!targetAcc) return null;
                  return (
                    <Button
                      key={r}
                      variant="outline"
                      size="sm"
                      onClick={() => setRole(r)}
                      className="h-7 text-[11px] gap-1 bg-background hover:bg-primary/10"
                    >
                      <UserCheck className="size-3 text-primary" />
                      <span>{targetAcc.shortLabel}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4 bg-muted/20">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard" className="gap-1.5 text-xs">
              <ArrowLeft className="size-3.5" />
              <span>Retour au tableau de bord</span>
            </Link>
          </Button>

          <span className="text-[11px] text-muted-foreground font-mono">
            BESD v2.1 — Contrôle d&apos;accès
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}

export default UnauthorizedPage;
