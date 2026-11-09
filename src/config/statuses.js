import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  FileCheck,
  FileEdit,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Inbox,
  PauseCircle,
  PenTool,
  Printer,
  RotateCcw,
  Send,
} from "lucide-react";
import { StatutDossier, StatutNote } from "@/types";

/**
 * Configuration visuelle des statuts de Dossier (Section 5)
 * Couleurs proposées :
 * - Reçu : bleu nuit
 * - En traitement : indigo
 * - En attente d'un autre bureau : ambre
 * - Transmis : vert
 * - Actif après retour : violet
 * - Clôturé : gris
 */
export const STATUT_DOSSIER_CONFIG = Object.freeze({
  [StatutDossier.RECU]: {
    id: StatutDossier.RECU,
    label: "Reçu",
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    dotClass: "bg-blue-600",
    icon: Inbox,
    description: "Dossier enregistré au secrétariat, en attente d'affectation",
  },
  [StatutDossier.EN_TRAITEMENT]: {
    id: StatutDossier.EN_TRAITEMENT,
    label: "En traitement",
    badgeClass: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    dotClass: "bg-indigo-600",
    icon: Clock,
    description: "En cours d'instruction, de rédaction ou de relecture au sein des cellules",
  },
  [StatutDossier.EN_ATTENTE_AUTRE_BUREAU]: {
    id: StatutDossier.EN_ATTENTE_AUTRE_BUREAU,
    label: "En attente d'un autre bureau",
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-600",
    icon: PauseCircle,
    description: "Dossier multi-bureaux en cours d'instruction chez un autre bureau partenaire",
  },
  [StatutDossier.TRANSMIS]: {
    id: StatutDossier.TRANSMIS,
    label: "Transmis",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-600",
    icon: CheckCircle2,
    description: "Note signée, cachetée et formellement transmise au destinataire",
  },
  [StatutDossier.ACTIF_APRES_RETOUR]: {
    id: StatutDossier.ACTIF_APRES_RETOUR,
    label: "Actif après retour",
    badgeClass: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    dotClass: "bg-purple-600",
    icon: RotateCcw,
    description: "Nouveau cycle de traitement ouvert suite à un retour ou des observations du cabinet",
  },
  [StatutDossier.CLOTURE]: {
    id: StatutDossier.CLOTURE,
    label: "Clôturé",
    badgeClass: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    dotClass: "bg-slate-600",
    icon: Archive,
    description: "Dossier définitivement traité et archivé",
  },
});

/**
 * Configuration visuelle des statuts de Note (Section 5)
 * Couleurs proposées :
 * - Brouillon : gris
 * - Relecture cellule : bleu clair
 * - Relecture bureau : bleu
 * - Validée : cyan
 * - En attente d'impression : ambre
 * - Imprimée : orange
 * - Signée : vert
 * - Transmise : vert foncé
 * - Rouverte : rouge
 */
export const STATUT_NOTE_CONFIG = Object.freeze({
  [StatutNote.BROUILLON]: {
    id: StatutNote.BROUILLON,
    label: "Brouillon",
    badgeClass: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    dotClass: "bg-slate-500",
    icon: FileEdit,
    stepIndex: 0,
    description: "En cours de rédaction initiale par le conseiller",
  },
  [StatutNote.RELECTURE_CELLULE]: {
    id: StatutNote.RELECTURE_CELLULE,
    label: "Relecture cellule",
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dotClass: "bg-sky-500",
    icon: FileText,
    stepIndex: 1,
    description: "Soumise à la relecture par le Chef de cellule",
  },
  [StatutNote.RELECTURE_BUREAU]: {
    id: StatutNote.RELECTURE_BUREAU,
    label: "Relecture bureau",
    badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    dotClass: "bg-blue-600",
    icon: FileSearch,
    stepIndex: 2,
    description: "Transmise au Chef de bureau (ou adjoint) pour examen",
  },
  [StatutNote.VALIDEE]: {
    id: StatutNote.VALIDEE,
    label: "Validée",
    badgeClass: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    dotClass: "bg-cyan-600",
    icon: FileCheck,
    stepIndex: 3,
    description: "Validée par le Chef de bureau, prête pour impression",
  },
  [StatutNote.EN_ATTENTE_IMPRESSION]: {
    id: StatutNote.EN_ATTENTE_IMPRESSION,
    label: "En attente d'impression",
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
    icon: Printer,
    stepIndex: 4,
    description: "Version finalisée en attente de sortie papier pour parapheur",
  },
  [StatutNote.IMPRIMEE]: {
    id: StatutNote.IMPRIMEE,
    label: "Imprimée",
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    dotClass: "bg-orange-500",
    icon: FileSpreadsheet,
    stepIndex: 5,
    description: "Sortie papier réalisée, intégrée au circuit parapheur",
  },
  [StatutNote.SIGNEE]: {
    id: StatutNote.SIGNEE,
    label: "Signée",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-600",
    icon: PenTool,
    stepIndex: 6,
    description: "Signée physiquement par l'autorité compétente",
  },
  [StatutNote.TRANSMISE]: {
    id: StatutNote.TRANSMISE,
    label: "Transmise",
    badgeClass: "border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-200",
    dotClass: "bg-teal-700",
    icon: Send,
    stepIndex: 7,
    description: "Cachet officiel apposé et transmise au cabinet / destinataire",
  },
  [StatutNote.ROUVERTE]: {
    id: StatutNote.ROUVERTE,
    label: "Rouverte",
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
    icon: AlertTriangle,
    stepIndex: -1,
    description: "Rouverte exceptionnellement après signature sur autorisation expresse",
  },
});

/**
 * Étapes séquentielles du circuit d'une note (pour WorkflowStepper)
 */
export const WORKFLOW_STEPS = Object.freeze([
  { id: StatutNote.BROUILLON, label: "Brouillon" },
  { id: StatutNote.RELECTURE_CELLULE, label: "Relecture cellule" },
  { id: StatutNote.RELECTURE_BUREAU, label: "Relecture bureau" },
  { id: StatutNote.VALIDEE, label: "Validée" },
  { id: StatutNote.IMPRIMEE, label: "Imprimée" },
  { id: StatutNote.SIGNEE, label: "Signée" },
  { id: "CACHETEE", label: "Cachetée" },
  { id: StatutNote.TRANSMISE, label: "Transmise" },
]);
