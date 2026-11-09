"use client";

import * as React from "react";
import { Landmark, Plus, Building, User, HelpCircle, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialProvenances } from "@/src/lib/mock/data";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} Provenance
 * @property {string} id - Identifiant unique
 * @property {string} nom - Intitulé officiel
 * @property {"MINISTERE"|"INSTITUTION"|"INDIVIDUEL"|"AUTRE"} categorie - Catégorie de provenance
 * @property {boolean} [actif=true] - Statut actif
 */

/**
 * @typedef {Object} ProvenanceSelectProps
 * @property {string} [value] - Identifiant de la provenance sélectionnée
 * @property {(provenanceId: string, provenance?: Provenance) => void} onChange - Callback au changement
 * @property {Provenance[]} [provenances] - Liste des provenances (utilise les mocks par défaut)
 * @property {string} [placeholder="Sélectionner une provenance..."] - Texte d'invite
 * @property {boolean} [disabled=false] - Désactivation
 * @property {string} [className] - Classes CSS personnalisées
 */

/**
 * Sélecteur de provenance avec modalité d'ajout rapide « Autre ».
 * Conforme aux sections 4.4, 4.7 et 4.18 de docs/BESD_structure_interfaces.md :
 * « Provenance (liste déroulante avec option « Autre » qui ouvre une mini-fenêtre d'ajout). »
 *
 * @param {ProvenanceSelectProps} props
 */
export function ProvenanceSelect({
  value,
  onChange,
  provenances: propProvenances,
  placeholder = "Sélectionner une institution d'origine...",
  disabled = false,
  className,
}) {
  const [list, setList] = React.useState(propProvenances || initialProvenances);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newNom, setNewNom] = React.useState("");
  const [newCategorie, setNewCategorie] = React.useState("MINISTERE");
  const [error, setError] = React.useState("");

  const handleSelectChange = (selectedValue) => {
    if (selectedValue === "ADD_NEW_PROVENANCE") {
      setDialogOpen(true);
      return;
    }
    const found = list.find((p) => p.id === selectedValue);
    onChange?.(selectedValue, found);
  };

  const handleCreateNewProvenance = (e) => {
    e.preventDefault();
    if (!newNom.trim()) {
      setError("Veuillez renseigner le nom de la provenance.");
      return;
    }

    const newId = `prov-${Date.now().toString(36)}`;
    const createdItem = {
      id: newId,
      nom: newNom.trim(),
      categorie: newCategorie,
      actif: true,
    };

    setList((prev) => [...prev, createdItem]);
    onChange?.(newId, createdItem);

    // Réinitialisation et fermeture du dialogue
    setNewNom("");
    setNewCategorie("MINISTERE");
    setError("");
    setDialogOpen(false);
  };

  const selectedItem = list.find((p) => p.id === value);

  return (
    <>
      <div className={cn("relative w-full", className)}>
        <Select
          value={value || ""}
          onValueChange={handleSelectChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full text-xs h-9 bg-background">
            <div className="flex items-center gap-2 truncate">
              <Landmark className="size-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder={placeholder}>
                {selectedItem ? selectedItem.nom : placeholder}
              </SelectValue>
            </div>
          </SelectTrigger>

          <SelectContent className="max-h-72">
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase font-mono text-muted-foreground">
                Institutions & Ministères
              </SelectLabel>
              {list
                .filter((p) => p.actif !== false)
                .map((prov) => (
                  <SelectItem key={prov.id} value={prov.id} className="text-xs">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{prov.nom}</span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {prov.categorie}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectGroup>

            <SelectSeparator />

            {/* Option spéciale « Autre » ouvrant le dialogue */}
            <SelectItem
              value="ADD_NEW_PROVENANCE"
              className="text-xs font-semibold text-primary focus:bg-primary/10 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 py-0.5">
                <Plus className="size-3.5 text-primary" />
                <span>+ Autre provenance (Créer...)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mini-fenêtre de dialogue d'ajout de provenance */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="size-4 text-primary" />
              <span>Ajouter une nouvelle provenance</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Renseignez l&apos;institution ou l&apos;autorité d&apos;origine. Elle sera enregistrée et immédiatement sélectionnée pour ce dossier.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewProvenance} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <label htmlFor="prov-name" className="text-xs font-medium text-foreground">
                Intitulé officiel de la provenance <span className="text-destructive">*</span>
              </label>
              <Input
                id="prov-name"
                placeholder="Ex : Ambassade de France, Préfecture maritime..."
                value={newNom}
                onChange={(e) => {
                  setNewNom(e.target.value);
                  if (error) setError("");
                }}
                className="text-xs h-8"
                autoFocus
              />
              {error && <p className="text-[11px] text-destructive">{error}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prov-cat" className="text-xs font-medium text-foreground">
                Catégorie administrative
              </label>
              <Select value={newCategorie} onValueChange={setNewCategorie}>
                <SelectTrigger id="prov-cat" className="text-xs h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINISTERE" className="text-xs">
                    Ministère / Secrétariat d&apos;État
                  </SelectItem>
                  <SelectItem value="INSTITUTION" className="text-xs">
                    Institution publique / Armée / Ambassade
                  </SelectItem>
                  <SelectItem value="INDIVIDUEL" className="text-xs">
                    Requête individuelle / Personnalité
                  </SelectItem>
                  <SelectItem value="AUTRE" className="text-xs">
                    Autre organisme
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="h-8 text-xs"
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs gap-1.5">
                <Check className="size-3.5" />
                <span>Créer et sélectionner</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProvenanceSelect;
