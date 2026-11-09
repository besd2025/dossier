import { initialUtilisateurs } from "@/lib/mock";

let utilisateurs = [...initialUtilisateurs];

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
  let result = [...utilisateurs];

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
  return utilisateurs.find((u) => u.id === id) || null;
}

/**
 * Crée un nouveau compte utilisateur
 * @param {Object} userData
 * @param {string} [auteurId]
 * @returns {Promise<Object>}
 */
export async function createUtilisateur(userData, auteurId = "usr-01") {
  await delay(90);

  const nextIndex = utilisateurs.length + 1;
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

  utilisateurs = [...utilisateurs, newUser];
  return newUser;
}

/**
 * Active ou désactive un compte (jamais de suppression physique)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function toggleUtilisateurActif(id) {
  await delay(60);
  const index = utilisateurs.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("Utilisateur introuvable");

  utilisateurs[index] = {
    ...utilisateurs[index],
    actif: !utilisateurs[index].actif,
  };

  return utilisateurs[index];
}

