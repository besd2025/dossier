"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Globe, Lock, Mail, ShieldCheck } from "lucide-react";

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
import { DEMO_ACCOUNTS } from "@/config/permissions";
import { getUtilisateurs } from "@/src/lib/services/utilisateurs-service";
import { useSessionStore } from "@/stores/session/session-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useSessionStore((state) => state.login);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const users = await getUtilisateurs({ activeOnly: true });
      const normalizedEmail = email.trim().toLowerCase();
      const demoIds = new Set(DEMO_ACCOUNTS.map((account) => account.user.id));
      const account = users.find(
        (user) => demoIds.has(user.id) && user.email.toLowerCase() === normalizedEmail,
      );
      if (!account) {
        setError("Cette adresse courriel ne correspond à aucun compte de démonstration actif.");
        return;
      }
      login(account, rememberMe);
      toast.success(`Bienvenue, ${account.prenom} ${account.nom}.`);
      router.replace("/dashboard");
    } catch (loginError) {
      setError(loginError.message || "La connexion n'a pas pu être effectuée.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <AppLogo className="mb-1 size-12 rounded-xl" />
          <h1 className="text-xl font-bold tracking-tight">
            Application de gestion des dossiers du BESD
          </h1>
          <p className="text-sm text-muted-foreground">
            Accès réservé aux personnels habilités.
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold">Connexion</CardTitle>
            <CardDescription>
              Saisissez votre adresse professionnelle et votre mot de passe.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Adresse courriel</Label>
                <div className="relative">
                  <Mail aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="prenom.nom@defense.gouv"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Link href="/auth/mot-de-passe-oublie" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                    Mot de passe oublié
                  </Link>
                </div>
                <div className="relative">
                  <Lock aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <label htmlFor="login-remember" className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="size-4 accent-primary"
                />
                Se souvenir de moi
              </label>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full gap-1.5" disabled={loading}>
                <span>{loading ? "Connexion…" : "Se connecter"}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
                <span>Connexion de démonstration sécurisée</span>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ministère des Armées — BESD © {new Date().getFullYear()}
        </p>
      </div> */}


<div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Login to your account</h1>
          <p className="text-muted-foreground text-sm">Please enter your details to login.</p>
        </div>
        <div className="space-y-4">
        
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">Or continue with</span>
          </div>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Adresse courriel</Label>
                <div className="relative">
                  <Mail aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="prenom.nom@defense.gouv"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Link href="/auth/mot-de-passe-oublie" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                    Mot de passe oublié
                  </Link>
                </div>
                <div className="relative">
                  <Lock aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <label htmlFor="login-remember" className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="size-4 accent-primary"
                />
                Se souvenir de moi
              </label>

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full gap-1.5" disabled={loading}>
                <span>{loading ? "Connexion…" : "Se connecter"}</span>
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
                <span>Connexion de démonstration sécurisée</span>
              </div>
            </CardFooter>
          </form>
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link prefetch={false} className="text-foreground" href="register">
            Register
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">Ministère des Armées — BESD © {new Date().getFullYear()}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="text-muted-foreground size-4" />
          ENG
        </div>
      </div>
    </>
  );
}
