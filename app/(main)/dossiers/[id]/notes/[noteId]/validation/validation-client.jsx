"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Printer, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/permission-gate";
import { PdfFirstPageViewer, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { createObservation, getNote, updateNoteStatus } from "@/lib/services/notes-service";
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
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function ValidationClient({ initialNote, dossierId }) {
  const [note, setNote] = useState(initialNote);
  const [isWorking, setIsWorking] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const [observationReason, setObservationReason] = useState("");
  const { role, currentUser } = useSessionStore();
  const user = currentUser || {};
  const status = note.statutNote;
  const canValidate = status === StatutNote.RELECTURE_BUREAU;
  const canPrint = [StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION].includes(status);
  const canSign = status === StatutNote.IMPRIMEE;
  const isDeputy = role === Role.CHEF_BUREAU_ADJOINT;
  const printDelegations = note.activeDelegations || [];
  const printContext = {
    dossierId: note.dossierId,
    prisesEnCharge: printDelegations,
  };

  async function refreshNote() {
    const updatedNote = await getNote(note.id);
    if (!updatedNote) throw new Error("Cette note n'existe plus.");
    setNote(updatedNote);
    return updatedNote;
  }

  async function updateStatus(nextStatus, message) {
    setIsWorking(true);
    try {
      await updateNoteStatus(note.id, nextStatus, user.id);
      await refreshNote();
      toast.success(message);
    } catch (error) {
      toast.error(error.message || "L'action n'a pas pu être effectuée.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handlePrint() {
    if (!canPrint || isWorking) return;
    window.print();
    await updateStatus(
      StatutNote.IMPRIMEE,
      "La note est marquée comme imprimée. Le secrétariat a été notifié."
    );
  }

  async function handleObservation() {
    const motif = observationReason.trim();
    if (!motif || isWorking) return;
    setIsWorking(true);
    try {
      await createObservation(
        note.id,
        { contenu: motif, notify: false, recordMovement: false },
        user.id
      );
      await updateNoteStatus(note.id, StatutNote.RELECTURE_CELLULE, user.id);
      await refreshNote();
      toast.success("La note a été renvoyée en observation.");
      setObservationOpen(false);
      setObservationReason("");
    } catch (error) {
      toast.error(error.message || "Le renvoi en observation a échoué.");
    } finally {
      setIsWorking(false);
    }
  }

  const signerCanAct = role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT;
  const signatureLabel = note.signatureMention ||
    (note.signeParAdjoint && note.signeParId
      ? `Signée par ${note.signeParNom || "l'adjoint"}, adjoint, par prise en charge du ${formatDate(note.signaturePriseEnChargeDate)}`
      : null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/dossiers/${dossierId}/notes/${note.id}`}>
              <ArrowLeft className="size-4" />
              Retour à la note
            </Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">
              Dossier {note.dossier?.reference || dossierId}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Validation de la note</h1>
          </div>
        </div>
        <StatusBadge type="note" status={status} size="lg" />
      </div>

      {signatureLabel && (
        <div
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {signatureLabel}
        </div>
      )}

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Circuit de validation et de signature</CardTitle>
          <CardDescription>
            {note.dossier?.objet || "Aperçu de la note avant validation, impression ou signature."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Rédacteur</p>
            <p className="font-medium">{note.redacteurNom}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Type de document</p>
            <p className="font-medium">{DOCUMENT_LABELS[note.typeDocument] || note.typeDocument}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Destinataire</p>
            <p className="font-medium">{note.destinataire || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <section id="note-print-area" aria-label="Aperçu PDF de la note">
        <PdfFirstPageViewer
          src="/sample-document.pdf"
          title="Aperçu PDF de la note"
          reference={note.dossier?.reference}
          showNotice={false}
          allowDownload={false}
          className="print:border-0 print:shadow-none"
        />
      </section>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Actions de circuit
          </CardTitle>
          <CardDescription>
            {status === StatutNote.EN_ATTENTE_IMPRESSION
              ? "Note validée, en attente d’impression."
              : status === StatutNote.IMPRIMEE
                ? "Note imprimée, en attente de signature."
                : "Les actions disponibles dépendent du statut et de votre prise en charge."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canValidate && (
            <>
              <PermissionGate
                ability="valider"
                context={printContext}
                tooltip="La validation est réservée au Chef de bureau ou à un adjoint autorisé."
              >
                <Button
                  type="button"
                  disabled={isWorking}
                  onClick={() =>
                    updateStatus(
                      StatutNote.EN_ATTENTE_IMPRESSION,
                      "La note est validée et attend son impression."
                    )
                  }
                >
                  <Check className="size-4" />
                  Valider
                </Button>
              </PermissionGate>
              <PermissionGate
                ability="valider"
                context={printContext}
                tooltip="Le renvoi en observation est réservé au Chef de bureau ou à un adjoint autorisé."
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isWorking}
                  onClick={() => setObservationOpen(true)}
                >
                  <RotateCcw className="size-4" />
                  Renvoyer en observation
                </Button>
              </PermissionGate>
            </>
          )}

          {canPrint && (
            <PermissionGate
              ability="imprimer"
              context={printContext}
              tooltip="L’impression est réservée au Chef de bureau ou à un adjoint autorisé."
            >
              <Button type="button" disabled={isWorking} onClick={handlePrint}>
                <Printer className="size-4" />
                Imprimer
              </Button>
            </PermissionGate>
          )}

          {canSign && signerCanAct && (
            <PermissionGate
              ability="signer"
              context={printContext}
              tooltip="Prise en charge active avec portée de signature requise."
            >
              <Button
                type="button"
                disabled={isWorking}
                onClick={() => updateStatus(StatutNote.SIGNEE, "La note est marquée comme signée.")}
              >
                <Check className="size-4" />
                Marquer comme signée
              </Button>
            </PermissionGate>
          )}

          {!canValidate && !canPrint && !canSign && (
            <p className="text-sm text-muted-foreground">
              Aucune action n’est disponible à ce statut.
            </p>
          )}
          {isDeputy && canSign && !note.activeDelegations?.some(
            (delegation) =>
              delegation.adjointId === user.id &&
              delegation.active &&
              delegation.portee?.signature === true
          ) && (
            <span className="sr-only">
              Le bouton de signature est désactivé : prise en charge requise.
            </span>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={observationOpen}
        onOpenChange={(open) => {
          if (!isWorking) {
            setObservationOpen(open);
            if (!open) setObservationReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renvoyer en observation</DialogTitle>
            <DialogDescription>
              Le motif sera ajouté au fil des observations et la note retournera à la relecture de la cellule.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="validation-observation-reason" className="text-sm font-medium">
            Motif obligatoire
          </label>
          <textarea
            id="validation-observation-reason"
            value={observationReason}
            onChange={(event) => setObservationReason(event.target.value)}
            rows={4}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isWorking}
              onClick={() => setObservationOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!observationReason.trim() || isWorking}
              onClick={handleObservation}
            >
              Confirmer le renvoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
