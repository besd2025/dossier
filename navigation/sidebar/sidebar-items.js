import {
  Bell,
  Building2,
  CheckSquare,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderOpen,
  History,
  KeyRound,
  Landmark,
  LayoutDashboard,
  PenTool,
  Search,
  Send,
  ShieldCheck,
  Undo2,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

/**
 * Configuration de la navigation latérale BESD.
 * Groupes requis : Pilotage, Dossiers, Secrétariat, Communication, Administration.
 * Référence : Section 3 de docs/BESD_structure_interfaces.md
 */
export const sidebarItems = [
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      {
        id: "dashboard",
        title: "Tableau de bord",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "recherche",
        title: "Recherche intelligente",
        url: "/recherche",
        icon: Search,
      },
    ],
  },
  {
    id: "dossiers-group",
    label: "Dossiers",
    items: [
      {
        id: "dossiers",
        title: "Liste des dossiers",
        url: "/dossiers",
        icon: FolderOpen,
      },
      {
        id: "nouveau-dossier",
        title: "Nouveau dossier",
        url: "/dossiers/nouveau",
        icon: FilePlus2,
      },
      {
        id: "a-affecter",
        title: "À affecter",
        url: "/a-affecter",
        icon: FileText,
      },
      {
        id: "mes-dossiers",
        title: "Mes dossiers à traiter",
        url: "/mes-dossiers",
        icon: CheckSquare,
      },
      {
        id: "relectures",
        title: "Notes à relire / valider",
        url: "/relectures",
        icon: FileCheck2,
      },
      {
        id: "signatures",
        title: "Circuit de signature",
        url: "/signatures",
        icon: PenTool,
      },
    ],
  },
  {
    id: "secretariat",
    label: "Secrétariat",
    items: [
      {
        id: "cachets",
        title: "Cachet / Transmission",
        url: "/secretariat/cachets",
        icon: Send,
      },
      {
        id: "retours-cabinet",
        title: "Retours du cabinet",
        url: "/retours-cabinet",
        icon: Undo2,
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      {
        id: "notifications",
        title: "Notifications",
        url: "/notifications",
        icon: Bell,
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      {
        id: "comptes",
        title: "Comptes utilisateurs",
        url: "/administration/comptes",
        icon: Users,
      },
      {
        id: "nouveau-compte",
        title: "Nouveau compte",
        url: "/administration/comptes/nouveau",
        icon: UserPlus,
      },
      {
        id: "cellules",
        title: "Cellules",
        url: "/administration/cellules",
        icon: Building2,
      },
      {
        id: "provenances",
        title: "Provenances",
        url: "/administration/provenances",
        icon: Landmark,
      },
      {
        id: "acces-exceptionnels",
        title: "Accès exceptionnels",
        url: "/administration/acces-exceptionnels",
        icon: KeyRound,
      },
      {
        id: "prises-en-charge",
        title: "Prises en charge",
        url: "/administration/prises-en-charge",
        icon: UserCheck,
      },
      {
        id: "journal",
        title: "Journal de traçabilité",
        url: "/administration/journal",
        icon: History,
      },
      {
        id: "roles",
        title: "Rôles et droits",
        url: "/administration/roles",
        icon: ShieldCheck,
      },
      {
        id: "profil",
        title: "Mon profil",
        url: "/profil",
        icon: UserRound,
      },
    ],
  },
];
