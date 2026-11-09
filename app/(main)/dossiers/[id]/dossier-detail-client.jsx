"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  UserRound,
  UsersRound,
} from "lucide-react";

import { PermissionGate } from "@/components/permission-gate";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  ErrorState,
  HistoryTimeline,
  PdfFirstPageViewer,
  StatusBadge,
} from "@/components/shared";
import { getDossier } from "@/lib/services/dossiers-service";
import { useSessionStore } from "@/stores/session/session-store";
import { Role, StatutDossier, StatutNote, TypeDocument } from "@/types";

const INSTRUCTION_LABELS = Object.freeze({
  POUR_ANALYSE: "Pour analyse",
  POUR_ACTION: "Pour action",
  POUR_TRAITEMENT: "Pour traitement",
  POUR_CLASSEMENT: "Pour classement",
  POUR_INFO: "Pour information",
  POUR_SUIVI: "Pour suivi",
  AUTRE: "Autre",
});

const ORIGINE_LABELS = Object.freeze({
  VIA_CABINET_CIVIL: "Via le cabinet civil",
  DIRECT_CHEF_BUREAU: "Direct chef de bureau",
  RETOUR_CABINET_SANS_DOSSIER: "Retour du cabinet sans dossier préalable",
});

const DOCUMENT_LABELS = Object.freeze({
  [TypeDocument.NOTE_CABINET_CIVIL]: "Note au Chef de cabinet civil",
  [TypeDocument.NOTE_PRESIDENT]: "Note au Président",
  [TypeDocument.PROJET_LETTRE]: "Projet de lettre",
});

const ACTIONS = Object.freeze({
  affecter: {
    label: "Affecter",
    ability: "affecter",
    roles: [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT, Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT],
  },
  confierAdjoint: {
    label: "Confier à l'adjoint",
    ability: "gerer_prises_en_charge",
    roles: [Role.CHEF_BUREAU],
  },
  retour: {
    label: "Retour du cabinet",
    ability: "enregistrer_retour",
    roles: [Role.SECRETARIAT],
  },
  clore: {
    label: "Clore",
    ability: "clore_dossier",
    roles: [Role.CHEF_BUREAU],
  },
});

function displayName(user) {
  if (!user) return "—";
  return [user.prenom, user.nom].filter(Boolean).join(" ") || user.nom || user.id || "—";
}

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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatInstruction(value) {
  return INSTRUCTION_LABELS[value] || value || "—";
}

function formatOrigin(value) {
  return ORIGINE_LABELS[value] || value || "—";
}

function getNextAction(note) {
  if (!note) return { action: "Aucune note en cours", owner: "—" };
  switch (note.statutNote) {
    case StatutNote.BROUILLON:
    case StatutNote.ROUVERTE:
      return { action: "Déposer une version", owner: displayName(note.redacteur) };
    case StatutNote.RELECTURE_CELLULE:
      return { action: "Relecture de la cellule", owner: "Chef de cellule" };
    case StatutNote.RELECTURE_BUREAU:
      return { action: "Relecture du bureau", owner: "Chef de bureau" };
    case StatutNote.VALIDEE:
    case StatutNote.EN_ATTENTE_IMPRESSION:
      return { action: "Impression de la note", owner: "Secrétariat" };
    case StatutNote.IMPRIMEE:
      return { action: "Signature", owner: "Chef de bureau" };
    case StatutNote.SIGNEE:
      return { action: "Apposition du cachet", owner: "Secrétariat" };
    case StatutNote.TRANSMISE:
      return { action: "Aucune action en attente", owner: "—" };
    default:
      return { action: "À déterminer", owner: "—" };
  }
}

function getPanelAction(note, role) {
  if (!note) return null;

  if (
    note.statutNote === StatutNote.RELECTURE_CELLULE &&
    [Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role)
  ) {
    return { label: "Traiter la relecture", ability: "relire" };
  }
  if (
    note.statutNote === StatutNote.RELECTURE_BUREAU &&
    [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role)
  ) {
    return { label: "Valider la note", ability: "valider" };
  }
  if (
    [StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION].includes(note.statutNote) &&
    [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT, Role.SECRETARIAT].includes(role)
  ) {
    return { label: "Imprimer la note", ability: "imprimer" };
  }
  if (
    note.statutNote === StatutNote.IMPRIMEE &&
    [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role)
  ) {
    return { label: "Signer la note", ability: "signer" };
  }
  if (note.statutNote === StatutNote.SIGNEE && role === Role.SECRETARIAT) {
    return { label: "Enregistrer le cachet", ability: "cacheter" };
  }

  return null;
}

function LoadingDetail() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement de la fiche dossier">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-[28rem] animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function InformationRow({ label, children }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children || "—"}</dd>
    </div>
  );
}

function LimitedAccessMessage() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <LockKeyhole className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
      <p>
        <span className="font-semibold">Accès limité</span>
        {" — demander un accès exceptionnel au Chef de bureau."}
      </p>
    </div>
  );
}

export default function DossierDetailClient({ dossierId }) {
  const router = useRouter();
  const role = useSessionStore((state) => state.role);
  const user = useSessionStore((state) => state.user);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [dialogAction, setDialogAction] = useState(null);

  useEffect(() => {
    let active = true;
    getDossier(dossierId)
      .then((result) => {
        if (active) setDossier(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || "Impossible de charger la fiche du dossier.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dossierId, reloadKey]);

  const retry = useCallback(() => {
    setError("");
    setDossier(null);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  const celluleIds = useMemo(
    () => new Set((dossier?.cellules || []).map((assignment) => assignment.celluleId)),
    [dossier],
  );
  const isCelluleRole = role === Role.CHEF_CELLULE || role === Role.CHEF_CELLULE_ADJOINT;
  const isOutOfCellScope = Boolean(
    isCelluleRole && user?.celluleId && !celluleIds.has(user.celluleId),
  );
  const isSecretariat = role === Role.SECRETARIAT;
  const canSeeAccessTab = role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT;

  const allNotes = useMemo(
    () => (dossier?.cycles || []).flatMap((cycle) => cycle.notes || []),
    [dossier],
  );
  const currentNote = useMemo(
    () =>
      [...allNotes].sort(
        (a, b) => new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime(),
      )[0] || null,
    [allNotes],
  );
  const latestVersion = useMemo(
    () => currentNote?.versions?.[currentNote.versions.length - 1] || null,
    [currentNote],
  );
  const nextAction = getNextAction(currentNote);
  const panelAction = getPanelAction(currentNote, role);
  const assignedCells = useMemo(
    () =>
      (dossier?.cellules || []).map((assignment) => ({
        ...assignment,
        label: assignment.cellule?.code || assignment.cellule?.nom || assignment.celluleId,
      })),
    [dossier],
  );
  const permissionDossier = useMemo(
    () => ({
      ...dossier,
      cellulePrincipale: assignedCells.find((cell) => cell.type === "PRINCIPALE")?.cellule?.code,
      cellules: assignedCells.map((cell) => cell.cellule?.code).filter(Boolean),
      affectations: dossier?.affectations || [],
    }),
    [dossier, assignedCells],
  );

  if (loading) return <LoadingDetail />;
  if (error) {
    return (
      <ErrorState
        title="Fiche dossier indisponible"
        message="La fiche n'a pas pu être chargée."
        error={error}
        onRetry={retry}
      />
    );
  }
  if (!dossier) {
    return (
      <EmptyState
        icon={FileText}
        title="Dossier introuvable"
        description="Aucun dossier ne correspond à cette référence."
        action={{
          label: "Retour aux dossiers",
          href: "/dossiers",
          icon: ArrowLeft,
        }}
      />
    );
  }

  const openActionDialog = (action) => setDialogAction(action);
  const visibleActions = Object.entries(ACTIONS).filter(([, action]) => action.roles.includes(role));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-8"
              onClick={() => router.push("/dossiers")}
            >
              <ArrowLeft className="size-4" />
              Retour aux dossiers
            </Button>
            {isOutOfCellScope ? (
              <div>
                <h1 className="text-xl font-bold tracking-tight">Dossier à accès limité</h1>
                <LimitedAccessMessage />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{dossier.reference}</h1>
                  <StatusBadge status={dossier.statutDossier} type="dossier" />
                  {dossier.multiBureaux && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                      Multi-bureaux
                    </span>
                  )}
                </div>
                <p className="max-w-4xl text-sm text-muted-foreground">{dossier.objet}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="size-3.5" />
                    {assignedCells.length
                      ? assignedCells.map((cell) => cell.label).join(", ")
                      : "Aucune cellule affectée"}
                  </span>
                  <span>{dossier.provenanceNom}</span>
                  <span>{formatInstruction(dossier.instructionCabinet)}</span>
                </div>
              </>
            )}
          </div>

          {!isOutOfCellScope && visibleActions.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {visibleActions.map(([key, action]) => {
                if (
                  key === "affecter" &&
                  ![
                    StatutDossier.RECU,
                    StatutDossier.EN_TRAITEMENT,
                    StatutDossier.ACTIF_APRES_RETOUR,
                  ].includes(dossier.statutDossier)
                ) return null;
                if (key === "confierAdjoint" && dossier.statutDossier === StatutDossier.CLOTURE) return null;
                if (key === "retour" && dossier.statutDossier !== StatutDossier.TRANSMIS) return null;
                if (key === "clore" && dossier.statutDossier === StatutDossier.CLOTURE) return null;
                return (
                  <PermissionGate
                    key={key}
                    ability={action.ability}
                    context={{ dossier }}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant={key === "clore" ? "outline" : "default"}
                      onClick={() => openActionDialog(action)}
                    >
                      {action.label}
                    </Button>
                  </PermissionGate>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs defaultValue="informations" className="min-w-0">
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-full min-w-[38rem] justify-start">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="affectations">Affectations</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
              <TabsTrigger value="acces" disabled={!canSeeAccessTab}>
                Accès
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="informations" className="mt-4 space-y-4">
            {isOutOfCellScope ? (
              <>
                <LimitedAccessMessage />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mots-clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossier.motsCles?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {dossier.motsCles.map((keyword) => (
                          <span key={keyword} className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun mot-clé renseigné.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {dossier.statutDossier === StatutDossier.EN_ATTENTE_AUTRE_BUREAU && (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-200"
                  >
                    <BriefcaseBusiness className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-semibold">En attente d&apos;un autre bureau</p>
                      <p className="mt-1 text-xs">
                        Le dossier reprendra son circuit après réception effective par le bureau suivant.
                        {dossier.bureauPrecedent ? ` Bureau précédent : ${dossier.bureauPrecedent}.` : ""}
                      </p>
                    </div>
                  </div>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations d&apos;enregistrement</CardTitle>
                    <CardDescription>Données administratives et instruction du dossier.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                      <InformationRow label="Référence">{dossier.reference}</InformationRow>
                      <InformationRow label="Objet">{dossier.objet}</InformationRow>
                      <InformationRow label="Provenance">{dossier.provenanceNom}</InformationRow>
                      <InformationRow label="Instruction">{formatInstruction(dossier.instructionCabinet)}</InformationRow>
                      <InformationRow label="Origine">{formatOrigin(dossier.origine)}</InformationRow>
                      <InformationRow label="Cellule(s)">
                        {assignedCells.map((cell) => `${cell.label} (${cell.type === "PRINCIPALE" ? "principale" : "collaboratrice"})`).join(", ") || "Non affecté"}
                      </InformationRow>
                      <InformationRow label="Transmission par l'institution d'origine">
                        {formatDate(dossier.dateTransmissionOrigine)}
                      </InformationRow>
                      <InformationRow label="Réception au cabinet">{formatDate(dossier.dateReceptionCabinet)}</InformationRow>
                      <InformationRow label="Réception au BESD">{formatDate(dossier.dateReceptionBesd)}</InformationRow>
                      {dossier.multiBureaux && (
                        <>
                          <InformationRow label="Bureau précédent">{dossier.bureauPrecedent}</InformationRow>
                          <InformationRow label="Rang BESD">{dossier.rangBesd}</InformationRow>
                          <InformationRow label="Mise en attente">{formatDate(dossier.dateMiseEnAttente)}</InformationRow>
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mots-clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossier.motsCles?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {dossier.motsCles.map((keyword) => (
                          <span key={keyword} className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun mot-clé renseigné.</p>
                    )}
                  </CardContent>
                </Card>

                {dossier.premierePagePdfUrl ? (
                  <PdfFirstPageViewer
                    src={dossier.premierePagePdfUrl}
                    title="Première page du dossier"
                    reference={dossier.reference}
                  />
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="Première page indisponible"
                    description="Aucun fichier PDF de première page n'est associé à ce dossier."
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="affectations" className="mt-4">
            {isOutOfCellScope ? (
              <LimitedAccessMessage />
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cellules rattachées</CardTitle>
                    <CardDescription>Cellule principale et cellules collaboratrices.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assignedCells.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {assignedCells.map((cell) => (
                          <div key={cell.id} className="rounded-lg border p-3">
                            <p className="font-medium">{cell.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {cell.type === "PRINCIPALE" ? "Cellule principale" : "Cellule collaboratrice"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={UsersRound}
                        title="Aucune cellule affectée"
                        description="L'affectation du dossier n'a pas encore été enregistrée."
                        className="min-h-40"
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique des affectations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dossier.affectations?.length ? (
                      <div className="space-y-3">
                        {dossier.affectations.map((assignment) => (
                          <div key={assignment.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto]">
                            <div>
                              <p className="text-sm font-medium">
                                {assignment.destinataire?.code ||
                                  displayName(assignment.destinataire) ||
                                  assignment.cellule?.code ||
                                  assignment.destinataireId ||
                                  "Destinataire inconnu"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {assignment.type.replaceAll("_", " ")}
                                {assignment.conseillerPrefere
                                  ? ` · Conseiller préféré : ${displayName(assignment.conseillerPrefere)}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Par {displayName(assignment.auteur)}
                              </p>
                            </div>
                            <time className="text-xs text-muted-foreground">{formatDateTime(assignment.date)}</time>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={CalendarDays}
                        title="Aucune affectation enregistrée"
                        description="Les mouvements d'affectation apparaîtront ici."
                        className="min-h-40"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            {isOutOfCellScope ? (
              <LimitedAccessMessage />
            ) : dossier.cycles?.length ? (
              <div className="space-y-4">
                {dossier.cycles.map((cycle) => (
                  <Card key={cycle.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {cycle.numeroCycle === 1 ? "Cycle initial" : `Cycle ${cycle.numeroCycle}`}
                      </CardTitle>
                      <CardDescription>
                        {cycle.typeSuite === "INITIAL" ? "Traitement initial" : `Suite : ${cycle.typeSuite.replaceAll("_", " ").toLowerCase()}`}
                        {" · Ouvert le "}
                        {formatDate(cycle.dateOuverture)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {cycle.notes?.length ? (
                        cycle.notes.map((note) => (
                          <div key={note.id} className="rounded-lg border p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 space-y-1.5">
                                <p className="font-medium">{DOCUMENT_LABELS[note.typeDocument] || note.typeDocument}</p>
                                <p className="text-xs text-muted-foreground">Destinataire : {note.destinataire || "—"}</p>
                                <p className="text-xs text-muted-foreground">Rédacteur : {displayName(note.redacteur)}</p>
                                {note.numeroOfficiel && (
                                  <p className="text-xs text-muted-foreground">Numéro officiel : {note.numeroOfficiel}</p>
                                )}
                              </div>
                              <StatusBadge
                                status={note.statutNote}
                                type="note"
                                size="sm"
                              />
                            </div>
                            {isSecretariat ? (
                              <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                                Consultation limitée à la première page de la note.
                                {note.premierePagePdfUrl ? (
                                  <div className="mt-3">
                                    <PdfFirstPageViewer
                                      src={note.premierePagePdfUrl}
                                      title="Première page de la note"
                                      reference={note.numeroOfficiel || dossier.reference}
                                    />
                                  </div>
                                ) : (
                                  <p className="mt-1">Aucun aperçu de première page n&apos;est disponible dans les données de démonstration.</p>
                                )}
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => router.push(`/dossiers/${dossier.id}/notes/${note.id}`)}
                              >
                                Consulter la note
                                <ArrowRight className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          icon={FileText}
                          title="Aucune note dans ce cycle"
                          description="Les notes créées dans ce cycle apparaîtront ici."
                          className="min-h-40"
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Aucun cycle de traitement"
                description="Les cycles et leurs notes apparaîtront ici."
              />
            )}
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique du dossier</CardTitle>
                <CardDescription>Frise chronologique des mouvements de traçabilité.</CardDescription>
              </CardHeader>
              <CardContent>
                <HistoryTimeline movements={dossier.mouvements || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acces" className="mt-4">
            {isOutOfCellScope ? (
              <LimitedAccessMessage />
            ) : !canSeeAccessTab ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                L&apos;onglet Accès est réservé au Chef de bureau et à son adjoint.
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <KeyRound className="size-4" />
                      Accès exceptionnels
                    </CardTitle>
                    <CardDescription>Accès accordés à des utilisateurs hors périmètre habituel.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dossier.accesExceptionnels?.length ? (
                      <div className="space-y-3">
                        {dossier.accesExceptionnels.map((access) => (
                          <div key={access.id} className="rounded-lg border p-3">
                            <p className="text-sm font-medium">{displayName(access.beneficiaire)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{access.motif}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Accordé par {displayName(access.accordePar)} · {formatDate(access.date)}
                              {access.echeance ? ` · Échéance : ${formatDate(access.echeance)}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={KeyRound}
                        title="Aucun accès exceptionnel"
                        description="Aucun accès n'a été accordé sur ce dossier."
                        className="min-h-40"
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserRound className="size-4" />
                      Prises en charge
                    </CardTitle>
                    <CardDescription>Délégations de suivi confiées à un adjoint.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dossier.prisesEnCharge?.length ? (
                      <div className="space-y-3">
                        {dossier.prisesEnCharge.map((prise) => (
                          <div key={prise.id} className="rounded-lg border p-3">
                            <p className="text-sm font-medium">{displayName(prise.adjoint)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Titulaire : {displayName(prise.titulaire)} · Accordée le {formatDateTime(prise.dateHeure)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {prise.active ? "Active" : "Terminée"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={UserRound}
                        title="Aucune prise en charge"
                        description="Aucune délégation de suivi n'est enregistrée pour ce dossier."
                        className="min-h-40"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="size-4 text-primary" />
              Note en cours
            </CardTitle>
            <CardDescription>Prochaine étape du circuit de traitement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOutOfCellScope ? (
              <LimitedAccessMessage />
            ) : currentNote ? (
              <>
                <div>
                  <p className="text-sm font-semibold">
                    {DOCUMENT_LABELS[currentNote.typeDocument] || currentNote.typeDocument}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{currentNote.destinataire || "Destinataire non précisé"}</p>
                </div>
                <StatusBadge
                  status={currentNote.statutNote}
                  type="note"
                  size="sm"
                />
                <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                  {isSecretariat ? (
                    <InformationRow label="Document consultable">Première page uniquement</InformationRow>
                  ) : (
                    <InformationRow label="Dernière version">
                      {latestVersion
                        ? `V${latestVersion.numeroVersion} · ${latestVersion.nomFichier}`
                        : "Aucune version déposée"}
                    </InformationRow>
                  )}
                  <InformationRow label="Prochaine action">{nextAction.action}</InformationRow>
                  <InformationRow label="Responsable attendu">{nextAction.owner}</InformationRow>
                </div>
                {isSecretariat ? (
                  <p className="text-xs text-muted-foreground">
                    Le secrétariat consulte uniquement la première page des notes.
                  </p>
                ) : (
                  <PermissionGate
                    ability="voir_dossier"
                    context={{ dossier: permissionDossier }}
                    mode="masquer"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/dossiers/${dossier.id}/notes/${currentNote.id}`)}
                    >
                      Ouvrir la note
                      <ArrowRight className="size-4" />
                    </Button>
                  </PermissionGate>
                )}
                {panelAction && (
                  <PermissionGate
                    ability={panelAction.ability}
                    context={{ dossier }}
                  >
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => openActionDialog(panelAction)}
                    >
                      {panelAction.label}
                      <ArrowRight className="size-4" />
                    </Button>
                  </PermissionGate>
                )}
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="Aucune note en cours"
                description="La prochaine note apparaîtra ici après sa création."
                className="min-h-40 border-0 bg-transparent p-2"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(dialogAction)} onOpenChange={(open) => !open && setDialogAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction?.label || "Action sur le dossier"}</DialogTitle>
            <DialogDescription>
              Cette action sera construite à une prochaine étape.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            Le formulaire de cette action n&apos;est pas encore disponible.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogAction(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
