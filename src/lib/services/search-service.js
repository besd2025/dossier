import { STATUT_DOSSIER_CONFIG, STATUT_NOTE_CONFIG } from "@/config/statuses";
import { mockRuntime } from "@/lib/mock/runtime-state";
import { Role } from "@/types";

const delay = (ms = 70) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getDossierCellIds(dossierId) {
  return mockRuntime.cellulesDossiers
    .filter((assignment) => assignment.dossierId === dossierId)
    .map((assignment) => assignment.celluleId);
}

function hasDossierAccess(dossier, user, role) {
  if ([Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT, Role.SECRETARIAT].includes(role)) {
    return true;
  }
  const cellIds = getDossierCellIds(dossier.id);
  if ([Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role)) {
    return Boolean(user?.celluleId && cellIds.includes(user.celluleId));
  }
  if ([Role.CONSEILLER, Role.CONSEILLER_HORS_CELLULE, Role.COMPTABLE].includes(role)) {
    return mockRuntime.affectations.some(
      (assignment) =>
        assignment.dossierId === dossier.id &&
        assignment.destinataireId === user?.id
    ) || mockRuntime.accesExceptionnels.some(
      (access) => access.dossierId === dossier.id && access.beneficiaireId === user?.id
    );
  }
  return false;
}

function canReadNoteText(dossier, user, role, dossierAccess) {
  if (!dossierAccess || role === Role.SECRETARIAT) return false;
  if ([Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role)) return true;
  if ([Role.CHEF_CELLULE, Role.CHEF_CELLULE_ADJOINT].includes(role)) {
    return getDossierCellIds(dossier.id).includes(user?.celluleId);
  }
  return mockRuntime.notes.some(
    (note) =>
      note.dossierId === dossier.id &&
      ((note.conseillersAssignesIds || []).includes(user?.id) ||
        note.redacteurId === user?.id)
  );
}

function getLatestNoteData(dossierId) {
  const notes = mockRuntime.notes
    .filter((note) => note.dossierId === dossierId)
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  const note = notes[0];
  if (!note) return { note: null, version: null };
  const version = mockRuntime.versions
    .filter((item) => item.noteId === note.id)
    .sort((a, b) => b.numeroVersion - a.numeroVersion)[0] || null;
  return { note, version };
}

function matchesTerms(query, fields) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return terms.length > 0 && terms.every((term) =>
    fields.some((field) => normalize(field).includes(term))
  );
}

function makeExcerpt(text, query, maxLength = 220) {
  const value = String(text || "").trim();
  if (!value) return "";
  const normalizedText = normalize(value);
  const firstTerm = normalize(query).split(/\s+/).find(Boolean);
  const index = firstTerm ? normalizedText.indexOf(firstTerm) : -1;
  const start = index > 70 ? index - 70 : 0;
  const excerpt = value.slice(start, start + maxLength);
  return `${start ? "…" : ""}${excerpt}${start + maxLength < value.length ? "…" : ""}`;
}

function getMatchingHistory(dossierId, query) {
  return mockRuntime.mouvements
    .filter((movement) =>
      movement.dossierId === dossierId &&
      matchesTerms(query, [movement.description, movement.typeMouvement])
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map((movement) => ({
      description: movement.description,
      date: movement.date,
      type: movement.typeMouvement,
    }));
}

function matchesDateFilter(dossier, filters) {
  const date = dossier.dateReceptionBesd || dossier.dateReceptionCabinet;
  if (!date) return !filters.dateFrom && !filters.dateTo;
  const dateValue = new Date(date).getTime();
  if (filters.dateFrom && dateValue < new Date(`${filters.dateFrom}T00:00:00`).getTime()) return false;
  if (filters.dateTo && dateValue > new Date(`${filters.dateTo}T23:59:59`).getTime()) return false;
  return true;
}

export async function getSearchFacets() {
  await delay(30);
  return {
    cellules: mockRuntime.cellules.map(({ id, nom, code }) => ({ id, nom, code })),
    provenances: mockRuntime.provenances.filter((item) => item.actif),
    statuts: [
      ...Object.values(STATUT_DOSSIER_CONFIG).map(({ id, label }) => ({ id, label, type: "DOSSIER" })),
      ...Object.values(STATUT_NOTE_CONFIG).map(({ id, label }) => ({ id, label, type: "NOTE" })),
    ],
  };
}

export async function searchDossiers(query, filters = {}, user, role) {
  await delay();
  const searchQuery = String(query || "").trim();
  if (!searchQuery) return [];

  const results = [];
  for (const dossier of mockRuntime.dossiers) {
    const cellIds = getDossierCellIds(dossier.id);
    if (filters.celluleId && !cellIds.includes(filters.celluleId)) continue;
    if (filters.provenanceId && dossier.provenanceId !== filters.provenanceId) continue;
    if (filters.status) {
      const dossierStatusMatches = dossier.statutDossier === filters.status;
      const noteStatusMatches = mockRuntime.notes.some(
        (note) => note.dossierId === dossier.id && note.statutNote === filters.status
      );
      if (!dossierStatusMatches && !noteStatusMatches) continue;
    }
    if (!matchesDateFilter(dossier, filters)) continue;

    const dossierAccess = hasDossierAccess(dossier, user, role);
    const canReadText = canReadNoteText(dossier, user, role, dossierAccess);
    const { note, version } = getLatestNoteData(dossier.id);
    const keywords = [...new Set([
      ...(dossier.motsCles || []),
      ...(note?.motsCles || []),
    ])];
    const matchingKeywords = keywords.filter((keyword) =>
      matchesTerms(searchQuery, [keyword])
    );
    const history = getMatchingHistory(dossier.id, searchQuery);
    const noteText = [version?.texteRecherche, version?.commentaire].filter(Boolean).join(" ");
    const matchingObject = dossierAccess &&
      matchesTerms(searchQuery, [dossier.reference, dossier.objet, dossier.provenanceNom]);
    const matchingNoteText = canReadText && matchesTerms(searchQuery, [
      noteText,
      note?.typeDocument,
      note?.destinataire,
    ]);

    if (!matchingObject && !matchingKeywords.length && !history.length && !matchingNoteText) continue;

    const matchTypes = [];
    if (matchingObject) matchTypes.push("Objet");
    if (matchingKeywords.length) matchTypes.push("Mots-clés");
    if (matchingNoteText) matchTypes.push("Texte de la note");
    if (history.length) matchTypes.push("Historique");

    results.push({
      dossierId: dossier.id,
      inScope: dossierAccess,
      reference: dossierAccess ? dossier.reference : "Dossier hors périmètre",
      objet: dossierAccess ? dossier.objet : null,
      statutDossier: dossierAccess ? dossier.statutDossier : null,
      statutNote: dossierAccess ? note?.statutNote || null : null,
      matchingKeywords,
      excerpt: matchingNoteText ? makeExcerpt(noteText || `${note?.typeDocument || ""} ${note?.destinataire || ""}`, searchQuery) : "",
      matchingHistory: history,
      matchTypes,
      noteId: note?.id || null,
      date: dossierAccess ? dossier.dateReceptionBesd || dossier.dateReceptionCabinet || null : null,
    });
  }
  return results.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}
