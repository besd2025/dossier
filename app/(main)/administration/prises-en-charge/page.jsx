"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, UserCheck } from "lucide-react";

import { PermissionGate } from "@/components/permission-gate";
import {
  DataTable,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createPriseEnCharge,
  getAssignmentUsers,
  getDossiersAdministratifs,
  getPrisesEnCharge,
} from "@/src/lib/services/administration-service";
import { useSessionStore } from "@/stores/session/session-store";
import { Role } from "@/types";

const formatDateTime = (value) => {
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
};

const fullName = (person) => [person?.prenom, person?.nom].filter(Boolean).join(" ") || "—";

function PriseEnChargeDialog({ open, onOpenChange, dossiers, users, user, onCreated }) {
  const [dossierId, setDossierId] = useState("none");
  const [adjointId, setAdjointId] = useState("none");
  const [affecter, setAffecter] = useState(false);
  const [valider, setValider] = useState(false);
  const [imprimer, setImprimer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const deputies = useMemo(() => {
    if (user?.role === Role.CHEF_BUREAU || user?.role === Role.CHEF_BUREAU_ADJOINT) {
      return users.filter((candidate) => candidate.role === Role.CHEF_BUREAU_ADJOINT && candidate.actif);
    }
    return users.filter(
      (candidate) =>
        candidate.role === Role.CHEF_CELLULE_ADJOINT &&
        candidate.celluleId === user?.celluleId &&
        candidate.actif,
    );
  }, [users, user]);

  const reset = () => {
    setDossierId("none");
    setAdjointId("none");
    setAffecter(false);
    setValider(false);
    setImprimer(false);
    setError("");
    setSaving(false);
  };

  const close = (nextOpen) => {
    if (!nextOpen && !saving) reset();
    onOpenChange(nextOpen);
  };

  const submit = async () => {
    if (dossierId === "none" || adjointId === "none") {
      setError("Sélectionnez un dossier et un adjoint.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreated({
        dossierId,
        adjointId,
        titulaireId: user.id,
        portee: { affecter, valider, imprimer },
      });
      reset();
      onOpenChange(false);
    } catch (createError) {
      setError(createError?.message || "La prise en charge n'a pas pu être créée.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer une prise en charge</DialogTitle>
          <DialogDescription>
            La délégation peut être accordée en cours de traitement, même si une note est déjà en préparation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pec-dossier">Dossier</Label>
            <Select value={dossierId} onValueChange={setDossierId}>
              <SelectTrigger id="pec-dossier" className="w-full">
                <SelectValue placeholder="Choisir un dossier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choisir un dossier</SelectItem>
                {dossiers.map((dossier) => (
                  <SelectItem key={dossier.id} value={dossier.id}>
                    {dossier.reference} · {dossier.objet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pec-adjoint">Adjoint désigné</Label>
            <Select value={adjointId} onValueChange={setAdjointId}>
              <SelectTrigger id="pec-adjoint" className="w-full">
                <SelectValue placeholder="Choisir un adjoint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Choisir un adjoint</SelectItem>
                {deputies.map((deputy) => (
                  <SelectItem key={deputy.id} value={deputy.id}>
                    {fullName(deputy)}{deputy.cellule ? ` · ${deputy.cellule}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!deputies.length && (
              <p className="text-xs text-muted-foreground">
                Aucun adjoint actif n&apos;est enregistré pour votre périmètre.
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-medium">Portée de l&apos;autorisation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Signature (et, selon décision à confirmer : affecter, valider, imprimer).
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ["affecter", "Affecter", affecter, setAffecter],
                ["valider", "Valider", valider, setValider],
                ["imprimer", "Imprimer", imprimer, setImprimer],
              ].map(([key, label, checked, setChecked]) => (
                <label key={key} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => setChecked(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              La signature est toujours incluse. Les autres portées sont désactivées par défaut.
            </p>
          </div>

          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => close(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={saving || !deputies.length} onClick={submit}>
            {saving ? "Création..." : "Confirmer la prise en charge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PrisesEnChargePage() {
  const user = useSessionStore((state) => state.user);
  const [rows, setRows] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prises, dossierRows, userRows] = await Promise.all([
        getPrisesEnCharge(),
        getDossiersAdministratifs(),
        getAssignmentUsers(),
      ]);
      setRows(prises);
      setDossiers(dossierRows);
      setUsers(userRows);
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger les prises en charge.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, reloadKey]);

  const columns = useMemo(
    () => [
      {
        id: "dossier",
        accessorFn: (row) => row.dossier?.reference || row.dossierId,
        header: "Dossier",
        cell: ({ row }) => (
          <div className="min-w-40">
            <p className="font-mono text-xs font-semibold text-primary">
              {row.original.dossier?.reference || row.original.dossierId}
            </p>
            <p className="mt-0.5 max-w-64 truncate text-[11px] text-muted-foreground">
              {row.original.dossier?.objet || "Dossier indisponible"}
            </p>
          </div>
        ),
      },
      {
        id: "titulaire",
        accessorFn: (row) => fullName(row.titulaire),
        header: "Titulaire",
        cell: ({ row }) => <span className="text-xs">{fullName(row.original.titulaire)}</span>,
      },
      {
        id: "adjoint",
        accessorFn: (row) => fullName(row.adjoint),
        header: "Adjoint désigné",
        cell: ({ row }) => <span className="text-xs">{fullName(row.original.adjoint)}</span>,
      },
      {
        accessorKey: "dateHeure",
        header: "Date et heure",
        cell: ({ row }) => <span className="font-mono text-xs">{formatDateTime(row.getValue("dateHeure"))}</span>,
      },
      {
        accessorKey: "auteur",
        header: "Auteur",
        cell: ({ row }) => <span className="text-xs">{fullName(row.original.auteur)}</span>,
      },
      {
        id: "portee",
        header: "Portée",
        enableSorting: false,
        cell: ({ row }) => {
          const portee = row.original.portee || {};
          const labels = [
            "Signature",
            ...(portee.affecter ? ["Affecter"] : []),
            ...(portee.valider ? ["Valider"] : []),
            ...(portee.imprimer ? ["Imprimer"] : []),
          ];
          return <span className="text-[11px] text-muted-foreground">{labels.join(" · ")}</span>;
        },
      },
      {
        accessorKey: "active",
        header: "État",
        cell: ({ row }) => (
          <span className={row.getValue("active") ? "text-xs font-medium text-emerald-700 dark:text-emerald-400" : "text-xs text-muted-foreground"}>
            {row.getValue("active") ? "Active" : "Terminée"}
          </span>
        ),
      },
    ],
    [],
  );

  const handleCreate = async (data) => {
    try {
      const created = await createPriseEnCharge(data, user.id);
      toast.success("La prise en charge a été créée.");
      setReloadKey((key) => key + 1);
      return created;
    } catch (createError) {
      toast.error(createError?.message || "La prise en charge n'a pas pu être créée.");
      throw createError;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prises en charge des adjoints</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Délégations de suivi attachées aux dossiers, y compris en cours de traitement.
          </p>
        </div>
        <PermissionGate ability="gerer_prises_en_charge">
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Nouvelle prise en charge
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
        La signature est incluse. Les portées supplémentaires (affecter, valider, imprimer) restent configurables conformément à la décision à confirmer.
      </div>

      {error ? (
        <ErrorState
          title="Registre indisponible"
          message="Les prises en charge n'ont pas pu être chargées."
          error={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : rows.length ? (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Rechercher un dossier, un titulaire ou un adjoint..."
          emptyMessage="Aucune prise en charge ne correspond à la recherche."
          showSearch
          showColumnVisibility
          showPagination
          showSelectionCount={false}
        />
      ) : (
        <EmptyState
          icon={UserCheck}
          title="Aucune prise en charge enregistrée"
          description="Créez une délégation pour permettre à un adjoint d'assurer le suivi d'un dossier."
          action={
            <PermissionGate ability="gerer_prises_en_charge">
              <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Créer une prise en charge
              </Button>
            </PermissionGate>
          }
        />
      )}

      <PriseEnChargeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dossiers={dossiers}
        users={users}
        user={user}
        onCreated={handleCreate}
      />
    </div>
  );
}
