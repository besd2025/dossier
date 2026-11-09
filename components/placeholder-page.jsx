import Link from "next/link";
import { ArrowLeft, Clock, Construction, FolderOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

/**
 * Composant placeholder « En construction »
 * @param {{
 *   title: string,
 *   description?: string,
 *   breadcrumb?: Array<{ label: string, href?: string }>,
 *   icon?: any,
 *   code?: string
 * }} props
 */
export function PlaceholderPage({
  title,
  description = "Cet écran est actuellement en cours de développement selon les spécifications BESD v2.1.",
  breadcrumb = [],
  icon: Icon = Construction,
  code,
}) {
  const today = formatDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Accueil
        </Link>
        {breadcrumb.map((item, index) => (
          <span key={item.label || index} className="flex items-center gap-1.5">
            <span>/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1 text-xs">
              <Construction className="size-3" />
              <span>En construction</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>Date : {today}</span>
        </div>
      </div>

      {/* Carte d'information / état placeholder */}
      <Card className="border-dashed bg-muted/20">
        <CardHeader className="text-center pb-2 pt-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Icon className="size-7" />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="max-w-md mx-auto text-xs mt-1">
            Les fonctionnalités de cet écran (tableaux, formulaires et actions) seront implémentées dans la prochaine étape.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-10 pt-4">
          {code && (
            <p className="text-xs font-mono text-muted-foreground mb-4">
              Référence écran : {code}
            </p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard" className="gap-1.5 text-xs">
              <ArrowLeft className="size-3.5" />
              <span>Retour au tableau de bord</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

