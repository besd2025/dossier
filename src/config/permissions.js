/**
 * Matrice des permissions et contrôle d'accès côté UI (BESD v2.1)
 * Référence : Section 2 de docs/BESD_structure_interfaces.md
 *
 * Rappel : ce contrôle filtre l'affichage (navigation, boutons, actions et sections).
 * Le véritable contrôle d'accès sera opéré côté serveur lors du branchement API.
 */

import { Role } from "@/types";
import { initialPrisesEnCharge, initialUtilisateurs } from "@/src/lib/mock/data";

export { Role };
export const BESD_ROLES = Role;

// ============================================================================
// 1. HYPOTHÈSES DU CAHIER DES CHARGES (SECTION 8)
// ============================================================================

/**
 * HYPOTHÈSE À TRANCHER (Section 8 et règle 4.5 du cahier des charges) :
 * L'adjoint d'un chef de cellule a la même lecture que son chef.
 * Isolé sur UNE SEULE LIGNE pour modification facile.
 */
export const ADJOINT_CELLULE_MEME_LECTURE_QUE_CHEF = true;

// ============================================================================
// 2. CONFIGURATION DES 8 COMPTES DE DÉMONSTRATION
// ============================================================================

export const DEMO_ACCOUNTS = Object.freeze([
  {
    role: Role.CHEF_BUREAU,
    user: initialUtilisateurs[0],
    label: "Chef de bureau",
    shortLabel: "Chef bur.",
    rank: "Colonel Alexandre Martin",
    cell: "Direction du BESD",
    description: "Visibilité complète, affectation, validation finale, signature",
  },
  {
    role: Role.CHEF_BUREAU_ADJOINT,
    user: initialUtilisateurs[1],
    label: "Adjoint chef de bureau",
    shortLabel: "Adj. bur.",
    rank: "Lieutenant-colonel Claire Dubois",
    cell: "Direction du BESD",
    description: "Lecture globale, actions conditionnées à une prise en charge active",
  },
  {
    role: Role.SECRETARIAT,
    user: initialUtilisateurs[2],
    label: "Secrétariat",
    shortLabel: "Secrétariat",
    rank: "Mme Sophie Bernard",
    cell: "Secrétariat central",
    description: "Enregistrement des dossiers, numérotation, cachet, transmission",
  },
  {
    role: Role.CHEF_CELLULE,
    user: initialUtilisateurs[3],
    label: "Chef de cellule (CASEAG)",
    shortLabel: "Chef cell.",
    rank: "Commandant Guillaume Petit",
    cell: "CASEAG",
    description: "Gestion et affectation des dossiers de la cellule, relecture intermédiaire",
  },
  {
    role: Role.CHEF_CELLULE_ADJOINT,
    user: initialUtilisateurs[4],
    label: "Adjoint chef de cellule",
    shortLabel: "Adj. cell.",
    rank: "Capitaine Éric Robert",
    cell: "CASEAG",
    description: "Même lecture que le chef de cellule, action sur prise en charge",
  },
  {
    role: Role.CONSEILLER,
    user: initialUtilisateurs[5],
    label: "Conseiller (Cellule 2)",
    shortLabel: "Conseiller",
    rank: "M. Thomas Richard",
    cell: "Cellule 2",
    description: "Traitement des dossiers assignés, rédaction et dépôt des versions Word",
  },
  {
    role: Role.CONSEILLER_HORS_CELLULE,
    user: initialUtilisateurs[6],
    label: "Conseiller hors-cellule",
    shortLabel: "Cons. hors cell.",
    rank: "Dr. Hélène Moreau",
    cell: "Pôle d'expertise autonome",
    description: "Expertise transverse sur dossiers assignés ou accès exceptionnel",
  },
  {
    role: Role.COMPTABLE,
    user: initialUtilisateurs[7],
    label: "Comptable",
    shortLabel: "Comptable",
    rank: "M. Jean-Paul Laurent",
    cell: "Service financier & comptabilité",
    description: "Traitement spécialisé sur les notes confiées, tableau de bord restreint",
  },
]);

/**
 * Dictionnaire indexé par Role
 */
export const BESD_ROLES_CONFIG = Object.freeze(
  DEMO_ACCOUNTS.reduce((acc, item) => {
    acc[item.role] = {
      id: item.role,
      label: item.label,
      shortLabel: item.shortLabel,
      cell: item.cell,
      defaultUser: {
        id: item.user.id,
        name: `${item.user.prenom} ${item.user.nom}`,
        email: item.user.email,
      },
    };
    return acc;
  }, {})
);

// ============================================================================
// 3. MATRICE D'ACCÈS AUX ROUTES PAR RÔLE (SECTION 2)
// ============================================================================

export const ROUTE_PERMISSIONS = Object.freeze({
  "/dashboard": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
    Role.CONSEILLER,
    Role.CONSEILLER_HORS_CELLULE,
    Role.COMPTABLE,
  ],
  "/dossiers": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
    Role.CONSEILLER,
    Role.CONSEILLER_HORS_CELLULE,
  ],
  "/dossiers/nouveau": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
  ],
  "/a-affecter": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ],
  "/mes-dossiers": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
    Role.CONSEILLER,
    Role.CONSEILLER_HORS_CELLULE,
    Role.COMPTABLE,
  ],
  "/relectures": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ],
  "/signatures": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
  ],
  "/secretariat/cachets": [
    Role.SECRETARIAT,
  ],
  "/retours-cabinet": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
  ],
  "/notifications": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
    Role.CONSEILLER,
    Role.CONSEILLER_HORS_CELLULE,
    Role.COMPTABLE,
  ],
  "/recherche": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
    Role.CONSEILLER,
    Role.CONSEILLER_HORS_CELLULE,
  ],
  "/administration/acces-exceptionnels": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
  ],
  "/administration/cellules": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ],
  "/administration/comptes": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ],
  "/administration/comptes/nouveau": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ],
  "/administration/prises-en-charge": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
  ],
  "/administration/provenances": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
  ],
  "/administration/journal": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
  ],
  "/administration/roles": [
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
  ],
  "/profil": [
    Role.SECRETARIAT,
    Role.CHEF_BUREAU,
    Role.CHEF_BUREAU_ADJOINT,
    Role.CHEF_CELLULE,
    Role.CHEF_CELLULE_ADJOINT,
    Role.CONSEILLER,
    Role.CONSEILLER_HORS_CELLULE,
    Role.COMPTABLE,
  ],
});

// ============================================================================
// 4. VÉRIFICATION D'ACCÈS AUX ROUTES
// ============================================================================

/**
 * Normalise un chemin URL pour la correspondance de permission
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePathname(pathname) {
  if (!pathname) return "/";
  // Enlever les paramètres d'URL éventuels
  const clean = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return clean;
}

/**
 * Vérifie si un rôle donné a accès à une route
 * @param {string} role - Rôle de l'utilisateur
 * @param {string} url - Chemin de la route demandée
 * @returns {boolean}
 */
export function canAccessRoute(role, url) {
  if (!role) return false;
  const path = normalizePathname(url);

  // Routes publiques (authentification et développement temporaire)
  if (path.startsWith("/auth") || path.startsWith("/dev")) return true;

  // Exact match
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path].includes(role);
  }

  // Cas des sous-routes dynamiques des dossiers
  // Validation d'une note : /dossiers/[id]/notes/[noteId]/validation
  if (path.includes("/validation")) {
    return [Role.CHEF_BUREAU, Role.CHEF_BUREAU_ADJOINT].includes(role);
  }

  // Fiche dossier et détail de note : /dossiers/[id] ou /dossiers/[id]/notes/[noteId]
  if (path.startsWith("/dossiers/")) {
    // Si c'est /dossiers/nouveau
    if (path === "/dossiers/nouveau") {
      return ROUTE_PERMISSIONS["/dossiers/nouveau"].includes(role);
    }
    // Toute consultation de dossier suit les droits d'accès à la liste /dossiers
    return ROUTE_PERMISSIONS["/dossiers"].includes(role);
  }

  // Sous-routes d'administration
  if (path.startsWith("/administration/")) {
    const parentRoute = Object.keys(ROUTE_PERMISSIONS).find(
      (r) => path.startsWith(r) && r !== "/administration"
    );
    if (parentRoute) {
      return ROUTE_PERMISSIONS[parentRoute].includes(role);
    }
  }

  // Par défaut, autorisé si la route n'est pas spécifiquement restreinte
  return true;
}

/**
 * Filtre les groupes et éléments de la barre latérale selon le rôle
 * @param {Array} groups - Groupes de navigation (sidebarItems)
 * @param {string} role - Rôle actif
 * @returns {Array}
 */
export function filterSidebarByRole(groups, role) {
  if (!groups || !role) return [];

  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.subItems) {
            const filteredSubItems = item.subItems.filter((sub) =>
              canAccessRoute(role, sub.url)
            );
            if (filteredSubItems.length === 0) return null;
            return {
              ...item,
              subItems: filteredSubItems,
            };
          }
          return canAccessRoute(role, item.url) ? item : null;
        })
        .filter(Boolean);

      if (filteredItems.length === 0) return null;

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter(Boolean);
}

// ============================================================================
// 5. MOTEUR DE CONTRÔLE D'ACCÈS AUX CAPACITÉS (can / evaluatePermission)
// ============================================================================

/**
 * Recherche une prise en charge active pour un dossier et un adjoint donnés
 * @param {string} dossierId
 * @param {string} [adjointId]
 * @param {Array} [prisesEnCharge]
 * @returns {Object|null}
 */
export function findActivePriseEnCharge(dossierId, adjointId, prisesEnCharge = initialPrisesEnCharge) {
  if (!dossierId) return null;
  return (
    prisesEnCharge.find(
      (p) =>
        p.dossierId === dossierId &&
        p.active &&
        (!adjointId || p.adjointId === adjointId)
    ) || null
  );
}

/**
 * Évalue une capacité avec résultat détaillé (allowed + raison)
 *
 * @param {string} role - Rôle simulé de l'utilisateur
 * @param {string} ability - Nom de la capacité
 * @param {Object} [context] - Contexte optionnel (dossier, note, prisesEnCharge, user)
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function evaluatePermission(role, ability, context = {}) {
  if (!role) {
    return { allowed: false, reason: "Utilisateur non connecté" };
  }

  const { dossier, dossierId: rawDossierId, prisesEnCharge = initialPrisesEnCharge, user } = context;
  const targetDossierId = dossier?.id || rawDossierId;

  const normalizedAbility = (ability || "").toLowerCase().trim();

  // --------------------------------------------------------------------------
  // A. Voir un menu / Voir une route
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "voir_menu" ||
    normalizedAbility === "view_menu" ||
    normalizedAbility === "viewmenu" ||
    normalizedAbility === "voir_route"
  ) {
    const routeUrl = context.url || context.pathname || context.route || context.menuKey;
    const allowed = canAccessRoute(role, routeUrl);
    return {
      allowed,
      reason: allowed ? undefined : "Ce menu n'est pas accessible avec votre profil.",
    };
  }

  // --------------------------------------------------------------------------
  // B. Voir un dossier (Liste ou Fiche)
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "voir_dossier" ||
    normalizedAbility === "view_dossier" ||
    normalizedAbility === "viewdossier"
  ) {
    if (role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT) {
      return { allowed: true };
    }
    if (role === Role.SECRETARIAT) {
      return { allowed: true };
    }
    if (role === Role.CHEF_CELLULE) {
      if (!dossier) return { allowed: true };
      const cell = user?.cellule || "CASEAG";
      const isInCell =
        dossier.cellulePrincipale === cell ||
        dossier.cellules?.includes(cell) ||
        dossier.celluleId === "cel-01";
      return {
        allowed: isInCell,
        reason: isInCell ? undefined : "Dossier en dehors du périmètre de votre cellule.",
      };
    }
    if (role === Role.CHEF_CELLULE_ADJOINT) {
      if (ADJOINT_CELLULE_MEME_LECTURE_QUE_CHEF) {
        if (!dossier) return { allowed: true };
        const cell = user?.cellule || "CASEAG";
        const isInCell =
          dossier.cellulePrincipale === cell ||
          dossier.cellules?.includes(cell) ||
          dossier.celluleId === "cel-01";
        return {
          allowed: isInCell,
          reason: isInCell ? undefined : "Dossier en dehors du périmètre de votre cellule.",
        };
      }
      return { allowed: false, reason: "Accès restreint pour l'adjoint de cellule." };
    }
    if (role === Role.CONSEILLER || role === Role.CONSEILLER_HORS_CELLULE) {
      if (!dossier) return { allowed: true };
      const userId = user?.id || "usr-06";
      const isAssigned =
        dossier.responsableId === userId ||
        dossier.affectations?.some((a) => a.destinataireId === userId);
      return {
        allowed: isAssigned,
        reason: isAssigned ? undefined : "Ce dossier ne vous est pas assigné.",
      };
    }
    if (role === Role.COMPTABLE) {
      if (!dossier) return { allowed: false, reason: "Accès restreint au personnel habilité." };
      return { allowed: false, reason: "Aucune note financière confiée sur ce dossier." };
    }
    return { allowed: false, reason: "Accès non autorisé." };
  }

  // --------------------------------------------------------------------------
  // C. Affecter un dossier
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "affecter" ||
    normalizedAbility === "affecter_dossier" ||
    normalizedAbility === "canassign"
  ) {
    if (role === Role.CHEF_BUREAU) {
      return { allowed: true };
    }
    if (role === Role.CHEF_BUREAU_ADJOINT) {
      if (!targetDossierId) {
        return { allowed: true };
      }
      const pec = findActivePriseEnCharge(targetDossierId, user?.id, prisesEnCharge);
      if (pec && pec.portee?.affecter !== false) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Prise en charge requise",
      };
    }
    if (role === Role.CHEF_CELLULE) {
      return { allowed: true };
    }
    if (role === Role.CHEF_CELLULE_ADJOINT) {
      if (!targetDossierId) {
        return { allowed: false, reason: "Prise en charge requise" };
      }
      const pec = findActivePriseEnCharge(targetDossierId, user?.id, prisesEnCharge);
      if (pec && pec.portee?.affecter !== false) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Prise en charge requise",
      };
    }
    return {
      allowed: false,
      reason: "Affectation réservée au Chef de bureau et aux chefs de cellule.",
    };
  }

  // --------------------------------------------------------------------------
  // D. Valider une note
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "valider" ||
    normalizedAbility === "valider_note" ||
    normalizedAbility === "canvalidate"
  ) {
    if (role === Role.CHEF_BUREAU) {
      return { allowed: true };
    }
    if (role === Role.CHEF_BUREAU_ADJOINT) {
      if (!targetDossierId) {
        return { allowed: false, reason: "Prise en charge requise" };
      }
      const pec = findActivePriseEnCharge(targetDossierId, user?.id, prisesEnCharge);
      if (pec && pec.portee?.valider !== false) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Prise en charge requise",
      };
    }
    return {
      allowed: false,
      reason: "La validation finale est réservée au Chef de bureau.",
    };
  }

  // --------------------------------------------------------------------------
  // E. Imprimer une note
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "imprimer" ||
    normalizedAbility === "imprimer_note" ||
    normalizedAbility === "canprint"
  ) {
    if (role === Role.CHEF_BUREAU || role === Role.SECRETARIAT) {
      return { allowed: true };
    }
    if (role === Role.CHEF_BUREAU_ADJOINT) {
      if (!targetDossierId) return { allowed: true };
      const pec = findActivePriseEnCharge(targetDossierId, user?.id, prisesEnCharge);
      if (pec && pec.portee?.imprimer !== false) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Prise en charge requise",
      };
    }
    return {
      allowed: false,
      reason: "Impression réservée au Chef de bureau et au Secrétariat.",
    };
  }

  // --------------------------------------------------------------------------
  // F. Signer une note
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "signer" ||
    normalizedAbility === "signer_note" ||
    normalizedAbility === "cansign"
  ) {
    if (role === Role.CHEF_BUREAU) {
      return { allowed: true };
    }
    if (role === Role.CHEF_BUREAU_ADJOINT) {
      if (!targetDossierId) {
        return { allowed: false, reason: "Prise en charge requise" };
      }
      const pec = findActivePriseEnCharge(targetDossierId, user?.id, prisesEnCharge);
      if (pec && pec.portee?.signature === true) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Prise en charge requise",
      };
    }
    return {
      allowed: false,
      reason: "La signature est réservée à l'autorité signataire.",
    };
  }

  // --------------------------------------------------------------------------
  // G. Cachet & Numérotation officielle
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "cacheter" ||
    normalizedAbility === "enregistrer_cachet" ||
    normalizedAbility === "canstamp"
  ) {
    if (role === Role.SECRETARIAT) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "L'enregistrement du cachet est réservé au Secrétariat.",
    };
  }

  // --------------------------------------------------------------------------
  // H. Transmettre au Cabinet
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "transmettre" ||
    normalizedAbility === "transmettre_note" ||
    normalizedAbility === "cantransmit"
  ) {
    if (role === Role.SECRETARIAT) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "La transmission physique au cabinet est réservée au Secrétariat.",
    };
  }

  // --------------------------------------------------------------------------
  // I. Enregistrer un retour du Cabinet
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "enregistrer_retour" ||
    normalizedAbility === "retour_cabinet"
  ) {
    if (role === Role.SECRETARIAT) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "L'enregistrement des retours est réservé au Secrétariat.",
    };
  }

  // --------------------------------------------------------------------------
  // J. Créer un compte utilisateur
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "creer_compte" ||
    normalizedAbility === "creercompte" ||
    normalizedAbility === "cancreateaccount"
  ) {
    if (
      role === Role.CHEF_BUREAU ||
      role === Role.CHEF_BUREAU_ADJOINT ||
      role === Role.CHEF_CELLULE ||
      role === Role.CHEF_CELLULE_ADJOINT
    ) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "La création de compte est réservée aux responsables habilités.",
    };
  }

  // --------------------------------------------------------------------------
  // K. Accorder un accès exceptionnel
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "accorder_acces" ||
    normalizedAbility === "accorderacces" ||
    normalizedAbility === "cangrantaccess"
  ) {
    if (role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "L'octroi d'accès exceptionnel est réservé à la direction du bureau.",
    };
  }

  // --------------------------------------------------------------------------
  // L. Gérer les prises en charge (adjoints)
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "gerer_prises_en_charge" ||
    normalizedAbility === "gererprisesencharge"
  ) {
    if (
      role === Role.CHEF_BUREAU ||
      role === Role.CHEF_BUREAU_ADJOINT ||
      role === Role.CHEF_CELLULE ||
      role === Role.CHEF_CELLULE_ADJOINT
    ) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "La gestion des prises en charge est réservée aux chefs et adjoints.",
    };
  }

  // --------------------------------------------------------------------------
  // M. Réouvrir une note signée
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "reouvrir" ||
    normalizedAbility === "reouvrir_note" ||
    normalizedAbility === "canreopen"
  ) {
    if (role === Role.CHEF_BUREAU || role === Role.CHEF_BUREAU_ADJOINT) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "La réouverture après signature est réservée au Chef de bureau.",
    };
  }

  // --------------------------------------------------------------------------
  // N. Créer / Enregistrer un nouveau dossier
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "creer_dossier" ||
    normalizedAbility === "nouveau_dossier"
  ) {
    if (role === Role.SECRETARIAT || role === Role.CHEF_BUREAU) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "L'enregistrement d'un dossier est réservé au Secrétariat et au Chef de bureau.",
    };
  }

  // --------------------------------------------------------------------------
  // P. Clore un dossier
  // --------------------------------------------------------------------------
  if (
    normalizedAbility === "clore" ||
    normalizedAbility === "clore_dossier" ||
    normalizedAbility === "close_dossier"
  ) {
    if (role === Role.CHEF_BUREAU) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "La clôture d'un dossier est réservée au Chef de bureau.",
    };
  }

  // --------------------------------------------------------------------------
  // Q. Relecture de note
  // --------------------------------------------------------------------------
  if (normalizedAbility === "relire" || normalizedAbility === "relire_note") {
    if (
      role === Role.CHEF_BUREAU ||
      role === Role.CHEF_BUREAU_ADJOINT ||
      role === Role.CHEF_CELLULE ||
      role === Role.CHEF_CELLULE_ADJOINT
    ) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Relecture réservée aux responsables de cellule et de bureau.",
    };
  }

  // Par défaut, refus avec message générique
  return { allowed: false, reason: "Action non autorisée pour ce profil." };
}

/**
 * Fonction principale utilitaire de vérification de permission
 *
 * @param {string} role - Rôle BESD
 * @param {string} ability - Nom de la capacité (ex: 'signer', 'valider', 'affecter')
 * @param {Object} [context] - Contexte (dossier, note, url, user)
 * @returns {boolean}
 */
export function can(role, ability, context = {}) {
  const result = evaluatePermission(role, ability, context);
  return Boolean(result.allowed);
}
