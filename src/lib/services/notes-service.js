import { mockRuntime } from "@/lib/mock/runtime-state";
import { Role, StatutNote, TypeMouvement } from "@/types";

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

function getActiveSignatureDelegation(note, userId) {
  return mockRuntime.prisesEnCharge.find(
    (delegation) =>
      delegation.dossierId === note.dossierId &&
      delegation.adjointId === userId &&
      delegation.active &&
      delegation.portee?.signature === true
  );
}

function getActiveValidationDelegation(note, userId) {
  return mockRuntime.prisesEnCharge.find(
    (delegation) =>
      delegation.dossierId === note.dossierId &&
      delegation.adjointId === userId &&
      delegation.active &&
      delegation.portee?.valider !== false
  );
}

function getActivePrintDelegation(note, userId) {
  return mockRuntime.prisesEnCharge.find(
    (delegation) =>
      delegation.dossierId === note.dossierId &&
      delegation.adjointId === userId &&
      delegation.active &&
      delegation.portee?.imprimer !== false
  );
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
  if (note.signatureMention && history[StatutNote.SIGNEE]) {
    history[StatutNote.SIGNEE] = {
      ...history[StatutNote.SIGNEE],
      mention: note.signatureMention,
    };
  }

  return Object.fromEntries(
    Object.entries(history).map(([status, event]) => [
      status,
      {
        author: event.author || getUserName(event.authorId),
        date: event.date,
        comment: event.comment,
        mention: event.mention,
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
 * Récupère les notes présentes dans le circuit de validation et de signature.
 * @returns {Promise<Array>}
 */
export async function getSignatureQueue() {
  await delay(50);
  const queueStatuses = new Set([
    StatutNote.RELECTURE_BUREAU,
    StatutNote.VALIDEE,
    StatutNote.EN_ATTENTE_IMPRESSION,
    StatutNote.IMPRIMEE,
  ]);
  const queueNotes = notes.filter((note) => queueStatuses.has(note.statutNote));
  const details = await Promise.all(queueNotes.map((note) => getNote(note.id)));

  return details.filter(Boolean).map((note) => ({
    ...note,
    signatureMention: note.signatureMention || null,
  }));
}

export async function getCachetQueues() {
  await delay(50);
  const signedNotes = notes.filter((note) =>
    [StatutNote.SIGNEE, "CACHETEE"].includes(note.statutNote)
  );
  const details = await Promise.all(signedNotes.map((note) => getNote(note.id)));
  const availableNotes = details.filter(Boolean);
  return {
    toStamp: availableNotes.filter(
      (note) => note.statutNote === StatutNote.SIGNEE && note.typeDocument !== "PROJET_LETTRE"
    ),
    toTransmit: availableNotes.filter((note) => note.statutNote === "CACHETEE"),
    lettersToRecover: availableNotes.filter(
      (note) =>
        note.typeDocument === "PROJET_LETTRE" &&
        note.statutNote === StatutNote.SIGNEE &&
        !note.lettreRecuperee
    ),
  };
}

export async function getNextOfficialNumber(noteId) {
  await delay(20);
  const note = notes.find((item) => item.id === noteId);
  if (!note) throw new Error(`Note introuvable : ${noteId}`);
  const year = new Date().getFullYear();
  const highestNumber = notes.reduce((highest, item) => {
    if (!item.numeroOfficiel || item.numeroOfficiel.slice(-4) !== String(year)) return highest;
    const parsed = Number(item.numeroOfficiel.split("/")[0]);
    return Number.isFinite(parsed) ? Math.max(highest, parsed) : highest;
  }, 0);
  return `${String(highestNumber + 1).padStart(4, "0")}/${year}`;
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
  const enrichedReouverture = reouverture
    ? {
      ...reouverture,
      date: reouverture.dateReouverture,
      versionOrigineNumero: noteVersions.find(
        (version) => version.id === reouverture.versionSigneeOrigineId
      )?.numeroVersion,
    }
    : null;
  const assignedCellIds = mockRuntime.cellulesDossiers
    .filter((assignment) => assignment.dossierId === note.dossierId)
    .map((assignment) => assignment.celluleId);
  const assignedCells = mockRuntime.cellules.filter((cell) => assignedCellIds.includes(cell.id));
  const dossier = mockRuntime.dossiers.find((item) => item.id === note.dossierId);
  const redacteur = mockRuntime.utilisateurs.find((user) => user.id === note.redacteurId);
  const signer = mockRuntime.utilisateurs.find((user) => user.id === note.signeParId);
  const signatureDelegation = note.signaturePriseEnChargeId
    ? mockRuntime.prisesEnCharge.find((item) => item.id === note.signaturePriseEnChargeId)
    : mockRuntime.prisesEnCharge.find(
      (item) =>
        item.dossierId === note.dossierId &&
        item.adjointId === note.signeParId &&
        (item.active || note.signeParAdjoint)
    );
  const signatureMention = note.signatureMention ||
    (note.signeParAdjoint && signer && signatureDelegation
      ? `Signée par ${getUserName(signer.id)}, adjoint, par prise en charge du ${new Intl.DateTimeFormat("fr-FR").format(new Date(signatureDelegation.dateHeure))}`
      : null);
  const conseillersAssignes = (note.conseillersAssignesIds || [])
    .map((userId) => mockRuntime.utilisateurs.find((user) => user.id === userId))
    .filter(Boolean);
  const activeDelegations = mockRuntime.prisesEnCharge.filter(
    (delegation) => delegation.dossierId === note.dossierId && delegation.active
  );
  const signedOriginalVersion = enrichedReouverture
    ? noteVersions.find((version) => version.id === enrichedReouverture.versionSigneeOrigineId) || null
    : null;

  return {
    ...note,
    versions: noteVersions,
    observations: noteObs,
    reouverture: enrichedReouverture,
    signedOriginalVersion,
    dossier: dossier ? { id: dossier.id, reference: dossier.reference, objet: dossier.objet } : null,
    redacteur,
    redacteurNom: redacteur ? getUserName(redacteur.id) : "—",
    signeParNom: signer ? getUserName(signer.id) : null,
    signeParRole: signer?.role || null,
    signatureMention,
    signaturePriseEnChargeDate:
      note.signaturePriseEnChargeDate || signatureDelegation?.dateHeure || null,
    conseillersAssignes,
    assignedCells,
    activeDelegations,
    involvedUserIds: getInvolvedUserIds(note),
    workflowHistory: getWorkflowHistory({ ...note, signatureMention }, noteVersions),
  };
}

function getElapsedDays(value, fallback = 0) {
  if (!value) return fallback;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return fallback;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

function getWorkItem(note, dossier, details = {}) {
  const latestVersion = details.versions?.[0] || null;
  const assignment = mockRuntime.affectations
    .filter((item) => item.dossierId === note.dossierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const assignmentAuthor = assignment
    ? mockRuntime.utilisateurs.find((user) => user.id === assignment.auteurId)
    : null;
  const lastActivity =
    note.dateSoumissionCellule ||
    note.dateSoumissionBureau ||
    latestVersion?.dateDepot ||
    note.dateCreation;
  const unresolvedObservations =
    details.observations?.filter((observation) => !observation.resolue).length || 0;
  const cells = details.assignedCells || [];

  return {
    ...note,
    ...details,
    dossier: details.dossier || dossier || null,
    dossierId: note.dossierId,
    dossierReference: dossier?.reference || details.dossier?.reference || "—",
    dossierObject: dossier?.objet || details.dossier?.objet || "—",
    instructionCabinet: dossier?.instructionCabinet || "—",
    assignedBy: assignmentAuthor
      ? `${assignmentAuthor.prenom} ${assignmentAuthor.nom}`
      : "—",
    assignedAt: assignment?.date || null,
    statutNote: note.statutNote,
    latestVersion,
    submittedBy: latestVersion?.auteurNom || details.redacteurNom || "—",
    submittedAt: latestVersion?.dateDepot || lastActivity,
    celluleIds: cells.map((cell) => cell.id),
    cellules: cells.map((cell) => cell.nom),
    celluleLabel: cells.map((cell) => cell.code || cell.nom).join(", ") || "—",
    unresolvedObservations,
    lastActivity,
    daysWaiting: getElapsedDays(lastActivity, dossier?.joursSansAvancement || 0),
    daysWithoutProgress: dossier?.joursSansAvancement || getElapsedDays(lastActivity),
  };
}

/**
 * Récupère les notes et dossiers explicitement confiés à l'utilisateur courant.
 * Les adjoints sont limités aux dossiers couverts par une prise en charge active.
 * @param {Object} user
 * @returns {Promise<Array>}
 */
export async function getMyWorkItems(user) {
  await delay(70);
  if (!user?.id || !user.role) {
    throw new Error("La session courante est requise pour charger vos dossiers.");
  }

  const isDeputy = [
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE_ADJOINT,
  ].includes(user.role);
  const assignedDossierIds = new Set(
    mockRuntime.affectations
      .filter(
        (assignment) =>
          assignment.destinataireId === user.id &&
          (!isDeputy ||
            mockRuntime.prisesEnCharge.some(
              (delegation) =>
                delegation.dossierId === assignment.dossierId &&
                delegation.adjointId === user.id &&
                delegation.active
            ))
      )
      .map((assignment) => assignment.dossierId)
  );
  const notesForUser = notes.filter((note) => {
    if (isDeputy) {
      return mockRuntime.prisesEnCharge.some(
        (delegation) =>
          delegation.dossierId === note.dossierId &&
          delegation.adjointId === user.id &&
          delegation.active
      );
    }
    return (
      note.redacteurId === user.id ||
      note.conseillersAssignesIds?.includes(user.id) ||
      assignedDossierIds.has(note.dossierId)
    );
  });

  const details = await Promise.all(notesForUser.map((note) => getNote(note.id)));
  const items = details.filter(Boolean).map((detail) => {
    const rawNote = notes.find((item) => item.id === detail.id);
    const dossier = mockRuntime.dossiers.find((item) => item.id === detail.dossierId);
    const item = getWorkItem(rawNote, dossier, detail);
    const hasUnresolvedObservations = item.unresolvedObservations > 0;

    if (item.statutNote === StatutNote.BROUILLON || item.statutNote === StatutNote.ROUVERTE) {
      item.workTab = hasUnresolvedObservations ? "correction" : "draft";
      item.nextAction = item.statutNote === StatutNote.ROUVERTE
        ? "Reprendre la rédaction après réouverture"
        : hasUnresolvedObservations
          ? "Traiter les observations"
          : "Rédiger la note";
    } else if (
      [StatutNote.RELECTURE_CELLULE, StatutNote.RELECTURE_BUREAU].includes(item.statutNote)
    ) {
      item.workTab = "review";
      item.nextAction =
        item.statutNote === StatutNote.RELECTURE_CELLULE
          ? "En relecture dans la cellule"
          : "En relecture au bureau";
    } else {
      item.workTab = "completed";
      item.nextAction = "Consulter la note terminée";
    }
    return item;
  });

  const assignedWithoutNote = [...assignedDossierIds]
    .filter((dossierId) => !notes.some((note) => note.dossierId === dossierId))
    .map((dossierId) => {
      const dossier = mockRuntime.dossiers.find((item) => item.id === dossierId);
      if (!dossier) return null;
      return {
        id: `dossier-${dossier.id}`,
        dossierId,
        dossier,
        dossierReference: dossier.reference,
        dossierObject: dossier.objet,
        instructionCabinet: dossier.instructionCabinet || "—",
        statutNote: null,
        workTab: "draft",
        nextAction: "Créer la première note",
        unresolvedObservations: 0,
        daysWaiting: dossier.joursSansAvancement || 0,
        daysWithoutProgress: dossier.joursSansAvancement || 0,
        celluleIds: mockRuntime.cellulesDossiers
          .filter((assignment) => assignment.dossierId === dossierId)
          .map((assignment) => assignment.celluleId),
        cellules: mockRuntime.cellulesDossiers
          .filter((assignment) => assignment.dossierId === dossierId)
          .map((assignment) => mockRuntime.cellules.find((cell) => cell.id === assignment.celluleId)?.nom)
          .filter(Boolean),
        celluleLabel: mockRuntime.cellulesDossiers
          .filter((assignment) => assignment.dossierId === dossierId)
          .map((assignment) => mockRuntime.cellules.find((cell) => cell.id === assignment.celluleId)?.code)
          .filter(Boolean)
          .join(", ") || "—",
      };
    })
    .filter(Boolean);

  return [...items, ...assignedWithoutNote];
}

/**
 * Récupère la file de relecture selon le rôle et la cellule de l'utilisateur.
 * @param {Object} user
 * @returns {Promise<Object>}
 */
export async function getReviewWorklist(user) {
  await delay(70);
  if (!user?.id || !user.role) {
    throw new Error("La session courante est requise pour charger les relectures.");
  }
  const isCellReviewer = [
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ].includes(user.role);
  const isOfficeReviewer = [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
  ].includes(user.role);
  if (!isCellReviewer && !isOfficeReviewer) {
    throw new Error("La file de relecture est réservée aux responsables habilités.");
  }

  const currentStatus = isCellReviewer
    ? StatutNote.RELECTURE_CELLULE
    : StatutNote.RELECTURE_BUREAU;
  const scopedNotes = notes.filter((note) => {
    if (note.statutNote !== currentStatus) return false;
    if (isOfficeReviewer) return true;
    return mockRuntime.cellulesDossiers.some(
      (assignment) =>
        assignment.dossierId === note.dossierId &&
        assignment.celluleId === user.celluleId
    );
  });
  const details = await Promise.all(scopedNotes.map((note) => getNote(note.id)));
  const toReview = details.filter(Boolean).map((detail) => {
    const rawNote = notes.find((item) => item.id === detail.id);
    const dossier = mockRuntime.dossiers.find((item) => item.id === detail.dossierId);
    return getWorkItem(rawNote, dossier, detail);
  });

  const returned = notes
    .filter((note) =>
      note.statutNote === StatutNote.BROUILLON &&
      note.renvoyeeParId === user.id &&
      (!isCellReviewer ||
        mockRuntime.cellulesDossiers.some(
          (assignment) =>
            assignment.dossierId === note.dossierId &&
            assignment.celluleId === user.celluleId
        ))
    );
  const returnedDetails = await Promise.all(returned.map((note) => getNote(note.id)));
  const returnedToAuthor = returnedDetails.filter(Boolean).map((detail) => {
    const rawNote = notes.find((item) => item.id === detail.id);
    const dossier = mockRuntime.dossiers.find((item) => item.id === detail.dossierId);
    return getWorkItem(rawNote, dossier, detail);
  });

  const recentCutoff = Date.now() - 7 * 86_400_000;
  const recentTransitions = notes.flatMap((note) => {
    const transitions = (note.transitionHistory || []).filter(
      (transition) =>
        transition.authorId === user.id &&
        [StatutNote.RELECTURE_BUREAU, StatutNote.VALIDEE].includes(transition.toStatus) &&
        new Date(transition.date).getTime() >= recentCutoff &&
        (!isCellReviewer ||
          mockRuntime.cellulesDossiers.some(
            (assignment) =>
              assignment.dossierId === note.dossierId &&
              assignment.celluleId === user.celluleId
          ))
    );
    return transitions.map((transition) => ({ note, transition }));
  });
  const recentIds = [...new Set(recentTransitions.map(({ note }) => note.id))];
  const recentDetails = await Promise.all(recentIds.map((noteId) => getNote(noteId)));
  const recentlyTreated = recentDetails.filter(Boolean).map((detail) => {
    const rawNote = notes.find((item) => item.id === detail.id);
    const dossier = mockRuntime.dossiers.find((item) => item.id === detail.dossierId);
    const item = getWorkItem(rawNote, dossier, detail);
    item.lastTreatedAt = recentTransitions
      .filter(({ note }) => note.id === item.id)
      .sort((a, b) => new Date(b.transition.date) - new Date(a.transition.date))[0]
      ?.transition.date;
    return item;
  });

  return { toReview, returnedToAuthor, recentlyTreated };
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
export async function updateNoteStatus(noteId, newStatus, auteurId = "usr-01", options = {}) {
  await delay(80);
  const index = notes.findIndex((n) => n.id === noteId);
  if (index === -1) throw new Error(`Note introuvable : ${noteId}`);

  const note = notes[index];
  const actor = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  if (!actor) throw new Error("L'utilisateur courant est introuvable.");
  const motif = options.motif?.trim() || "";
  const hasActiveReviewDelegation = mockRuntime.prisesEnCharge.some(
    (item) =>
      item.dossierId === note.dossierId &&
      item.adjointId === auteurId &&
      item.active &&
      item.portee?.valider !== false
  );
  const belongsToActorCell = mockRuntime.cellulesDossiers.some(
    (assignment) =>
      assignment.dossierId === note.dossierId &&
      assignment.celluleId === actor.celluleId
  );

  let delegation = null;
  if (newStatus === StatutNote.RELECTURE_CELLULE && note.statutNote === StatutNote.BROUILLON) {
    if (note.redacteurId !== auteurId) {
      throw new Error("Seul le rédacteur de la note peut la soumettre en relecture.");
    }
  }
  if (newStatus === StatutNote.RELECTURE_BUREAU) {
    if (
      note.statutNote !== StatutNote.RELECTURE_CELLULE ||
      !belongsToActorCell ||
      ![Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(actor.role) ||
      (actor.role === Role.CHEF_CELLULE_ADJOINT && !hasActiveReviewDelegation)
    ) {
      throw new Error("La transmission au Chef de bureau est réservée au responsable habilité de la cellule.");
    }
  }
  if (newStatus === StatutNote.BROUILLON) {
    if (!motif) throw new Error("Un motif est obligatoire pour renvoyer la note au rédacteur.");
    const isCellReturn =
      note.statutNote === StatutNote.RELECTURE_CELLULE &&
      belongsToActorCell &&
      [Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(actor.role) &&
      (actor.role !== Role.CHEF_CELLULE_ADJOINT || hasActiveReviewDelegation);
    const isOfficeReturn =
      note.statutNote === StatutNote.RELECTURE_BUREAU &&
      [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(actor.role) &&
      (actor.role !== Role.CHEF_BUREAU_ADJOINT || hasActiveReviewDelegation);
    if (!isCellReturn && !isOfficeReturn) {
      throw new Error("Vous n'êtes pas autorisé à renvoyer cette note au rédacteur.");
    }
  }
  if (newStatus === StatutNote.VALIDEE || newStatus === StatutNote.EN_ATTENTE_IMPRESSION) {
    if (note.statutNote !== StatutNote.RELECTURE_BUREAU) {
      throw new Error("Cette note n'est pas en attente de validation du Chef de bureau.");
    }
    if (
      actor.role !== Role.CHEF_BUREAU &&
      !(actor.role === Role.CHEF_BUREAU_ADJOINT &&
        (delegation = getActiveValidationDelegation(note, auteurId)))
    ) {
      throw new Error("La validation est réservée au Chef de bureau ou à un adjoint autorisé.");
    }
  }
  if (newStatus === StatutNote.RELECTURE_CELLULE && note.statutNote === StatutNote.RELECTURE_BUREAU) {
    if (!motif) throw new Error("Un motif est obligatoire pour renvoyer la note en observation.");
    if (
      actor.role !== Role.CHEF_BUREAU &&
      !(actor.role === Role.CHEF_BUREAU_ADJOINT &&
        (delegation = getActiveValidationDelegation(note, auteurId)))
    ) {
      throw new Error("Le renvoi en observation est réservé au Chef de bureau ou à un adjoint autorisé.");
    }
  }
  if (newStatus === StatutNote.IMPRIMEE) {
    if (![StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION].includes(note.statutNote)) {
      throw new Error("La note doit être validée avant d'être imprimée.");
    }
    if (actor.role === Role.CHEF_BUREAU_ADJOINT) {
      delegation = getActivePrintDelegation(note, auteurId);
    }
    if (
      ![Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT, Role.SECRETARIAT].includes(actor.role) ||
      (actor.role === Role.CHEF_BUREAU_ADJOINT &&
        (!delegation || delegation.portee?.imprimer === false))
    ) {
      throw new Error("Vous n'êtes pas autorisé à imprimer cette note.");
    }
  }
  if (newStatus === StatutNote.SIGNEE) {
    if (note.statutNote !== StatutNote.IMPRIMEE) {
      throw new Error("La note doit être imprimée avant d'être signée.");
    }
    if (actor.role === Role.CHEF_BUREAU_ADJOINT) {
      delegation = getActiveSignatureDelegation(note, auteurId);
      if (!delegation) throw new Error("Prise en charge active avec portée de signature requise.");
    } else if (actor.role !== Role.CHEF_BUREAU) {
      throw new Error("La signature est réservée au Chef de bureau ou à son adjoint autorisé.");
    }
  }

  const date = new Date().toISOString();
  const displayName = `${actor.prenom} ${actor.nom}`.trim();
  const signatureMention = newStatus === StatutNote.SIGNEE && delegation
    ? `Signée par ${displayName}, adjoint, par prise en charge du ${new Intl.DateTimeFormat("fr-FR").format(new Date(delegation.dateHeure))}`
    : null;
  const workflowStatus =
    newStatus === StatutNote.EN_ATTENTE_IMPRESSION
      ? StatutNote.VALIDEE
      : newStatus;
  const updates = {
    statutNote: newStatus,
    transitionHistory: [
      ...(note.transitionHistory || []),
      {
        fromStatus: note.statutNote,
        toStatus: newStatus,
        authorId: auteurId,
        author: displayName,
        role: actor.role,
        date,
        motif: motif || undefined,
      },
    ],
    historiqueEtapes: {
      ...(note.historiqueEtapes || {}),
      [workflowStatus]: {
        authorId: auteurId,
        author: displayName,
        role: actor.role,
        date,
        mention: signatureMention || undefined,
      },
    },
  };

  if (newStatus === StatutNote.VALIDEE || newStatus === StatutNote.EN_ATTENTE_IMPRESSION) {
    updates.dateValidation = date.split("T")[0];
    updates.valideParId = auteurId;
  }
  if (newStatus === StatutNote.IMPRIMEE) {
    updates.dateImpression = date.split("T")[0];
    updates.imprimeParId = auteurId;
  } else if (newStatus === StatutNote.SIGNEE) {
    updates.dateSignature = date.split("T")[0];
    updates.signeParId = auteurId;
    updates.signeParAdjoint = actor.role === Role.CHEF_BUREAU_ADJOINT;
    updates.signatureMention = signatureMention;
    updates.signaturePriseEnChargeId = delegation?.id || null;
    updates.signaturePriseEnChargeDate = delegation?.dateHeure || null;
  } else if (newStatus === StatutNote.RELECTURE_CELLULE) {
    updates.dateSoumissionCellule = date;
  } else if (newStatus === StatutNote.RELECTURE_BUREAU) {
    updates.dateSoumissionBureau = date;
  } else if (newStatus === StatutNote.TRANSMISE) {
    updates.dateTransmission = date.split("T")[0];
    updates.transmiseParId = auteurId;
  }
  if (newStatus === StatutNote.BROUILLON) {
    updates.renvoyeeParId = auteurId;
    updates.dateRenvoyee = date;
    updates.motifRenvoyee = motif;
  } else if (
    newStatus === StatutNote.RELECTURE_CELLULE ||
    newStatus === StatutNote.RELECTURE_BUREAU
  ) {
    updates.renvoyeeParId = null;
    updates.dateRenvoyee = null;
    updates.motifRenvoyee = null;
  }

  if (motif) {
    observations.push({
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      noteId,
      auteurId,
      date,
      contenu: motif,
      resolue: false,
    });
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
    [StatutNote.EN_ATTENTE_IMPRESSION]: "validée, en attente d'impression",
    [StatutNote.IMPRIMEE]: "imprimée",
    [StatutNote.SIGNEE]: "signée",
  }[newStatus] || newStatus;
  const movementType = {
    [StatutNote.VALIDEE]: TypeMouvement.VALIDATION,
    [StatutNote.EN_ATTENTE_IMPRESSION]: TypeMouvement.VALIDATION,
    [StatutNote.IMPRIMEE]: TypeMouvement.IMPRESSION,
    [StatutNote.SIGNEE]: TypeMouvement.SIGNATURE,
  }[newStatus] || TypeMouvement.OBSERVATION;

  notifyInvolved(
    notes[index],
    `La note du dossier {reference} a été ${statusLabel}.${motif ? ` Motif : ${motif}` : ""}`,
    auteurId,
    newStatus === StatutNote.VALIDEE || newStatus === StatutNote.EN_ATTENTE_IMPRESSION
      ? "VALIDATION"
      : newStatus === StatutNote.IMPRIMEE
        ? "IMPRESSION"
        : newStatus === StatutNote.SIGNEE
          ? "SIGNATURE"
          : "OBSERVATION",
    date
  );
  if (newStatus === StatutNote.IMPRIMEE && auteurId !== "usr-03") {
    mockRuntime.notifications.unshift({
      id: `notif-print-secretariat-${Date.now()}`,
      destinataireId: "usr-03",
      message: `La note du dossier ${reference} a été imprimée et attend sa mise en parapheur.`,
      dossierId: note.dossierId,
      date,
      canal: "APPLICATION",
      lue: false,
      type: "IMPRESSION",
    });
  }
  if (signatureMention) notes[index].signatureMention = signatureMention;
  addMovement(
    notes[index],
    motif
      ? `Note du dossier ${reference} : ${statusLabel}. Motif : ${motif}`
      : signatureMention
      ? `Note du dossier ${reference} : ${signatureMention}.`
      : `Note du dossier ${reference} : ${statusLabel}.`,
    auteurId,
    movementType,
    date
  );

  return notes[index];
}

/**
 * Transfère une note avec un motif obligatoire, en enregistrant observation,
 * historique, mouvement et notification dans la transition de statut commune.
 * @param {string} noteId
 * @param {string} newStatus
 * @param {string} motif
 * @param {string} auteurId
 * @returns {Promise<Object>}
 */
export async function transitionNoteWithObservation(noteId, newStatus, motif, auteurId) {
  if (!motif?.trim()) {
    throw new Error("Un motif est obligatoire pour cette action.");
  }
  return updateNoteStatus(noteId, newStatus, auteurId, { motif: motif.trim() });
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
  const author = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  if (author?.role !== Role.SECRETARIAT) {
    throw new Error("L'enregistrement du cachet est réservé au Secrétariat.");
  }
  if (![StatutNote.SIGNEE, "CACHETEE"].includes(notes[index].statutNote)) {
    throw new Error("Seule une note signée peut recevoir le cachet.");
  }
  if (!data.premierePagePdfUrl) {
    throw new Error("La première page signée et cachetée au format PDF est obligatoire.");
  }
  if (notes[index].statutNote === "CACHETEE") {
    throw new Error("Le cachet a déjà été enregistré pour cette note.");
  }
  const numeroOfficiel = await getNextOfficialNumber(noteId);
  const date = new Date().toISOString();
  const dateCachet = data.dateCachet || date.split("T")[0];

  notes[index] = {
    ...notes[index],
    numeroOfficiel,
    dateCachet,
    cachetParId: auteurId,
    premierePagePdfUrl: data.premierePagePdfUrl,
    lettreRecuperee: notes[index].typeDocument === "PROJET_LETTRE" || notes[index].lettreRecuperee,
    statutNote: "CACHETEE",
    historiqueEtapes: {
      ...(notes[index].historiqueEtapes || {}),
      CACHETEE: { authorId: auteurId, date },
    },
  };
  const dossier = mockRuntime.dossiers.find((item) => item.id === notes[index].dossierId);
  const reference = dossier?.reference || notes[index].dossierId;
  notifyInvolved(
    notes[index],
    `Le cachet officiel ${numeroOfficiel} a été enregistré pour le dossier ${reference}.`,
    auteurId,
    "CACHET",
    date
  );
  addMovement(
    notes[index],
    `Cachet ${numeroOfficiel} enregistré sur la note du dossier ${reference}.`,
    auteurId,
    TypeMouvement.CACHET,
    date
  );

  return notes[index];
}

export async function transmettreNote(noteId, auteurId = "usr-03") {
  const author = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  if (author?.role !== Role.SECRETARIAT) {
    throw new Error("La transmission au cabinet est réservée au Secrétariat.");
  }
  const index = notes.findIndex((item) => item.id === noteId);
  if (index === -1) throw new Error(`Note introuvable : ${noteId}`);
  if (notes[index].statutNote !== "CACHETEE") {
    throw new Error("La note doit être cachetée avant sa transmission.");
  }
  const date = new Date().toISOString();
  notes[index] = {
    ...notes[index],
    statutNote: StatutNote.TRANSMISE,
    dateTransmission: date.split("T")[0],
    transmiseParId: auteurId,
    historiqueEtapes: {
      ...(notes[index].historiqueEtapes || {}),
      [StatutNote.TRANSMISE]: { authorId: auteurId, date },
    },
  };
  const dossierIndex = mockRuntime.dossiers.findIndex(
    (item) => item.id === notes[index].dossierId
  );
  if (dossierIndex === -1) throw new Error(`Dossier introuvable : ${notes[index].dossierId}`);
  mockRuntime.dossiers[dossierIndex] = {
    ...mockRuntime.dossiers[dossierIndex],
    statutDossier: "TRANSMIS",
  };
  const reference = mockRuntime.dossiers[dossierIndex].reference;
  notifyInvolved(
    notes[index],
    `La note du dossier {reference} a été transmise au cabinet.`,
    auteurId,
    "TRANSMISSION",
    date
  );
  addMovement(
    notes[index],
    `Note du dossier ${reference} transmise au cabinet.`,
    auteurId,
    TypeMouvement.TRANSMISSION,
    date
  );
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
  const author = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  if (![Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(author?.role)) {
    throw new Error("La réouverture est réservée au Chef de bureau et à son adjoint.");
  }
  const originalNote = notes[index];
  if (originalNote.statutNote !== StatutNote.SIGNEE || originalNote.estRouverte) {
    throw new Error("Seule une note signée non rouverte peut être rouverte.");
  }
  if (!reouvertureData.motif?.trim()) throw new Error("Le motif de réouverture est obligatoire.");
  if (!reouvertureData.autorisePar?.trim()) {
    throw new Error("L'autorité ayant autorisé la réouverture est obligatoire.");
  }

  const activeVersions = versions.filter((v) => v.noteId === noteId);
  const signedVersion = activeVersions.find((v) => v.estDerniereVersion) ||
    [...activeVersions].sort((a, b) => b.numeroVersion - a.numeroVersion)[0];
  const dateReouverture = reouvertureData.date
    ? new Date(`${reouvertureData.date}T12:00:00`).toISOString()
    : new Date().toISOString();

  const newReouverture = {
    id: `reouv-${Date.now()}`,
    noteId,
    dateReouverture,
    auteurId,
    motif: reouvertureData.motif.trim(),
    autorisePar: reouvertureData.autorisePar.trim(),
    versionSigneeOrigineId: signedVersion?.id || null,
  };

  reouvertures.unshift(newReouverture);
  const newCycle = {
    id: `cyc-reopen-${Date.now()}`,
    dossierId: originalNote.dossierId,
    numeroCycle: Math.max(
      0,
      ...mockRuntime.cycles
        .filter((cycle) => cycle.dossierId === originalNote.dossierId)
        .map((cycle) => cycle.numeroCycle)
    ) + 1,
    typeSuite: "REOUVERTURE",
    dateOuverture: dateReouverture,
    bureauxCollaboration: [],
    noteOrigineId: originalNote.id,
  };
  mockRuntime.cycles.push(newCycle);
  const newNote = {
    ...originalNote,
    id: `not-reopen-${Date.now()}`,
    cycleId: newCycle.id,
    numeroOfficiel: null,
    statutNote: StatutNote.BROUILLON,
    dateCreation: dateReouverture,
    dateValidation: null,
    valideParId: null,
    dateImpression: null,
    imprimeParId: null,
    dateSignature: null,
    signeParId: null,
    signeParAdjoint: false,
    signatureMention: null,
    signaturePriseEnChargeId: null,
    signaturePriseEnChargeDate: null,
    dateCachet: null,
    cachetParId: null,
    dateTransmission: null,
    transmiseParId: null,
    estRouverte: false,
    noteOrigineId: originalNote.id,
    reouvertureId: newReouverture.id,
    historiqueEtapes: {
      [StatutNote.BROUILLON]: { authorId: originalNote.redacteurId, date: dateReouverture },
    },
  };
  notes[index] = {
    ...originalNote,
    estRouverte: true,
    reouvertureId: newReouverture.id,
    noteSuivanteId: newNote.id,
  };
  notes.unshift(newNote);
  const dossier = mockRuntime.dossiers.find((item) => item.id === originalNote.dossierId);
  notifyInvolved(
    newNote,
    `Une nouvelle version de travail a été ouverte après réouverture du dossier ${dossier?.reference || originalNote.dossierId}.`,
    auteurId,
    "REOUVERTURE",
    dateReouverture
  );
  addMovement(
    originalNote,
    `Note signée rouverte. Motif : ${newReouverture.motif}. Nouvelle note ${newNote.id}, cycle ${newCycle.numeroCycle}.`,
    auteurId,
    TypeMouvement.REOUVERTURE,
    dateReouverture
  );

  return {
    note: notes[index],
    reouverture: newReouverture,
    newNote,
    cycle: newCycle,
    versionSigneeOrigine: signedVersion || null,
    dossierReference: dossier?.reference || originalNote.dossierId,
  };
}
