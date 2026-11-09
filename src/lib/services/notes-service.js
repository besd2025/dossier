import { mockRuntime } from "@/lib/mock/runtime-state";
import { StatutNote, TypeMouvement } from "@/types";

const { notes, versions, observations, reouvertures } = mockRuntime;

const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
const WORKFLOW_ORDER = [
  StatutNote.BROUILLON,
  StatutNote.RELECTURE_CELLULE,
  StatutNote.RELECTURE_BUREAU,
  StatutNote.VALIDEE,
  StatutNote.IMPRIMEE,
  StatutNote.SIGNEE,
  "CACHETEE",
  StatutNote.TRANSMISE,
];

function getUserName(userId) {
  const user = mockRuntime.utilisateurs.find((item) => item.id === userId);
  return user ? `${user.prenom} ${user.nom}` : userId || "Utilisateur";
}

function getRoleName(role) {
  return {
    SECRETARIAT: "Secrétariat",
    CHEF_BUREAU: "Chef de bureau",
    CHEF_BUREAU_ADJOINT: "Adjoint du Chef de bureau",
    CHEF_CELLULE: "Chef de cellule",
    CHEF_CELLULE_ADJOINT: "Adjoint de cellule",
    CONSEILLER: "Conseiller",
    CONSEILLER_HORS_CELLULE: "Conseiller hors cellule",
    COMPTABLE: "Comptable",
  }[role] || role || "";
}

function getInvolvedUserIds(note) {
  const assignedCellIds = mockRuntime.cellulesDossiers
    .filter((assignment) => assignment.dossierId === note.dossierId)
    .map((assignment) => assignment.celluleId);
  const assignedCellUsers = mockRuntime.cellules
    .filter((cell) => assignedCellIds.includes(cell.id))
    .flatMap((cell) => [cell.chefId, cell.chefAdjointId]);
  const delegationUsers = mockRuntime.prisesEnCharge
    .filter((delegation) => delegation.dossierId === note.dossierId && delegation.active)
    .map((delegation) => delegation.adjointId);

  return [...new Set([
    "usr-01",
    note.redacteurId,
    ...(note.conseillersAssignesIds || []),
    ...assignedCellUsers,
    ...delegationUsers,
  ].filter(Boolean))];
}

function notifyInvolved(note, message, authorId, type, date = new Date().toISOString()) {
  const dossier = mockRuntime.dossiers.find((item) => item.id === note.dossierId);
  const reference = dossier?.reference || note.dossierId;
  for (const recipientId of getInvolvedUserIds(note)) {
    if (recipientId === authorId) continue;
    mockRuntime.notifications.unshift({
      id: `notif-note-${Date.now()}-${recipientId}`,
      destinataireId: recipientId,
      message: message.replace("{reference}", reference),
      dossierId: note.dossierId,
      date,
      canal: "APPLICATION",
      lue: false,
      type,
    });
  }
}

function addMovement(note, description, authorId, type, date = new Date().toISOString()) {
  mockRuntime.mouvements.unshift({
    id: `mvt-note-${Date.now()}`,
    dossierId: note.dossierId,
    date,
    auteurId: authorId,
    typeMouvement: type,
    description,
  });
}

function getWorkflowHistory(note, noteVersions) {
  const history = { ...(note.historiqueEtapes || {}) };
  const effectiveStatus =
    note.statutNote === StatutNote.EN_ATTENTE_IMPRESSION
      ? StatutNote.VALIDEE
      : note.statutNote;
  const statusIndex = WORKFLOW_ORDER.indexOf(effectiveStatus);
  const hasReached = (status) => {
    const index = WORKFLOW_ORDER.indexOf(status);
    return index >= 0 && (statusIndex >= index || status === effectiveStatus);
  };

  if (!history[StatutNote.BROUILLON]) {
    history[StatutNote.BROUILLON] = {
      authorId: note.redacteurId,
      date: note.dateCreation,
    };
  }
  if (hasReached(StatutNote.RELECTURE_CELLULE) && !history[StatutNote.RELECTURE_CELLULE]) {
    const firstVersion = [...noteVersions].sort((a, b) => a.numeroVersion - b.numeroVersion)[0];
    history[StatutNote.RELECTURE_CELLULE] = {
      authorId: firstVersion?.auteurId || note.redacteurId,
      date: firstVersion?.dateDepot || note.dateCreation,
    };
  }
  if (hasReached(StatutNote.RELECTURE_BUREAU) && !history[StatutNote.RELECTURE_BUREAU]) {
    history[StatutNote.RELECTURE_BUREAU] = {
      authorId: note.valideParId || note.redacteurId,
      date: note.dateValidation || note.dateCreation,
    };
  }

  const knownEvents = [
    [StatutNote.VALIDEE, note.valideParId, note.dateValidation],
    [StatutNote.IMPRIMEE, note.imprimeParId || "usr-03", note.dateImpression],
    [StatutNote.SIGNEE, note.signeParId, note.dateSignature],
    ["CACHETEE", note.cachetParId || "usr-03", note.dateCachet],
    [StatutNote.TRANSMISE, note.transmiseParId || "usr-03", note.dateTransmission],
  ];
  for (const [status, authorId, date] of knownEvents) {
    if (date && !history[status]) history[status] = { authorId, date };
  }

  return Object.fromEntries(
    Object.entries(history).map(([status, event]) => [
      status,
      {
        author: event.author || getUserName(event.authorId),
        date: event.date,
        comment: event.comment,
      },
    ])
  );
}

/**
 * Récupère les notes associées à un dossier ou l'ensemble des notes
 * @param {string} [dossierId]
 * @returns {Promise<Array>}
 */
export async function getNotes(dossierId) {
  await delay(70);
  if (dossierId) {
    return notes.filter((n) => n.dossierId === dossierId);
  }
  return [...notes];
}

/**
 * Récupère une note complète avec ses versions, observations et éventuelle réouverture
 * @param {string} noteId
 * @returns {Promise<Object|null>}
 */
export async function getNote(noteId) {
  await delay(60);
  const note = notes.find((n) => n.id === noteId);
  if (!note) return null;

  const noteVersions = versions
    .filter((v) => v.noteId === note.id)
    .sort((a, b) => b.numeroVersion - a.numeroVersion)
    .map((version) => ({
      ...version,
      auteurNom: getUserName(version.auteurId),
      dateCreation: version.dateDepot,
      isLatest: version.estDerniereVersion,
    }));

  const noteObs = observations
    .filter((o) => o.noteId === note.id)
    .map((observation) => {
      const author = mockRuntime.utilisateurs.find((user) => user.id === observation.auteurId);
      return {
        ...observation,
        auteurNom: getUserName(observation.auteurId),
        auteurRole: getRoleName(author?.role),
        dateCreation: observation.dateCreation || observation.date,
        texte: observation.texte || observation.contenu,
        resolueParNom: observation.resolueParId
          ? getUserName(observation.resolueParId)
          : undefined,
      };
    });
  const reouverture = reouvertures.find((r) => r.noteId === note.id) || null;
  const assignedCellIds = mockRuntime.cellulesDossiers
    .filter((assignment) => assignment.dossierId === note.dossierId)
    .map((assignment) => assignment.celluleId);
  const assignedCells = mockRuntime.cellules.filter((cell) => assignedCellIds.includes(cell.id));
  const dossier = mockRuntime.dossiers.find((item) => item.id === note.dossierId);
  const redacteur = mockRuntime.utilisateurs.find((user) => user.id === note.redacteurId);
  const conseillersAssignes = (note.conseillersAssignesIds || [])
    .map((userId) => mockRuntime.utilisateurs.find((user) => user.id === userId))
    .filter(Boolean);
  const activeDelegations = mockRuntime.prisesEnCharge.filter(
    (delegation) => delegation.dossierId === note.dossierId && delegation.active
  );
  const signedOriginalVersion = reouverture
    ? noteVersions.find((version) => version.id === reouverture.versionSigneeOrigineId) || null
    : null;

  return {
    ...note,
    versions: noteVersions,
    observations: noteObs,
    reouverture,
    signedOriginalVersion,
    dossier: dossier ? { id: dossier.id, reference: dossier.reference, objet: dossier.objet } : null,
    redacteur,
    redacteurNom: redacteur ? getUserName(redacteur.id) : "—",
    conseillersAssignes,
    assignedCells,
    activeDelegations,
    involvedUserIds: getInvolvedUserIds(note),
    workflowHistory: getWorkflowHistory(note, noteVersions),
  };
}

/**
 * Dépose une nouvelle version de document Word pour une note
 * @param {string} noteId
 * @param {Object} versionData
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function createNoteVersion(noteId, versionData, auteurId = "usr-06") {
  await delay(100);
  const note = notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note introuvable : ${noteId}`);
  if (!note.motsCles?.some((keyword) => keyword.trim())) {
    throw new Error("Ajoutez au moins un mot-clé avant de déposer une version.");
  }
  if (versionData.nomFichier && !versionData.nomFichier.toLowerCase().endsWith(".docx")) {
    throw new Error("Le document doit être au format .docx.");
  }

  // Marquer les anciennes versions comme non dernières
  versions.forEach((version, index) => {
    if (version.noteId === noteId) {
      versions[index] = { ...version, estDerniereVersion: false };
    }
  });

  const existing = versions.filter((v) => v.noteId === noteId);
  const nextVersionNum = existing.length + 1;
  const dateDepot = new Date().toISOString();

  const newVersion = {
    id: `ver-${noteId}-${nextVersionNum}`,
    noteId,
    numeroVersion: nextVersionNum,
    auteurId,
    dateDepot,
    nomFichier: versionData.nomFichier || `Document_V${nextVersionNum}.docx`,
    tailleFichier: versionData.tailleFichier || "420 Ko",
    fichierUrl: versionData.fichierUrl || `/mock/docs/${noteId}_V${nextVersionNum}.docx`,
    commentaire: versionData.commentaire || "",
    estDerniereVersion: true,
  };

  versions.unshift(newVersion);
  const dossier = mockRuntime.dossiers.find((item) => item.id === note.dossierId);
  notifyInvolved(
    note,
    `Une nouvelle version de la note du dossier {reference} a été déposée.`,
    auteurId,
    "DEPOT_VERSION",
    dateDepot
  );
  addMovement(
    note,
    `Version V${nextVersionNum} déposée pour la note du dossier ${dossier?.reference || note.dossierId}.`,
    auteurId,
    TypeMouvement.DEPOT_VERSION,
    dateDepot
  );
  return newVersion;
}

export async function updateNoteKeywords(noteId, keywords) {
  const note = notes.find((item) => item.id === noteId);
  if (!note) throw new Error(`Note introuvable : ${noteId}`);
  if (!Array.isArray(keywords)) throw new Error("La liste des mots-clés est invalide.");

  note.motsCles = [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))];
  return [...note.motsCles];
}

/**
 * Ajoute une observation / remarque de relecture
 * @param {string} noteId
 * @param {Object} obsData
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function createObservation(noteId, obsData, auteurId = "usr-04") {
  await delay(70);
  const note = notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note introuvable : ${noteId}`);
  const date = new Date().toISOString();
  const newObs = {
    id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    noteId,
    auteurId,
    date,
    contenu: obsData.contenu || obsData.texte || "",
    resolue: false,
  };

  observations.push(newObs);
  const dossier = mockRuntime.dossiers.find((item) => item.id === note.dossierId);
  if (obsData.notify !== false) {
    notifyInvolved(
      note,
      `Une observation a été ajoutée à la note du dossier {reference}.`,
      auteurId,
      "OBSERVATION",
      date
    );
  }
  if (obsData.recordMovement !== false) {
    addMovement(
      note,
      `Observation ajoutée à la note du dossier ${dossier?.reference || note.dossierId}.`,
      auteurId,
      TypeMouvement.OBSERVATION,
      date
    );
  }
  return newObs;
}

/**
 * Marque une observation comme résolue
 * @param {string} obsId
 * @returns {Promise<Object>}
 */
export async function resolveObservation(obsId, resolue = true, auteurId = "usr-04") {
  await delay(50);
  const index = observations.findIndex((o) => o.id === obsId);
  if (index === -1) throw new Error("Observation introuvable");

  const date = new Date().toISOString();
  observations[index] = {
    ...observations[index],
    resolue,
    dateResolution: resolue ? date : null,
    resolueParId: resolue ? auteurId : null,
  };

  return observations[index];
}

/**
 * Fait progresser ou reculer le statut d'une note
 * @param {string} noteId
 * @param {string} newStatus
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function updateNoteStatus(noteId, newStatus, auteurId = "usr-01") {
  await delay(80);
  const index = notes.findIndex((n) => n.id === noteId);
  if (index === -1) throw new Error(`Note introuvable : ${noteId}`);

  const note = notes[index];
  const date = new Date().toISOString();
  const updates = {
    statutNote: newStatus,
    historiqueEtapes: {
      ...(note.historiqueEtapes || {}),
      [newStatus]: { authorId: auteurId, date },
    },
  };

  if (newStatus === StatutNote.VALIDEE) {
    updates.dateValidation = date.split("T")[0];
    updates.valideParId = auteurId;
  } else if (newStatus === StatutNote.RELECTURE_CELLULE) {
    updates.dateSoumissionCellule = date;
  } else if (newStatus === StatutNote.RELECTURE_BUREAU) {
    updates.dateSoumissionBureau = date;
  } else if (newStatus === StatutNote.IMPRIMEE) {
    updates.dateImpression = date.split("T")[0];
    updates.imprimeParId = auteurId;
  } else if (newStatus === StatutNote.SIGNEE) {
    updates.dateSignature = date.split("T")[0];
    updates.signeParId = auteurId;
  } else if (newStatus === StatutNote.TRANSMISE) {
    updates.dateTransmission = date.split("T")[0];
    updates.transmiseParId = auteurId;
  }

  notes[index] = {
    ...note,
    ...updates,
  };
  const dossier = mockRuntime.dossiers.find((item) => item.id === note.dossierId);
  const reference = dossier?.reference || note.dossierId;
  const statusLabel = {
    [StatutNote.BROUILLON]: "renvoyée au rédacteur",
    [StatutNote.RELECTURE_CELLULE]: "soumise à la relecture de la cellule",
    [StatutNote.RELECTURE_BUREAU]: "transmise au Chef de bureau",
    [StatutNote.VALIDEE]: "validée",
  }[newStatus] || newStatus;
  const movementType = newStatus === StatutNote.VALIDEE
    ? TypeMouvement.VALIDATION
    : TypeMouvement.OBSERVATION;

  notifyInvolved(
    notes[index],
    `La note du dossier {reference} a été ${statusLabel}.`,
    auteurId,
    newStatus === StatutNote.VALIDEE ? "VALIDATION" : "OBSERVATION",
    date
  );
  addMovement(
    notes[index],
    `Note du dossier ${reference} : ${statusLabel}.`,
    auteurId,
    movementType,
    date
  );

  return notes[index];
}

/**
 * Enregistre le cachet officiel et génère le numéro officiel NNNN/AAAA (Section 4.11)
 * @param {string} noteId
 * @param {Object} data
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function enregistrerCachet(noteId, data = {}, auteurId = "usr-03") {
  await delay(120);
  const index = notes.findIndex((n) => n.id === noteId);
  if (index === -1) throw new Error(`Note introuvable : ${noteId}`);

  // Génération automatique du numéro séquentiel au format NNNN/AAAA
  const year = new Date().getFullYear();
  const stampedNotesCount = notes.filter((n) => n.numeroOfficiel !== null).length + 1;
  const numeroOfficiel = `${String(stampedNotesCount).padStart(4, "0")}/${year}`;

  const today = new Date().toISOString().split("T")[0];

  notes[index] = {
    ...notes[index],
    numeroOfficiel,
    dateCachet: data.dateCachet || today,
    statutNote: StatutNote.TRANSMISE,
    dateTransmission: data.dateTransmission || today,
  };

  return notes[index];
}

/**
 * Réouvre une note signée (Section 4.13)
 * @param {string} noteId
 * @param {Object} reouvertureData
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function reouvrirNote(noteId, reouvertureData, auteurId = "usr-01") {
  await delay(110);
  const index = notes.findIndex((n) => n.id === noteId);
  if (index === -1) throw new Error(`Note introuvable : ${noteId}`);

  const activeVersions = versions.filter((v) => v.noteId === noteId);
  const lastVersion = activeVersions.find((v) => v.estDerniereVersion);

  const newReouverture = {
    id: `reouv-${Date.now()}`,
    noteId,
    dateReouverture: new Date().toISOString(),
    auteurId,
    motif: reouvertureData.motif || "Motif non spécifié",
    autorisePar: reouvertureData.autorisePar || "Chef de bureau",
    versionSigneeOrigineId: lastVersion?.id || null,
  };

  reouvertures.unshift(newReouverture);

  notes[index] = {
    ...notes[index],
    statutNote: StatutNote.ROUVERTE,
    estRouverte: true,
  };

  return {
    note: notes[index],
    reouverture: newReouverture,
  };
}
