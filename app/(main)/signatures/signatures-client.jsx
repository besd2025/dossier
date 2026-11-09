"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, FileCheck2, Printer, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/permission-gate";
import {
  DataTable,
  EmptyState,
  ErrorState,
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
import { getSignatureQueue, updateNoteStatus } from "@/lib/services/notes-service";
import { useSessionStore } from "@/stores/session/session-store";
import { Role, StatutNote, TypeDocument } from "@/types";

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

function getStatusDate(note) {
  if (note.statutNote === StatutNote.RELECTURE_BUREAU) {
    return note.dateSoumissionBureau || note.dateCreation;
  }
  if ([StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION].includes(note.statutNote)) {
    return note.dateValidation || note.dateCreation;
  }
  if (note.statutNote === StatutNote.IMPRIMEE) return note.dateImpression;
  return note.dateSignature;
}

export default function SignaturesClient() {
  const role = useSessionStore((state) => state.role);
  const user = useSessionStore((state) => state.currentUser || state.user);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [workingNoteId, setWorkingNoteId] = useState(null);
  const [printingNote, setPrintingNote] = useState(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setNotes(await getSignatureQueue());
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger le circuit de signature.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadNotes, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotes, reloadKey]);

  const counters = useMemo(() => ({
    validation: notes.filter((note) => note.statutNote === StatutNote.RELECTURE_BUREAU).length,
    impression: notes.filter((note) =>
      [StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION].includes(note.statutNote)
    ).length,
    signature: notes.filter((note) => note.statutNote === StatutNote.IMPRIMEE).length,
  }), [notes]);

  const handlePrint = useCallback(async (note) => {
    if (workingNoteId) return;
    setWorkingNoteId(note.id);
    try {
      setPrintingNote(note);
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      window.print();
      await updateNoteStatus(note.id, StatutNote.IMPRIMEE, user.id);
      toast.success(`La note ${note.dossier?.reference || ""} est marquée comme imprimée. Le secrétariat a été notifié.`);
      await loadNotes();
    } catch (actionError) {
      toast.error(actionError.message || "L'impression n'a pas pu être enregistrée.");
    } finally {
      setPrintingNote(null);
      setWorkingNoteId(null);
    }
  }, [loadNotes, user.id, workingNoteId]);

  const handleValidate = useCallback(async (note) => {
    if (workingNoteId) return;
    setWorkingNoteId(note.id);
    try {
      await updateNoteStatus(note.id, StatutNote.EN_ATTENTE_IMPRESSION, user.id);
      toast.success(`La note ${note.dossier?.reference || ""} est validée et attend son impression.`);
      await loadNotes();
    } catch (actionError) {
      toast.error(actionError.message || "La validation n'a pas pu être enregistrée.");
    } finally {
      setWorkingNoteId(null);
    }
  }, [loadNotes, user.id, workingNoteId]);

  const handleSign = useCallback(async (note) => {
    if (workingNoteId) return;
    setWorkingNoteId(note.id);
    try {
      const signedNote = await updateNoteStatus(note.id, StatutNote.SIGNEE, user.id);
      toast.success(signedNote.signatureMention || "La note est marquée comme signée.");
      await loadNotes();
    } catch (actionError) {
      toast.error(actionError.message || "La signature n'a pas pu être enregistrée.");
    } finally {
      setWorkingNoteId(null);
    }
  }, [loadNotes, user.id, workingNoteId]);

  const columns = useMemo(() => [
    {
      accessorKey: "dossier.reference",
      id: "reference",
      header: "Dossier",
      accessorFn: (row) => row.dossier?.reference || row.dossierId,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.original.dossier?.reference || row.original.dossierId}
        </span>
      ),
    },
    {
      accessorKey: "typeDocument",
      header: "Document",
      cell: ({ row }) => (
        <div className="max-w-64">
          <p className="font-medium">
            {DOCUMENT_LABELS[row.original.typeDocument] || row.original.typeDocument}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.destinataire || "Destinataire non précisé"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "dossier.objet",
      id: "objet",
      header: "Objet",
      accessorFn: (row) => row.dossier?.objet || "",
      cell: ({ row }) => (
        <span className="block max-w-[24rem] truncate">
          {row.original.dossier?.objet || "—"}
        </span>
      ),
    },
    {
      accessorKey: "statutNote",
      header: "Statut",
      cell: ({ row }) => (
        <StatusBadge type="note" status={row.original.statutNote} size="sm" />
      ),
    },
    {
      id: "dateAction",
      accessorFn: getStatusDate,
      header: "Depuis le",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">{formatDate(getStatusDate(row.original))}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions rapides",
      enableSorting: false,
      cell: ({ row }) => {
        const note = row.original;
        const permissionContext = {
          dossierId: note.dossierId,
          prisesEnCharge: note.activeDelegations || [],
        };
        const isWorking = workingNoteId === note.id;

        return (
          <div className="flex flex-wrap gap-1.5">
            {note.statutNote === StatutNote.RELECTURE_BUREAU && (
              <PermissionGate
                ability="valider"
                context={permissionContext}
                tooltip="La validation requiert une prise en charge active."
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={isWorking}
                  onClick={() => handleValidate(note)}
                >
                  <ShieldCheck className="size-3.5" />
                  Valider
                </Button>
              </PermissionGate>
            )}
            {[StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION].includes(note.statutNote) && (
              <PermissionGate
                ability="imprimer"
                context={permissionContext}
                tooltip="L’impression requiert une prise en charge autorisant l’impression."
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={isWorking}
                  onClick={() => handlePrint(note)}
                >
                  <Printer className="size-3.5" />
                  Imprimer
                </Button>
              </PermissionGate>
            )}
            {note.statutNote === StatutNote.IMPRIMEE && (
              <PermissionGate
                ability="signer"
                context={permissionContext}
                tooltip="Prise en charge active avec portée de signature requise."
              >
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={isWorking}
                  onClick={() => handleSign(note)}
                >
                  <Check className="size-3.5" />
                  Signer
                </Button>
              </PermissionGate>
            )}
            <Button asChild type="button" size="sm" variant="ghost" className="h-8">
              <Link href={`/dossiers/${note.dossierId}/notes/${note.id}`}>
                Voir la note
              </Link>
            </Button>
          </div>
        );
      },
    },
  ], [handlePrint, handleSign, handleValidate, workingNoteId]);

  if (![Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role)) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        Cette page est réservée au Chef de bureau et à son adjoint.
      </div>
    );
  }

  return (
    <>
    <div className="space-y-5 print:hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Circuit de signature</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Validation, impression et suivi des notes en attente de signature.
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

      {error ? (
        <ErrorState
          title="Circuit indisponible"
          message="Les notes n'ont pas pu être chargées."
          error={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente de validation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">{counters.validation}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente d’impression
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">{counters.impression}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente de signature
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">{counters.signature}</CardContent>
            </Card>
          </div>

          {notes.length ? (
            <DataTable
              data={notes}
              columns={columns}
              searchPlaceholder="Rechercher un dossier ou un objet..."
              emptyMessage="Aucune note ne correspond à la recherche."
              showSearch
              showColumnVisibility
              showPagination
              showSelectionCount={false}
            />
          ) : (
            <EmptyState
              icon={FileCheck2}
              title="Aucune note dans le circuit"
              description="Aucune note n’attend actuellement une validation, une impression ou une signature."
            />
          )}
        </>
      )}
    </div>
    {printingNote && (
      <section id="signature-print-area" className="hidden print:block">
        <h1 className="mb-3 text-xl font-semibold">
          {printingNote.dossier?.reference} —{" "}
          {DOCUMENT_LABELS[printingNote.typeDocument] || printingNote.typeDocument}
        </h1>
        <p className="mb-4">{printingNote.dossier?.objet}</p>
        <iframe
          src="/sample-document.pdf"
          title={`Aperçu de la note ${printingNote.dossier?.reference || ""}`}
          className="h-[95vh] w-full border-0"
        />
      </section>
    )}
    </>
  );
}
