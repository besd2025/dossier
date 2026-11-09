"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CircleAlert,
  Download,
  Landmark,
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTE_PERMISSIONS, BESD_ROLES_CONFIG, DEMO_ACCOUNTS } from "@/config/permissions";
import {
  createAcces,
  createCellule,
  createProvenance,
  getAcces,
  getAssignmentUsers,
  getCellules,
  getDossiersAdministratifs,
  getMouvements,
  getProvenances,
  requestDossierAccess,
  updateCellule,
  updateProvenance,
} from "@/src/lib/services/administration-service";
import { createUtilisateur, getUtilisateurs, toggleUtilisateurActif, updateUtilisateur } from "@/src/lib/services/utilisateurs-service";
import { useSessionStore } from "@/stores/session/session-store";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { CategorieProvenance, Role, TypeMouvement } from "@/types";

const roleOptions = Object.values(Role);
const roleLabels = Object.fromEntries(
  Object.entries(BESD_ROLES_CONFIG).map(([role, config]) => [role, config.label]),
);
const roleDescriptions = Object.fromEntries(DEMO_ACCOUNTS.map((account) => [account.role, account.description]));
const categoryLabels = {
  MINISTERE: "Ministère",
  INSTITUTION: "Institution",
  INDIVIDUEL: "Individuel",
  AUTRE: "Autre",
};
const movementLabels = {
  [TypeMouvement.RECEPTION]: "Réception",
  [TypeMouvement.AFFECTATION]: "Affectation",
  [TypeMouvement.DEPOT_VERSION]: "Dépôt",
  [TypeMouvement.OBSERVATION]: "Observation",
  [TypeMouvement.SIGNATURE]: "Signature",
  [TypeMouvement.TRANSMISSION]: "Transmission",
  [TypeMouvement.RETOUR]: "Retour",
  [TypeMouvement.REOUVERTURE]: "Réouverture",
  [TypeMouvement.ACCES_ACCORDE]: "Accès accordé",
  [TypeMouvement.CONSULTATION_ADJOINT]: "Consultation par l'adjoint",
  [TypeMouvement.CREATION_COMPTE]: "Création de compte",
};
const cellRestrictedRoles = [Role.CHEF_BUREAU, Role.COMPTABLE, Role.CONSEILLER_HORS_CELLULE];

function fullName(person) {
  return [person?.prenom, person?.nom].filter(Boolean).join(" ") || "—";
}

function displayDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

function PageFrame({ title, description, icon: Icon, action, children }) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Panel({ title, description, children, className = "" }) {
  return (
    <section className={`rounded-xl border bg-card ${className}`}>
      {(title || description) && (
        <div className="border-b px-4 py-3">
          {title && <h2 className="font-medium">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function TableFrame({ headers, children, empty, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-3 p-4" aria-label="Chargement">
        {[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-md bg-muted" />)}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 p-5 text-sm" role="alert">
        <span className="text-destructive">{error}</span>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Réessayer</Button>}
      </div>
    );
  }
  if (empty) return <p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>{headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NativeSelect({ id, value, onChange, children, disabled = false, required = false }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {children}
    </select>
  );
}

function LoadingPanel({ error, retry, children }) {
  return (
    <Panel>
      {error ? (
        <div className="flex items-center justify-between gap-3 p-4 text-sm" role="alert">
          <span className="text-destructive">{error}</span>
          {retry && <Button variant="outline" size="sm" onClick={retry}>Réessayer</Button>}
        </div>
      ) : children}
    </Panel>
  );
}

export function ComptesPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setRows(await getUtilisateurs());
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Impossible de charger les comptes.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const filtered = rows.filter((user) =>
    [user.nom, user.prenom, user.email, user.cellule, roleLabels[user.role]]
      .filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase().trim()),
  );

  const toggle = async (user) => {
    try {
      const updated = await toggleUtilisateurActif(user.id);
      setRows((current) => current.map((row) => row.id === updated.id ? updated : row));
      toast.success(updated.actif ? "Compte réactivé." : "Compte désactivé.", {
        description: "L'historique de ses actions est préservé.",
      });
    } catch (toggleError) {
      toast.error(toggleError.message || "Le statut du compte n'a pas pu être modifié.");
    }
  };

  return (
    <PageFrame
      title="Comptes utilisateurs"
      description="Gérez les comptes internes et leurs rattachements. Un compte désactivé n'est jamais supprimé."
      icon={Users}
      action={<Button asChild><Link href="/administration/comptes/nouveau"><Plus data-icon="inline-start" />Créer un compte</Link></Button>}
    >
      <Panel>
        <div className="border-b p-4">
          <Input aria-label="Rechercher un compte" placeholder="Rechercher un nom, une adresse ou un rôle…" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-md" />
        </div>
        <TableFrame
          headers={["Nom", "Prénom", "Courriel", "Rôle", "Cellule", "Créé par", "Statut", "Création", "Actions"]}
          loading={loading}
          error={error}
          onRetry={load}
          empty={filtered.length ? null : "Aucun compte ne correspond à la recherche."}
        >
          {filtered.map((user) => (
            <tr key={user.id}>
              <Cell className="font-medium">{user.nom}</Cell>
              <Cell>{user.prenom}</Cell>
              <Cell>{user.email}</Cell>
              <Cell>{roleLabels[user.role] || user.role}</Cell>
              <Cell>{user.cellule || "—"}</Cell>
              <Cell>{user.creePar || "—"}</Cell>
              <Cell><span className={`rounded-full px-2 py-1 text-xs ${user.actif ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{user.actif ? "Actif" : "Désactivé"}</span></Cell>
              <Cell>{displayDate(user.dateCreation)}</Cell>
              <Cell>
                <Button variant="outline" size="sm" onClick={() => toggle(user)}>
                  {user.actif ? <UserRoundX data-icon="inline-start" /> : <UserRoundCheck data-icon="inline-start" />}
                  {user.actif ? "Désactiver" : "Réactiver"}
                </Button>
              </Cell>
            </tr>
          ))}
        </TableFrame>
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">La désactivation conserve le compte et l&apos;historique de toutes ses actions.</p>
      </Panel>
    </PageFrame>
  );
}

export function NouveauComptePage() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const [values, setValues] = useState({ nom: "", prenom: "", email: "", role: "", celluleId: "" });
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getCellules().then(setCells).catch((loadError) => setError(loadError.message || "Impossible de charger les cellules.")).finally(() => setLoading(false));
  }, []);
  const cellIsAllowed = values.role && !cellRestrictedRoles.includes(values.role);
  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!values.nom.trim() || !values.prenom.trim() || !values.email.trim() || !values.role) {
      setError("Renseignez le nom, le prénom, le courriel et le rôle.");
      return;
    }
    if (cellIsAllowed && values.celluleId && !cells.some((cell) => cell.id === values.celluleId)) {
      setError("La cellule sélectionnée n'est plus disponible.");
      return;
    }
    setSaving(true);
    try {
      const cell = cells.find((item) => item.id === values.celluleId);
      const created = await createUtilisateur({
        ...values,
        cellule: cellIsAllowed ? cell?.code || null : null,
        celluleId: cellIsAllowed ? cell?.id || null : null,
        creePar: fullName(user),
      }, user?.id);
      toast.success("Le compte a été créé.");
      router.push("/administration/comptes");
      return created;
    } catch (createError) {
      setError(createError.message || "Le compte n'a pas pu être créé.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <PageFrame title="Créer un compte utilisateur" description="Création interne d'un compte agent BESD." icon={UserRound}>
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <Panel title="Identité et rattachement">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field label="Nom" htmlFor="account-last"><Input id="account-last" autoComplete="family-name" value={values.nom} onChange={change("nom")} required /></Field>
            <Field label="Prénom" htmlFor="account-first"><Input id="account-first" autoComplete="given-name" value={values.prenom} onChange={change("prenom")} required /></Field>
            <Field label="Courriel professionnel" htmlFor="account-email"><Input id="account-email" type="email" autoComplete="email" value={values.email} onChange={change("email")} required /></Field>
            <Field label="Rôle" htmlFor="account-role"><NativeSelect id="account-role" value={values.role} onChange={(event) => setValues((current) => ({ ...current, role: event.target.value, celluleId: "" }))} required><option value="">Choisir un rôle</option>{roleOptions.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</NativeSelect></Field>
            <Field label="Cellule" htmlFor="account-cell" hint="Facultative, selon le rôle attribué.">
              <NativeSelect id="account-cell" value={values.celluleId} onChange={change("celluleId")} disabled={!cellIsAllowed || loading}>
                <option value="">{loading ? "Chargement…" : "Aucune cellule"}</option>
                {cells.map((cell) => <option key={cell.id} value={cell.id}>{cell.code} — {cell.nom}</option>)}
              </NativeSelect>
            </Field>
          </div>
        </Panel>
        <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p>La création d&apos;un compte ne donne pas à elle seule accès aux dossiers. Les droits dépendent du rôle, des dossiers assignés et des accès complémentaires.</p>
        </div>
        {user?.role !== Role.CHEF_BUREAU && <p className="text-sm text-muted-foreground">Le Chef de bureau sera notifié automatiquement de cette création.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/administration/comptes")}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? "Création…" : "Créer le compte"}</Button>
        </div>
      </form>
    </PageFrame>
  );
}

export function CellulesPage() {
  const user = useSessionStore((state) => state.user);
  const [cells, setCells] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const canEdit = user?.role === Role.CHEF_BUREAU;
  const load = useCallback(async () => {
    try {
      const [cellRows, userRows] = await Promise.all([getCellules(), getUtilisateurs({ activeOnly: true })]);
      setCells(cellRows); setUsers(userRows);
      setError("");
    } catch (loadError) { setError(loadError.message || "Impossible de charger les cellules."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const open = (cell = null) => {
    setEditing(cell);
    setForm(cell ? { ...cell } : { nom: "", code: "", chefId: "", chefAdjointId: "", conseillerAttitreId: "", delegationCorrection: false, description: "" });
    setDialogOpen(true);
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      if (!form.nom?.trim() || !form.code?.trim()) throw new Error("Le nom et le code de la cellule sont obligatoires.");
      if (editing) await updateCellule(editing.id, form);
      else await createCellule(form);
      toast.success(editing ? "Cellule mise à jour." : "Cellule créée.");
      setDialogOpen(false); await load();
    } catch (saveError) { setError(saveError.message || "La cellule n'a pas pu être enregistrée."); }
    finally { setSaving(false); }
  };
  const selectMembers = (label, key, roles) => (
    <Field label={label} htmlFor={`cell-${key}`}>
      <NativeSelect id={`cell-${key}`} value={form[key] || ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value || null }))}>
        <option value="">Non désigné</option>
        {users.filter((candidate) => roles.includes(candidate.role)).map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)}</option>)}
      </NativeSelect>
    </Field>
  );
  const userName = (id) => fullName(users.find((candidate) => candidate.id === id));
  return (
    <PageFrame title="Cellules du bureau" description="Référentiel des cellules, de leurs responsables et des délégations de correction." icon={Building2} action={canEdit && <Button onClick={() => open()}><Plus data-icon="inline-start" />Créer une cellule</Button>}>
      <LoadingPanel error={error} retry={load}>
        <TableFrame headers={["Code et cellule", "Chef", "Chef adjoint", "Conseiller attitré", "Délégation", ...(canEdit ? ["Actions"] : [])]} loading={loading} empty={cells.length ? null : "Aucune cellule enregistrée."}>
          {cells.map((cell) => (
            <tr key={cell.id}>
              <Cell><span className="font-semibold">{cell.code}</span><span className="block text-xs text-muted-foreground">{cell.nom}</span></Cell>
              <Cell>{userName(cell.chefId)}</Cell><Cell>{userName(cell.chefAdjointId)}</Cell>
              <Cell>{cell.conseillerAttitreId ? userName(cell.conseillerAttitreId) : "Non"}</Cell>
              <Cell>{cell.delegationCorrection ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">CASEAG · active</span> : "—"}</Cell>
              {canEdit && <Cell><Button aria-label={`Modifier ${cell.code}`} variant="outline" size="sm" onClick={() => open(cell)}><Pencil data-icon="inline-start" />Modifier</Button></Cell>}
            </tr>
          ))}
        </TableFrame>
      </LoadingPanel>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Modifier une cellule" : "Créer une cellule"}</DialogTitle><DialogDescription>Les référentiels sont partagés par les écrans du BESD.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="cell-name"><Input id="cell-name" value={form.nom || ""} onChange={(event) => setForm((v) => ({ ...v, nom: event.target.value }))} required /></Field>
              <Field label="Code" htmlFor="cell-code"><Input id="cell-code" value={form.code || ""} onChange={(event) => setForm((v) => ({ ...v, code: event.target.value }))} required /></Field>
              {selectMembers("Chef de cellule", "chefId", [Role.CHEF_CELLULE])}
              {selectMembers("Chef adjoint", "chefAdjointId", [Role.CHEF_CELLULE_ADJOINT])}
              {selectMembers("Conseiller attitré", "conseillerAttitreId", [Role.CONSEILLER])}
              <Field label="Description" htmlFor="cell-description"><Input id="cell-description" value={form.description || ""} onChange={(event) => setForm((v) => ({ ...v, description: event.target.value }))} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.delegationCorrection)} onChange={(event) => setForm((v) => ({ ...v, delegationCorrection: event.target.checked }))} />Délégation de correction CASEAG</label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button><Button disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

export function ProvenancesPage() {
  const user = useSessionStore((state) => state.user);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CategorieProvenance.INSTITUTION);
  const [saving, setSaving] = useState(false);
  const canEdit = [Role.CHEF_BUREAU, Role.SECRETARIAT].includes(user?.role);
  const load = useCallback(async () => {
    try { setRows(await getProvenances()); setError(""); }
    catch (loadError) { setError(loadError.message || "Impossible de charger les provenances."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const showDialog = (item = null) => {
    setEditing(item); setName(item?.nom || ""); setCategory(item?.categorie || CategorieProvenance.INSTITUTION); setOpen(true);
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (!name.trim()) throw new Error("Le nom de la provenance est obligatoire.");
      if (editing) await updateProvenance(editing.id, { nom: name.trim(), categorie: category });
      else await createProvenance({ nom: name.trim(), categorie: category });
      toast.success(editing ? "Provenance renommée." : "Provenance ajoutée.");
      setOpen(false); await load();
    } catch (saveError) { setError(saveError.message || "La provenance n'a pas pu être enregistrée."); }
    finally { setSaving(false); }
  };
  return (
    <PageFrame title="Référentiel des provenances" description="Liste enrichissable des ministères, institutions, expéditeurs individuels et autres provenances." icon={Landmark} action={canEdit && <Button onClick={() => showDialog()}><Plus data-icon="inline-start" />Ajouter une provenance</Button>}>
      <Panel>
        <TableFrame headers={["Provenance", "Catégorie", ...(canEdit ? ["Actions"] : [])]} loading={loading} error={error} onRetry={load} empty={rows.length ? null : "Aucune provenance enregistrée."}>
          {rows.map((item) => <tr key={item.id}><Cell className="font-medium">{item.nom}</Cell><Cell>{categoryLabels[item.categorie] || item.categorie}</Cell>{canEdit && <Cell><Button variant="outline" size="sm" onClick={() => showDialog(item)}><Pencil data-icon="inline-start" />Renommer</Button></Cell>}</tr>)}
        </TableFrame>
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Renommer la provenance" : "Ajouter une provenance"}</DialogTitle><DialogDescription>La modification sera disponible dans les formulaires de dossier.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nom" htmlFor="provenance-name"><Input id="provenance-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} required /></Field>
            <Field label="Catégorie" htmlFor="provenance-category"><NativeSelect id="provenance-category" value={category} onChange={(event) => setCategory(event.target.value)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></Field>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

export function AccesExceptionnelsPage() {
  const user = useSessionStore((state) => state.user);
  const [rows, setRows] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ dossierId: "", beneficiaireId: "", motif: "", echeance: "", type: "EXCEPTIONNEL" });
  const [saving, setSaving] = useState(false);
  const isAdvisor = user?.role === Role.CONSEILLER_HORS_CELLULE;
  const canGrant = user?.role === Role.CHEF_BUREAU;
  const load = useCallback(async () => {
    try {
      const [accessRows, dossierRows, userRows] = await Promise.all([getAcces(), getDossiersAdministratifs(), getAssignmentUsers()]);
      setRows(accessRows); setDossiers(dossierRows); setUsers(userRows);
      setError("");
    } catch (loadError) { setError(loadError.message || "Impossible de charger les accès."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const openDialog = (kind) => {
    setForm({ dossierId: "", beneficiaireId: isAdvisor ? user.id : "", motif: "", echeance: "", type: "EXCEPTIONNEL" });
    setError(""); setDialog(kind);
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (dialog === "request") {
        await requestDossierAccess(form, user.id);
        toast.success("Votre demande a été transmise au Chef de bureau.");
      } else {
        if (!form.beneficiaireId) throw new Error("Sélectionnez un bénéficiaire.");
        await createAcces(form, user.id);
        toast.success("L'accès au dossier a été accordé.");
      }
      setDialog(null); await load();
    } catch (saveError) { setError(saveError.message || "L'opération n'a pas abouti."); }
    finally { setSaving(false); }
  };
  const dossierName = (id) => dossiers.find((item) => item.id === id)?.reference || id || "—";
  const personName = (id) => fullName(users.find((item) => item.id === id));
  return (
    <PageFrame title="Accès exceptionnels" description="Accès ponctuels ou complémentaires aux dossiers, accordés par le Chef de bureau." icon={LockKeyhole} action={isAdvisor ? <Button onClick={() => openDialog("request")}><Plus data-icon="inline-start" />Demander un accès</Button> : canGrant ? <Button onClick={() => openDialog("grant")}><Plus data-icon="inline-start" />Accorder un accès</Button> : null}>
      <Panel title="Accès accordés" description="Les accès accordés et leurs échéances sont consultables ci-dessous.">
        <TableFrame headers={["Dossier", "Bénéficiaire", "Accordé par", "Date", "Échéance / durée", "Type", "Motif"]} loading={loading} error={error} onRetry={load} empty={rows.length ? null : "Aucun accès exceptionnel enregistré."}>
          {rows.map((item) => <tr key={item.id}><Cell className="font-medium">{dossierName(item.dossierId)}</Cell><Cell>{personName(item.beneficiaireId)}</Cell><Cell>{personName(item.accordeParId)}</Cell><Cell>{displayDate(item.date, true)}</Cell><Cell>{item.echeance ? displayDate(item.echeance) : "Sans échéance"}</Cell><Cell>{item.type === "COMPLEMENTAIRE" ? "Complémentaire" : "Exceptionnel"}</Cell><Cell className="max-w-xs whitespace-normal">{item.motif}</Cell></tr>)}
        </TableFrame>
      </Panel>
      {user?.role === Role.CHEF_BUREAU_ADJOINT && <p className="text-sm text-muted-foreground">Consultation en lecture seule. L&apos;octroi d&apos;un accès est réservé au Chef de bureau.</p>}
      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialog === "request" ? "Demander l'accès à un dossier antérieur" : "Accorder un accès à un dossier"}</DialogTitle>
            <DialogDescription>{dialog === "request" ? "Le Chef de bureau recevra une notification avec le besoin exprimé." : "L'accès sera ajouté au journal de traçabilité et le bénéficiaire sera notifié."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Dossier" htmlFor="access-dossier"><NativeSelect id="access-dossier" value={form.dossierId} onChange={(event) => setForm((v) => ({ ...v, dossierId: event.target.value }))} required><option value="">Choisir un dossier</option>{dossiers.map((dossier) => <option key={dossier.id} value={dossier.id}>{dossier.reference} — {dossier.objet}</option>)}</NativeSelect></Field>
            {dialog === "grant" && <>
              <Field label="Bénéficiaire" htmlFor="access-user"><NativeSelect id="access-user" value={form.beneficiaireId} onChange={(event) => setForm((v) => ({ ...v, beneficiaireId: event.target.value }))} required><option value="">Choisir un bénéficiaire</option>{users.filter((candidate) => candidate.actif && [Role.CONSEILLER_HORS_CELLULE, Role.COMPTABLE].includes(candidate.role)).map((candidate) => <option key={candidate.id} value={candidate.id}>{fullName(candidate)} — {roleLabels[candidate.role]}</option>)}</NativeSelect></Field>
              <Field label="Type d'accès" htmlFor="access-type"><NativeSelect id="access-type" value={form.type} onChange={(event) => setForm((v) => ({ ...v, type: event.target.value }))}><option value="EXCEPTIONNEL">Exceptionnel</option><option value="COMPLEMENTAIRE">Complémentaire</option></NativeSelect></Field>
              <Field label="Échéance (facultative)" htmlFor="access-expiry"><Input id="access-expiry" type="date" value={form.echeance} onChange={(event) => setForm((v) => ({ ...v, echeance: event.target.value }))} /></Field>
            </>}
            <Field label={dialog === "request" ? "Besoin exprimé" : "Motif du besoin"} htmlFor="access-reason"><textarea id="access-reason" required rows={3} value={form.motif} onChange={(event) => setForm((v) => ({ ...v, motif: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></Field>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Annuler</Button><Button disabled={saving}>{saving ? "Envoi…" : dialog === "request" ? "Envoyer la demande" : "Confirmer l'accès"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

export function JournalPage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ since: "", until: "", author: "", type: "", dossier: "" });
  const load = useCallback(async () => {
    try {
      const [movementRows, userRows, dossierRows] = await Promise.all([getMouvements(), getUtilisateurs(), getDossiersAdministratifs()]);
      setRows(movementRows); setUsers(userRows); setDossiers(dossierRows);
      setError("");
    } catch (loadError) { setError(loadError.message || "Impossible de charger le journal."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const filtered = useMemo(() => rows.filter((row) => {
    const time = new Date(row.date).getTime();
    return (!filters.since || time >= new Date(`${filters.since}T00:00:00`).getTime())
      && (!filters.until || time < new Date(`${filters.until}T23:59:59`).getTime())
      && (!filters.author || row.auteurId === filters.author)
      && (!filters.type || row.typeMouvement === filters.type)
      && (!filters.dossier || row.dossierId === filters.dossier);
  }), [rows, filters]);
  const userMap = new Map(users.map((item) => [item.id, item]));
  const dossierMap = new Map(dossiers.map((item) => [item.id, item]));
  const exportMock = () => toast.info("L'export du journal sera disponible avec le branchement serveur.");
  return (
    <PageFrame title="Journal de traçabilité" description="Historique en lecture seule des actions, consultations et changements de comptes." icon={ShieldCheck} action={<Button variant="outline" onClick={exportMock}><Download data-icon="inline-start" />Exporter</Button>}>
      <Panel title="Filtres" description="Filtrez les mouvements par période, auteur, type ou dossier.">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Du" htmlFor="journal-since"><Input id="journal-since" type="date" value={filters.since} onChange={(event) => setFilters((v) => ({ ...v, since: event.target.value }))} /></Field>
          <Field label="Au" htmlFor="journal-until"><Input id="journal-until" type="date" value={filters.until} onChange={(event) => setFilters((v) => ({ ...v, until: event.target.value }))} /></Field>
          <Field label="Auteur" htmlFor="journal-author"><NativeSelect id="journal-author" value={filters.author} onChange={(event) => setFilters((v) => ({ ...v, author: event.target.value }))}><option value="">Tous les auteurs</option>{users.map((item) => <option key={item.id} value={item.id}>{fullName(item)}</option>)}</NativeSelect></Field>
          <Field label="Type" htmlFor="journal-type"><NativeSelect id="journal-type" value={filters.type} onChange={(event) => setFilters((v) => ({ ...v, type: event.target.value }))}><option value="">Tous les types</option>{Object.entries(movementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></Field>
          <Field label="Dossier" htmlFor="journal-dossier"><NativeSelect id="journal-dossier" value={filters.dossier} onChange={(event) => setFilters((v) => ({ ...v, dossier: event.target.value }))}><option value="">Tous les dossiers</option>{dossiers.map((item) => <option key={item.id} value={item.id}>{item.reference}</option>)}</NativeSelect></Field>
        </div>
      </Panel>
      <Panel>
        <TableFrame headers={["Date et heure", "Auteur", "Type", "Dossier", "Compte concerné", "Description"]} loading={loading} error={error} onRetry={load} empty={filtered.length ? null : "Aucun mouvement ne correspond aux filtres."}>
          {filtered.map((movement) => {
            const isDeputyView = movement.typeMouvement === TypeMouvement.CONSULTATION_ADJOINT;
            return <tr key={movement.id} className={isDeputyView ? "bg-amber-500/10" : ""}>
              <Cell>{displayDate(movement.date, true)}</Cell>
              <Cell>{fullName(userMap.get(movement.auteurId))}</Cell>
              <Cell>{movementLabels[movement.typeMouvement] || movement.typeMouvement}</Cell>
              <Cell>{movement.dossierId ? dossierMap.get(movement.dossierId)?.reference || movement.dossierId : "—"}</Cell>
              <Cell>{movement.compteConcerneId ? fullName(userMap.get(movement.compteConcerneId)) : "—"}</Cell>
              <Cell className="whitespace-normal">{isDeputyView && <span className="mr-2 rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-900">Consultation adjoint</span>}{movement.description}</Cell>
            </tr>;
          })}
        </TableFrame>
      </Panel>
    </PageFrame>
  );
}

export function RolesPage() {
  const roles = Object.values(Role);
  const routeLabels = {
    "/dashboard": "Tableau de bord", "/dossiers": "Dossiers", "/dossiers/nouveau": "Créer un dossier",
    "/a-affecter": "Affecter", "/mes-dossiers": "Mes dossiers", "/relectures": "Relectures",
    "/signatures": "Circuit de signature", "/secretariat/cachets": "Cachets",
    "/retours-cabinet": "Retours cabinet", "/notifications": "Notifications", "/recherche": "Recherche",
    "/administration/acces-exceptionnels": "Accès exceptionnels", "/administration/prises-en-charge": "Prises en charge",
    "/administration/comptes": "Comptes", "/administration/cellules": "Cellules",
    "/administration/provenances": "Provenances", "/administration/journal": "Journal",
    "/administration/roles": "Rôles", "/profil": "Profil",
  };
  return (
    <PageFrame title="Rôles et matrice des droits" description="Référence en lecture seule des huit rôles fixes et de leurs accès aux fonctions BESD." icon={ShieldCheck}>
      <Panel title="Rôles" description="Les droits de consultation et d'action dépendent également de l'affectation et des autorisations de dossier.">
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => {
            const config = BESD_ROLES_CONFIG[role];
            return <article key={role} className="rounded-lg border p-3"><h3 className="font-medium">{config.label}</h3><p className="mt-1 text-sm text-muted-foreground">{roleDescriptions[role]}</p></article>;
          })}
        </div>
      </Panel>
      <Panel title="Accès aux fonctions" description="La coche indique l'accès à la route ; elle ne confère pas d'accès à un dossier hors périmètre.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-muted/50"><tr><th scope="col" className="sticky left-0 bg-muted/50 px-4 py-3">Fonction</th>{roles.map((role) => <th scope="col" key={role} className="px-3 py-3 text-center">{BESD_ROLES_CONFIG[role].shortLabel}</th>)}</tr></thead>
            <tbody className="divide-y">
              {Object.entries(ROUTE_PERMISSIONS).map(([route, allowed]) => <tr key={route}><th scope="row" className="sticky left-0 bg-background px-4 py-2 font-medium">{routeLabels[route] || route}</th>{roles.map((role) => <td key={role} className="px-3 py-2 text-center">{allowed.includes(role) ? <Check className="mx-auto size-4 text-emerald-600" aria-label="Autorisé" /> : <span className="text-muted-foreground" aria-label="Non autorisé">—</span>}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageFrame>
  );
}

export function ProfilPage() {
  const user = useSessionStore((state) => state.user);
  return <ProfilEditor key={user?.id || "profile"} user={user} />;
}

function ProfilEditor({ user }) {
  const updateSessionUser = useSessionStore((state) => state.updateUser);
  const themeMode = usePreferencesStore((state) => state.values.theme_mode);
  const contentLayout = usePreferencesStore((state) => state.values.content_layout);
  const setPreference = usePreferencesStore((state) => state.setPreference);
  const [identity, setIdentity] = useState({ nom: user?.nom || "", prenom: user?.prenom || "", email: user?.email || "" });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const saveIdentity = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (!identity.nom.trim() || !identity.prenom.trim() || !identity.email.trim()) throw new Error("Tous les champs d'identité sont obligatoires.");
      const updated = await updateUtilisateur(user.id, identity);
      updateSessionUser(updated);
      toast.success("Votre profil a été mis à jour.");
    } catch (saveError) { setError(saveError.message || "Le profil n'a pas pu être enregistré."); }
    finally { setSaving(false); }
  };
  const changePreference = (key, value) => {
    setPreference(key, value);
    toast.success("Préférence d'affichage enregistrée.");
  };
  const changePassword = (event) => {
    event.preventDefault();
    if (password.length < 8) { setError("Le mot de passe doit comporter au moins 8 caractères."); return; }
    if (password !== confirmPassword) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setPasswordOpen(false); setPassword(""); setConfirmPassword(""); setError("");
    toast.success("La modification du mot de passe sera disponible avec l'authentification.");
  };
  return (
    <PageFrame title="Mon profil" description="Informations de votre compte, rôle actif et préférences d'affichage." icon={UserRound}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <Panel title="Identité">
            <form onSubmit={saveIdentity} className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="profile-last"><Input id="profile-last" value={identity.nom} onChange={(event) => setIdentity((v) => ({ ...v, nom: event.target.value }))} required /></Field>
              <Field label="Prénom" htmlFor="profile-first"><Input id="profile-first" value={identity.prenom} onChange={(event) => setIdentity((v) => ({ ...v, prenom: event.target.value }))} required /></Field>
              <Field label="Courriel professionnel" htmlFor="profile-email"><Input id="profile-email" type="email" value={identity.email} onChange={(event) => setIdentity((v) => ({ ...v, email: event.target.value }))} required /></Field>
              {error && !passwordOpen && <p role="alert" className="self-center text-sm text-destructive sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer le profil"}</Button></div>
            </form>
          </Panel>
          <Panel title="Préférences d'affichage">
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Thème" htmlFor="profile-theme"><NativeSelect id="profile-theme" value={themeMode} onChange={(event) => changePreference("theme_mode", event.target.value)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="system">Système</option></NativeSelect></Field>
              <Field label="Disposition" htmlFor="profile-layout"><NativeSelect id="profile-layout" value={contentLayout} onChange={(event) => changePreference("content_layout", event.target.value)}><option value="centered">Centrée</option><option value="full-width">Pleine largeur</option></NativeSelect></Field>
            </div>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Compte actif">
            <dl className="space-y-4 p-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Identité</dt><dd className="mt-1 font-medium">{fullName(user)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Rôle</dt><dd className="mt-1 font-medium">{roleLabels[user?.role] || user?.role || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Cellule</dt><dd className="mt-1 font-medium">{user?.cellule || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Courriel</dt><dd className="mt-1 break-all font-medium">{user?.email || "—"}</dd></div>
            </dl>
          </Panel>
          <Panel title="Sécurité">
            <div className="p-4"><p className="mb-3 text-sm text-muted-foreground">Le changement de mot de passe est simulé dans cette version de démonstration.</p><Button variant="outline" onClick={() => { setError(""); setPasswordOpen(true); }}>Modifier le mot de passe</Button></div>
          </Panel>
        </div>
      </div>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le mot de passe</DialogTitle><DialogDescription>Le nouveau mot de passe doit contenir au moins 8 caractères.</DialogDescription></DialogHeader>
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Nouveau mot de passe" htmlFor="profile-password"><Input id="profile-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field>
            <Field label="Confirmer le mot de passe" htmlFor="profile-password-confirm"><Input id="profile-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></Field>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Annuler</Button><Button>Confirmer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
