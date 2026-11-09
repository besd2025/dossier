import {
  initialAccesExceptionnels,
  initialCellules,
  initialProvenances,
} from "@/lib/mock";
import { mockRuntime } from "@/lib/mock/runtime-state";
import { TypeMouvement } from "@/types";

let cellules = [...initialCellules];
let provenances = [...initialProvenances];
let accesExceptionnels = [...initialAccesExceptionnels];
const prisesEnCharge = mockRuntime.prisesEnCharge;
const notifications = mockRuntime.notifications;
const mouvements = mockRuntime.mouvements;

const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// CELLULES
// ============================================================================
export async function getCellules() {
  await delay(50);
  return [...cellules];
}

export async function getCellule(id) {
  await delay(40);
  return cellules.find((c) => c.id === id) || null;
}

export async function createCellule(data) {
  await delay(80);
  const nextId = `cel-${String(cellules.length + 1).padStart(2, "0")}`;
  const newCellule = {
    id: nextId,
    nom: data.nom,
    code: data.code || `CEL_${cellules.length + 1}`,
    chefId: data.chefId || null,
    chefAdjointId: data.chefAdjointId || null,
    conseillerAttitreId: data.conseillerAttitreId || null,
    delegationCorrection: Boolean(data.delegationCorrection),
    description: data.description || "",
  };
  cellules = [...cellules, newCellule];
  return newCellule;
}

// ============================================================================
// PROVENANCES
// ============================================================================
export async function getProvenances() {
  await delay(50);
  return [...provenances];
}

export async function createProvenance(data) {
  await delay(70);
  const nextId = `prov-${String(provenances.length + 1).padStart(2, "0")}`;
  const newProv = {
    id: nextId,
    nom: data.nom,
    categorie: data.categorie || "INSTITUTION",
    actif: true,
  };
  provenances = [...provenances, newProv];
  return newProv;
}

// ============================================================================
// ACCÈS EXCEPTIONNELS & COMPLÉMENTAIRES
// ============================================================================
export async function getAcces(filters = {}) {
  await delay(60);
  let result = [...accesExceptionnels];
  if (filters.dossierId) {
    result = result.filter((a) => a.dossierId === filters.dossierId);
  }
  if (filters.userId) {
    result = result.filter((a) => a.beneficiaireId === filters.userId);
  }
  return result;
}

export async function createAcces(data, auteurId = "usr-01") {
  await delay(90);
  const newAcces = {
    id: `acc-${Date.now()}`,
    dossierId: data.dossierId,
    beneficiaireId: data.beneficiaireId,
    accordeParId: auteurId,
    date: new Date().toISOString().split("T")[0],
    echeance: data.echeance || null,
    motif: data.motif || "Accès exceptionnel",
    type: data.type || "EXCEPTIONNEL",
  };
  accesExceptionnels = [newAcces, ...accesExceptionnels];
  return newAcces;
}

// ============================================================================
// PRISES EN CHARGE DES ADJOINTS
// ============================================================================
export async function getPrisesEnCharge(filters = {}) {
  await delay(60);
  let result = [...prisesEnCharge];
  if (filters.dossierId) {
    result = result.filter((p) => p.dossierId === filters.dossierId);
  }
  if (filters.activeOnly) {
    result = result.filter((p) => p.active);
  }
  return result.map((prise) => ({
    ...prise,
    dossier: mockRuntime.dossiers.find((dossier) => dossier.id === prise.dossierId) || null,
    titulaire: mockRuntime.utilisateurs.find((user) => user.id === prise.titulaireId) || null,
    adjoint: mockRuntime.utilisateurs.find((user) => user.id === prise.adjointId) || null,
    auteur: mockRuntime.utilisateurs.find((user) => user.id === prise.auteurId) || null,
  }));
}

export async function createPriseEnCharge(data, auteurId = "usr-01") {
  await delay(90);
  if (!data.dossierId || !data.adjointId) {
    throw new Error("Un dossier et un adjoint doivent être sélectionnés.");
  }
  const dossier = mockRuntime.dossiers.find((item) => item.id === data.dossierId);
  const adjoint = mockRuntime.utilisateurs.find((item) => item.id === data.adjointId);
  if (!dossier) throw new Error("Le dossier sélectionné est introuvable.");
  if (!adjoint || ![ "CHEF_BUREAU_ADJOINT", "CHEF_CELLULE_ADJOINT" ].includes(adjoint.role)) {
    throw new Error("L'utilisateur sélectionné n'est pas un adjoint habilité.");
  }
  if (prisesEnCharge.some((prise) => prise.dossierId === data.dossierId && prise.adjointId === data.adjointId && prise.active)) {
    throw new Error("Une prise en charge active existe déjà pour cet adjoint et ce dossier.");
  }
  const newPec = {
    id: `pec-${Date.now()}`,
    dossierId: data.dossierId,
    titulaireId: data.titulaireId || auteurId,
    adjointId: data.adjointId,
    dateHeure: new Date().toISOString(),
    auteurId,
    active: true,
    portee: {
      signature: true,
      affecter: Boolean(data.portee?.affecter ?? true),
      valider: Boolean(data.portee?.valider ?? true),
      imprimer: Boolean(data.portee?.imprimer ?? true),
    },
  };
  prisesEnCharge.unshift(newPec);
  const auteur = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  mockRuntime.notifications.unshift({
    id: `notif-${Date.now()}`,
    destinataireId: newPec.adjointId,
    message: `Une prise en charge du dossier ${dossier.reference} vous a été confiée.`,
    dossierId: dossier.id,
    date: newPec.dateHeure,
    canal: "APPLICATION",
    lue: false,
    type: "AFFECTATION",
  });
  mouvements.unshift({
    id: `mvt-${Date.now()}`,
    dossierId: dossier.id,
    date: newPec.dateHeure,
    auteurId,
    typeMouvement: TypeMouvement.AFFECTATION,
    description: `Prise en charge du dossier ${dossier.reference} confiée à ${adjoint.prenom} ${adjoint.nom} par ${auteur ? `${auteur.prenom} ${auteur.nom}` : auteurId}.`,
  });
  return newPec;
}

export async function getAssignmentUsers() {
  await delay(40);
  return [...mockRuntime.utilisateurs];
}

export async function getDossiersAdministratifs() {
  await delay(40);
  return [...mockRuntime.dossiers];
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export async function getNotifications(filters = {}) {
  await delay(50);
  let result = [...notifications];
  if (filters.userId) {
    result = result.filter((n) => n.destinataireId === filters.userId);
  }
  if (filters.unreadOnly) {
    result = result.filter((n) => !n.lue);
  }
  return result;
}

export async function markNotificationAsRead(id) {
  await delay(30);
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications[index] = { ...notifications[index], lue: true };
  }
}

// ============================================================================
// JOURNAL DE TRAÇABILITÉ (MOUVEMENTS)
// ============================================================================
export async function getMouvements(filters = {}) {
  await delay(60);
  let result = [...mouvements];
  if (filters.dossierId) {
    result = result.filter((m) => m.dossierId === filters.dossierId);
  }
  if (filters.type) {
    result = result.filter((m) => m.typeMouvement === filters.type);
  }
  if (filters.auteurId) {
    result = result.filter((m) => m.auteurId === filters.auteurId);
  }
  return result;
}
