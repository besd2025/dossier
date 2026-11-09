"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, FileText, RefreshCw, Send, Stamp, Upload } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/permission-gate";
import {
  DataTable,
  EmptyState,
  ErrorState,
  PdfFirstPageViewer,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  enregistrerCachet,
  getCachetQueues,
  getNextOfficialNumber,
  transmettreNote,
} from "@/lib/services/notes-service";
import { useSessionStore } from "@/stores/session/session-store";
import { TypeDocument } from "@/types";

const DOCUMENT_LABELS = Object.freeze({
  [TypeDocument.NOTE_CABINET_CIVIL]: "Note au Chef de cabinet civil",
  [TypeDocument.NOTE_PRESIDENT]: "Note au Président",
  [TypeDocument.PROJET_LETTRE]: "Projet de lettre",
});

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getReference(note) {
  return note.dossier?.reference || note.dossierId;
}

export default function CachetsClient() {
  const user = useSessionStore((state) => state.currentUser || state.user);
  const userId = user?.id;
  const [queues, setQueues] = useState({ toStamp: [], toTransmit: [], lettersToRecover: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedNote, setSelectedNote] = useState(null);
  const [officialNumber, setOfficialNumber] = useState("");
  const [stampDate, setStampDate] = useState(new Date().toISOString().slice(0, 10));
  const [pdfFile, setPdfFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingNoteId, setWorkingNoteId] = useState(null);

  const loadQueues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setQueues(await getCachetQueues());
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger les files du secrétariat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadQueues, 0);
    return () => window.clearTimeout(timer);
  }, [loadQueues, reloadKey]);

  async function openStampDialog(note) {
    setSelectedNote(note);
    setStampDate(new Date().toISOString().slice(0, 10));
    setPdfFile(null);
    setFileError("");
    try {
      setOfficialNumber(await getNextOfficialNumber(note.id));
    } catch (numberError) {
      setSelectedNote(null);
      toast.error(numberError.message || "Impossible de générer le numéro officiel.");
    }
  }

  function handlePdfChange(event) {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfFile(null);
      setFileError("Le fichier de première page doit être un PDF.");
      return;
    }
    setFileError("");
    setPdfFile(file);
  }

  async function saveStamp(event) {
    event.preventDefault();
    if (!selectedNote || !pdfFile || !stampDate || saving) return;
    setSaving(true);
    try {
      await enregistrerCachet(
        selectedNote.id,
        {
          dateCachet: stampDate,
          premierePagePdfUrl: "/sample-document.pdf",
          premierePagePdfNom: pdfFile.name,
        },
        user.id
      );
      toast.success(`Cachet ${officialNumber} enregistré pour le dossier ${getReference(selectedNote)}.`);
      setSelectedNote(null);
      await loadQueues();
    } catch (saveError) {
      toast.error(saveError.message || "L'enregistrement du cachet a échoué.");
    } finally {
      setSaving(false);
    }
  }

  const handleTransmit = useCallback(async (note) => {
    if (workingNoteId) return;
    setWorkingNoteId(note.id);
    try {
      await transmettreNote(note.id, userId);
      toast.success(`La note ${getReference(note)} a été transmise au cabinet.`);
      await loadQueues();
    } catch (transmitError) {
      toast.error(transmitError.message || "La transmission a échoué.");
    } finally {
      setWorkingNoteId(null);
    }
  }, [loadQueues, userId, workingNoteId]);

  const createColumns = useCallback((actionLabel, onAction, actionIcon) => [
    {
      id: "reference",
      accessorFn: getReference,
      header: "Dossier",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {getReference(row.original)}
        </span>
      ),
    },
    {
      id: "document",
      accessorFn: (note) => DOCUMENT_LABELS[note.typeDocument] || note.typeDocument,
      header: "Document",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {DOCUMENT_LABELS[row.original.typeDocument] || row.original.typeDocument}
          </p>
          <p className="text-xs text-muted-foreground">
            Destinataire : {row.original.destinataire || "—"}
          </p>
        </div>
      ),
    },
    {
      id: "objet",
      accessorFn: (note) => note.dossier?.objet || "",
      header: "Objet",
      cell: ({ row }) => (
        <span className="block max-w-[25rem] truncate">{row.original.dossier?.objet || "—"}</span>
      ),
    },
    {
      accessorKey: "statutNote",
      header: "Statut",
      cell: ({ row }) => <StatusBadge type="note" status={row.original.statutNote} size="sm" />,
    },
    {
      id: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant={actionLabel === "Transmettre au cabinet" ? "default" : "outline"}
          disabled={workingNoteId === row.original.id}
          onClick={() => onAction(row.original)}
        >
          {actionIcon}
          {actionLabel}
        </Button>
      ),
    },
  ], [workingNoteId]);

  const stampColumns = useMemo(
    () => createColumns("Enregistrer le cachet", openStampDialog, <Stamp className="size-3.5" />),
    [createColumns]
  );
  const transmitColumns = useMemo(
    () => createColumns(
      "Transmettre au cabinet",
      handleTransmit,
      <Send className="size-3.5" />
    ),
    [createColumns, handleTransmit]
  );
  const letterColumns = useMemo(
    () => createColumns(
      "Récupérer et cacheter",
      openStampDialog,
      <Upload className="size-3.5" />
    ),
    [createColumns]
  );

  function renderTable(rows, columns, emptyTitle, emptyDescription) {
    if (loading) return <TableSkeleton rows={5} columns={5} />;
    if (error) {
      return (
        <ErrorState
          title="File indisponible"
          message="Les notes n'ont pas pu être chargées."
          error={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      );
    }
    if (!rows.length) {
      return (
        <EmptyState
          icon={FileText}
          title={emptyTitle}
          description={emptyDescription}
          className="min-h-48"
        />
      );
    }
    return (
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Rechercher une référence ou un objet..."
        showSelectionCount={false}
        showColumnVisibility
        showPagination
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cachet et transmission</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Numérotation officielle, archivage de la première page et transmission au cabinet.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => setReloadKey((key) => key + 1)}
        >
          <RefreshCw className="size-4" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Notes signées à cacheter", queues.toStamp.length],
          ["À transmettre au cabinet", queues.toTransmit.length],
          ["Projets de lettre à récupérer", queues.lettersToRecover.length],
        ].map(([label, count]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {loading ? "—" : count}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="to-stamp" className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="to-stamp">Notes signées à cacheter</TabsTrigger>
          <TabsTrigger value="to-transmit">À transmettre au cabinet</TabsTrigger>
          <TabsTrigger value="letters">Projets de lettre à récupérer</TabsTrigger>
        </TabsList>
        <TabsContent value="to-stamp">
          {renderTable(
            queues.toStamp,
            stampColumns,
            "Aucune note à cacheter",
            "Les notes signées en attente d'un cachet officiel apparaîtront ici."
          )}
        </TabsContent>
        <TabsContent value="to-transmit">
          {renderTable(
            queues.toTransmit,
            transmitColumns,
            "Aucune note à transmettre",
            "Les notes cachetées en attente de transmission apparaîtront ici."
          )}
        </TabsContent>
        <TabsContent value="letters">
          {renderTable(
            queues.lettersToRecover,
            letterColumns,
            "Aucun projet de lettre à récupérer",
            "Les projets de lettre signés à récupérer auprès du cabinet apparaîtront ici."
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedNote)}
        onOpenChange={(open) => {
          if (!saving && !open) {
            setSelectedNote(null);
            setPdfFile(null);
            setFileError("");
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={saveStamp} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Enregistrer le cachet</DialogTitle>
              <DialogDescription>
                Le numéro est généré automatiquement. Téléversez uniquement la première page signée et cachetée.
              </DialogDescription>
            </DialogHeader>

            {selectedNote && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="official-number" className="text-sm font-medium">
                      Numéro officiel
                    </label>
                    <Input
                      id="official-number"
                      value={officialNumber || "Génération en cours…"}
                      readOnly
                      aria-describedby="official-number-help"
                    />
                    <p id="official-number-help" className="text-xs text-muted-foreground">
                      Généré automatiquement — à reporter sur le document papier
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="stamp-date" className="text-sm font-medium">Date du cachet</label>
                    <Input
                      id="stamp-date"
                      type="date"
                      value={stampDate}
                      required
                      onChange={(event) => setStampDate(event.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm">
                  {getReference(selectedNote)} ·{" "}
                  {DOCUMENT_LABELS[selectedNote.typeDocument] || selectedNote.typeDocument}
                </p>
                {selectedNote.typeDocument === TypeDocument.PROJET_LETTRE && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    Le projet de lettre est à récupérer au cabinet avant l’apposition du cachet.
                    La récupération sera enregistrée avec cette opération.
                  </p>
                )}
                <div className="space-y-2">
                  <label htmlFor="stamp-pdf" className="text-sm font-medium">
                    Première page signée et cachetée (PDF) *
                  </label>
                  <Input
                    id="stamp-pdf"
                    type="file"
                    accept="application/pdf,.pdf"
                    required
                    onChange={handlePdfChange}
                    aria-invalid={Boolean(fileError)}
                  />
                  {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
                  {pdfFile && (
                    <p className="text-xs text-muted-foreground">
                      Fichier sélectionné : {pdfFile.name} — aperçu de démonstration ci-dessous.
                    </p>
                  )}
                  {pdfFile && (
                    <PdfFirstPageViewer
                      src="/sample-document.pdf"
                      title="Aperçu de la première page"
                      reference={getReference(selectedNote)}
                      showNotice
                      allowDownload={false}
                      className="max-h-[24rem]"
                    />
                  )}
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setSelectedNote(null)}
              >
                Annuler
              </Button>
              <PermissionGate ability="cacheter">
                <Button type="submit" disabled={!officialNumber || !pdfFile || !stampDate || saving}>
                  <CalendarDays className="size-4" />
                  {saving ? "Enregistrement…" : "Enregistrer le cachet"}
                </Button>
              </PermissionGate>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
