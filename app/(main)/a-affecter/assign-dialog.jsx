"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, UserRound, UsersRound } from "lucide-react";

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
import { Role } from "@/types";

const isOfficeManager = (role) => role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT;

function personName(user) {
  return [user.prenom, user.nom].filter(Boolean).join(" ");
}

function CheckboxOption({ checked, onChange, children, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{children}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}

export function AssignDialog({ dossier, role, user, users, cellules, open, onOpenChange, onAssigned }) {
  const [step, setStep] = useState("form");
  const [bureauMode, setBureauMode] = useState("cellules");
  const [celluleIds, setCelluleIds] = useState([]);
  const [preferredCounselorId, setPreferredCounselorId] = useState("none");
  const [horsCelluleId, setHorsCelluleId] = useState("none");
  const [conseillerIds, setConseillerIds] = useState([]);
  const [assignToDeputy, setAssignToDeputy] = useState(false);
  const [adjointId, setAdjointId] = useState("none");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const officeManager = isOfficeManager(role);
  const cellIds = useMemo(() => new Set(celluleIds), [celluleIds]);
  const selectedCells = useMemo(
    () => cellules.filter((cellule) => cellIds.has(cellule.id)),
    [cellules, cellIds],
  );
  const eligibleCounselors = useMemo(
    () => users.filter((item) => item.role === Role.CONSEILLER && item.actif),
    [users],
  );
  const eligibleOutsideCounselors = useMemo(
    () => users.filter((item) => item.role === Role.CONSEILLER_HORS_CELLULE && item.actif),
    [users],
  );
  const deputies = useMemo(
    () =>
      users.filter((item) =>
        officeManager
          ? item.role === Role.CHEF_BUREAU_ADJOINT && item.actif
          : item.role === Role.CHEF_CELLULE_ADJOINT &&
            item.celluleId === user?.celluleId &&
            item.actif,
      ),
    [users, officeManager, user?.celluleId],
  );
  const preferredCandidates = useMemo(
    () =>
      eligibleCounselors.filter(
        (counselor) => !selectedCells.length || selectedCells.some((cellule) => cellule.id === counselor.celluleId),
      ),
    [eligibleCounselors, selectedCells],
  );
  const selectedCounselors = useMemo(
    () => conseillerIds.map((id) => eligibleCounselors.find((counselor) => counselor.id === id)).filter(Boolean),
    [conseillerIds, eligibleCounselors],
  );
  const externalCounselor = eligibleOutsideCounselors.find((candidate) => candidate.id === horsCelluleId);
  const selectedDeputy = deputies.find((candidate) => candidate.id === adjointId);

  const reset = () => {
    setStep("form");
    setBureauMode("cellules");
    setCelluleIds([]);
    setPreferredCounselorId("none");
    setHorsCelluleId("none");
    setConseillerIds([]);
    setAssignToDeputy(false);
    setAdjointId("none");
    setError("");
    setSaving(false);
  };

  const closeDialog = (nextOpen) => {
    if (!nextOpen && !saving) reset();
    onOpenChange(nextOpen);
  };

  const toggleCell = (id) => {
    setCelluleIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 2) return current;
      return [...current, id];
    });
  };

  const toggleCounselor = (id) => {
    setConseillerIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 2) return current;
      return [...current, id];
    });
  };

  const validate = () => {
    if (officeManager && bureauMode === "cellules" && (celluleIds.length < 1 || celluleIds.length > 2)) {
      return "Choisissez une ou deux cellules.";
    }
    if (
      officeManager &&
      bureauMode === "cellules" &&
      preferredCounselorId !== "none" &&
      !preferredCandidates.some((candidate) => candidate.id === preferredCounselorId)
    ) {
      return "Le conseiller préféré doit appartenir à l'une des cellules sélectionnées.";
    }
    if (officeManager && bureauMode === "hors_cellule" && !externalCounselor) {
      return "Choisissez le conseiller hors cellule à qui confier le dossier.";
    }
    if (!officeManager && bureauMode === "cellules" && (conseillerIds.length < 1 || conseillerIds.length > 2)) {
      return "Choisissez un ou deux conseillers.";
    }
    if (assignToDeputy && !selectedDeputy) return "Choisissez l'adjoint qui prendra en charge le dossier.";
    return "";
  };

  const buildAssignment = () => {
    if (officeManager) {
      if (bureauMode === "self") return { type: "AUTO_TRAITEMENT" };
      if (bureauMode === "hors_cellule") {
        return { type: "HORS_CELLULE", conseillerId: externalCounselor.id };
      }
      return {
        type: "BUREAU_VERS_CELLULE",
        cellules: celluleIds.map((id) => ({ celluleId: id })),
        conseillerPrefereId: preferredCounselorId === "none" ? null : preferredCounselorId,
        adjointId: assignToDeputy ? adjointId : null,
      };
    }
    if (bureauMode === "self") return { type: "AUTO_TRAITEMENT" };
    return {
      type: "CELLULE_VERS_CONSEILLER",
      conseillers: selectedCounselors,
    };
  };

  const handleReview = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep("review");
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      await onAssigned(buildAssignment());
      reset();
      onOpenChange(false);
    } catch (assignmentError) {
      setError(assignmentError?.message || "L'affectation n'a pas pu être enregistrée.");
      setStep("form");
    } finally {
      setSaving(false);
    }
  };

  const setMode = (mode) => {
    setBureauMode(mode);
    setError("");
    if (mode !== "cellules") {
      setCelluleIds([]);
      setPreferredCounselorId("none");
      setConseillerIds([]);
      setAssignToDeputy(false);
      setAdjointId("none");
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{step === "review" ? "Récapitulatif de l'affectation" : "Affecter le dossier"}</DialogTitle>
          <DialogDescription>
            {dossier.reference} · {dossier.objet}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            {officeManager ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">Mode d&apos;affectation</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ["cellules", "Affecter à une ou deux cellules"],
                      ["self", "Traiter moi-même"],
                      ["hors_cellule", "Confier hors cellule"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs hover:bg-muted/40">
                        <input
                          type="radio"
                          name="bureau-mode"
                          checked={bureauMode === value}
                          onChange={() => setMode(value)}
                          className="mt-0.5 accent-primary"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {bureauMode === "cellules" && (
                  <>
                    <fieldset className="space-y-2">
                      <legend className="mb-2 text-sm font-medium">Cellules (maximum deux)</legend>
                      <p className="text-xs text-muted-foreground">
                        La première cellule sélectionnée sera principale ; la seconde, collaboratrice.
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {cellules.map((cellule) => (
                          <CheckboxOption
                            key={cellule.id}
                            checked={celluleIds.includes(cellule.id)}
                            onChange={() => toggleCell(cellule.id)}
                            description={`${celluleIds.includes(cellule.id)
                              ? `Cellule ${celluleIds.indexOf(cellule.id) === 0 ? "principale" : "collaboratrice"} · `
                              : ""}${cellule.nom}`}
                          >
                            {cellule.code}
                          </CheckboxOption>
                        ))}
                      </div>
                    </fieldset>
                    <div className="space-y-2">
                      <Label htmlFor="preferred-counselor">Conseiller préféré (facultatif)</Label>
                      <Select value={preferredCounselorId} onValueChange={setPreferredCounselorId}>
                        <SelectTrigger id="preferred-counselor" className="w-full">
                          <SelectValue placeholder="Aucun conseiller préféré" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun conseiller préféré</SelectItem>
                          {preferredCandidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {personName(candidate)} · {candidate.cellule || "Sans cellule"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {bureauMode === "hors_cellule" && (
                  <div className="space-y-2">
                    <Label htmlFor="outside-counselor">Conseiller hors cellule</Label>
                    <Select value={horsCelluleId} onValueChange={setHorsCelluleId}>
                      <SelectTrigger id="outside-counselor" className="w-full">
                        <SelectValue placeholder="Choisir un conseiller" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleOutsideCounselors.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {personName(candidate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {bureauMode === "cellules" && role === Role.CHEF_BUREAU && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <CheckboxOption
                      checked={assignToDeputy}
                      onChange={(event) => {
                        setAssignToDeputy(event.target.checked);
                        if (!event.target.checked) setAdjointId("none");
                      }}
                      description="La prise en charge reste active jusqu'à la signature."
                    >
                      Confier le suivi et la prise en charge à mon adjoint jusqu&apos;à la signature
                    </CheckboxOption>
                    {assignToDeputy && (
                      <div className="space-y-2">
                        <Label htmlFor="office-deputy">Adjoint désigné</Label>
                        <Select value={adjointId} onValueChange={setAdjointId}>
                          <SelectTrigger id="office-deputy" className="w-full">
                            <SelectValue placeholder="Choisir un adjoint" />
                          </SelectTrigger>
                          <SelectContent>
                            {deputies.map((candidate) => (
                              <SelectItem key={candidate.id} value={candidate.id}>
                                {personName(candidate)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">Mode d&apos;affectation</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["cellules", "Affecter à un ou deux conseillers"],
                      ["self", "Traiter moi-même"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                        <input
                          type="radio"
                          name="cell-mode"
                          checked={bureauMode === value}
                          onChange={() => setMode(value)}
                          className="mt-0.5 accent-primary"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {bureauMode === "cellules" && (
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-sm font-medium">Conseillers (maximum deux)</legend>
                    {eligibleCounselors.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {eligibleCounselors.map((candidate) => (
                          <CheckboxOption
                            key={candidate.id}
                            checked={conseillerIds.includes(candidate.id)}
                            onChange={() => toggleCounselor(candidate.id)}
                            description={candidate.cellule || "Sans cellule"}
                          >
                            {personName(candidate)}
                          </CheckboxOption>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Aucun conseiller actif n&apos;est disponible.
                      </p>
                    )}
                  </fieldset>
                )}
              </>
            )}

            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleReview}>
                Vérifier le récapitulatif
                <ChevronRight className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Dossier sélectionné</h3>
              <p className="text-sm">{dossier.reference} · {dossier.objet}</p>
              <h3 className="pt-2 text-sm font-semibold">Affectation prévue</h3>
              {officeManager ? (
                bureauMode === "self" ? (
                  <p className="flex items-center gap-2 text-sm"><UserRound className="size-4" />Traitement par {personName(user)}</p>
                ) : bureauMode === "hors_cellule" ? (
                  <p className="flex items-center gap-2 text-sm"><UserRound className="size-4" />{personName(externalCounselor)}</p>
                ) : (
                  <>
                    {selectedCells.map((cellule, index) => (
                      <p key={cellule.id} className="flex items-center gap-2 text-sm">
                        <UsersRound className="size-4" />
                        {cellule.code} · {index === 0 ? "principale" : "collaboratrice"}
                      </p>
                    ))}
                    <p className="text-sm">Conseiller préféré : {preferredCandidates.find((candidate) => candidate.id === preferredCounselorId)
                      ? personName(preferredCandidates.find((candidate) => candidate.id === preferredCounselorId))
                      : "Aucun"}</p>
                    {assignToDeputy && <p className="text-sm">Prise en charge : {personName(selectedDeputy)} jusqu&apos;à la signature</p>}
                  </>
                )
              ) : bureauMode === "self" ? (
                <p className="flex items-center gap-2 text-sm"><UserRound className="size-4" />Traitement par {personName(user)}</p>
              ) : (
                selectedCounselors.map((candidate) => (
                  <p key={candidate.id} className="flex items-center gap-2 text-sm">
                    <Check className="size-4" />
                    {personName(candidate)} · {candidate.cellule || "Sans cellule"}
                  </p>
                ))
              )}
            </div>
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setStep("form")}>
                <ChevronLeft className="size-4" />
                Modifier
              </Button>
              <Button type="button" disabled={saving} onClick={handleConfirm}>
                {saving ? "Enregistrement..." : "Confirmer l'affectation"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
