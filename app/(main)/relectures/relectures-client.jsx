"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  MessageSquareText,
  Send,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/permission-gate";
import {
  DataTable,
  EmptyState,
  ErrorState,
  OverdueIndicator,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getReviewWorklist,
  transitionNoteWithObservation,
  updateNoteStatus,
} from "@/lib/services/notes-service";
import { useSessionStore } from "@/stores/session/session-store";
import { Role, StatutNote, TypeDocument } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = Object.freeze([
  { id: "toReview", label: "À relire" },
  { id: "returnedToAuthor", label: "Renvoyées en observation" },
  { id: "recentlyTreated", label: "Traitées récemment" },
]);

const DOCUMENT_LABELS = Object.freeze({
  [TypeDocument.NOTE_CABINET_CIVIL]: "Note au Chef de cabinet civil",
  [TypeDocument.NOTE_PRESIDENT]: "Note au Président",
  [TypeDocument.PROJET_LETTRE]: "Projet de lettre",
});

const ACTIONS = Object.freeze({
  SEND_TO_OFFICE: "SEND_TO_OFFICE",
  RETURN_TO_AUTHOR: "RETURN_TO_AUTHOR",
  SEND_IN_OBSERVATION: "SEND_IN_OBSERVATION",
});

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function downloadLatestVersion(item) {
  if (!item.latestVersion) return;
  const version = item.latestVersion;
  const contents = [
    "Fichier de démonstration BESD — document Word factice.",
    `Version : V${version.numeroVersion}`,
    `Fichier : ${version.nomFichier}`,
  ].join("\n");
  const file = new Blob([contents], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const href = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = href;
  link.download = version.nomFichier || `Note_V${version.numeroVersion}.docx`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function RelecturesClient() {
  const router = useRouter();
  const role = useSessionStore((state) => state.role);
  const user = useSessionStore((state) => state.user);
  const [worklist, setWorklist] = useState({
    toReview: [],
    returnedToAuthor: [],
    recentlyTreated: [],
  });
  const [tab, setTab] = useState("toReview");
  const [cellFilter, setCellFilter] = useState("all");
  const [writerFilter, setWriterFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWorklist(await getReviewWorklist(user));
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger les notes à relire.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, reloadKey]);

  const rows = useMemo(() => worklist[tab] || [], [tab, worklist]);
  const allRows = useMemo(
    () => [...worklist.toReview, ...worklist.returnedToAuthor, ...worklist.recentlyTreated],
    [worklist],
  );
  const filteredRows = useMemo(
    () =>
      rows.filter((item) => {
        if (cellFilter !== "all" && !item.celluleIds?.includes(cellFilter)) return false;
        if (writerFilter !== "all" && item.redacteurId !== writerFilter) return false;
        if (documentFilter !== "all" && item.typeDocument !== documentFilter) return false;
        return !overdueOnly || item.daysWaiting > 7;
      }),
    [cellFilter, documentFilter, overdueOnly, rows, writerFilter],
  );

  const summary = useMemo(
    () => ({
      waiting: worklist.toReview.length,
      overdue: worklist.toReview.filter((item) => item.daysWaiting > 7).length,
      returned: worklist.returnedToAuthor.length,
      treated: worklist.recentlyTreated.length,
    }),
    [worklist],
  );

  const openAction = useCallback((item, action) => {
    setSelectedAction({ item, action });
    setReason("");
  }, []);

  const performAction = useCallback(async (item, action, motif = "") => {
    if (working) return;
    const nextStatus =
      action === ACTIONS.SEND_TO_OFFICE
        ? StatutNote.RELECTURE_BUREAU
        : action === ACTIONS.RETURN_TO_AUTHOR
          ? StatutNote.BROUILLON
          : StatutNote.RELECTURE_CELLULE;
    setWorking(true);
    try {
      if (motif) {
        await transitionNoteWithObservation(item.id, nextStatus, motif, user.id);
      } else {
        await updateNoteStatus(item.id, nextStatus, user.id);
      }
      toast.success(
        action === ACTIONS.SEND_TO_OFFICE
          ? "La note a été transmise au Chef de bureau."
          : action === ACTIONS.RETURN_TO_AUTHOR
            ? "La note a été renvoyée au rédacteur avec le motif."
            : "La note a été renvoyée en observation."
      );
      setSelectedAction(null);
      setReason("");
      setReloadKey((key) => key + 1);
    } catch (actionError) {
      toast.error(actionError?.message || "L'action n'a pas pu être effectuée.");
    } finally {
      setWorking(false);
    }
  }, [user, working]);

  const confirmAction = () => {
    if (!selectedAction || !reason.trim()) return;
    return performAction(selectedAction.item, selectedAction.action, reason.trim());
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "dossierReference",
        header: "Référence",
        cell: ({ row }) => (
          <Link
            href={`/dossiers/${row.original.dossierId}/notes/${row.original.id}`}
            onClick={(event) => event.stopPropagation()}
            className="font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            {row.original.dossierReference}
          </Link>
        ),
      },
      {
        accessorKey: "dossierObject",
        header: "Objet",
        cell: ({ row }) => (
          <span className="block max-w-[18rem] truncate" title={row.original.dossierObject}>
            {row.original.dossierObject}
          </span>
        ),
      },
      {
        accessorKey: "typeDocument",
        header: "Type de document",
        cell: ({ row }) => DOCUMENT_LABELS[row.original.typeDocument] || row.original.typeDocument || "—",
      },
      {
        accessorKey: "destinataire",
        header: "Destinataire",
      },
      {
        accessorKey: "redacteurNom",
        header: "Rédacteur",
      },
      {
        accessorKey: "celluleLabel",
        header: "Cellule",
        cell: ({ row }) => {
          const hasCaseagDelegation = row.original.assignedCells?.some(
            (cell) => cell.code === "CASEAG" && cell.delegationCorrection
          );
          return (
            <div className="min-w-32">
              <span>{row.original.celluleLabel}</span>
              {hasCaseagDelegation && (
                <span className="block text-[10px] text-primary">
                  Correction déléguée au nom du Chef de bureau
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "latestVersion.numeroVersion",
        header: "Version",
        cell: ({ row }) =>
          row.original.latestVersion
            ? `V${row.original.latestVersion.numeroVersion}`
            : "—",
      },
      {
        accessorKey: "submittedAt",
        header: "Déposée par / le",
        cell: ({ row }) => (
          <div className="min-w-32">
            <p>{row.original.submittedBy}</p>
            <p className="text-[11px] text-muted-foreground">{formatDate(row.original.submittedAt)}</p>
          </div>
        ),
      },
      {
        accessorKey: "daysWaiting",
        header: "Jours en attente",
        cell: ({ row }) => <OverdueIndicator days={row.original.daysWaiting} />,
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
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const notePath = `/dossiers/${item.dossierId}/notes/${item.id}`;
          const isCellReviewer = [Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role);
          const isOfficeReviewer = [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role);
          return (
            <div className="flex min-w-[15rem] flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => router.push(notePath)}
              >
                <Eye className="size-3.5" />
                Ouvrir la note
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Télécharger la dernière version"
                title="Télécharger la dernière version"
                disabled={!item.latestVersion}
                onClick={() => downloadLatestVersion(item)}
              >
                <Download className="size-4" />
              </Button>
              {tab === "toReview" && isCellReviewer && (
                <>
                  <PermissionGate ability="relire" context={{ dossierId: item.dossierId }}>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={working}
                      onClick={() => performAction(item, ACTIONS.SEND_TO_OFFICE)}
                    >
                      <Send className="size-3.5" />
                      Envoyer au Chef de bureau
                    </Button>
                  </PermissionGate>
                  <PermissionGate ability="relire" context={{ dossierId: item.dossierId }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => openAction(item, ACTIONS.RETURN_TO_AUTHOR)}
                    >
                      <Undo2 className="size-3.5" />
                      Renvoyer au rédacteur
                    </Button>
                  </PermissionGate>
                </>
              )}
              {tab === "toReview" && isOfficeReviewer && (
                <>
                  <PermissionGate ability="valider" context={{ dossierId: item.dossierId }}>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => router.push(`${notePath}/validation`)}
                    >
                      <FileCheck2 className="size-3.5" />
                      Ouvrir la validation
                    </Button>
                  </PermissionGate>
                  <PermissionGate ability="valider" context={{ dossierId: item.dossierId }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => openAction(item, ACTIONS.SEND_IN_OBSERVATION)}
                    >
                      <MessageSquareText className="size-3.5" />
                      Renvoyer en observation
                    </Button>
                  </PermissionGate>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [openAction, performAction, role, router, tab, working],
  );

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={cellFilter} onValueChange={setCellFilter}>
        <SelectTrigger aria-label="Filtrer par cellule" className="h-8 w-40 text-xs">
          <SelectValue placeholder="Toutes les cellules" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les cellules</SelectItem>
          {[...new Map(allRows.flatMap((item) =>
            (item.assignedCells || []).map((cell) => [cell.id, cell])
          )).values()].map((cell) => (
            <SelectItem key={cell.id} value={cell.id}>{cell.code || cell.nom}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={writerFilter} onValueChange={setWriterFilter}>
        <SelectTrigger aria-label="Filtrer par rédacteur" className="h-8 w-44 text-xs">
          <SelectValue placeholder="Tous les rédacteurs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les rédacteurs</SelectItem>
          {[...new Map(allRows.map((item) => [item.redacteurId, item.redacteurNom])).entries()]
            .filter(([id]) => id)
            .map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={documentFilter} onValueChange={setDocumentFilter}>
        <SelectTrigger aria-label="Filtrer par type de document" className="h-8 w-48 text-xs">
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          {Object.entries(DOCUMENT_LABELS).map(([type, label]) => (
            <SelectItem key={type} value={type}>{label}</SelectItem>
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

  const currentActionTitle = selectedAction?.action === ACTIONS.SEND_TO_OFFICE
    ? "Envoyer au Chef de bureau"
    : selectedAction?.action === ACTIONS.RETURN_TO_AUTHOR
      ? "Renvoyer au rédacteur"
      : "Renvoyer en observation";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notes à relire / valider</h1>
        <p className="text-sm text-muted-foreground">
          File de relecture limitée à votre cellule ou au circuit du bureau selon votre rôle.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["À relire", summary.waiting, FileCheck2],
          ["En retard (> 7 jours)", summary.overdue, AlertTriangle],
          ["Renvoyées au rédacteur", summary.returned, MessageSquareText],
          ["Relues cette semaine", summary.treated, CheckCircle2],
        ].map(([label, value, Icon]) => (
          <Card key={label}>
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
        <TabsList className="grid h-auto w-full grid-cols-1 sm:w-fit sm:grid-cols-3">
          {TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id} className="gap-1.5 px-3 py-2 text-xs">
              {label}
              <span className="rounded-full bg-muted px-1.5 text-[10px]">
                {(worklist[id] || []).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <TableSkeleton columns={10} rows={5} />
        ) : error ? (
          <ErrorState
            title="Chargement impossible"
            message="La file de relecture n'a pas pu être récupérée."
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : !filteredRows.length ? (
          <EmptyState
            icon={FileCheck2}
            title={tab === "toReview" ? "Aucune note n'attend votre relecture" : "Aucune note à afficher"}
            description={
              rows.length
                ? "Aucune note ne correspond aux filtres actifs."
                : tab === "returnedToAuthor"
                  ? "Les notes que vous renvoyez au rédacteur apparaîtront ici tant qu'elles sont en correction."
                  : tab === "recentlyTreated"
                    ? "Les notes que vous avez traitées au cours des sept derniers jours apparaîtront ici."
                    : "Aucune note n'est actuellement à cette étape de votre circuit."
            }
          />
        ) : (
          <DataTable
            data={filteredRows}
            columns={columns}
            searchPlaceholder="Rechercher une référence, un objet ou un rédacteur..."
            emptyMessage="Aucune note ne correspond à la recherche."
            filters={filters}
            showSelectionCount={false}
            onRowClick={(item) => router.push(`/dossiers/${item.dossierId}/notes/${item.id}`)}
          />
        )}
      </Tabs>

      <Dialog
        open={Boolean(selectedAction)}
        onOpenChange={(open) => {
          if (!open && !working) {
            setSelectedAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentActionTitle}</DialogTitle>
            <DialogDescription>
              {selectedAction?.item?.dossierReference} · {selectedAction?.item?.dossierObject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="review-action-reason" className="text-sm font-medium">
              Motif obligatoire
            </label>
            <textarea
              id="review-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Saisissez le motif à transmettre avec la note."
              rows={4}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={working}
              onClick={() => setSelectedAction(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={working || !reason.trim()}
              onClick={confirmAction}
            >
              {working ? "Enregistrement…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
