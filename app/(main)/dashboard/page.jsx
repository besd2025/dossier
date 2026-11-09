import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, FileCheck2, Clock, Shield, CheckCircle2 } from "lucide-react";
import { getKpis } from "@/lib/services";

export const metadata = {
  title: "Tableau de bord — BESD",
};

export default async function DashboardPage() {
  const kpis = await getKpis();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          Aperçu de l&apos;activité du Bureau d&apos;Études et de Stratégie de Défense (BESD).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers en cours</CardTitle>
            <FolderOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.dossiersEnCours}</div>
            <p className="text-muted-foreground text-xs">Dossiers actifs au bureau</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard (&gt; 7 j)</CardTitle>
            <Clock className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis.dossiersEnRetard}</div>
            <p className="text-muted-foreground text-xs">Sans avancement récent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes à valider</CardTitle>
            <FileCheck2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.notesAValider}</div>
            <p className="text-muted-foreground text-xs">En attente de relecture/visa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En signature</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.notesEnSignature}</div>
            <p className="text-muted-foreground text-xs">Circuit d&apos;approbation</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <CardTitle>Portail BESD — Couche de données simulée opérationnelle</CardTitle>
          </div>
          <CardDescription>
            L&apos;ensemble des entités métier BESD v2.1 (dossiers, notes, versions, observations, utilisateurs, cellules) et leurs services async en mémoire sont initialisés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Total des dossiers mockés : <span className="font-semibold text-foreground">{kpis.totalDossiers} dossiers</span> (dont dossiers en attente d&apos;un autre bureau, retours du cabinet avec multiples cycles, notes rouvertes après signature, prises en charge actives et dossiers en retard &gt; 7 jours).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
