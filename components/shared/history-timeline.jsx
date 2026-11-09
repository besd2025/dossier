"use client";

import * as React from "react";
import {
  Activity,
  AlertOctagon,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  KeyRound,
  MessageSquare,
  PenTool,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Undo2,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateTime } from "@/lib/utils";
import { TypeMouvement } from "@/types";

/**
 * Configuration visuelle des types de mouvement
 */
const MOUVEMENT_CONFIG = Object.freeze({
  [TypeMouvement.RECEPTION]: {
    label: "Réception",
    icon: FilePlus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  [TypeMouvement.AFFECTATION]: {
    label: "Affectation",
    icon: UserCheck,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  [TypeMouvement.DEPOT_VERSION]: {
    label: "Dépôt de version",
    icon: FileText,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  [TypeMouvement.OBSERVATION]: {
    label: "Observation",
    icon: MessageSquare,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  [TypeMouvement.VALIDATION]: {
    label: "Validation",
    icon: FileCheck2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  [TypeMouvement.IMPRESSION]: {
    label: "Impression",
    icon: Printer,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  [TypeMouvement.SIGNATURE]: {
    label: "Signature",
    icon: PenTool,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-600/15 border-emerald-600/30",
  },
  [TypeMouvement.CACHET]: {
    label: "Cachet officiel",
    icon: ShieldCheck,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  [TypeMouvement.TRANSMISSION]: {
    label: "Transmission",
    icon: Send,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  [TypeMouvement.RETOUR_CABINET]: {
    label: "Retour cabinet",
    icon: Undo2,
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-500/15 border-purple-500/30",
  },
  [TypeMouvement.REOUVERTURE]: {
    label: "Réouverture",
    icon: AlertOctagon,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/15 border-red-500/30 ring-2 ring-red-500/20",
  },
  [TypeMouvement.ACCES_ACCORDE]: {
    label: "Accès accordé",
    icon: KeyRound,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  [TypeMouvement.CONSULTATION_ADJOINT]: {
    label: "Consultation par l'adjoint",
    icon: Eye,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/20 border-amber-500/40 ring-2 ring-amber-500/30",
    isAdjoint: true,
  },
  [TypeMouvement.CREATION_COMPTE]: {
    label: "Création de compte",
    icon: UserPlus,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
});

/**
 * @typedef {Object} HistoryTimelineProps
 * @property {Array} movements - Liste des mouvements du dossier (MouvementDossier)
 * @property {boolean} [showFilter=true] - Affiche la barre de filtrage et recherche
 * @property {string} [initialFilter="ALL"] - Type de mouvement initialement filtré
 * @property {number} [maxItems] - Nombre maximal d'événements affichés
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Frise chronologique unique et filtrable de l'historique du dossier.
 * Conforme aux sections 4.5 et 4.21 :
 * « Frise chronologique unique... chaque ligne avec auteur, date, icône par type.
 * Filtrable par type de mouvement. Mise en évidence des consultations de l'adjoint. »
 *
 * @param {HistoryTimelineProps} props
 */
export function HistoryTimeline({
  movements = [],
  showFilter = true,
  initialFilter = "ALL",
  maxItems,
  className,
}) {
  const [selectedType, setSelectedType] = React.useState(initialFilter);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Tri antichronologique (le plus récent en premier)
  const sortedMovements = React.useMemo(() => {
    return [...movements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [movements]);

  // Filtrage par type et recherche texte
  const filteredMovements = React.useMemo(() => {
    return sortedMovements.filter((mvt) => {
      if (selectedType !== "ALL" && mvt.typeMouvement !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = (mvt.description || "").toLowerCase().includes(query);
        const authorMatch = (mvt.auteurNom || mvt.auteur || "").toLowerCase().includes(query);
        return descMatch || authorMatch;
      }
      return true;
    });
  }, [sortedMovements, selectedType, searchQuery]);

  const displayedMovements = maxItems
    ? filteredMovements.slice(0, maxItems)
    : filteredMovements;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Barre de filtre et de recherche */}
      {showFilter && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 text-xs w-48 bg-background">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types ({sortedMovements.length})</SelectItem>
                {Object.keys(MOUVEMENT_CONFIG).map((typeKey) => {
                  const cfg = MOUVEMENT_CONFIG[typeKey];
                  const count = sortedMovements.filter((m) => m.typeMouvement === typeKey).length;
                  if (count === 0) return null;
                  return (
                    <SelectItem key={typeKey} value={typeKey} className="text-xs">
                      {cfg.label} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono self-end sm:self-center">
            {displayedMovements.length} événement(s)
          </div>
        </div>
      )}

      {/* Liste chronologique */}
      {displayedMovements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20 border-dashed">
          <History className="size-8 text-muted-foreground/60 mb-2" />
          <p className="text-xs font-medium text-foreground">Aucun mouvement trouvé</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Aucun événement ne correspond aux filtres appliqués.
          </p>
          {(selectedType !== "ALL" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedType("ALL");
                setSearchQuery("");
              }}
              className="mt-3 h-7 text-xs"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/80">
          {displayedMovements.map((mvt) => {
            const config = MOUVEMENT_CONFIG[mvt.typeMouvement] || {
              label: mvt.typeMouvement,
              icon: Activity,
              color: "text-muted-foreground",
              bg: "bg-muted border-border",
            };
            const Icon = config.icon;
            const isConsultationAdjoint = mvt.typeMouvement === TypeMouvement.CONSULTATION_ADJOINT;
            const isReopening = mvt.typeMouvement === TypeMouvement.REOUVERTURE;

            return (
              <div
                key={mvt.id}
                className={cn(
                  "relative group transition-all",
                  isConsultationAdjoint &&
                    "p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 shadow-xs",
                  isReopening &&
                    "p-3 rounded-lg border border-red-500/30 bg-red-500/5 shadow-xs"
                )}
              >
                {/* Pastille icône sur l'axe vertical */}
                <div
                  className={cn(
                    "absolute -left-6 top-0.5 flex size-5.5 items-center justify-center rounded-full border shadow-xs transition-transform group-hover:scale-110",
                    config.bg,
                    isConsultationAdjoint ? "bg-amber-500 text-white" : config.color
                  )}
                  title={config.label}
                >
                  <Icon className="size-3" />
                </div>

                {/* Contenu de la ligne */}
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground text-xs">
                        {mvt.auteurNom || mvt.auteur || "Utilisateur"}
                      </span>
                      {mvt.auteurRole && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({mvt.auteurRole})
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0 h-4 rounded-sm border",
                          config.bg,
                          config.color
                        )}
                      >
                        {config.label}
                      </Badge>

                      {/* Mise en valeur explicite pour la consultation par l'adjoint */}
                      {isConsultationAdjoint && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono"
                        >
                          Règle 4.5
                        </Badge>
                      )}
                    </div>

                    <time
                      dateTime={mvt.date}
                      className="text-[11px] font-mono text-muted-foreground tabular-nums"
                    >
                      {formatDateTime(mvt.date)}
                    </time>
                  </div>

                  {/* Description de l'action */}
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {mvt.description}
                  </p>

                  {/* Commentaire ou motif additionnel */}
                  {mvt.motif && (
                    <div className="mt-1 p-2 rounded-md bg-muted/50 border text-[11px] text-muted-foreground italic">
                      Motif : « {mvt.motif} »
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistoryTimeline;

