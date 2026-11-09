"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FilePlus2,
  MessageSquareText,
  PencilLine,
} from "lucide-react";

import {
  DataTable,
  EmptyState,
  ErrorState,
  OverdueIndicator,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUT_NOTE_CONFIG } from "@/config/statuses";
import { getMyWorkItems } from "@/lib/services/notes-service";
import { useSessionStore } from "@/stores/session/session-store";
import { InstructionCabinet, TypeDocument } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = Object.freeze([
  { id: "draft", label: "À rédiger", icon: PencilLine },
  { id: "correction", label: "À corriger", icon: AlertTriangle },
  { id: "review", label: "En relecture", icon: ClipboardList },
  { id: "completed", label: "Terminés", icon: CheckCircle2 },
]);

const DOCUMENT_LABELS = Object.freeze({
  [TypeDocument.NOTE_CABINET_CIVIL]: "Note au Chef de cabinet civil",
  [TypeDocument.NOTE_PRESIDENT]: "Note au Président",
  [TypeDocument.PROJET_LETTRE]: "Projet de lettre",
});

const INSTRUCTION_LABELS = Object.freeze({
  [InstructionCabinet.POUR_ANALYSE]: "Pour analyse",
  [InstructionCabinet.POUR_ACTION]: "Pour action",
  [InstructionCabinet.POUR_TRAITEMENT]: "Pour traitement",
  [InstructionCabinet.POUR_CLASSEMENT]: "Pour classement",
  [InstructionCabinet.POUR_INFO]: "Pour information",
  [InstructionCabinet.POUR_SUIVI]: "Pour suivi",
  [InstructionCabinet.AUTRE]: "Autre",
});

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

export default function MesDossiersClient() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("draft");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cellFilter, setCellFilter] = useState("all");
  const [instructionFilter, setInstructionFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getMyWorkItems(user));
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger vos dossiers.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, reloadKey]);

  const tabItems = useMemo(() => items.filter((item) => item.workTab === tab), [items, tab]);
  const filteredItems = useMemo(
    () =>
      tabItems.filter((item) => {
        if (statusFilter !== "all" && item.statutNote !== statusFilter) return false;
        if (cellFilter !== "all" && !item.celluleIds?.includes(cellFilter)) return false;
        if (instructionFilter !== "all" && item.instructionCabinet !== instructionFilter) return false;
        return !overdueOnly || item.daysWithoutProgress > 7 || item.dossier?.enRetard;
      }),
    [cellFilter, instructionFilter, overdueOnly, statusFilter, tabItems],
  );

  const summary = useMemo(
    () => ({
      draft: items.filter((item) => item.workTab === "draft").length,
      correction: items.filter((item) => item.workTab === "correction").length,
      review: items.filter((item) => item.workTab === "review").length,
      overdue: items.filter((item) => item.daysWithoutProgress > 7 || item.dossier?.enRetard).length,
    }),
    [items],
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "dossierReference",
        header: "Référence",
        cell: ({ row }) => {
          const item = row.original;
          const href = item.id?.startsWith("dossier-")
            ? `/dossiers/${item.dossierId}`
            : `/dossiers/${item.dossierId}/notes/${item.id}`;
          return (
            <Link
              href={href}
              onClick={(event) => event.stopPropagation()}
              className="font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {item.dossierReference}
            </Link>
          );
        },
      },
      {
        accessorKey: "dossierObject",
        header: "Objet",
        cell: ({ row }) => (
          <span className="block max-w-[20rem] truncate" title={row.original.dossierObject}>
            {row.original.dossierObject}
          </span>
        ),
      },
      {
        accessorKey: "typeDocument",
        header: "Type de document",
        cell: ({ row }) => DOCUMENT_LABELS[row.original.typeDocument] || "Note à rédiger",
      },
      {
        accessorKey: "statutNote",
        header: "Statut de la note",
        cell: ({ row }) =>
          row.original.statutNote ? (
            <StatusBadge type="note" status={row.original.statutNote} size="sm" />
          ) : (
            <span className="text-muted-foreground">Sans note</span>
          ),
      },
      {
        accessorKey: "nextAction",
        header: "Prochaine action",
      },
      {
        accessorKey: "assignedBy",
        header: "Assigné par / le",
        cell: ({ row }) => (
          <div className="min-w-28">
            <p>{row.original.assignedBy || "—"}</p>
            <p className="text-[11px] text-muted-foreground">{formatDate(row.original.assignedAt)}</p>
          </div>
        ),
      },
      {
        accessorKey: "daysWithoutProgress",
        header: "Sans avancement",
        cell: ({ row }) => <OverdueIndicator days={row.original.daysWithoutProgress} />,
      },
      {
        accessorKey: "unresolvedObservations",
        header: "Observations",
        cell: ({ row }) => (
          <span className={row.original.unresolvedObservations ? "font-semibold text-amber-700" : "text-muted-foreground"}>
            {row.original.unresolvedObservations}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions rapides",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const noteHref = item.id?.startsWith("dossier-")
            ? null
            : `/dossiers/${item.dossierId}/notes/${item.id}`;
          return (
            <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Ouvrir le dossier"
                title="Ouvrir le dossier"
                onClick={() => router.push(`/dossiers/${item.dossierId}`)}
              >
                <Eye className="size-4" />
              </Button>
              {noteHref && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Déposer une version"
                    title="Déposer une version"
                    onClick={() => router.push(`${noteHref}#versions`)}
                  >
                    <FilePlus2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Voir les observations"
                    title="Voir les observations"
                    onClick={() => router.push(`${noteHref}#observations`)}
                  >
                    <MessageSquareText className="size-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [router],
  );

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger aria-label="Filtrer par statut de note" className="h-8 w-44 text-xs">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {Object.entries(STATUT_NOTE_CONFIG).map(([status, config]) => (
            <SelectItem key={status} value={status}>{config.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={cellFilter} onValueChange={setCellFilter}>
        <SelectTrigger aria-label="Filtrer par cellule" className="h-8 w-40 text-xs">
          <SelectValue placeholder="Toutes les cellules" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les cellules</SelectItem>
          {[...new Map(items.flatMap((item) =>
            (item.assignedCells || []).map((cell) => [cell.id, cell])
          )).values()].map((cell) => (
            <SelectItem key={cell.id} value={cell.id}>{cell.code || cell.nom}</SelectItem>
          ))}
          {items.flatMap((item) => item.celluleIds || [])
            .filter((id, index, list) => id && list.indexOf(id) === index && !items.some((item) => item.assignedCells?.some((cell) => cell.id === id)))
            .map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={instructionFilter} onValueChange={setInstructionFilter}>
        <SelectTrigger aria-label="Filtrer par instruction du cabinet" className="h-8 w-44 text-xs">
          <SelectValue placeholder="Toutes les instructions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les instructions</SelectItem>
          {Object.values(InstructionCabinet).map((instruction) => (
            <SelectItem key={instruction} value={instruction}>
              {INSTRUCTION_LABELS[instruction] || instruction}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-2 text-xs">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(event) => setOverdueOnly(event.target.checked)}
          className="size-3.5 accent-primary"
        />
        En retard seulement
      </label>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes dossiers à traiter</h1>
        <p className="text-sm text-muted-foreground">
          Vos dossiers rédigés ou explicitement confiés, selon votre profil actif.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["draft", "Dossiers à rédiger", summary.draft, PencilLine],
          ["review", "En relecture", summary.review, ClipboardList],
          ["correction", "À corriger", summary.correction, MessageSquareText],
          ["overdue", "En retard", summary.overdue, AlertTriangle],
        ].map(([id, label, value, Icon]) => (
          <Card key={id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-3">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit sm:grid-cols-4">
          {TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id} className="gap-1.5 px-3 py-2 text-xs">
              {label}
              <span className="rounded-full bg-muted px-1.5 text-[10px]">
                {items.filter((item) => item.workTab === id).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <TableSkeleton columns={8} rows={5} />
        ) : error ? (
          <ErrorState
            title="Chargement impossible"
            message="Vos dossiers n'ont pas pu être récupérés."
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : !items.length ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucun dossier ne vous est assigné pour le moment"
            description="Les dossiers dont vous êtes le rédacteur ou le destinataire d'une affectation apparaîtront ici."
          />
        ) : !filteredItems.length ? (
          <EmptyState
            icon={ClipboardList}
            title={tabItems.length ? "Aucun dossier ne correspond aux filtres" : "Aucun dossier dans cet onglet"}
            description={tabItems.length ? "Modifiez les filtres pour afficher d'autres dossiers." : "Aucune action n'est attendue dans cette catégorie."}
          />
        ) : (
          <DataTable
            data={filteredItems}
            columns={columns}
            searchPlaceholder="Rechercher une référence ou un objet..."
            emptyMessage="Aucun dossier ne correspond à la recherche."
            filters={filters}
            showSelectionCount={false}
            onRowClick={(item) =>
              router.push(
                item.id?.startsWith("dossier-")
                  ? `/dossiers/${item.dossierId}`
                  : `/dossiers/${item.dossierId}/notes/${item.id}`
              )
            }
          />
        )}
      </Tabs>
    </div>
  );
}
