import { mockRuntime } from "@/lib/mock/runtime-state";
import { Role, TypeMouvement } from "@/types";

const delay = (ms = 70) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Récupère la liste des utilisateurs avec filtres
 * @param {Object} [filters]
 * @param {string} [filters.role]
 * @param {boolean} [filters.activeOnly]
 * @param {string} [filters.search]
 * @returns {Promise<Array>}
 */
export async function getUtilisateurs(filters = {}) {
  await delay(60);
  let result = [...mockRuntime.utilisateurs];

  if (filters.role) {
    result = result.filter((u) => u.role === filters.role);
  }

  if (filters.activeOnly) {
    result = result.filter((u) => u.actif);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (u) =>
        u.nom.toLowerCase().includes(q) ||
        u.prenom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cellule && u.cellule.toLowerCase().includes(q)),
    );
  }

  return result;
}

/**
 * Récupère un utilisateur par son identifiant
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getUtilisateur(id) {
  await delay(40);
  return mockRuntime.utilisateurs.find((u) => u.id === id) || null;
}

export async function updateUtilisateur(id, updates) {
  await delay(60);
  const index = mockRuntime.utilisateurs.findIndex((user) => user.id === id);
  if (index === -1) throw new Error("Utilisateur introuvable.");
  mockRuntime.utilisateurs[index] = { ...mockRuntime.utilisateurs[index], ...updates };
  return mockRuntime.utilisateurs[index];
}

/**
 * Crée un nouveau compte utilisateur
 * @param {Object} userData
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function createUtilisateur(userData, auteurId = "usr-01") {
  await delay(90);

  const nextIndex = mockRuntime.utilisateurs.reduce((max, user) => {
    const index = Number(user.id.match(/\d+$/)?.[0] || 0);
    return Math.max(max, index);
  }, 0) + 1;
  const newId = `usr-${String(nextIndex).padStart(2, "0")}`;

  const newUser = {
    id: newId,
    nom: userData.nom || "",
    prenom: userData.prenom || "",
    email: userData.email || `${userData.prenom?.toLowerCase()}.${userData.nom?.toLowerCase()}@besd.defense.gouv`,
    role: userData.role,
    cellule: userData.cellule || null,
    celluleId: userData.celluleId || null,
    creePar: userData.creePar || auteurId,
    actif: true,
    dateCreation: new Date().toISOString(),
  };

  mockRuntime.utilisateurs.push(newUser);
  const creator = mockRuntime.utilisateurs.find((user) => user.id === auteurId);
  mockRuntime.mouvements.unshift({
    id: `mvt-${Date.now()}`,
    dossierId: null,
    compteConcerneId: newUser.id,
    date: newUser.dateCreation,
    auteurId,
    typeMouvement: TypeMouvement.CREATION_COMPTE,
    description: `Création du compte de ${newUser.prenom} ${newUser.nom} (${newUser.role}).`,
  });
  if (creator?.role !== Role.CHEF_BUREAU) {
    mockRuntime.notifications.unshift({
      id: `notif-${Date.now()}`,
      destinataireId: "usr-01",
      message: `Un nouveau compte a été créé par ${creator ? `${creator.prenom} ${creator.nom}` : auteurId} : ${newUser.prenom} ${newUser.nom}.`,
      dossierId: null,
      date: newUser.dateCreation,
      canal: "APPLICATION",
      lue: false,
      type: "CREATION_COMPTE",
    });
  }
  return newUser;
}

/**
 * Active ou désactive un compte (jamais de suppression physique)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function toggleUtilisateurActif(id) {
  await delay(60);
  const index = mockRuntime.utilisateurs.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("Utilisateur introuvable");

  mockRuntime.utilisateurs[index] = {
    ...mockRuntime.utilisateurs[index],
    actif: !mockRuntime.utilisateurs[index].actif,
  };

  return mockRuntime.utilisateurs[index];
}
