import { initialCellules } from "@/lib/mock";
import { mockRuntime } from "@/lib/mock/runtime-state";
import { StatutDossier, TypeMouvement } from "@/types";

// État mutable en mémoire (sans persistance)
const dossiers = mockRuntime.dossiers;
const cycles = mockRuntime.cycles;
const dossierCellules = mockRuntime.cellulesDossiers;
const mouvements = mockRuntime.mouvements;

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

function filterDossiersByRole(role, currentUser = null, rows = []) {
  if (!role || !rows.length) return rows;

  const userCelluleId = currentUser?.celluleId || null;

  switch (role) {
    case "SECRETARIAT":
      return rows;
    case "CHEF_BUREAU":
    case "CHEF_BUREAU_ADJOINT":
      return rows;
    case "CHEF_CELLULE":
    case "CHEF_CELLULE_ADJOINT":
    case "CONSEILLER":
    case "CONSEILLER_HORS_CELLULE":
      if (!userCelluleId) return rows;
      return rows.filter((dossier) =>
        dossierCellules.some(
          (dc) => dc.dossierId === dossier.id && dc.celluleId === userCelluleId,
        ),
      );
    case "COMPTABLE":
      return rows.filter((dossier) => dossier.enRetard || dossier.statutDossier === "RECU");
    default:
      return rows;
  }
}

/**
 * Récupère la liste des dossiers avec filtres optionnels
 * @param {Object} [filters]
 * @param {string} [filters.status]
 * @param {string} [filters.celluleId]
 * @param {string} [filters.provenanceId]
 * @param {string} [filters.search]
 * @param {boolean} [filters.overdueOnly]
 * @param {string} [role]
 * @param {Object} [currentUser]
 * @returns {Promise<Array>}
 */
export async function getDossiers(filters = {}, role = null, currentUser = null) {
  await delay(80);
  let result = [...dossiers];

  result = filterDossiersByRole(role, currentUser, result);

  if (filters.status) {
    result = result.filter((d) => d.statutDossier === filters.status);
  }

  if (filters.provenanceId) {
    result = result.filter((d) => d.provenanceId === filters.provenanceId);
  }

  if (filters.overdueOnly) {
    result = result.filter((d) => d.enRetard);
  }

  if (filters.celluleId) {
    const matchingDossierIds = new Set(
      dossierCellules
        .filter((dc) => dc.celluleId === filters.celluleId)
        .map((dc) => dc.dossierId),
    );
    result = result.filter((d) => matchingDossierIds.has(d.id));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (d) =>
        d.reference.toLowerCase().includes(q) ||
        d.objet.toLowerCase().includes(q) ||
        d.provenanceNom.toLowerCase().includes(q) ||
        (d.motsCles && d.motsCles.some((kw) => kw.toLowerCase().includes(q))),
    );
  }

  return result;
}

/**
 * Récupère un dossier par son identifiant technique ou sa référence métier
 * @param {string} idOrReference
 * @returns {Promise<Object|null>}
 */
export async function getDossier(idOrReference) {
  await delay(60);
  const dossier = dossiers.find(
    (d) => d.id === idOrReference || d.reference === idOrReference,
  );
  if (!dossier) return null;

  const getUser = (id) => mockRuntime.utilisateurs.find((user) => user.id === id) || null;
  const getCell = (id) => initialCellules.find((cellule) => cellule.id === id) || null;
  const cells = dossierCellules
    .filter((assignment) => assignment.dossierId === dossier.id)
    .map((assignment) => ({
      ...assignment,
      cellule: getCell(assignment.celluleId),
    }));
  const dossierCycles = cycles
    .filter((cycle) => cycle.dossierId === dossier.id)
    .sort((a, b) => a.numeroCycle - b.numeroCycle)
    .map((cycle) => ({
      ...cycle,
      notes: mockRuntime.notes
        .filter((note) => note.dossierId === dossier.id && note.cycleId === cycle.id)
        .map((note) => ({
          ...note,
          redacteur: getUser(note.redacteurId),
          versions: mockRuntime.versions
            .filter((version) => version.noteId === note.id)
            .sort((a, b) => a.numeroVersion - b.numeroVersion)
            .map((version) => ({
              ...version,
              auteur: getUser(version.auteurId),
            })),
        })),
    }));
  const assignments = mockRuntime.affectations
    .filter((assignment) => assignment.dossierId === dossier.id)
    .map((assignment) => ({
      ...assignment,
      auteur: getUser(assignment.auteurId),
      destinataire: getUser(assignment.destinataireId) || getCell(assignment.destinataireId),
      cellule: getCell(assignment.celluleId),
      conseillerPrefere: getUser(assignment.conseillerPrefereId),
    }));
  const movements = mouvements
    .filter((movement) => movement.dossierId === dossier.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((movement) => {
      const author = getUser(movement.auteurId);
      return {
        ...movement,
        auteurNom: author ? `${author.prenom} ${author.nom}` : "Utilisateur",
        auteurRole: author?.role,
      };
    });

  return {
    ...dossier,
    cellules: cells,
    cycles: dossierCycles,
    affectations: assignments,
    mouvements: movements,
    accesExceptionnels: mockRuntime.accesExceptionnels
      .filter((access) => access.dossierId === dossier.id)
      .map((access) => ({
        ...access,
        beneficiaire: getUser(access.beneficiaireId),
        accordePar: getUser(access.accordeParId),
      })),
    prisesEnCharge: mockRuntime.prisesEnCharge
      .filter((prise) => prise.dossierId === dossier.id)
      .map((prise) => ({
        ...prise,
        titulaire: getUser(prise.titulaireId),
        adjoint: getUser(prise.adjointId),
        auteur: getUser(prise.auteurId),
      })),
  };
}

/**
 * Enregistre un nouveau dossier au secrétariat
 * @param {Object} dossierData
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function createDossier(dossierData, auteurId = "usr-03") {
  await delay(120);

  const nextIndex = dossiers.length + 1;
  const newId = `dos-${String(nextIndex).padStart(3, "0")}`;
  const year = new Date().getFullYear();
  const reference = dossierData.reference || `${year}-D-${String(150 + nextIndex).padStart(4, "0")}`;

  const newDossier = {
    id: newId,
    reference,
    objet: dossierData.objet || "Sans objet",
    provenanceId: dossierData.provenanceId || "prov-01",
    provenanceNom: dossierData.provenanceNom || "Cabinet du Ministre",
    instructionCabinet: dossierData.instructionCabinet || "POUR_ANALYSE",
    origine: dossierData.origine || "VIA_CABINET_CIVIL",
    dateTransmissionOrigine: dossierData.dateTransmissionOrigine || new Date().toISOString().split("T")[0],
    dateReceptionCabinet: dossierData.dateReceptionCabinet || new Date().toISOString().split("T")[0],
    dateReceptionBesd: dossierData.dateReceptionBesd || new Date().toISOString().split("T")[0],
    statutDossier: dossierData.multiBureaux ? StatutDossier.EN_ATTENTE_AUTRE_BUREAU : StatutDossier.RECU,
    multiBureaux: Boolean(dossierData.multiBureaux),
    bureauPrecedent: dossierData.bureauPrecedent || null,
    rangBesd: dossierData.rangBesd || (dossierData.multiBureaux ? 2 : 1),
    dateMiseEnAttente: dossierData.multiBureaux ? new Date().toISOString().split("T")[0] : null,
    joursSansAvancement: 0,
    enRetard: false,
    premierePagePdfUrl: dossierData.premierePagePdfUrl || "/mock/pdf/default_p1.pdf",
    motsCles: dossierData.motsCles || [],
  };

  dossiers.unshift(newDossier);

  // Création du cycle initial
  const newCycle = {
    id: `cyc-${newId}`,
    dossierId: newId,
    numeroCycle: 1,
    typeSuite: "INITIAL",
    dateOuverture: newDossier.dateReceptionBesd,
    bureauxCollaboration: [],
  };
  cycles.push(newCycle);

  // Mouvement de traçabilité
  mouvements.unshift({
      id: `mvt-${Date.now()}`,
      dossierId: newId,
      date: new Date().toISOString(),
      auteurId,
      typeMouvement: TypeMouvement.RECEPTION,
      description: `Enregistrement du nouveau dossier réf. ${reference} (${newDossier.objet}).`,
    });

  return newDossier;
}

/**
 * Met à jour les champs d'un dossier
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateDossier(id, updates) {
  await delay(80);
  const index = dossiers.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(`Dossier introuvable : ${id}`);

  dossiers[index] = {
    ...dossiers[index],
    ...updates,
  };

  return dossiers[index];
}

/**
 * Récupère les dossiers en attente d'affectation dans le périmètre du rôle courant.
 * @param {string} role
 * @param {Object} user
 * @returns {Promise<Array>}
 */
export async function getDossiersToAssign(role, user) {
  await delay(70);

  if (role === "CHEF_BUREAU" || role === "CHEF_BUREAU_ADJOINT") {
    return dossiers
      .filter((dossier) => dossier.statutDossier === StatutDossier.RECU)
      .map((dossier) => ({
        ...dossier,
        cellules: dossierCellules
          .filter((assignment) => assignment.dossierId === dossier.id)
          .map((assignment) => ({
            ...assignment,
            code: initialCellules.find((cellule) => cellule.id === assignment.celluleId)?.code,
          })),
      }));
  }

  if (role === "CHEF_CELLULE" || role === "CHEF_CELLULE_ADJOINT") {
    const celluleId = user?.celluleId;
    if (!celluleId) return [];
    const dossierIds = new Set(dossierCellules
      .filter((assignment) => assignment.celluleId === celluleId)
      .map((assignment) => assignment.dossierId));
    const assignedToCounselorInCell = new Set(mockRuntime.affectations
      .filter((assignment) =>
        assignment.type === "CELLULE_VERS_CONSEILLER" && assignment.celluleId === celluleId,
      )
      .map((assignment) => assignment.dossierId));
    return dossiers
      .filter((dossier) =>
        dossierIds.has(dossier.id) &&
        !assignedToCounselorInCell.has(dossier.id) &&
        ![StatutDossier.TRANSMIS, StatutDossier.CLOTURE].includes(dossier.statutDossier),
      )
      .map((dossier) => ({
        ...dossier,
        cellules: dossierCellules
          .filter((assignment) => assignment.dossierId === dossier.id)
          .map((assignment) => ({
            ...assignment,
            code: initialCellules.find((cellule) => cellule.id === assignment.celluleId)?.code,
          })),
      }));
  }

  return [];
}

/**
 * Enregistre une affectation et les événements mock associés.
 * @param {Object} data
 * @param {Object} actor
 * @returns {Promise<Object>}
 */
export async function assignDossier(data, actor) {
  await delay(100);
  const dossier = dossiers.find((item) => item.id === data.dossierId);
  if (!dossier) throw new Error(`Dossier introuvable : ${data.dossierId}`);
  if (!actor?.id || !actor.role) throw new Error("Auteur d'affectation manquant.");

  const now = new Date().toISOString();
  const assignments = [];
  const addAssignment = (assignment) => {
    const saved = {
      id: `aff-${Date.now()}-${mockRuntime.affectations.length + assignments.length + 1}`,
      dossierId: dossier.id,
      date: now,
      auteurId: actor.id,
      confierAdjoint: Boolean(data.adjointId),
      ...(data.adjointId ? { adjointId: data.adjointId } : {}),
      ...assignment,
    };
    assignments.push(saved);
    mockRuntime.affectations.unshift(saved);
  };

  if (data.type === "BUREAU_VERS_CELLULE") {
    if (!Array.isArray(data.cellules) || data.cellules.length < 1 || data.cellules.length > 2) {
      throw new Error("Sélectionnez une ou deux cellules pour cette affectation.");
    }

    data.cellules.forEach((cellule, index) => {
      const currentAssignment = mockRuntime.cellulesDossiers.find(
        (item) => item.dossierId === dossier.id && item.celluleId === cellule.celluleId,
      );
      if (!currentAssignment) {
        mockRuntime.cellulesDossiers.push({
          id: `dc-${Date.now()}-${index}`,
          dossierId: dossier.id,
          celluleId: cellule.celluleId,
          type: index === 0 ? "PRINCIPALE" : "COLLABORATRICE",
        });
      } else if (index === 0) {
        currentAssignment.type = "PRINCIPALE";
      } else {
        currentAssignment.type = "COLLABORATRICE";
      }

      addAssignment({
        type: "BUREAU_VERS_CELLULE",
        celluleId: cellule.celluleId,
        destinataireId: cellule.celluleId,
        roleCellule: index === 0 ? "PRINCIPALE" : "COLLABORATRICE",
        conseillerPrefereId: data.conseillerPrefereId || null,
      });
    });

    if (data.adjointId) {
      const alreadyAuthorized = mockRuntime.prisesEnCharge.some(
        (prise) => prise.dossierId === dossier.id && prise.adjointId === data.adjointId && prise.active,
      );
      if (!alreadyAuthorized) {
        mockRuntime.prisesEnCharge.unshift({
          id: `pec-${Date.now()}`,
          dossierId: dossier.id,
          titulaireId: actor.id,
          adjointId: data.adjointId,
          dateHeure: now,
          auteurId: actor.id,
          active: true,
          portee: { signature: true, affecter: true, valider: true, imprimer: true },
        });
      }
    }

    data.cellules.forEach((selection, index) => {
      const cellule = initialCellules.find((item) => item.id === selection.celluleId);
      mockRuntime.notifications.unshift({
        id: `notif-${Date.now()}-${index}`,
        destinataireId: cellule?.chefId || selection.celluleId,
        message: `Le dossier ${dossier.reference} vous a été affecté${index ? " en collaboration." : " comme cellule principale."}`,
        dossierId: dossier.id,
        date: now,
        canal: "APPLICATION",
        lue: false,
        type: "AFFECTATION",
      });
    });
    if (data.adjointId) {
      mockRuntime.notifications.unshift({
        id: `notif-${Date.now()}-adjoint`,
        destinataireId: data.adjointId,
        message: `Vous êtes chargé du suivi du dossier ${dossier.reference} jusqu'à sa signature.`,
        dossierId: dossier.id,
        date: now,
        canal: "APPLICATION",
        lue: false,
        type: "AFFECTATION",
      });
    }
  } else if (data.type === "CELLULE_VERS_CONSEILLER") {
    if (!Array.isArray(data.conseillers) || data.conseillers.length < 1 || data.conseillers.length > 2) {
      throw new Error("Sélectionnez un ou deux conseillers pour cette affectation.");
    }

    data.conseillers.forEach((conseiller) => {
      if (!conseiller.celluleId) {
        throw new Error("Chaque conseiller doit être rattaché à une cellule.");
      }
      if (!mockRuntime.cellulesDossiers.some(
        (item) => item.dossierId === dossier.id && item.celluleId === conseiller.celluleId,
      )) {
        mockRuntime.cellulesDossiers.push({
          id: `dc-${Date.now()}-${mockRuntime.cellulesDossiers.length}`,
          dossierId: dossier.id,
          celluleId: conseiller.celluleId,
          type: mockRuntime.cellulesDossiers.some((item) => item.dossierId === dossier.id)
            ? "COLLABORATRICE"
            : "PRINCIPALE",
        });
      }

      addAssignment({
        type: "CELLULE_VERS_CONSEILLER",
        celluleId: conseiller.celluleId,
        destinataireId: conseiller.id,
      });
      mockRuntime.notifications.unshift({
        id: `notif-${Date.now()}-${conseiller.id}`,
        destinataireId: conseiller.id,
        message: `Le dossier ${dossier.reference} vous a été affecté pour instruction.`,
        dossierId: dossier.id,
        date: now,
        canal: "APPLICATION",
        lue: false,
        type: "AFFECTATION",
      });
    });
  } else if (data.type === "AUTO_TRAITEMENT") {
    addAssignment({
      type: "AUTO_TRAITEMENT",
      celluleId: actor.celluleId || null,
      destinataireId: actor.id,
    });
    mockRuntime.notifications.unshift({
      id: `notif-${Date.now()}`,
      destinataireId: actor.id,
      message: `Vous prenez en charge le dossier ${dossier.reference}.`,
      dossierId: dossier.id,
      date: now,
      canal: "APPLICATION",
      lue: false,
      type: "AFFECTATION",
    });
  } else if (data.type === "HORS_CELLULE") {
    const conseiller = mockRuntime.utilisateurs.find((item) => item.id === data.conseillerId);
    if (!conseiller || conseiller.role !== "CONSEILLER_HORS_CELLULE") {
      throw new Error("Sélectionnez un conseiller hors cellule valide.");
    }
    addAssignment({
      type: "HORS_CELLULE",
      celluleId: null,
      destinataireId: conseiller.id,
    });
    mockRuntime.notifications.unshift({
      id: `notif-${Date.now()}`,
      destinataireId: conseiller.id,
      message: `Le dossier ${dossier.reference} vous a été confié pour expertise.`,
      dossierId: dossier.id,
      date: now,
      canal: "APPLICATION",
      lue: false,
      type: "AFFECTATION",
    });
  } else {
    throw new Error("Type d'affectation non reconnu.");
  }

  dossier.statutDossier = StatutDossier.EN_TRAITEMENT;
  mockRuntime.mouvements.unshift({
    id: `mvt-${Date.now()}`,
    dossierId: dossier.id,
    date: now,
    auteurId: actor.id,
    typeMouvement: TypeMouvement.AFFECTATION,
    description: `Dossier ${dossier.reference} affecté : ${assignments.map((item) => item.destinataireId).join(", ")}.`,
  });

  return { dossier, affectations: assignments };
}
