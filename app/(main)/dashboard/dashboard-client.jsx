"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  FileClock,
  FileSignature,
  FolderInput,
  FolderOpen,
  MailCheck,
  MessageSquareWarning,
  PackageCheck,
  RefreshCw,
  Stamp,
  Undo2,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  EmptyState,
  ErrorState,
  OverdueIndicator,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getKpis } from "@/lib/services";
import { useSessionStore } from "@/stores/session/session-store";
import { Role, StatutDossier } from "@/types";

const CHART_COLORS = ["#2563eb", "#4f46e5", "#0f766e", "#d97706", "#7c3aed", "#64748b"];
const STATUS_COLORS = {
  [StatutDossier.RECU]: "#2563eb",
  [StatutDossier.EN_TRAITEMENT]: "#4f46e5",
  [StatutDossier.EN_ATTENTE_AUTRE_BUREAU]: "#d97706",
  [StatutDossier.TRANSMIS]: "#059669",
  [StatutDossier.ACTIF_APRES_RETOUR]: "#7c3aed",
  [StatutDossier.CLOTURE]: "#64748b",
};

const ROLE_LABELS = {
  [Role.SECRETARIAT]: "Vue du secrétariat",
  [Role.CHEF_BUREAU]: "Vue complète du BESD",
  [Role.CHEF_BUREAU_ADJOINT]: "Vue complète du BESD",
  [Role.CHEF_CELLULE]: "Vue de votre cellule",
  [Role.CHEF_CELLULE_ADJOINT]: "Vue de votre cellule",
  [Role.CONSEILLER]: "Votre activité",
  [Role.CONSEILLER_HORS_CELLULE]: "Votre activité",
  [Role.COMPTABLE]: "Votre activité",
};

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "quarter", label: "Trimestre en cours" },
  { value: "custom", label: "Période personnalisée" },
];

function getDashboardCards(role, kpis) {
  const cards = [];
  const add = (title, value, description, icon, tone = "default", href) => {
    cards.push({ title, value, description, icon, tone, href });
  };
  if (role === Role.SECRETARIAT) {
    add("Dossiers reçus à affecter", kpis.dossiersAffecter, "Enregistrés et en attente d'affectation", FolderInput, "blue", "/a-affecter");
    add("Notes imprimées à cacheter", kpis.notesImprimeesAchetter, "En attente d'un cachet officiel", Stamp, "amber", "/secretariat/cachets");
    add("Projets de lettre à récupérer", kpis.lettresARecuperer, "Signés, en attente de récupération au cabinet", MailCheck, "violet", "/secretariat/cachets");
    add("Retours du cabinet enregistrés", kpis.retoursEnregistres, "Cycles de retour dans le périmètre BESD", Undo2, "teal", "/retours-cabinet");
  } else if ([Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role)) {
    add("Dossiers en cours", kpis.dossiersEnCours, "Dossiers actifs au bureau", FolderOpen, "blue", "/dossiers");
    add("Dossiers en retard", kpis.dossiersEnRetard, "Plus de 7 jours sans avancement", AlertTriangle, "red", "/dossiers");
    add("Dossiers traités", kpis.dossiersTraites, "Sur la période sélectionnée", PackageCheck, "green", "/dossiers");
    add("Notes à valider", kpis.notesAValider, "En relecture bureau ou cellule", FileCheck2, "violet", "/signatures");
    add("Notes en signature", kpis.notesEnSignature, "Validées, à imprimer ou signer", FileSignature, "amber", "/signatures");
  } else if ([Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role)) {
    add("Dossiers de la cellule", kpis.totalDossiers, "Dossiers dans votre périmètre", BriefcaseBusiness, "blue", "/dossiers");
    add("Dossiers en retard", kpis.dossiersEnRetard, "Hors temps passé chez un autre bureau", AlertTriangle, "red", "/dossiers");
    add("Notes à relire", kpis.notesARevoir, "En attente de relecture", FileClock, "violet", "/relectures");
    add("Dossiers à affecter", kpis.notesAffecteesConseillers, "À confier aux conseillers", Users, "amber", "/a-affecter");
    add("Dossiers traités", kpis.dossiersTraites, "Sur la période sélectionnée", PackageCheck, "green", "/dossiers");
  } else {
    add("Mes dossiers", kpis.mesDossiers, "Dossiers qui vous sont confiés", FolderOpen, "blue", "/mes-dossiers");
    add("Notes en cours", kpis.mesNotesEnCours, "Notes non signées ou non transmises", FileCheck2, "violet", "/mes-dossiers");
    add("Observations à traiter", kpis.observationsATraiter, "Observations non résolues", MessageSquareWarning, "amber", "/mes-dossiers");
    add("Dossiers traités", kpis.dossiersTraites, "Sur la période sélectionnée", PackageCheck, "green", "/mes-dossiers");
    add("Dossiers en retard", kpis.dossiersEnRetard, "Plus de 7 jours sans avancement", AlertTriangle, "red", "/mes-dossiers");
  }
  return cards;
}

function KpiCard({ item }) {
  const Icon = item.icon;
  const iconTone = {
    default: "text-muted-foreground bg-muted",
    blue: "text-blue-700 bg-blue-500/10 dark:text-blue-300",
    amber: "text-amber-700 bg-amber-500/10 dark:text-amber-300",
    violet: "text-violet-700 bg-violet-500/10 dark:text-violet-300",
    teal: "text-teal-700 bg-teal-500/10 dark:text-teal-300",
    green: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
    red: "text-destructive bg-destructive/10",
  }[item.tone] || "text-muted-foreground bg-muted";

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="space-y-1">
          <CardDescription>{item.title}</CardDescription>
          <CardTitle className={`text-3xl tabular-nums ${item.tone === "red" && item.value ? "text-destructive" : ""}`}>
            {item.value}
          </CardTitle>
        </div>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconTone}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{item.description}</p>
        {item.href && (
          <Button variant="ghost" size="icon" className="size-7 shrink-0" asChild>
            <Link href={item.href} aria-label={`Ouvrir ${item.title}`}>
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ChartEmpty({ text }) {
  return (
    <div className="grid h-64 place-items-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StatusDistribution({ data }) {
  const visible = data.filter((item) => item.count > 0);
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Répartition des dossiers par statut</CardTitle>
        <CardDescription>Selon le périmètre de votre rôle</CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length ? (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.8fr)]">
            <div className="h-64 min-w-0" role="img" aria-label="Diagramme en anneau de la répartition des dossiers par statut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visible}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    strokeWidth={2}
                  >
                    {visible.map((item) => (
                      <Cell key={item.status} fill={STATUS_COLORS[item.status] || "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} dossier${value > 1 ? "s" : ""}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-col justify-center gap-2">
              {data.map((item) => (
                <li key={item.status} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: STATUS_COLORS[item.status] }} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ChartEmpty text="Aucun dossier dans ce périmètre." />
        )}
      </CardContent>
    </Card>
  );
}

function TreatedChart({ data, series }) {
  const hasData = data.some((row) => series.some((item) => row[item.key] > 0));
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Dossiers traités par période</CardTitle>
        <CardDescription>
          {series.length ? `Activité par ${series.length === 1 && series[0].label === "Mes traitements" ? "vous" : "cellule ou conseiller"}` : "Aucune activité dans la période sélectionnée"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 min-w-0" role="img" aria-label="Histogramme des dossiers traités par période et responsable">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Legend />
                {series.map((item, index) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    name={item.label}
                    fill={item.color || CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty text="Aucun dossier traité sur cette période." />
        )}
      </CardContent>
    </Card>
  );
}

function OverdueTable({ rows }) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Dossiers en retard</CardTitle>
          <CardDescription className="mt-1">Plus de 7 jours sans avancement, hors attente d&apos;un autre bureau</CardDescription>
        </div>
        <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
          {rows.length} dossier{rows.length > 1 ? "s" : ""}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-y bg-muted/40 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Référence</th>
                  <th scope="col" className="px-4 py-3 font-medium">Objet</th>
                  <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                  <th scope="col" className="px-4 py-3 font-medium">Responsable</th>
                  <th scope="col" className="px-4 py-3 font-medium">Sans avancement</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((dossier) => (
                  <tr key={dossier.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/dossiers/${dossier.id}`} className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline">
                        {dossier.reference}
                      </Link>
                    </td>
                    <td className="max-w-[22rem] truncate px-4 py-3">{dossier.objet}</td>
                    <td className="px-4 py-3"><StatusBadge status={dossier.statut} size="sm" /></td>
                    <td className="px-4 py-3">{dossier.responsable}</td>
                    <td className="px-4 py-3"><OverdueIndicator days={dossier.joursSansAvancement} compact showNormal={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={CheckCircle2}
              title="Aucun dossier en retard"
              description="Aucun dossier de votre périmètre ne dépasse le seuil de 7 jours."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardClient() {
  const role = useSessionStore((state) => state.role);
  const user = useSessionStore((state) => state.currentUser || state.user);
  const [period, setPeriod] = useState("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadKpis = useCallback(async () => {
    if (period === "custom" && (!dateFrom || !dateTo)) {
      setKpis(null);
      setLoading(false);
      setError("");
      return;
    }
    if (period === "custom" && dateFrom > dateTo) {
      setKpis(null);
      setLoading(false);
      setError("La date de début doit précéder la date de fin.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await getKpis({
        role,
        user,
        period,
        dateFrom,
        dateTo,
      });
      setKpis(result);
    } catch (loadError) {
      setError(loadError.message || "Impossible de charger les indicateurs.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, period, role, user]);

  useEffect(() => {
    const timer = window.setTimeout(loadKpis, 0);
    return () => window.clearTimeout(timer);
  }, [loadKpis, reloadKey]);

  const cards = useMemo(() => kpis ? getDashboardCards(role, kpis) : [], [kpis, role]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{ROLE_LABELS[role] || "Tableau de bord"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aperçu de l&apos;activité du Bureau d&apos;Études et de Stratégie de Défense.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="dashboard-period" className="text-xs font-medium text-muted-foreground">Période d&apos;activité</label>
            <select
              id="dashboard-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm"
            >
              {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {period === "custom" && (
            <>
              <div className="space-y-1">
                <label htmlFor="dashboard-date-from" className="text-xs font-medium text-muted-foreground">Du</label>
                <Input id="dashboard-date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 w-36" />
              </div>
              <div className="space-y-1">
                <label htmlFor="dashboard-date-to" className="text-xs font-medium text-muted-foreground">Au</label>
                <Input id="dashboard-date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 w-36" />
              </div>
            </>
          )}
          <Button type="button" variant="outline" size="icon" aria-label="Actualiser les indicateurs" disabled={loading} onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Tableau de bord indisponible"
          message="Les indicateurs n'ont pas pu être calculés à partir des données."
          error={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : loading ? (
        <div className="space-y-6" aria-label="Chargement du tableau de bord">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-muted" />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ) : period === "custom" && (!dateFrom || !dateTo) ? (
        <EmptyState
          icon={Activity}
          title="Choisissez une période"
          description="Renseignez les deux dates pour calculer les indicateurs personnalisés."
        />
      ) : kpis ? (
        <>
          <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((item) => <KpiCard key={item.title} item={item} />)}
          </section>

          <section aria-label="Graphiques d'activité" className="grid min-w-0 gap-4 xl:grid-cols-2">
            <StatusDistribution data={kpis.repartitionStatuts} />
            <TreatedChart data={kpis.dossiersTraitesParPeriode} series={kpis.seriesTraitement} />
          </section>

          <OverdueTable rows={kpis.dossiersEnRetardListe} />
        </>
      ) : null}
    </div>
  );
}
