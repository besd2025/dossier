import { mockRuntime } from "@/lib/mock/runtime-state";
import { createDossier } from "@/lib/services/dossiers-service";
import { StatutDossier, StatutNote, TypeDocument, TypeMouvement } from "@/types";

const delay = (ms = 70) => new Promise((resolve) => setTimeout(resolve, ms));

function getUserName(userId) {
  const user = mockRuntime.utilisateurs.find((item) => item.id === userId);
  return user ? `${user.prenom} ${user.nom}` : "Secrétariat";
}

function enrichReturn(retour) {
  return {
    ...retour,
    dossier: mockRuntime.dossiers.find((item) => item.id === retour.dossierId) || null,
    noteOrigine: mockRuntime.notes.find((item) => item.id === retour.noteOrigineId) || null,
    nouveauCycle:
      mockRuntime.cycles.find((item) => item.id === retour.nouveauCycleId) || null,
  };
}

export async function getCabinetReturnOptions() {
  await delay(40);
  return {
    dossiers: [...mockRuntime.dossiers],
    notes: [...mockRuntime.notes],
    provenances: [...mockRuntime.provenances],
  };
}

export async function getCabinetReturns() {
  await delay();
  return [...mockRuntime.retoursCabinet]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(enrichReturn);
}

export async function createCabinetReturn(data, authorId = "usr-03") {
  await delay(100);
  if (!data.typeSuite) throw new Error("Le type de suite attendu est obligatoire.");

  const author = mockRuntime.utilisateurs.find((user) => user.id === authorId);
  if (!author || author.role !== "SECRETARIAT") {
    throw new Error("L'enregistrement des retours est réservé au Secrétariat.");
  }

  let dossier;
  let cycle;
  let sourceNote = null;
  const date = data.date || new Date().toISOString().slice(0, 10);
  const dateHeure = new Date(`${date}T12:00:00`).toISOString();
  const noPriorCase = Boolean(data.sansDossierPrealable);

  if (noPriorCase) {
    if (!data.objet?.trim()) {
      throw new Error("L'objet du nouveau dossier est obligatoire pour un retour sans dossier préalable.");
    }
    dossier = await createDossier(
      {
        objet: data.objet.trim(),
        provenanceId: data.provenanceId,
        origine: "RETOUR_CABINET_SANS_DOSSIER",
        provenanceNom: data.provenanceNom?.trim() || "Cabinet du Ministre",
        instructionCabinet: data.instructionCabinet || "POUR_ANALYSE",
        dateTransmissionOrigine: date,
        dateReceptionCabinet: date,
        dateReceptionBesd: date,
        premierePagePdfUrl: data.premierePagePdfUrl || "/sample-document.pdf",
      },
      authorId
    );
    cycle = mockRuntime.cycles.find((item) => item.dossierId === dossier.id);
    if (!cycle) throw new Error("Le cycle initial du nouveau dossier n'a pas été créé.");
    Object.assign(cycle, {
      typeSuite: "RETOUR_SANS_DOSSIER",
      dateOuverture: date,
      bureauxCollaboration: data.bureauxCollaboration || [],
      statut: "OUVERT",
    });
  } else {
    dossier = mockRuntime.dossiers.find((item) => item.id === data.dossierId);
    if (!dossier) throw new Error("Sélectionnez un dossier existant.");
    sourceNote = mockRuntime.notes.find(
      (item) => item.id === data.noteOrigineId && item.dossierId === dossier.id
    );
    if (!sourceNote) throw new Error("Sélectionnez la note d'origine renvoyée par le cabinet.");

    const dossierCycles = mockRuntime.cycles.filter((item) => item.dossierId === dossier.id);
    cycle = {
      id: `cyc-return-${Date.now()}`,
      dossierId: dossier.id,
      numeroCycle: Math.max(0, ...dossierCycles.map((item) => item.numeroCycle)) + 1,
      typeSuite: data.typeSuite,
      dateOuverture: date,
      bureauxCollaboration: data.bureauxCollaboration || [],
      statut: "OUVERT",
      noteOrigineId: sourceNote.id,
    };
    mockRuntime.cycles.push(cycle);
    dossier.statutDossier = StatutDossier.ACTIF_APRES_RETOUR;

    const newNote = {
      ...sourceNote,
      id: `not-return-${Date.now()}`,
      cycleId: cycle.id,
      typeDocument:
        data.typeSuite === "PROJET_LETTRE" ? TypeDocument.PROJET_LETTRE : sourceNote.typeDocument,
      statutNote: StatutNote.BROUILLON,
      numeroOfficiel: null,
      dateCreation: date,
      dateValidation: null,
      valideParId: null,
      dateImpression: null,
      imprimeParId: null,
      dateSignature: null,
      signeParId: null,
      signeParAdjoint: false,
      signatureMention: null,
      dateCachet: null,
      dateTransmission: null,
      transmiseParId: null,
      estRouverte: false,
      motsCles: [...(sourceNote.motsCles || [])],
      historiqueEtapes: {
        [StatutNote.BROUILLON]: { authorId, date: dateHeure },
      },
      noteOrigineId: sourceNote.id,
    };
    mockRuntime.notes.unshift(newNote);
  }

  const retour = {
    id: `ret-${Date.now()}`,
    dossierId: dossier.id,
    noteOrigineId: sourceNote?.id || null,
    date: dateHeure,
    auteurId: authorId,
    typeSuite: noPriorCase ? "RETOUR_SANS_DOSSIER" : data.typeSuite,
    typeSuiteAttendu: data.typeSuite,
    commentaire: data.commentaire?.trim() || "",
    bureauxCollaboration: data.bureauxCollaboration || [],
    nouveauCycleId: cycle.id,
    sansDossierPrealable: noPriorCase,
  };
  mockRuntime.retoursCabinet.unshift(retour);
  mockRuntime.notifications.unshift({
    id: `notif-retour-${Date.now()}`,
    destinataireId: "usr-01",
    message: `Un retour du cabinet a été enregistré pour le dossier ${dossier.reference}.`,
    dossierId: dossier.id,
    date: dateHeure,
    canal: "APPLICATION",
    lue: false,
    type: "RETOUR",
  });
  mockRuntime.mouvements.unshift({
    id: `mvt-retour-${Date.now()}`,
    dossierId: dossier.id,
    date: dateHeure,
    auteurId: authorId,
    typeMouvement: TypeMouvement.RETOUR,
    description: `Retour du cabinet enregistré${sourceNote ? ` pour la note ${sourceNote.id}` : " sans dossier préalable"} ; cycle ${cycle.numeroCycle} ouvert (${data.typeSuite}). ${data.commentaire?.trim() || ""}`.trim(),
  });

  return enrichReturn(retour);
}
