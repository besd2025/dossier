"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <AppLogo className="mb-1 size-12 rounded-xl" />
          <h1 className="text-xl font-bold tracking-tight">
            Application de gestion des dossiers du BESD
          </h1>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold">Mot de passe oublié</CardTitle>
            <CardDescription>
              La récupération du mot de passe n&apos;est pas activée dans cette démonstration.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="recovery-email">Adresse courriel</Label>
                <div className="relative">
                  <Mail aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    placeholder="prenom.nom@defense.gouv"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              {submitted && (
                <p role="status" className="text-sm text-muted-foreground">
                  Cette fonctionnalité est fictive : aucune demande n&apos;a été envoyée.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full">
                Demander un lien de réinitialisation
              </Button>
              <Link
                href="/auth/login"
                className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-primary underline-offset-4 outline-none transition-all hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Retour à la connexion
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
