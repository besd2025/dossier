import { STATUT_DOSSIER_CONFIG, STATUT_NOTE_CONFIG } from "@/config/statuses";
import { mockRuntime } from "@/lib/mock/runtime-state";
import {
  Role,
  StatutDossier,
  StatutNote,
  TypeMouvement,
} from "@/types";

const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
const OVERDUE_THRESHOLD_DAYS = 7;
const TREATED_MOVEMENT_TYPES = new Set([
  TypeMouvement.TRANSMISSION,
  TypeMouvement.SIGNATURE,
]);

function getUserCellId(user) {
  return user?.celluleId || mockRuntime.cellules.find(
    (cellule) => cellule.code === user?.cellule || cellule.nom === user?.cellule
  )?.id || null;
}

function getScopedDossierIds(role, user) {
  if ([Role.SECRETARIAT, Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role)) {
    return new Set(mockRuntime.dossiers.map((dossier) => dossier.id));
  }
  const userCellId = getUserCellId(user);
  if ([Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role)) {
    return new Set(
      mockRuntime.cellulesDossiers
        .filter((assignment) => assignment.celluleId === userCellId)
        .map((assignment) => assignment.dossierId)
    );
  }
  const userId = user?.id;
  if (!userId) return new Set();
  const assignedDossierIds = mockRuntime.affectations
    .filter((assignment) => assignment.destinataireId === userId)
    .map((assignment) => assignment.dossierId);
  const authoredNoteIds = mockRuntime.notes
    .filter((note) =>
      note.redacteurId === userId ||
      (note.conseillersAssignesIds || []).includes(userId)
    )
    .map((note) => note.dossierId);
  const accessDossierIds = mockRuntime.accesExceptionnels
    .filter((access) => access.beneficiaireId === userId)
    .map((access) => access.dossierId);
  return new Set([...assignedDossierIds, ...authoredNoteIds, ...accessDossierIds]);
}

function getPeriodRange(period, dateFrom, dateTo) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (period === "custom") {
    return {
      start: dateFrom ? new Date(`${dateFrom}T00:00:00`) : null,
      end: dateTo ? new Date(`${dateTo}T23:59:59.999`) : end,
    };
  }
  const start = new Date(end);
  if (period === "7d") start.setDate(start.getDate() - 6);
  else if (period === "30d") start.setDate(start.getDate() - 29);
  else if (period === "quarter") {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  }
  else start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function isWithinRange(value, range) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (!range.start || date >= range.start) && date <= range.end;
}

function getDossierAssignment(dossierId) {
  return mockRuntime.affectations
    .filter((assignment) => assignment.dossierId === dossierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
}

function getAssignmentName(assignment) {
  if (!assignment) return "Non affecté";
  const user = mockRuntime.utilisateurs.find(
    (item) => item.id === assignment.destinataireId
  );
  if (user) return `${user.prenom} ${user.nom}`;
  const cell = mockRuntime.cellules.find(
    (item) => item.id === (assignment.celluleId || assignment.destinataireId)
  );
  return cell?.code || "Non affecté";
}

function getDossierCellNames(dossierId) {
  return mockRuntime.cellulesDossiers
    .filter((assignment) => assignment.dossierId === dossierId)
    .map((assignment) => mockRuntime.cellules.find((cellule) => cellule.id === assignment.celluleId)?.code)
    .filter(Boolean);
}

function getTreatedEvents(scopedDossierIds, user, role, range) {
  const events = mockRuntime.mouvements
    .filter((movement) =>
      movement.dossierId &&
      scopedDossierIds.has(movement.dossierId) &&
      TREATED_MOVEMENT_TYPES.has(movement.typeMouvement) &&
      isWithinRange(movement.date, range)
    )
    .map((movement) => ({
      id: movement.id,
      dossierId: movement.dossierId,
      date: movement.date,
      auteurId: movement.auteurId,
      type: movement.typeMouvement,
    }));

  const trackedDossierIds = new Set(events.map((event) => event.dossierId));
  for (const note of mockRuntime.notes) {
    const date = note.dateTransmission || note.dateSignature;
    if (
      scopedDossierIds.has(note.dossierId) &&
      [StatutNote.TRANSMISE, StatutNote.SIGNEE].includes(note.statutNote) &&
      !trackedDossierIds.has(note.dossierId) &&
      isWithinRange(date, range)
    ) {
      events.push({
        id: `note-${note.id}`,
        dossierId: note.dossierId,
        date,
        auteurId: note.transmiseParId || note.signeParId || note.valideParId,
        type: note.statutNote,
      });
    }
  }

  const scopedEvents = [Role.CONSEILLER, Role.CONSEILLER_HORS_CELLULE, Role.COMPTABLE].includes(role)
    ? events.filter((event) => event.auteurId === user?.id)
    : events;
  const latestByDossier = new Map();
  for (const event of scopedEvents) {
    const previous = latestByDossier.get(event.dossierId);
    if (!previous || new Date(event.date) > new Date(previous.date)) {
      latestByDossier.set(event.dossierId, event);
    }
  }
  return [...latestByDossier.values()];
}

function getBucket(date, period, range) {
  const value = new Date(date);
  if (period === "7d" || (period === "custom" && range.start &&
    (range.end.getTime() - range.start.getTime()) / 86400000 <= 14)) {
    return {
      key: value.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit" }).format(value),
    };
  }
  if (period === "30d" || (period === "custom" && range.start &&
    (range.end.getTime() - range.start.getTime()) / 86400000 <= 45)) {
    const weekStart = new Date(value);
    weekStart.setDate(value.getDate() - ((value.getDay() + 6) % 7));
    const key = weekStart.toISOString().slice(0, 10);
    return { key, label: `Sem. ${new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(weekStart)}` };
  }
  return {
    key: `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(value),
  };
}

function getPerformer(event, role) {
  const dossierCells = getDossierCellNames(event.dossierId);
  if ([Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT, Role.SECRETARIAT].includes(role)) {
    return dossierCells[0] || "Sans cellule";
  }
  if ([Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role)) {
    const author = mockRuntime.utilisateurs.find((user) => user.id === event.auteurId);
    return author ? `${author.prenom} ${author.nom}` : dossierCells[0] || "Équipe";
  }
  return "Mes traitements";
}

function makeTreatmentChart(events, role, period, range) {
  const buckets = new Map();
  const performers = new Set();
  for (const event of events) {
    const bucket = getBucket(event.date, period, range);
    const performer = getPerformer(event, role);
    performers.add(performer);
    if (!buckets.has(bucket.key)) buckets.set(bucket.key, { key: bucket.key, label: bucket.label });
    const row = buckets.get(bucket.key);
    row[performer] = (row[performer] || 0) + 1;
  }
  const performerNames = [...performers].sort();
  return {
    data: [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key)),
    performers: performerNames.map((name, index) => ({
      key: name,
      label: name,
      color: ["#2563eb", "#0f766e", "#7c3aed", "#ea580c", "#0891b2"][index % 5],
    })),
  };
}

function getLateDossiers(dossiers) {
  return dossiers
    .filter((dossier) =>
      dossier.statutDossier !== StatutDossier.EN_ATTENTE_AUTRE_BUREAU &&
      Number(dossier.joursSansAvancement || 0) > OVERDUE_THRESHOLD_DAYS
    )
    .sort((a, b) => b.joursSansAvancement - a.joursSansAvancement)
    .map((dossier) => {
      const assignment = getDossierAssignment(dossier.id);
      const cells = getDossierCellNames(dossier.id);
      return {
        ...dossier,
        responsable: assignment ? getAssignmentName(assignment) : cells[0] || "Non affecté",
        cellulesNoms: cells,
      };
    });
}

/**
 * Calcule les indicateurs du tableau de bord depuis les données mock partagées.
 * @param {Object} [params]
 * @param {string} [params.role]
 * @param {Object} [params.user]
 * @param {string} [params.celluleId]
 * @param {"7d"|"30d"|"quarter"|"custom"} [params.period]
 * @param {string} [params.dateFrom]
 * @param {string} [params.dateTo]
 * @returns {Promise<Object>}
 */
export async function getKpis(params = {}) {
  await delay();
  const role = params.role || Role.CHEF_BUREAU;
  const user = params.user || (params.celluleId ? { celluleId: params.celluleId } : null);
  const scopedDossierIds = getScopedDossierIds(role, user);
  const dossiers = mockRuntime.dossiers.filter((dossier) => scopedDossierIds.has(dossier.id));
  const notes = mockRuntime.notes.filter((note) => scopedDossierIds.has(note.dossierId));
  const range = getPeriodRange(params.period || "30d", params.dateFrom, params.dateTo);
  const treatedEvents = getTreatedEvents(scopedDossierIds, user, role, range);
  const lateDossiers = getLateDossiers(dossiers);
  const isSecretariat = role === Role.SECRETARIAT;
  const isOffice = [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role);
  const isCell = [Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role);
  const isIndividual = !isSecretariat && !isOffice && !isCell;
  const notesForUser = isIndividual
    ? notes.filter((note) =>
      note.redacteurId === user?.id ||
      (note.conseillersAssignesIds || []).includes(user?.id)
    )
    : notes;
  const openNotes = notesForUser.filter((note) =>
    ![StatutNote.SIGNEE, StatutNote.TRANSMISE].includes(note.statutNote)
  );
  const overdueRows = lateDossiers.map((dossier) => ({
    id: dossier.id,
    reference: dossier.reference,
    objet: dossier.objet,
    statut: dossier.statutDossier,
    responsable: dossier.responsable,
    joursSansAvancement: dossier.joursSansAvancement,
  }));
  const repartitionStatuts = Object.values(StatutDossier).map((status) => ({
    status,
    label: STATUT_DOSSIER_CONFIG[status]?.label || status,
    count: dossiers.filter((dossier) => dossier.statutDossier === status).length,
  }));
  const notesAValider = notes.filter((note) =>
    [StatutNote.RELECTURE_BUREAU, StatutNote.RELECTURE_CELLULE].includes(note.statutNote)
  ).length;
  const notesEnSignature = notes.filter((note) =>
    [StatutNote.VALIDEE, StatutNote.EN_ATTENTE_IMPRESSION, StatutNote.IMPRIMEE].includes(note.statutNote)
  ).length;
  const notesARelire = notes.filter((note) => note.statutNote === StatutNote.RELECTURE_CELLULE).length;
  const notesImprimees = notes.filter((note) => note.statutNote === StatutNote.IMPRIMEE).length;
  const lettersToRecover = notes.filter((note) =>
    note.typeDocument === "PROJET_LETTRE" &&
    note.statutNote === StatutNote.SIGNEE &&
    !note.lettreRecuperee
  ).length;
  const returns = mockRuntime.retoursCabinet.filter((retour) =>
    !retour.dossierId || scopedDossierIds.has(retour.dossierId)
  );
  const assignedToCounselor = isCell
    ? mockRuntime.affectations.filter((assignment) =>
      assignment.type === "BUREAU_VERS_CELLULE" &&
      assignment.celluleId === getUserCellId(user) &&
      scopedDossierIds.has(assignment.dossierId) &&
      !mockRuntime.affectations.some((nextAssignment) =>
        nextAssignment.dossierId === assignment.dossierId &&
        nextAssignment.type === "CELLULE_VERS_CONSEILLER"
      )
    ).length
    : 0;
  const unresolvedObservations = mockRuntime.observations.filter((observation) => {
    if (observation.resolue) return false;
    const note = mockRuntime.notes.find((item) => item.id === observation.noteId);
    return note && scopedDossierIds.has(note.dossierId) &&
      (!isIndividual || notesForUser.some((item) => item.id === note.id));
  }).length;
  const treatmentChart = makeTreatmentChart(treatedEvents, role, params.period || "30d", range);

  return {
    role,
    totalDossiers: dossiers.length,
    dossiersEnCours: dossiers.filter((dossier) =>
      [StatutDossier.EN_TRAITEMENT, StatutDossier.ACTIF_APRES_RETOUR].includes(dossier.statutDossier)
    ).length,
    dossiersEnRetard: lateDossiers.length,
    dossiersAffecter: dossiers.filter((dossier) => dossier.statutDossier === StatutDossier.RECU).length,
    dossiersTraites: treatedEvents.length,
    notesAValider,
    notesEnSignature,
    notesARevoir: notesARelire,
    notesAffecteesConseillers: assignedToCounselor,
    notesImprimeesAchetter: notesImprimees,
    lettresARecuperer: lettersToRecover,
    retoursEnregistres: returns.length,
    mesDossiers: dossiers.length,
    mesNotesEnCours: openNotes.length,
    observationsATraiter: unresolvedObservations,
    repartitionStatuts,
    dossiersEnRetardListe: overdueRows,
    dossiersTraitesParPeriode: treatmentChart.data,
    seriesTraitement: treatmentChart.performers,
    statutsNote: Object.values(StatutNote).map((status) => ({
      status,
      label: STATUT_NOTE_CONFIG[status]?.label || status,
      count: notes.filter((note) => note.statutNote === status).length,
    })),
  };
}
