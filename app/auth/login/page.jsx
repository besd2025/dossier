"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_CONFIG } from "@/config/app-config";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <AppLogo className="size-12 rounded-xl mb-1" />
          <h1 className="text-xl font-bold tracking-tight">{APP_CONFIG.name}</h1>
          <p className="text-xs text-muted-foreground">
            Application de gestion des dossiers du BESD
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold">Connexion</CardTitle>
            <CardDescription className="text-xs">
              Veuillez saisir vos identifiants professionnels pour accéder à l&apos;application.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Identifiant ou Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="prenom.nom@defense.gouv"
                    defaultValue="chef.bureau@besd.defense.gouv"
                    className="pl-9 text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                  <Button variant="link" size="sm" type="button" className="h-auto p-0 text-[11px] text-muted-foreground hover:text-primary">
                    Mot de passe oublié ?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    defaultValue="••••••••••••"
                    className="pl-9 text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox id="remember" defaultChecked />
                <label
                  htmlFor="remember"
                  className="text-xs text-muted-foreground leading-none cursor-pointer"
                >
                  Se souvenir de moi
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full text-xs h-9 gap-1.5 font-medium">
                <span>Se connecter</span>
                <ArrowRight className="size-3.5" />
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Accès réservé aux personnels habilités</span>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Ministère des Armées — BESD &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
