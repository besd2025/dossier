"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  Info,
  Layers,
  MessageSquare,
  PenTool,
  Printer,
  Shield,
  Tag,
  Undo2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataTable,
  EmptyState,
  ErrorState,
  HistoryTimeline,
  KeywordInput,
  ObservationThread,
  OverdueIndicator,
  PdfFirstPageViewer,
  PermissionGate,
  ProvenanceSelect,
  ReopenedBanner,
  StatusBadge,
  TableSkeleton,
  VersionDropzone,
  VersionList,
  WorkflowStepper,
} from "@/components/shared";
import { initialDossiers, initialMouvements } from "@/src/lib/mock/data";
import { StatutDossier, StatutNote, TypeMouvement } from "@/types";

/**
 * Page de démonstration interactive de TOUS les composants partagés BESD.
 * URL : /dev/composants
 * Note : Page temporaire à supprimer avant la mise en production (mentionnée dans la tâche).
 */
export default function DevComponentsPage() {
  // 1. États pour KeywordInput
  const [demoKeywords, setDemoKeywords] = React.useState([
    "Défense",
    "Télécoms tactiques",
    "Zone 4",
  ]);

  // 2. États pour ProvenanceSelect
  const [selectedProvenance, setSelectedProvenance] = React.useState("prov-01");

  // 3. États pour Observations
  const [demoObservations, setDemoObservations] = React.useState([
    {
      id: "obs-001",
      auteurNom: "Commandant Guillaume Petit",
      auteurRole: "Chef de cellule CASEAG",
      dateCreation: "2026-02-15T10:30:00Z",
      texte: "Revoir l'estimation financière du lot 2 conformément aux barèmes 2026.",
      resolue: true,
      dateResolution: "2026-02-16T14:15:00Z",
      resolueParNom: "M. Richard (Conseiller)",
    },
    {
      id: "obs-002",
      auteurNom: "Colonel Alexandre Martin",
      auteurRole: "Chef de bureau",
      dateCreation: "2026-02-18T16:45:00Z",
      texte: "Préciser la compatibilité avec les systèmes alliés dans la synthèse exécutive.",
      resolue: false,
    },
  ]);

  // 4. États pour Versions Word
  const [demoVersions, setDemoVersions] = React.useState([
    {
      id: "ver-001",
      numeroVersion: 1,
      nomFichier: "Note_Transmission_Zone4_V1.docx",
      auteurNom: "M. Thomas Richard",
      dateCreation: "2026-02-14T11:00:00Z",
      tailleFichier: "142 Ko",
      commentaire: "Premier jet pour relecture interne à la cellule.",
    },
    {
      id: "ver-002",
      numeroVersion: 2,
      nomFichier: "Note_Transmission_Zone4_V2.docx",
      auteurNom: "M. Thomas Richard",
      dateCreation: "2026-02-17T09:30:00Z",
      tailleFichier: "156 Ko",
      commentaire: "Intégration des observations du Chef de cellule.",
      isLatest: true,
    },
  ]);

  // Handler ajout observation
  const handleAddObservation = (texte) => {
    const newObs = {
      id: `obs-${Date.now()}`,
      auteurNom: "Alexandre Martin",
      auteurRole: "Chef de bureau",
      dateCreation: new Date().toISOString(),
      texte,
      resolue: false,
    };
    setDemoObservations((prev) => [newObs, ...prev]);
  };

  // Handler toggle observation
  const handleToggleObservation = (id, resolue) => {
    setDemoObservations((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              resolue,
              dateResolution: resolue ? new Date().toISOString() : null,
              resolueParNom: resolue ? "Utilisateur connecté" : null,
            }
          : o
      )
    );
  };

  // Handler upload version
  const handleUploadVersion = (file, comment) => {
    const nextVerNum = demoVersions.length + 1;
    const newVer = {
      id: `ver-${Date.now()}`,
      numeroVersion: nextVerNum,
      nomFichier: file.name,
      auteurNom: "Utilisateur actif",
      dateCreation: new Date().toISOString(),
      tailleFichier: `${Math.round(file.size / 1024)} Ko`,
      commentaire: comment || `Version V${nextVerNum} déposée`,
      isLatest: true,
    };
    setDemoVersions((prev) => [
      ...prev.map((v) => ({ ...v, isLatest: false })),
      newVer,
    ]);
  };

  // 5. Colonnes simples pour le DataTable de démonstration
  const demoColumns = React.useMemo(
    () => [
      {
        accessorKey: "reference",
        header: "Référence",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-primary">
            {row.getValue("reference")}
          </span>
        ),
      },
      {
        accessorKey: "objet",
        header: "Objet du dossier",
        cell: ({ row }) => (
          <span className="truncate max-w-xs block font-medium">
            {row.getValue("objet")}
          </span>
        ),
      },
      {
        accessorKey: "provenanceNom",
        header: "Provenance",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-[11px]">
            {row.getValue("provenanceNom")}
          </span>
        ),
      },
      {
        accessorKey: "statutDossier",
        header: "Statut",
        cell: ({ row }) => (
          <StatusBadge type="dossier" status={row.getValue("statutDossier")} size="sm" />
        ),
      },
      {
        accessorKey: "joursSansAvancement",
        header: "Avancement",
        cell: ({ row }) => (
          <OverdueIndicator
            days={row.getValue("joursSansAvancement")}
            compact
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-12">
      {/* En-tête de la page de démonstration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Composants partagés BESD
            </h1>
            <Badge variant="secondary" className="font-mono text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Dev / Démonstration temporaire
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Galerie interactive des 15 composants partagés créés conformément à la section 5 de <code>docs/BESD_structure_interfaces.md</code>.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-[11px] self-start sm:self-center">
          Route : /dev/composants
        </Badge>
      </div>

      <Tabs defaultValue="statuts-stepper" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted/60 gap-1">
          <TabsTrigger value="statuts-stepper" className="text-xs">
            1. Statuts & Stepper
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            2. HistoryTimeline
          </TabsTrigger>
          <TabsTrigger value="datatable" className="text-xs">
            3. DataTable générique
          </TabsTrigger>
          <TabsTrigger value="pdf" className="text-xs">
            4. PdfFirstPageViewer
          </TabsTrigger>
          <TabsTrigger value="versions-obs" className="text-xs">
            5. Versions & Observations
          </TabsTrigger>
          <TabsTrigger value="formulaires" className="text-xs">
            6. Mots-clés & Provenance
          </TabsTrigger>
          <TabsTrigger value="alertes-etats" className="text-xs">
            7. Alertes & États standard
          </TabsTrigger>
        </TabsList>

        {/* ONGLET 1 : STATUTS & WORKFLOW STEPPER */}
        <TabsContent value="statuts-stepper" className="space-y-6">
          {/* StatusBadge Dossier */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <span>StatusBadge — Statuts des dossiers</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Couleurs officielles : Reçu (bleu), En traitement (indigo), En attente d&apos;un autre bureau (ambre), Transmis (vert), Actif après retour (violet), Clôturé (gris).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2.5">
              {Object.values(StatutDossier).map((st) => (
                <StatusBadge key={st} type="dossier" status={st} />
              ))}
            </CardContent>
          </Card>

          {/* StatusBadge Note */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileCheck2 className="size-4 text-primary" />
                <span>StatusBadge — Statuts des notes</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Cycle complet : Brouillon, Relecture cellule, Relecture bureau, Validée, En attente d&apos;impression, Imprimée, Signée, Transmise, et Rouverte.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2.5">
              {Object.values(StatutNote).map((st) => (
                <StatusBadge key={st} type="note" status={st} />
              ))}
            </CardContent>
          </Card>

          {/* WorkflowStepper standard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>WorkflowStepper — Circuit en cours (Étape 3 : Relecture bureau)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Affiche l&apos;étape active mise en évidence et les auteurs/dates renseignés sous chaque étape franchie.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <WorkflowStepper
                currentStatus={StatutNote.RELECTURE_BUREAU}
                stepHistory={{
                  [StatutNote.BROUILLON]: {
                    author: "M. Richard",
                    date: "2026-02-14T09:00:00Z",
                  },
                  [StatutNote.RELECTURE_CELLULE]: {
                    author: "Cdt Petit",
                    date: "2026-02-16T14:30:00Z",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* WorkflowStepper avec note rouverte */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-600" />
                <span>WorkflowStepper — Cas particulier : Note rouverte après signature</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Mise en évidence rouge de l&apos;étape de signature réouverte avec bandeau explicatif.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <WorkflowStepper
                currentStatus={StatutNote.ROUVERTE}
                showReopenedBanner
                stepHistory={{
                  [StatutNote.SIGNEE]: {
                    author: "Col. Martin",
                    date: "2026-02-20T11:00:00Z",
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 2 : HISTORY TIMELINE */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <span>HistoryTimeline — Frise chronologique unique du dossier</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Filtre par type de mouvement, recherche textuelle, dates au format <code>jj/MM/aaaa à HH:mm</code>, et mise en évidence des consultations de l&apos;adjoint (Règle 4.5).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTimeline movements={initialMouvements} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 3 : DATA TABLE */}
        <TabsContent value="datatable" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>DataTable générique (TanStack Table v9)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Recherche intégrée, sélecteur de colonnes visibles, tri interactif, sélection de lignes et pagination dynamique.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={initialDossiers}
                columns={demoColumns}
                searchPlaceholder="Rechercher par référence, objet ou provenance..."
                emptyMessage="Aucun dossier ne correspond à la recherche."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 4 : PDF VIEWER */}
        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>PdfFirstPageViewer — Visionneuse de la première page</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Aperçu sécurisé avec zoom, rotation, téléchargement et mention obligatoire « Seule la première page est numérisée » (Sections 4.4, 4.5, 4.11).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PdfFirstPageViewer
                src="/sample-document.pdf"
                reference="2026-D-0142"
                title="Dossier n° 2026-D-0142 — Première page"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 5 : VERSIONS & OBSERVATIONS */}
        <TabsContent value="versions-obs" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Liste et dépôt de versions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HardDrive className="size-4 text-primary" />
                  <span>VersionList — Versions Word du document</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Affiche les versions successives avec taille, auteur, commentaire et statut « dernière version ».
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VersionList
                  versions={demoVersions}
                  onDownload={(v) => alert(`Téléchargement de la version V${v.numeroVersion}`)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HardDrive className="size-4 text-primary" />
                  <span>VersionDropzone — Dépôt de nouvelle version</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Glisser-déposer de fichiers .docx avec consigne officielle et champ de commentaire.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VersionDropzone onUpload={handleUploadVersion} />
              </CardContent>
            </Card>
          </div>

          {/* Observations */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <span>ObservationThread — Fil de remarques</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Commentaires courts, case à cocher « Résolue » et ajout rapide avec notification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ObservationThread
                observations={demoObservations}
                onAddObservation={handleAddObservation}
                onToggleResolve={handleToggleObservation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 6 : FORMULAIRES (MOTS-CLÉS & PROVENANCES) */}
        <TabsContent value="formulaires" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  <span>KeywordInput — Saisie des mots-clés</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Badges amovibles, validation Entrée/Virgule, obligatoire avant dépôt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordInput
                  keywords={demoKeywords}
                  onChange={setDemoKeywords}
                  placeholder="Tapez un mot-clé (ex: Radar, Budget...) puis Entrée"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <span>ProvenanceSelect — Sélecteur d&apos;institution</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Liste des provenances avec option « Autre » ouvrant un dialogue de création immédiate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProvenanceSelect
                  value={selectedProvenance}
                  onChange={(val) => setSelectedProvenance(val)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Identifiant sélectionné : <code>{selectedProvenance}</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ONGLET 7 : ALERTES & ÉTATS STANDARD */}
        <TabsContent value="alertes-etats" className="space-y-4">
          {/* ReopenedBanner & OverdueIndicator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                <span>ReopenedBanner & OverdueIndicator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReopenedBanner
                reouverture={{
                  motif: "Mise à jour requise suite à l'arbitrage ministériel sur les effectifs.",
                  autorisePar: "Colonel Alexandre Martin (Chef de bureau)",
                  date: "2026-02-23T10:00:00Z",
                  versionOrigineNumero: 1,
                }}
                onViewOriginalVersion={() => alert("Affichage de la version signée originale archivée.")}
              />

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Dossier à jour :</span>
                  <OverdueIndicator days={3} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Dossier en retard (&gt; 7 jours) :</span>
                  <OverdueIndicator days={12} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Format compact :</span>
                  <OverdueIndicator days={14} compact />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EmptyState, ErrorState, TableSkeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">EmptyState</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="Aucun dossier en attente"
                  description="Tous les dossiers transmis ont été pris en charge par les cellules."
                  action={{
                    label: "Créer un dossier",
                    onClick: () => alert("Redirection vers nouveau dossier"),
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">ErrorState</CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorState
                  title="Erreur de connexion aux services"
                  message="Impossible de charger la liste des dossiers depuis le service local."
                  onRetry={() => alert("Tentative de reconnexion...")}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">TableSkeleton</CardTitle>
              <CardDescription className="text-xs">
                Animation de chargement pendant les requêtes asynchrones vers <code>services/*</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSkeleton columns={5} rows={3} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
