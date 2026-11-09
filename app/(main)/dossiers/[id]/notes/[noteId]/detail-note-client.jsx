"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Info,
  MessageSquareText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  ObservationThread,
  StatusBadge,
  VersionDropzone,
  VersionList,
  WorkflowStepper,
} from "@/components/shared";
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
import { KeywordInput } from "@/components/shared/keyword-input";
import {
  createNoteVersion,
  createObservation,
  getNote,
  resolveObservation,
  updateNoteKeywords,
  updateNoteStatus,
} from "@/lib/services/notes-service";
import { useSessionStore } from "@/stores/session/session-store";
import { Role, StatutNote, TypeDocument } from "@/types";

const DOCUMENT_LABELS = Object.freeze({
  [TypeDocument.NOTE_CABINET_CIVIL]: "Note au Chef de cabinet civil",
  [TypeDocument.NOTE_PRESIDENT]: "Note au Président",
  [TypeDocument.PROJET_LETTRE]: "Projet de lettre",
});

const DIALOG_ACTIONS = Object.freeze({
  RETURN_TO_AUTHOR: "RETURN_TO_AUTHOR",
  SEND_IN_OBSERVATION: "SEND_IN_OBSERVATION",
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

function formatFileSize(bytes) {
  if (!bytes) return "0 Ko";
  const sizeInKb = bytes / 1024;
  return `${sizeInKb < 1024 ? sizeInKb.toFixed(0) : (sizeInKb / 1024).toFixed(1)} ${sizeInKb < 1024 ? "Ko" : "Mo"}`;
}

function displayName(user) {
  return user ? `${user.prenom || ""} ${user.nom || ""}`.trim() : "—";
}

function fakeDocxDownload(version) {
  const contents = [
    "Fichier de démonstration BESD — document Word factice.",
    `Version : V${version.numeroVersion}`,
    `Fichier : ${version.nomFichier}`,
    `Déposé le : ${formatDate(version.dateCreation)}`,
    "",
    "Aucun contenu de note réel n'est inclus dans ce fichier.",
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

export default function DetailNoteClient({ initialNote, dossierId }) {
  const [note, setNote] = useState(initialNote);
  const [isUploading, setIsUploading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [dialogComment, setDialogComment] = useState("");
  const [versionNotice, setVersionNotice] = useState("");
  const { role, currentUser } = useSessionStore();
  const user = currentUser || {};

  const isDraft = [StatutNote.BROUILLON, StatutNote.ROUVERTE].includes(note.statutNote);
  const isWriter = user.id === note.redacteurId;
  const isCellReviewer =
    role === Role.CHEF_CELLULE &&
    note.assignedCells?.some((cell) => cell.id === user.celluleId);
  const isAuthorizedDeputy = note.activeDelegations?.some(
    (delegation) =>
      delegation.adjointId === user.id &&
      delegation.active &&
      delegation.portee?.valider
  );
  const isOfficeReviewer =
    role === Role.CHEF_BUREAU ||
    (role === Role.CHEF_BUREAU_ADJOINT && isAuthorizedDeputy);
  const canWrite = isWriter && isDraft;
  const canAddObservation =
    note.involvedUserIds?.includes(user.id) ||
    [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT, Role.CHEF_CELLULE].includes(role);
  const hasKeywords = note.motsCles?.some((keyword) => keyword.trim()) || false;
  const assignedCaseag = note.assignedCells?.some(
    (cell) => cell.code === "CASEAG" && cell.delegationCorrection
  );
  const noteStatus = note.statutNote;

  const workflowHistory = useMemo(() => note.workflowHistory || {}, [note.workflowHistory]);

  async function refreshNote() {
    const updatedNote = await getNote(note.id);
    if (!updatedNote) throw new Error("Cette note n'existe plus.");
    setNote(updatedNote);
    return updatedNote;
  }

  async function handleKeywordChange(keywords) {
    setNote((current) => ({ ...current, motsCles: keywords }));
    try {
      await updateNoteKeywords(note.id, keywords);
    } catch (error) {
      toast.error(error.message || "Les mots-clés n'ont pas pu être enregistrés.");
    }
  }

  async function handleUpload(file, comment) {
    setIsUploading(true);
    try {
      await createNoteVersion(
        note.id,
        {
          nomFichier: file.name,
          tailleFichier: formatFileSize(file.size),
          commentaire: comment,
        },
        user.id
      );
      await refreshNote();
      setVersionNotice(
        "Version déposée : le conseiller et le Chef de cellule concernés ont été notifiés."
      );
      toast.success("La nouvelle version a été déposée.");
    } catch (error) {
      toast.error(error.message || "Le dépôt de la version a échoué.");
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleTransition(status, successMessage) {
    setIsWorking(true);
    try {
      await updateNoteStatus(note.id, status, user.id);
      await refreshNote();
      setVersionNotice("");
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || "Le changement de statut a échoué.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSubmitForReview() {
    if (!hasKeywords) {
      toast.error("Ajoutez au moins un mot-clé avant de soumettre la note.");
      return;
    }
    if (note.versions.length === 0) {
      toast.error("Déposez une version Word avant de soumettre la note.");
      return;
    }
    await handleTransition(
      StatutNote.RELECTURE_CELLULE,
      "La note a été soumise à la relecture de la cellule."
    );
  }

  async function handleDialogConfirm() {
    if (!dialogComment.trim() || isWorking) return;
    const isReturn = dialogAction === DIALOG_ACTIONS.RETURN_TO_AUTHOR;
    const nextStatus = isReturn ? StatutNote.BROUILLON : StatutNote.RELECTURE_CELLULE;
    setIsWorking(true);
    try {
      await createObservation(
        note.id,
        { contenu: dialogComment.trim(), notify: false, recordMovement: false },
        user.id
      );
      await updateNoteStatus(note.id, nextStatus, user.id);
      await refreshNote();
      toast.success(
        isReturn
          ? "La note a été renvoyée au rédacteur avec le motif."
          : "La note a été envoyée en observation."
      );
      setDialogAction(null);
      setDialogComment("");
    } catch (error) {
      toast.error(error.message || "L'action n'a pas pu être effectuée.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleAddObservation(text) {
    try {
      await createObservation(note.id, { contenu: text }, user.id);
      await refreshNote();
    } catch (error) {
      toast.error(error.message || "L'observation n'a pas pu être ajoutée.");
      throw error;
    }
  }

  async function handleResolveObservation(observationId, resolved) {
    try {
      await resolveObservation(observationId, resolved, user.id);
      await refreshNote();
    } catch (error) {
      toast.error(error.message || "L'observation n'a pas pu être mise à jour.");
    }
  }

  const latestVersion = note.versions[0];
  const originalSignedVersion = note.signedOriginalVersion;
  const typeLabel = DOCUMENT_LABELS[note.typeDocument] || note.typeDocument || "Document";
  const recipients = note.destinataire || "—";
  const dossierReference = note.dossier?.reference || dossierId;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/dossiers/${dossierId}`}>
              <ArrowLeft className="size-4" />
              Retour au dossier
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Dossier {dossierReference}
              {note.numeroOfficiel ? ` · N° ${note.numeroOfficiel}` : ""}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Détail de la note
            </h1>
          </div>
        </div>
        <StatusBadge type="note" status={noteStatus} size="lg" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document et destinataire</CardTitle>
          <CardDescription>
            Rédacteur : {note.redacteurNom} · Conseiller(s) assigné(s) :{" "}
            {note.conseillersAssignes?.map(displayName).join(", ") || "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Type de document</p>
            <p className="font-medium">{typeLabel}</p>
          </div>
          <div className="space-y-1 rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Destinataire</p>
            <p className="font-medium">{recipients}</p>
          </div>
          {note.dossier?.objet && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Objet du dossier</p>
              <p className="text-sm">{note.dossier.objet}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {note.statutNote === StatutNote.ROUVERTE && (
        <section
          aria-label="Note rouverte"
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-destructive">Note rouverte après signature</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {note.reouverture?.motif || "Une correction a été autorisée après signature."}
            </p>
          </div>
          {originalSignedVersion ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => fakeDocxDownload(originalSignedVersion)}
            >
              <Download className="size-4" />
              Télécharger la version signée d&apos;origine
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              La version signée d&apos;origine n&apos;est pas disponible.
            </span>
          )}
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Circuit de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowStepper
            currentStatus={noteStatus}
            stepHistory={workflowHistory}
            showReopenedBanner
          />
        </CardContent>
      </Card>

      {assignedCaseag && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <strong>CASEAG — délégation de correction :</strong> Délégation de correction au
            nom du Chef de bureau — validation finale réservée au Chef de bureau.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mots-clés obligatoires</CardTitle>
              <CardDescription>
                Au moins un mot-clé est requis avant le dépôt d&apos;une version ou la soumission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordInput
                keywords={note.motsCles || []}
                onChange={handleKeywordChange}
                disabled={!canWrite || isWorking || isUploading}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Versions Word
              </CardTitle>
              <CardDescription>
                Les documents se travaillent dans Word ; aucune édition en ligne n&apos;est proposée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <VersionList versions={note.versions} onDownload={fakeDocxDownload} />
              {canWrite && (
                <div className="space-y-3 border-t pt-4">
                  {!hasKeywords && (
                    <p className="text-sm text-amber-700" role="status">
                      Ajoutez un mot-clé avant de pouvoir déposer un fichier.
                    </p>
                  )}
                  <VersionDropzone
                    onUpload={handleUpload}
                    disabled={!hasKeywords || isWorking}
                    isUploading={isUploading}
                  />
                </div>
              )}
              {versionNotice && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-900 dark:text-sky-200"
                  role="status"
                >
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{versionNotice}</span>
                </div>
              )}
              {latestVersion && (
                <p className="text-xs text-muted-foreground">
                  Dernier dépôt : {latestVersion.nomFichier} · {formatDate(latestVersion.dateCreation)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="size-4 text-primary" />
                Observations
              </CardTitle>
              <CardDescription>
                Remarques de relecture et suivi de leur résolution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ObservationThread
                observations={note.observations}
                onAddObservation={handleAddObservation}
                onToggleResolve={handleResolveObservation}
                readOnly={!canAddObservation}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
              <CardDescription>Disponibles selon votre rôle et le statut de la note.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {canWrite && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!hasKeywords || isUploading || isWorking}
                    onClick={() => {
                      document.getElementById("version-dropzone-form")?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                  >
                    <Download className="size-4" />
                    Déposer une version
                  </Button>
                  <Button
                    type="button"
                    disabled={!hasKeywords || note.versions.length === 0 || isWorking || isUploading}
                    onClick={handleSubmitForReview}
                  >
                    <Send className="size-4" />
                    Soumettre à la relecture
                  </Button>
                </>
              )}
              {isCellReviewer && noteStatus === StatutNote.RELECTURE_CELLULE && (
                <>
                  <Button
                    type="button"
                    disabled={isWorking}
                    onClick={() =>
                      handleTransition(
                        StatutNote.RELECTURE_BUREAU,
                        "La note a été envoyée au Chef de bureau."
                      )
                    }
                  >
                    <Send className="size-4" />
                    Envoyer au Chef de bureau
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isWorking}
                    onClick={() => setDialogAction(DIALOG_ACTIONS.RETURN_TO_AUTHOR)}
                  >
                    Renvoyer au rédacteur avec motif
                  </Button>
                </>
              )}
              {isOfficeReviewer && noteStatus === StatutNote.RELECTURE_BUREAU && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isWorking}
                    onClick={() => setDialogAction(DIALOG_ACTIONS.SEND_IN_OBSERVATION)}
                  >
                    <MessageSquareText className="size-4" />
                    Envoyer en observation
                  </Button>
                  <Button
                    type="button"
                    disabled={isWorking}
                    onClick={() =>
                      handleTransition(StatutNote.VALIDEE, "La note a été validée.")
                    }
                  >
                    <Check className="size-4" />
                    Valider
                  </Button>
                </>
              )}
              {!canWrite &&
                !(isCellReviewer && noteStatus === StatutNote.RELECTURE_CELLULE) &&
                !(isOfficeReviewer && noteStatus === StatutNote.RELECTURE_BUREAU) && (
                  <p className="text-sm text-muted-foreground">
                    Aucune action n&apos;est disponible pour votre rôle à cette étape.
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(dialogAction)}
        onOpenChange={(open) => {
          if (!open && !isWorking) {
            setDialogAction(null);
            setDialogComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === DIALOG_ACTIONS.RETURN_TO_AUTHOR
                ? "Renvoyer la note au rédacteur"
                : "Envoyer la note en observation"}
            </DialogTitle>
            <DialogDescription>
              Indiquez le motif ou les corrections attendues. Ce texte sera ajouté au fil des observations.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="note-action-comment" className="text-sm font-medium">
            Motif <span className="text-destructive">*</span>
          </label>
          <textarea
            id="note-action-comment"
            value={dialogComment}
            onChange={(event) => setDialogComment(event.target.value)}
            rows={4}
            required
            autoFocus
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isWorking}
              onClick={() => {
                setDialogAction(null);
                setDialogComment("");
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!dialogComment.trim() || isWorking}
              onClick={handleDialogConfirm}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
