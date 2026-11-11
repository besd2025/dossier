"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";

import { DataTable, OverdueIndicator, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  initialCellules,
  initialDossierCellules,
  initialProvenances,
} from "@/src/lib/mock/data";
import { getDossiers } from "@/src/lib/services/dossiers-service";
import { useSessionStore } from "@/stores/session/session-store";
import { InstructionCabinet, OrigineDossier, StatutDossier } from "@/types";

const INSTRUCTION_LABELS = {
  [InstructionCabinet.POUR_ANALYSE]: "Pour analyse",
  [InstructionCabinet.POUR_ACTION]: "Pour action",
  [InstructionCabinet.POUR_TRAITEMENT]: "Pour traitement",
  [InstructionCabinet.POUR_CLASSEMENT]: "Pour classement",
  [InstructionCabinet.POUR_INFO]: "Pour information",
  [InstructionCabinet.POUR_SUIVI]: "Pour suivi",
  [InstructionCabinet.AUTRE]: "Autre",
};

const ORIGINE_LABELS = {
  [OrigineDossier.VIA_CABINET_CIVIL]: "Cabinet civil",
  [OrigineDossier.DIRECT_CHEF_BUREAU]: "Direct chef de bureau",
  [OrigineDossier.RETOUR_CABINET_SANS_DOSSIER]: "Retour cabinet sans dossier",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function DossiersPage() {
  const router = useRouter();
  const currentRole = useSessionStore((state) => state.role);
  const currentUser = useSessionStore((state) => state.user);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [celluleFilter, setCelluleFilter] = useState("Tous");
  const [provenanceFilter, setProvenanceFilter] = useState("Tous");
  const [instructionFilter, setInstructionFilter] = useState("Tous");
  const [origineFilter, setOrigineFilter] = useState("Tous");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const cellMap = useMemo(
    () =>
      Object.fromEntries(
        initialCellules.map((cellule) => [cellule.id, cellule]),
      ),
    [],
  );

  const rowsWithDisplay = useMemo(
    () =>
      rows.map((dossier) => {
        const cellules = initialDossierCellules
          .filter((assignment) => assignment.dossierId === dossier.id)
          .map((assignment) => cellMap[assignment.celluleId])
          .filter(Boolean)
          .map((cellule) => cellule.code || cellule.nom);

        return {
          ...dossier,
          celluleDisplay: cellules.join(", ") || "—",
        };
      }),
    [rows, cellMap],
  );

  useEffect(() => {
    let isMounted = true;
    const setLoadingState = (nextLoading, nextError = "") => {
      queueMicrotask(() => {
        if (!isMounted) return;
        setLoading(nextLoading);
        setError(nextError);
      });
    };

    setLoadingState(true, "");

    const filters = {
      status: statusFilter === "Tous" ? "" : statusFilter,
      celluleId: celluleFilter === "Tous" ? "" : celluleFilter,
      provenanceId: provenanceFilter === "Tous" ? "" : provenanceFilter,
      overdueOnly,
      instruction: instructionFilter === "Tous" ? "" : instructionFilter,
      origine: origineFilter === "Tous" ? "" : origineFilter,
    };

    getDossiers(filters, currentRole, currentUser)
      .then((result) => {
        if (isMounted) setRows(result);
      })
      .catch((err) => {
        if (isMounted)
          setError(err?.message || "Impossible de charger les dossiers.");
      })
      .finally(() => {
        if (isMounted) setLoadingState(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentRole,
    currentUser,
    statusFilter,
    celluleFilter,
    provenanceFilter,
    instructionFilter,
    origineFilter,
    overdueOnly,
  ]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "reference",
        header: "Référence",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-primary">
            {row.getValue("reference")}
          </span>
        ),
      },
      {
        accessorKey: "objet",
        header: "Objet",
        cell: ({ row }) => (
          <span className="block max-w-[24rem] truncate">
            {row.getValue("objet")}
          </span>
        ),
      },
      {
        accessorKey: "provenanceNom",
        header: "Provenance",
        cell: ({ row }) => (
          <span className="text-sm  text-muted-foreground">
            {row.getValue("provenanceNom")}
          </span>
        ),
      },
      {
        accessorKey: "instructionCabinet",
        header: "Instruction",
        cell: ({ row }) => (
          <span className="text-sm  font-medium text-foreground">
            {INSTRUCTION_LABELS[row.getValue("instructionCabinet")] ||
              row.getValue("instructionCabinet")}
          </span>
        ),
      },
      {
        accessorKey: "statutDossier",
        header: "Statut",
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("statutDossier")} type="dossier" />
        ),
      },
      {
        accessorKey: "celluleDisplay",
        header: "Cellule(s)",
        cell: ({ row }) => (
          <span className="text-sm  text-muted-foreground">
            {row.getValue("celluleDisplay")}
          </span>
        ),
      },
      {
        accessorKey: "dateReceptionBesd",
        header: "Date BESD",
        cell: ({ row }) => (
          <span className=" text-sm ">
            {formatDate(row.getValue("dateReceptionBesd"))}
          </span>
        ),
      },
      {
        accessorKey: "joursSansAvancement",
        header: "Retard",
        cell: ({ row }) => (
          <OverdueIndicator
            days={row.getValue("joursSansAvancement")}
            compact
            className="text-xs"
          />
        ),
      },
      {
        accessorKey: "origine",
        header: "Origine",
        cell: ({ row }) => (
          <span className="text-sm  text-muted-foreground">
            {ORIGINE_LABELS[row.getValue("origine")] || row.getValue("origine")}
          </span>
        ),
      },
    ],
    [],
  );

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-8 w-[150px] text-sm">
          <SelectValue placeholder="Tous statuts" />
        </SelectTrigger>
        <SelectContent className="px-2 py-1 w-max">
          <SelectItem value="Tous" className="text-xs text-muted-foreground">
            Tous statuts
          </SelectItem>
          {Object.values(StatutDossier).map((status) => (
            <SelectItem key={status} value={status} className="text-sm">
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={celluleFilter} onValueChange={setCelluleFilter}>
        <SelectTrigger className="h-8 w-[170px] text-sm">
          <SelectValue placeholder="Toutes cellules" />
        </SelectTrigger>
        <SelectContent className="px-2 py-1 w-max">
          <SelectItem value="Tous" className="text-xs text-muted-foreground">
            Toutes cellules
          </SelectItem>
          {initialCellules.map((cellule) => (
            <SelectItem key={cellule.id} value={cellule.id} className="text-sm">
              {cellule.code || cellule.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={provenanceFilter} onValueChange={setProvenanceFilter}>
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue placeholder="Toutes provenances" />
        </SelectTrigger>
        <SelectContent className="px-2 py-1 w-max">
          <SelectItem value="Tous" className="text-xs text-muted-foreground">
            Toutes provenances
          </SelectItem>
          {initialProvenances.map((provenance) => (
            <SelectItem
              key={provenance.id}
              value={provenance.id}
              className="text-sm"
            >
              {provenance.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={instructionFilter} onValueChange={setInstructionFilter}>
        <SelectTrigger className="h-8 w-[170px] text-sm">
          <SelectValue placeholder="Toutes instructions" />
        </SelectTrigger>
        <SelectContent className="px-2 py-1 w-max">
          <SelectItem value="Tous" className="text-xs text-muted-foreground">
            Toutes instructions
          </SelectItem>
          {Object.values(InstructionCabinet).map((instruction) => (
            <SelectItem
              key={instruction}
              value={instruction}
              className="text-sm"
            >
              {INSTRUCTION_LABELS[instruction] || instruction}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={origineFilter} onValueChange={setOrigineFilter}>
        <SelectTrigger className="h-8 w-[170px] text-sm">
          <SelectValue placeholder="Toutes origines" />
        </SelectTrigger>
        <SelectContent className="px-2 py-1 w-max">
          <SelectItem value="Tous" className="text-xs text-muted-foreground">
            Toutes origines
          </SelectItem>
          {Object.values(OrigineDossier).map((origine) => (
            <SelectItem key={origine} value={origine} className="text-sm">
              {ORIGINE_LABELS[origine] || origine}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm text-destructive">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(event) => setOverdueOnly(event.target.checked)}
          className="h-3.5 w-3.5 accent-destructive"
        />
        En retard seulement
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Liste des dossiers
          </h1>
          <p className="text-sm text-muted-foreground">
            Tableau de suivi et filtres selon le rôle courant et le périmètre
            BESD.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => router.push("/dossiers/nouveau")}
        >
          <Plus className="size-4" />
          Nouveau dossier
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <DataTable
        data={rowsWithDisplay}
        columns={columns}
        searchPlaceholder="Rechercher une référence, un objet ou une provenance..."
        emptyMessage="Aucun dossier ne correspond aux filtres actifs."
        showSearch
        showColumnVisibility
        showPagination
        showSelectionCount={false}
        filters={filterControls}
        onRowClick={(row) => router.push(`/dossiers/${row.id}`)}
        toolbarActions={
          <Button variant="outline" size="sm" className="h-8 text-sm">
            <Download className="size-3.5" />
            Exporter
          </Button>
        }
        className={loading ? "opacity-90" : ""}
      />
    </div>
  );
}
