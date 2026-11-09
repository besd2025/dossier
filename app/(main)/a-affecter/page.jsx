"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/permission-gate";
import { DataTable, EmptyState, ErrorState, StatusBadge, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getAssignmentUsers, getCellules } from "@/src/lib/services/administration-service";
import { assignDossier, getDossiersToAssign } from "@/src/lib/services/dossiers-service";
import { useSessionStore } from "@/stores/session/session-store";
import { Role } from "@/types";
import { AssignDialog } from "./assign-dialog";

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

export default function AAffecterPage() {
  const router = useRouter();
  const role = useSessionStore((state) => state.role);
  const user = useSessionStore((state) => state.user);
  const [rows, setRows] = useState([]);
  const [cellules, setCellules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canAccessPage = [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ].includes(role);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dossierRows, celluleRows, userRows] = await Promise.all([
        getDossiersToAssign(role, user),
        getCellules(),
        getAssignmentUsers(),
      ]);
      setRows(dossierRows);
      setCellules(celluleRows);
      setUsers(userRows);
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger les dossiers à affecter.");
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, reloadKey]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "reference",
        header: "Référence",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.getValue("reference")}
          </span>
        ),
      },
      {
        accessorKey: "objet",
        header: "Objet",
        cell: ({ row }) => <span className="block max-w-[28rem] truncate">{row.getValue("objet")}</span>,
      },
      {
        accessorKey: "dateReceptionBesd",
        header: "Réception BESD",
        cell: ({ row }) => <span className="font-mono text-xs">{formatDate(row.getValue("dateReceptionBesd"))}</span>,
      },
      {
        accessorKey: "statutDossier",
        header: "Statut",
        cell: ({ row }) => <StatusBadge status={row.getValue("statutDossier")} type="dossier" size="sm" />,
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <PermissionGate
            ability="affecter"
            context={{
              dossier: {
                ...row.original,
                cellulePrincipale: row.original.cellules?.find((item) => item.type === "PRINCIPALE")?.code,
                cellules: (row.original.cellules || []).map((item) => item.code),
              },
            }}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedDossier(row.original);
              }}
            >
              Affecter
              <ArrowRight className="size-3.5" />
            </Button>
          </PermissionGate>
        ),
      },
    ],
    [],
  );

  const handleAssign = async (assignment) => {
    try {
      const result = await assignDossier({ dossierId: selectedDossier.id, ...assignment }, user);
      const recipient = assignment.type === "BUREAU_VERS_CELLULE"
        ? cellules
          .filter((cellule) => assignment.cellules.some((item) => item.celluleId === cellule.id))
          .map((cellule) => cellule.code)
          .join(" et ")
        : assignment.type === "CELLULE_VERS_CONSEILLER"
          ? assignment.conseillers.map((counselor) => `${counselor.prenom} ${counselor.nom}`).join(" et ")
          : assignment.type === "HORS_CELLULE"
            ? users.find((item) => item.id === assignment.conseillerId)?.prenom || "le conseiller hors cellule"
            : `${user.prenom} ${user.nom}`;
      toast.success(`Affectation notifiée à ${recipient}.`);
      setSelectedDossier(null);
      setReloadKey((key) => key + 1);
      return result;
    } catch (assignmentError) {
      toast.error(assignmentError?.message || "L'affectation a échoué.");
      throw assignmentError;
    }
  };

  const title = role === Role.CHEF_CELLULE || role === Role.CHEF_CELLULE_ADJOINT
    ? "Dossiers de la cellule à affecter"
    : "Dossiers reçus à affecter";

  if (!canAccessPage) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        Cette page est réservée aux responsables du bureau et des cellules.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dossiers à affecter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === Role.CHEF_CELLULE || role === Role.CHEF_CELLULE_ADJOINT
              ? "Affectez les dossiers de votre cellule à un ou deux conseillers."
              : "Affectez les nouveaux dossiers reçus aux cellules ou à un responsable."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
          <BriefcaseBusiness className="size-4 text-primary" />
          {title}
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Liste indisponible"
          message="Les dossiers à affecter n'ont pas pu être chargés."
          error={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : rows.length ? (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Rechercher une référence ou un objet..."
          emptyMessage="Aucun dossier ne correspond à la recherche."
          showSearch
          showColumnVisibility
          showPagination
          showSelectionCount={false}
          toolbarActions={
            <Button type="button" size="sm" variant="outline" onClick={() => router.push("/dossiers")}>
              <Plus className="size-3.5" />
              Liste des dossiers
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Aucun dossier à affecter"
          description={
            role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT
              ? "Aucun dossier reçu n'attend actuellement une affectation."
              : "Aucun dossier de votre cellule n'attend actuellement l'affectation d'un conseiller."
          }
          action={{ label: "Voir les dossiers", href: "/dossiers" }}
        />
      )}

      {selectedDossier && (
        <AssignDialog
          key={selectedDossier.id}
          dossier={selectedDossier}
          role={role}
          user={user}
          users={users}
          cellules={cellules}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedDossier(null);
          }}
          onAssigned={handleAssign}
        />
      )}
    </div>
  );
}
