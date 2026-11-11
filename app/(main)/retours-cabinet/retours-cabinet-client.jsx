"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/components/permission-gate";
import {
  DataTable,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  createCabinetReturn,
  getCabinetReturnOptions,
  getCabinetReturns,
} from "@/lib/services/retours-service";
import { useSessionStore } from "@/stores/session/session-store";

const SUITE_LABELS = {
  PROJET_LETTRE: "Projet de lettre",
  DESCENTE: "Descente",
  AUTRE: "Autre",
  RETOUR_SANS_DOSSIER: "Retour sans dossier préalable",
};

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

export default function RetoursCabinetClient() {
  const user = useSessionStore((state) => state.currentUser || state.user);
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({ dossiers: [], notes: [], provenances: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sansDossierPrealable, setSansDossierPrealable] = useState(false);
  const [dossierId, setDossierId] = useState("");
  const [noteOrigineId, setNoteOrigineId] = useState("");
  const [typeSuite, setTypeSuite] = useState("DESCENTE");
  const [bureaux, setBureaux] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [objet, setObjet] = useState("");
  const [provenanceNom, setProvenanceNom] = useState("Cabinet du Ministre");
  const [provenanceId, setProvenanceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [returns, returnOptions] = await Promise.all([
        getCabinetReturns(),
        getCabinetReturnOptions(),
      ]);
      setRows(returns);
      setOptions(returnOptions);
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger les retours du cabinet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData, reloadKey]);

  const notesForDossier = useMemo(
    () => options.notes.filter((note) => note.dossierId === dossierId),
    [options.notes, dossierId]
  );
  const columns = useMemo(() => [
    {
      id: "dossier",
      accessorFn: (row) => row.dossier?.reference || "Sans référence",
      header: "Dossier",
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs font-semibold text-primary">
            {row.original.dossier?.reference || "Sans référence"}
          </p>
          <p className="mt-1 max-w-[20rem] truncate text-xs text-muted-foreground">
            {row.original.dossier?.objet || "Dossier BESD créé à l’enregistrement"}
          </p>
        </div>
      ),
    },
    {
      id: "note",
      accessorFn: (row) => row.noteOrigine?.id || "",
      header: "Note d'origine",
      cell: ({ row }) => row.original.noteOrigine?.id || "—",
    },
    {
      accessorKey: "typeSuite",
      header: "Type de suite",
      cell: ({ row }) => SUITE_LABELS[row.original.typeSuite] || row.original.typeSuite,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: "bureaux",
      accessorFn: (row) => (row.bureauxCollaboration || []).join(", "),
      header: "Bureaux en collaboration",
      cell: ({ row }) => (row.original.bureauxCollaboration || []).join(", ") || "—",
    },
    {
      id: "cycle",
      accessorFn: (row) => row.nouveauCycle?.numeroCycle ?? "",
      header: "Nouveau cycle",
      cell: ({ row }) => (
        <span>
          Cycle {row.original.nouveauCycle?.numeroCycle ?? "—"} · {row.original.dossier?.statutDossier || "Ouvert"}
        </span>
      ),
    },
  ], []);

  function resetForm() {
    setSansDossierPrealable(false);
    setDossierId("");
    setNoteOrigineId("");
    setTypeSuite("DESCENTE");
    setBureaux("");
    setCommentaire("");
    setObjet("");
    setProvenanceNom("Cabinet du Ministre");
    setProvenanceId("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving || (!sansDossierPrealable && (!dossierId || !noteOrigineId))) return;
    setSaving(true);
    try {
      const result = await createCabinetReturn(
        {
          sansDossierPrealable,
          dossierId,
          noteOrigineId,
          typeSuite,
          date,
          bureauxCollaboration: bureaux.split(",").map((value) => value.trim()).filter(Boolean),
          commentaire,
          objet,
          provenanceNom,
          provenanceId,
        },
        user?.id
      );
      toast.success(`Retour enregistré. Le cycle ${result.nouveauCycle?.numeroCycle || 1} est ouvert.`);
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || "Le retour n'a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Undo2 className="size-4" />
            Secrétariat
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Retours du cabinet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enregistrez le retour et ouvrez un nouveau cycle de traitement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw className="size-4" />
            Actualiser
          </Button>
          <PermissionGate ability="enregistrer_retour">
            <Button type="button" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Enregistrer un retour
            </Button>
          </PermissionGate>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : error ? (
        <ErrorState
          title="Retours indisponibles"
          message="La liste des retours n'a pas pu être chargée."
          error={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : rows.length ? (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Rechercher un dossier ou un type de suite..."
          showSelectionCount={false}
          showColumnVisibility
          showPagination
        />
      ) : (
        <EmptyState
          icon={Undo2}
          title="Aucun retour du cabinet"
          description="Les retours enregistrés et leurs nouveaux cycles apparaîtront ici."
        />
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) setDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={handleSave} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Enregistrer un retour du cabinet</DialogTitle>
              <DialogDescription>
                Un nouveau cycle sera créé et visible dans la fiche dossier et son historique.
              </DialogDescription>
            </DialogHeader>

            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={sansDossierPrealable}
                onChange={(event) => {
                  setSansDossierPrealable(event.target.checked);
                  setDossierId("");
                  setNoteOrigineId("");
                }}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="block font-medium">Retour sans dossier BESD préalable</span>
                <span className="mt-1 block text-muted-foreground">
                  Créer un dossier avec l’origine « Retour du cabinet sans dossier préalable ».
                </span>
              </span>
            </label>

            {!sansDossierPrealable ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="return-dossier" className="text-sm font-medium">Dossier</label>
                  <Select
                    value={dossierId}
                    onValueChange={(val) => {
                      setDossierId(val);
                      setNoteOrigineId("");
                    }}
                  >
                    <SelectTrigger id="return-dossier" className="h-9 w-full bg-background px-3 text-sm">
                      <SelectValue placeholder="Sélectionner un dossier…" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.dossiers.map((dossier) => (
                        <SelectItem key={dossier.id} value={dossier.id} className="text-xs">
                          {dossier.reference} — {dossier.objet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="return-note" className="text-sm font-medium">Note d&apos;origine renvoyée</label>
                  <Select
                    value={noteOrigineId}
                    onValueChange={setNoteOrigineId}
                    disabled={!dossierId}
                  >
                    <SelectTrigger id="return-note" className="h-9 w-full bg-background px-3 text-sm disabled:opacity-50">
                      <SelectValue placeholder="Sélectionner une note…" />
                    </SelectTrigger>
                    <SelectContent>
                      {notesForDossier.map((note) => (
                        <SelectItem key={note.id} value={note.id} className="text-xs">
                          {note.id} · {note.typeDocument}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="return-object" className="text-sm font-medium">Objet du nouveau dossier</label>
                  <Input id="return-object" value={objet} onChange={(event) => setObjet(event.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="return-provenance" className="text-sm font-medium">Provenance</label>
                  <Select
                    value={provenanceId}
                    onValueChange={(val) => {
                      const selected = options.provenances.find((item) => item.id === val);
                      setProvenanceId(val);
                      setProvenanceNom(selected?.nom || "");
                    }}
                  >
                    <SelectTrigger id="return-provenance" className="h-9 w-full bg-background px-3 text-sm">
                      <SelectValue placeholder="Sélectionner une provenance…" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.provenances.filter((item) => item.actif).map((item) => (
                        <SelectItem key={item.id} value={item.id} className="text-xs">
                          {item.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="return-type" className="text-sm font-medium">Type de suite attendu</label>
                <Select value={typeSuite} onValueChange={setTypeSuite}>
                  <SelectTrigger id="return-type" className="h-9 w-full bg-background px-3 text-sm">
                    <SelectValue placeholder="Type de suite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESCENTE" className="text-xs">Descente</SelectItem>
                    <SelectItem value="PROJET_LETTRE" className="text-xs">Projet de lettre</SelectItem>
                    <SelectItem value="AUTRE" className="text-xs">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="return-date" className="text-sm font-medium">Date du retour</label>
                <Input id="return-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="return-bureaux" className="text-sm font-medium">
                Bureaux en collaboration
              </label>
              <Input
                id="return-bureaux"
                value={bureaux}
                onChange={(event) => setBureaux(event.target.value)}
                placeholder="Ex. Bureau Asie-Pacifique, Bureau juridique"
              />
              <p className="text-xs text-muted-foreground">Séparez les bureaux par une virgule.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="return-comment" className="text-sm font-medium">Commentaire</label>
              <textarea
                id="return-comment"
                value={commentaire}
                onChange={(event) => setCommentaire(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <PermissionGate ability="enregistrer_retour">
                <Button
                  type="submit"
                  disabled={saving || !date || (sansDossierPrealable ? !objet.trim() : !dossierId || !noteOrigineId)}
                >
                  {saving ? "Enregistrement…" : "Enregistrer le retour"}
                </Button>
              </PermissionGate>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
