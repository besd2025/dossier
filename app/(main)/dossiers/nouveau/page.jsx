"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FileText, FileUp, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PdfFirstPageViewer, ProvenanceSelect } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDossier } from "@/src/lib/services/dossiers-service";
import { useSessionStore } from "@/stores/session/session-store";
import { InstructionCabinet, OrigineDossier, Role } from "@/types";

const instructionOptions = Object.values(InstructionCabinet);
const origineOptions = Object.values(OrigineDossier);

const formatLabel = (value) => {
  const labels = {
    [InstructionCabinet.POUR_ANALYSE]: "Pour analyse",
    [InstructionCabinet.POUR_ACTION]: "Pour action",
    [InstructionCabinet.POUR_TRAITEMENT]: "Pour traitement",
    [InstructionCabinet.POUR_CLASSEMENT]: "Pour classement",
    [InstructionCabinet.POUR_INFO]: "Pour information",
    [InstructionCabinet.POUR_SUIVI]: "Pour suivi",
    [InstructionCabinet.AUTRE]: "Autre",
    [OrigineDossier.VIA_CABINET_CIVIL]: "Cabinet civil",
    [OrigineDossier.DIRECT_CHEF_BUREAU]: "Direct chef de bureau",
    [OrigineDossier.RETOUR_CABINET_SANS_DOSSIER]: "Retour cabinet sans dossier",
  };
  return labels[value] || value;
};

const createSchema = (currentRole) =>
  z
    .object({
      reference: z.string().trim().min(1, "Le numéro de référence est obligatoire."),
      objet: z.string().trim().min(3, "L'objet est trop court."),
      provenanceId: z.string().trim().min(1, "Une provenance est requise."),
      provenanceNom: z.string().trim().optional(),
      instructionCabinet: z.string().trim().min(1, "L'instruction du cabinet est obligatoire."),
      origine: z.string().trim().min(1, "L'origine du dossier est obligatoire."),
      dateTransmissionOrigine: z.string().trim().min(1, "La date de transmission est obligatoire."),
      dateReceptionCabinet: z.string().trim().min(1, "La date de réception cabinet est obligatoire."),
      dateReceptionBesd: z.string().trim().min(1, "La date de réception BESD est obligatoire."),
      multiBureaux: z.boolean().default(false),
      bureauPrecedent: z.string().trim().optional(),
      rangBesd: z.string().trim().optional(),
      dateMiseEnAttente: z.string().trim().optional(),
      premierePagePdfUrl: z.string().trim().optional(),
    })
    .superRefine((value, ctx) => {
      const valueDate = (date) => {
        if (!date) return null;
        const parsed = new Date(`${date}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const transmission = valueDate(value.dateTransmissionOrigine);
      const cabinet = valueDate(value.dateReceptionCabinet);
      const besd = valueDate(value.dateReceptionBesd);

      if (transmission && cabinet && transmission > cabinet) {
        ctx.addIssue({
          code: "custom",
          path: ["dateTransmissionOrigine"],
          message: "La date de transmission doit précéder la date de réception au cabinet.",
        });
      }

      if (cabinet && besd && cabinet > besd) {
        ctx.addIssue({
          code: "custom",
          path: ["dateReceptionCabinet"],
          message: "La date de réception au cabinet doit précéder la date de réception BESD.",
        });
      }

      if (value.multiBureaux) {
        if (!value.bureauPrecedent || !value.bureauPrecedent.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["bureauPrecedent"],
            message: "Le bureau précédent est requis lorsque le dossier est multi-bureaux.",
          });
        }

        if (!value.dateMiseEnAttente || !value.dateMiseEnAttente.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["dateMiseEnAttente"],
            message: "La date de mise en attente est requise en mode multi-bureaux.",
          });
        }

        if (value.rangBesd && Number(value.rangBesd) < 2) {
          ctx.addIssue({
            code: "custom",
            path: ["rangBesd"],
            message: "Le rang BESD doit être supérieur ou égal à 2 lorsqu'un dossier est multi-bureaux.",
          });
        }
      }

      if (currentRole === Role.CHEF_BUREAU && value.origine !== OrigineDossier.DIRECT_CHEF_BUREAU) {
        ctx.addIssue({
          code: "custom",
          path: ["origine"],
          message: "Un chef de bureau ne peut enregistrer qu'un dossier d'origine directe.",
        });
      }
    });

export default function NouveauDossierPage() {
  const router = useRouter();
  const currentRole = useSessionStore((state) => state.role);
  const currentUser = useSessionStore((state) => state.user);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");

  const allowedOrigines = useMemo(
    () =>
      currentRole === Role.SECRETARIAT
        ? origineOptions
        : [OrigineDossier.DIRECT_CHEF_BUREAU],
    [currentRole],
  );

  const schema = useMemo(() => createSchema(currentRole), [currentRole]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      reference: "",
      objet: "",
      provenanceId: "",
      provenanceNom: "",
      instructionCabinet: InstructionCabinet.POUR_ANALYSE,
      origine: currentRole === Role.CHEF_BUREAU ? OrigineDossier.DIRECT_CHEF_BUREAU : OrigineDossier.VIA_CABINET_CIVIL,
      dateTransmissionOrigine: "",
      dateReceptionCabinet: "",
      dateReceptionBesd: "",
      multiBureaux: false,
      bureauPrecedent: "",
      rangBesd: "",
      dateMiseEnAttente: "",
      premierePagePdfUrl: "",
    },
  });

  const { register, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = form;
  const selectedOrigine = watch("origine");
  const isMultiBureaux = watch("multiBureaux");

  useEffect(() => {
    if (currentRole !== Role.SECRETARIAT && currentRole !== Role.CHEF_BUREAU) {
      toast.error("Accès non autorisé pour l'enregistrement d'un dossier.");
      router.replace("/dossiers");
    }
  }, [currentRole, router]);

  useEffect(() => {
    if (currentRole === Role.CHEF_BUREAU && selectedOrigine !== OrigineDossier.DIRECT_CHEF_BUREAU) {
      setValue("origine", OrigineDossier.DIRECT_CHEF_BUREAU, { shouldValidate: true });
    }
  }, [currentRole, selectedOrigine, setValue]);

  useEffect(() => () => {
    if (pdfPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
  }, [pdfPreviewUrl]);

  const handleProvenanceChange = (provenanceId, provenance) => {
    setValue("provenanceId", provenanceId, { shouldValidate: true });
    setValue("provenanceNom", provenance?.nom || "", { shouldValidate: true });
  };

  const handlePdfUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Le document doit être au format PDF.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPdfPreviewUrl(objectUrl);
    setValue("premierePagePdfUrl", objectUrl, { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    if (currentRole !== Role.SECRETARIAT && currentRole !== Role.CHEF_BUREAU) {
      toast.error("Vous n'êtes pas autorisé à enregistrer un dossier.");
      return;
    }

    if (currentRole === Role.CHEF_BUREAU && values.origine !== OrigineDossier.DIRECT_CHEF_BUREAU) {
      toast.error("Le chef de bureau ne peut enregistrer qu'un dossier d'origine directe.");
      return;
    }

    const payload = {
      ...values,
      provenanceNom: selectedProvenance?.nom || values.provenanceNom || "Provenance inconnue",
      multiBureaux: Boolean(values.multiBureaux),
      bureauPrecedent: values.multiBureaux ? values.bureauPrecedent : "",
      rangBesd: values.multiBureaux && values.rangBesd ? Number(values.rangBesd) : undefined,
      dateMiseEnAttente: values.multiBureaux ? values.dateMiseEnAttente : null,
      premierePagePdfUrl: values.premierePagePdfUrl || "/mock/pdf/default_p1.pdf",
      objet: values.objet.trim(),
      reference: values.reference.trim(),
    };

    try {
      const dossier = await createDossier(payload, currentUser?.id || "usr-03");
      toast.success(`Dossier ${dossier.reference} enregistré avec succès.`);
      router.push(`/dossiers/${dossier.id}`);
    } catch (error) {
      toast.error(error?.message || "L'enregistrement du dossier a échoué.");
    }
  };

  if (currentRole !== Role.SECRETARIAT && currentRole !== Role.CHEF_BUREAU) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="size-4" />
          Accès interdit
        </div>
        <p className="mt-2">Seul le secrétariat ou le chef de bureau peut créer un dossier.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enregistrement d&apos;un dossier</h1>
        <p className="text-sm text-muted-foreground">
          Saisie administrative, provenance, multi-bureaux et première page numérisée.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dossier</CardTitle>
            <CardDescription>Référence, objet et dates de transmission / réception.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" placeholder="Ex. 2026-D-0151" {...register("reference")} />
              {errors.reference ? <p className="text-xs text-destructive">{errors.reference.message}</p> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="objet">Objet</Label>
              <Input id="objet" placeholder="Objet complet du dossier" {...register("objet")} />
              {errors.objet ? <p className="text-xs text-destructive">{errors.objet.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTransmissionOrigine">Date de transmission par l&apos;institution d&apos;origine</Label>
              <Input id="dateTransmissionOrigine" type="date" {...register("dateTransmissionOrigine")} />
              {errors.dateTransmissionOrigine ? (
                <p className="text-xs text-destructive">{errors.dateTransmissionOrigine.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateReceptionCabinet">Date de réception par le cabinet</Label>
              <Input id="dateReceptionCabinet" type="date" {...register("dateReceptionCabinet")} />
              {errors.dateReceptionCabinet ? (
                <p className="text-xs text-destructive">{errors.dateReceptionCabinet.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateReceptionBesd">Date de réception au BESD</Label>
              <Input id="dateReceptionBesd" type="date" {...register("dateReceptionBesd")} />
              {errors.dateReceptionBesd ? (
                <p className="text-xs text-destructive">{errors.dateReceptionBesd.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructionCabinet">Instruction du cabinet</Label>
              <Select
                value={watch("instructionCabinet")}
                onValueChange={(value) => setValue("instructionCabinet", value, { shouldValidate: true })}
              >
                <SelectTrigger id="instructionCabinet">
                  <SelectValue placeholder="Choisir une instruction" />
                </SelectTrigger>
                <SelectContent>
                  {instructionOptions.map((instruction) => (
                    <SelectItem key={instruction} value={instruction} className="text-xs">
                      {formatLabel(instruction)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.instructionCabinet ? (
                <p className="text-xs text-destructive">{errors.instructionCabinet.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Origine et provenance</CardTitle>
            <CardDescription>Choix de l&apos;origine du dossier et de la provenance institutionnelle.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origine">Origine</Label>
              <Select
                value={watch("origine")}
                onValueChange={(value) => setValue("origine", value, { shouldValidate: true })}
              >
                <SelectTrigger id="origine">
                  <SelectValue placeholder="Choisir une origine" />
                </SelectTrigger>
                <SelectContent>
                  {allowedOrigines.map((origine) => (
                    <SelectItem key={origine} value={origine} className="text-xs">
                      {formatLabel(origine)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.origine ? <p className="text-xs text-destructive">{errors.origine.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Provenance</Label>
              <ProvenanceSelect
                value={watch("provenanceId")}
                onChange={(provenanceId, provenance) => handleProvenanceChange(provenanceId, provenance)}
              />
              {errors.provenanceId ? (
                <p className="text-xs text-destructive">{errors.provenanceId.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multi-bureaux</CardTitle>
            <CardDescription>
              Si le dossier est affecté à plusieurs bureaux, cochez la case et complétez les informations d&apos;attente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={Boolean(watch("multiBureaux"))}
                onChange={(event) => setValue("multiBureaux", event.target.checked, { shouldValidate: true })}
              />
              Dossier affecté à plusieurs bureaux
            </label>

            {isMultiBureaux ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bureauPrecedent">Bureau précédent</Label>
                  <Input id="bureauPrecedent" placeholder="Ex. Bureau des affaires juridiques" {...register("bureauPrecedent")} />
                  {errors.bureauPrecedent ? (
                    <p className="text-xs text-destructive">{errors.bureauPrecedent.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rangBesd">Rang BESD</Label>
                  <Input id="rangBesd" type="number" min="2" placeholder="2" {...register("rangBesd")} />
                  {errors.rangBesd ? (
                    <p className="text-xs text-destructive">{errors.rangBesd.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateMiseEnAttente">Date de mise en attente</Label>
                  <Input id="dateMiseEnAttente" type="date" {...register("dateMiseEnAttente")} />
                  {errors.dateMiseEnAttente ? (
                    <p className="text-xs text-destructive">{errors.dateMiseEnAttente.message}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isMultiBureaux ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                Le dossier sera en attente d&apos;un autre bureau tant que la date de réception effective n&apos;est pas saisie.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Première page PDF</CardTitle>
            <CardDescription>Pièce jointe de la première page numérisée. Seule la première page est archivée.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center transition hover:bg-muted/50">
              <FileUp className="mb-3 size-6 text-primary" />
              <span className="text-sm font-medium">Téléverser la première page (PDF)</span>
              <span className="mt-1 text-xs text-muted-foreground">Format attendu : PDF</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
            </label>

            {pdfPreviewUrl ? (
              <PdfFirstPageViewer src={pdfPreviewUrl} title="Première page du dossier" reference={watch("reference") || "Nouveau dossier"} />
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2 font-medium text-foreground">
                  <FileText className="size-4" />
                  Aucune première page téléversée
                </div>
                <p className="mt-2">L&apos;aperçu s&apos;affichera ici après le chargement du PDF.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {errors.root ? <p className="text-xs text-destructive">{errors.root.message}</p> : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dossiers")}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer et transmettre au Chef de bureau"}
          </Button>
        </div>
      </form>
    </div>
  );
}

