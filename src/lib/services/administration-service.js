import { mockRuntime } from "@/lib/mock/runtime-state";
import { Role, TypeMouvement } from "@/types";

const prisesEnCharge = mockRuntime.prisesEnCharge;
const notifications = mockRuntime.notifications;
const mouvements = mockRuntime.mouvements;

const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// CELLULES
// ============================================================================
export async function getCellules() {
  await delay(50);
  return [...mockRuntime.cellules];
}

export async function getCellule(id) {
  await delay(40);
  return mockRuntime.cellules.find((c) => c.id === id) || null;
}

export async function createCellule(data) {
  await delay(80);
  const nextId = `cel-${String(mockRuntime.cellules.length + 1).padStart(2, "0")}`;
  const newCellule = {
    id: nextId,
    nom: data.nom,
    code: data.code || `CEL_${mockRuntime.cellules.length + 1}`,
    chefId: data.chefId || null,
    chefAdjointId: data.chefAdjointId || null,
    conseillerAttitreId: data.conseillerAttitreId || null,
    delegationCorrection: Boolean(data.delegationCorrection),
    description: data.description || "",
  };
  mockRuntime.cellules.push(newCellule);
  return newCellule;
}

export async function updateCellule(id, data) {
  await delay(70);
  const index = mockRuntime.cellules.findIndex((cellule) => cellule.id === id);
  if (index === -1) throw new Error("Cellule introuvable.");
  mockRuntime.cellules[index] = {
    ...mockRuntime.cellules[index],
    ...data,
    delegationCorrection: Boolean(data.delegationCorrection),
  };
  return mockRuntime.cellules[index];
}

// ============================================================================
// PROVENANCES
// ============================================================================
export async function getProvenances() {
  await delay(50);
  return [...mockRuntime.provenances];
}

export async function createProvenance(data) {
  await delay(70);
  const nextId = `prov-${String(mockRuntime.provenances.length + 1).padStart(2, "0")}`;
  const newProv = {
    id: nextId,
    nom: data.nom,
    categorie: data.categorie || "INSTITUTION",
    actif: true,
  };
  mockRuntime.provenances.push(newProv);
  return newProv;
}

export async function updateProvenance(id, data) {
  await delay(60);
  const index = mockRuntime.provenances.findIndex((provenance) => provenance.id === id);
  if (index === -1) throw new Error("Provenance introuvable.");
  mockRuntime.provenances[index] = { ...mockRuntime.provenances[index], ...data };
  return mockRuntime.provenances[index];
}

// ============================================================================
// ACCÈS EXCEPTIONNELS & COMPLÉMENTAIRES
// ============================================================================
export async function getAcces(filters = {}) {
  await delay(60);
  let result = [...mockRuntime.accesExceptionnels];
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
  const author = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  const beneficiary = mockRuntime.utilisateurs.find((user) => user.id === data.beneficiaireId);
  const dossier = mockRuntime.dossiers.find((item) => item.id === data.dossierId);
  if (author?.role !== Role.CHEF_BUREAU) {
    throw new Error("Seul le Chef de bureau peut accorder un accès.");
  }
  if (!dossier) throw new Error("Le dossier sélectionné est introuvable.");
  if (!beneficiary?.actif || ![Role.CONSEILLER_HORS_CELLULE, Role.COMPTABLE].includes(beneficiary.role)) {
    throw new Error("Le bénéficiaire doit être un conseiller hors cellule ou un comptable actif.");
  }
  if (data.type && !["EXCEPTIONNEL", "COMPLEMENTAIRE"].includes(data.type)) {
    throw new Error("Le type d'accès sélectionné est invalide.");
  }
  if (!data.motif?.trim()) throw new Error("Le motif du besoin est obligatoire.");
  if (data.echeance && Number.isNaN(new Date(data.echeance).getTime())) {
    throw new Error("L'échéance saisie est invalide.");
  }
  const dateHeure = new Date().toISOString();
  const newAcces = {
    id: `acc-${Date.now()}`,
    dossierId: data.dossierId,
    beneficiaireId: data.beneficiaireId,
    accordeParId: auteurId,
    date: dateHeure,
    echeance: data.echeance || null,
    motif: data.motif.trim(),
    type: data.type || "EXCEPTIONNEL",
  };
  mockRuntime.accesExceptionnels.unshift(newAcces);
  mockRuntime.notifications.unshift({
    id: `notif-${Date.now()}`,
    destinataireId: newAcces.beneficiaireId,
    message: `Un accès ${newAcces.type.toLowerCase()} vous a été accordé au dossier ${mockRuntime.dossiers.find((dossier) => dossier.id === newAcces.dossierId)?.reference || newAcces.dossierId}.`,
    dossierId: newAcces.dossierId,
    date: dateHeure,
    canal: "APPLICATION",
    lue: false,
    type: "ACCES_ACCORDE",
  });
  mouvements.unshift({
    id: `mvt-${Date.now()}`,
    dossierId: newAcces.dossierId,
    date: dateHeure,
    auteurId,
    typeMouvement: TypeMouvement.ACCES_ACCORDE,
    description: `Accès ${newAcces.type.toLowerCase()} accordé à ${beneficiary.prenom} ${beneficiary.nom} : ${newAcces.motif}`,
  });
  return newAcces;
}

export async function requestDossierAccess(data, requesterId) {
  await delay(70);
  if (!data.dossierId || !data.motif?.trim()) {
    throw new Error("Sélectionnez un dossier et décrivez votre besoin.");
  }
  const dossier = mockRuntime.dossiers.find((item) => item.id === data.dossierId);
  const requester = mockRuntime.utilisateurs.find((item) => item.id === requesterId);
  if (!dossier) throw new Error("Le dossier sélectionné est introuvable.");
  if (requester?.role !== Role.CONSEILLER_HORS_CELLULE) {
    throw new Error("La demande d'accès est réservée au conseiller hors cellule.");
  }
  mockRuntime.notifications.unshift({
    id: `notif-${Date.now()}`,
    destinataireId: "usr-01",
    message: `${requester.prenom} ${requester.nom} demande un accès au dossier ${dossier.reference} : ${data.motif.trim()}`,
    dossierId: dossier.id,
    date: new Date().toISOString(),
    canal: "APPLICATION",
    lue: false,
    type: "DEMANDE_ACCES",
  });
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
