/**
 * Types et énumérations du domaine BESD (v2.1)
 * JavaScript pur — Enums via Object.freeze, formes via JSDoc @typedef
 * Référence : Sections 5 et 6 de docs/BESD_structure_interfaces.md
 */

// ============================================================================
// ÉNUMÉRATIONS (Object.freeze)
// ============================================================================

/**
 * 8 Rôles fixes du BESD
 */
export const Role = Object.freeze({
  SECRETARIAT: "SECRETARIAT",
  CHEF_BUREAU: "CHEF_BUREAU",
  CHEF_BUREAU_ADJOINT: "CHEF_BUREAU_ADJOINT",
  CHEF_CELLULE: "CHEF_CELLULE",
  CHEF_CELLULE_ADJOINT: "CHEF_CELLULE_ADJOINT",
  CONSEILLER: "CONSEILLER",
  CONSEILLER_HORS_CELLULE: "CONSEILLER_HORS_CELLULE",
  COMPTABLE: "COMPTABLE",
});

/**
 * Statuts des dossiers (cycle de vie global)
 */
export const StatutDossier = Object.freeze({
  RECU: "RECU",
  EN_TRAITEMENT: "EN_TRAITEMENT",
  EN_ATTENTE_AUTRE_BUREAU: "EN_ATTENTE_AUTRE_BUREAU",
  TRANSMIS: "TRANSMIS",
  ACTIF_APRES_RETOUR: "ACTIF_APRES_RETOUR",
  CLOTURE: "CLOTURE",
});

/**
 * Statuts des notes (cycle de relecture, validation, signature et cachet)
 */
export const StatutNote = Object.freeze({
  BROUILLON: "BROUILLON",
  RELECTURE_CELLULE: "RELECTURE_CELLULE",
  RELECTURE_BUREAU: "RELECTURE_BUREAU",
  VALIDEE: "VALIDEE",
  EN_ATTENTE_IMPRESSION: "EN_ATTENTE_IMPRESSION",
  IMPRIMEE: "IMPRIMEE",
  SIGNEE: "SIGNEE",
  TRANSMISE: "TRANSMISE",
  ROUVERTE: "ROUVERTE",
});

/**
 * Types de documents produits dans le cadre d'un dossier
 */
export const TypeDocument = Object.freeze({
  NOTE_CABINET_CIVIL: "NOTE_CABINET_CIVIL",
  NOTE_PRESIDENT: "NOTE_PRESIDENT",
  PROJET_LETTRE: "PROJET_LETTRE",
});

/**
 * Instructions données par le cabinet ministériel
 */
export const InstructionCabinet = Object.freeze({
  POUR_ANALYSE: "POUR_ANALYSE",
  POUR_ACTION: "POUR_ACTION",
  POUR_TRAITEMENT: "POUR_TRAITEMENT",
  POUR_CLASSEMENT: "POUR_CLASSEMENT",
  POUR_INFO: "POUR_INFO",
  POUR_SUIVI: "POUR_SUIVI",
  AUTRE: "AUTRE",
});

/**
 * Canal d'arrivée / origine du dossier
 */
export const OrigineDossier = Object.freeze({
  VIA_CABINET_CIVIL: "VIA_CABINET_CIVIL",
  DIRECT_CHEF_BUREAU: "DIRECT_CHEF_BUREAU",
  RETOUR_CABINET_SANS_DOSSIER: "RETOUR_CABINET_SANS_DOSSIER",
});

/**
 * Destinataires possibles d'une note
 */
export const DestinataireNote = Object.freeze({
  CHEF_CABINET_CIVIL: "Chef de cabinet civil",
  PRESIDENT: "Président",
  COPIE_PRESIDENT: "Copie pour information au Président",
});

/**
 * Catégories de provenances
 */
export const CategorieProvenance = Object.freeze({
  MINISTERE: "MINISTERE",
  INSTITUTION: "INSTITUTION",
  INDIVIDUEL: "INDIVIDUEL",
  AUTRE: "AUTRE",
});

/**
 * Types de mouvements dans le journal de traçabilité
 */
export const TypeMouvement = Object.freeze({
  RECEPTION: "RECEPTION",
  AFFECTATION: "AFFECTATION",
  DEPOT_VERSION: "DEPOT_VERSION",
  OBSERVATION: "OBSERVATION",
  VALIDATION: "VALIDATION",
  IMPRESSION: "IMPRESSION",
  SIGNATURE: "SIGNATURE",
  CACHET: "CACHET",
  TRANSMISSION: "TRANSMISSION",
  RETOUR: "RETOUR",
  REOUVERTURE: "REOUVERTURE",
  ACCES_ACCORDE: "ACCES_ACCORDE",
  CONSULTATION_ADJOINT: "CONSULTATION_ADJOINT",
  CREATION_COMPTE: "CREATION_COMPTE",
});

// ============================================================================
// DÉFINITIONS JSDoc DES 16 ENTITÉS MÉTIER
// ============================================================================

/**
 * @typedef {Object} Utilisateur
 * @property {string} id - Identifiant technique unique
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string} email - Courriel professionnel @defense.gouv
 * @property {string} role - Valeur issue de Role
 * @property {string} [cellule] - Nom ou code de la cellule (facultatif : absent pour Chef de bureau, Comptable, Conseiller hors cellule)
 * @property {string} [celluleId] - Identifiant de la cellule de rattachement (facultatif)
 * @property {string} creePar - Identifiant ou nom de l'autorité créatrice
 * @property {boolean} actif - Indique si le compte est actif (jamais de suppression physique)
 * @property {string} dateCreation - Date de création au format ISO
 */

/**
 * @typedef {Object} Cellule
 * @property {string} id - Identifiant technique
 * @property {string} nom - Nom complet de la cellule (ex. "Cellule CASEAG")
 * @property {string} code - Code court (ex. "CASEAG", "CELLULE_2", "CELLULE_3")
 * @property {string} chefId - Identifiant de l'utilisateur Chef de cellule
 * @property {string} [chefAdjointId] - Identifiant de l'adjoint de cellule (facultatif)
 * @property {string} [conseillerAttitreId] - Identifiant d'un conseiller attitré (facultatif)
 * @property {boolean} delegationCorrection - Délégation de correction au nom du Chef de bureau (badge spécifique pour CASEAG)
 * @property {string} description - Description des missions
 */

/**
 * @typedef {Object} Provenance
 * @property {string} id - Identifiant technique
 * @property {string} nom - Nom de l'organisme ou autorité (ex. "EMA / CPCO", "Cabinet du Ministre")
 * @property {string} categorie - Catégorie issue de CategorieProvenance
 * @property {boolean} actif - Si la provenance est utilisable pour de nouveaux dossiers
 */

/**
 * @typedef {Object} Dossier
 * @property {string} id - Identifiant technique distinct (ex. "dos-001")
 * @property {string} reference - Référence officielle métier distincte (ex. "2026-D-0142")
 * @property {string} objet - Intitulé / objet complet du dossier
 * @property {string} provenanceId - Identifiant de la provenance
 * @property {string} provenanceNom - Nom dénormalisé de la provenance
 * @property {string} instructionCabinet - Valeur issue de InstructionCabinet
 * @property {string} origine - Valeur issue de OrigineDossier
 * @property {string} dateTransmissionOrigine - Date de transmission par l'institution (jj/MM/aaaa ou ISO)
 * @property {string} dateReceptionCabinet - Date de réception par le cabinet
 * @property {string} dateReceptionBesd - Date de réception effective au BESD
 * @property {string} statutDossier - Valeur issue de StatutDossier
 * @property {boolean} multiBureaux - Indique si le dossier est affecté à plusieurs bureaux
 * @property {string} [bureauPrecedent] - Nom du bureau précédent si multi-bureaux
 * @property {number} [rangBesd] - Rang du BESD dans la chaîne multi-bureaux
 * @property {string} [dateMiseEnAttente] - Date de mise en attente pour un autre bureau
 * @property {number} joursSansAvancement - Nombre de jours sans mouvement (alerte si > 7)
 * @property {boolean} enRetard - Vrai si joursSansAvancement > 7 (hors temps chez un autre bureau)
 * @property {string} [premierePagePdfUrl] - URL fictive de la première page numérisée
 * @property {string} [dateCloture] - Date de clôture du dossier (facultatif)
 * @property {string[]} [motsCles] - Mots-clés associés au dossier
 */

/**
 * @typedef {Object} CycleTraitement
 * @property {string} id - Identifiant technique du cycle
 * @property {string} dossierId - Référence au dossier
 * @property {number} numeroCycle - 1 pour le cycle initial, 2+ pour les retours cabinet
 * @property {string} typeSuite - "INITIAL", "PROJET_LETTRE", "DESCENTE", "AUTRE"
 * @property {string} dateOuverture - Date d'ouverture du cycle
 * @property {string} [dateCloture] - Date de clôture du cycle
 * @property {string[]} bureauxCollaboration - Liste des bureaux associés en collaboration
 */

/**
 * @typedef {Object} DossierCellule
 * @property {string} id - Identifiant technique
 * @property {string} dossierId - Référence au dossier
 * @property {string} celluleId - Référence à la cellule
 * @property {string} type - "PRINCIPALE" ou "COLLABORATRICE"
 */

/**
 * @typedef {Object} Affectation
 * @property {string} id - Identifiant technique
 * @property {string} dossierId - Référence au dossier
 * @property {string} date - Date et heure de l'affectation
 * @property {string} auteurId - Utilisateur ayant réalisé l'affectation
 * @property {string} [destinataireId] - Utilisateur ou cellule destinataire
 * @property {string} [celluleId] - Cellule affectée
 * @property {string} type - "BUREAU_VERS_CELLULE" | "CELLULE_VERS_CONSEILLER" | "AUTO_TRAITEMENT" | "HORS_CELLULE"
 * @property {string} [conseillerPrefereId] - Conseiller suggéré par le Chef de bureau
 * @property {boolean} confierAdjoint - Prise en charge déléguée à l'adjoint
 * @property {string} [adjointId] - Adjoint désigné si confierAdjoint est vrai
 */

/**
 * @typedef {Object} RetourCabinet
 * @property {string} id - Identifiant technique
 * @property {string} dossierId - Référence au dossier concerné
 * @property {string} noteOrigineId - Référence à la note ayant suscité le retour
 * @property {string} date - Date d'enregistrement du retour
 * @property {string} typeSuite - "PROJET_LETTRE" | "DESCENTE" | "AUTRE"
 * @property {string} commentaire - Annotations / instructions du ministre ou du cabinet
 * @property {string[]} bureauxCollaboration - Bureaux associés
 * @property {string} nouveauCycleId - Cycle de traitement initié par ce retour
 */

/**
 * @typedef {Object} Note
 * @property {string} id - Identifiant technique
 * @property {string} dossierId - Référence au dossier
 * @property {string} cycleId - Référence au cycle de traitement
 * @property {string} typeDocument - "NOTE_CABINET_CIVIL" | "NOTE_PRESIDENT" | "PROJET_LETTRE" (distinct de destinataire)
 * @property {string} destinataire - Nom de l'autorité destinataire (distinct de typeDocument)
 * @property {string|null} numeroOfficiel - Format NNNN/AAAA, STRICTEMENT NUL tant que le cachet n'est pas enregistré
 * @property {string} statutNote - Valeur issue de StatutNote
 * @property {string} redacteurId - Identifiant du conseiller / rédacteur
 * @property {string[]} conseillersAssignesIds - Liste des conseillers assignés à l'instruction
 * @property {string} dateCreation - Date de création de la note
 * @property {string} [dateValidation] - Date de validation par le Chef de bureau
 * @property {string} [valideParId] - Identifiant de l'autorité ayant validé
 * @property {string} [dateImpression] - Date d'impression papier
 * @property {string} [dateSignature] - Date de signature effective
 * @property {string} [signeParId] - Autorité ayant signé (Chef de bureau ou adjoint avec prise en charge)
 * @property {boolean} signeParAdjoint - Vrai si signée par l'adjoint en vertu d'une prise en charge
 * @property {string} [dateCachet] - Date d'enregistrement du cachet officiel
 * @property {string} [dateTransmission] - Date de transmission finale au destinataire
 * @property {boolean} estRouverte - Vrai si la note a été rouverte après signature
 * @property {string[]} motsCles - Mots-clés obligatoires saisis avant dépôt
 */

/**
 * @typedef {Object} NoteVersion
 * @property {string} id - Identifiant technique
 * @property {string} noteId - Référence à la note
 * @property {number} numeroVersion - Numéro de version séquentiel (1, 2, 3...)
 * @property {string} auteurId - Auteur du dépôt du document Word
 * @property {string} dateDepot - Date et heure de téléversement
 * @property {string} nomFichier - Nom du fichier .docx
 * @property {string} tailleFichier - Taille lisible (ex. "450 Ko")
 * @property {string} fichierUrl - URL mockée de téléchargement
 * @property {string} [commentaire] - Commentaires sur les modifications apportées
 * @property {boolean} estDerniereVersion - Indique si c'est la version de travail active
 */

/**
 * @typedef {Object} ReouvertureNote
 * @property {string} id - Identifiant technique
 * @property {string} noteId - Référence à la note rouverte
 * @property {string} dateReouverture - Date et heure de réouverture
 * @property {string} auteurId - Utilisateur ayant déclenché la réouverture
 * @property {string} motif - Motif obligatoire de la réouverture après signature
 * @property {string} autorisePar - Autorité supérieure ayant formellement autorisé
 * @property {string} versionSigneeOrigineId - Référence à la version signée d'origine (préservée)
 */

/**
 * @typedef {Object} Observation
 * @property {string} id - Identifiant technique
 * @property {string} noteId - Référence à la note
 * @property {string} auteurId - Identifiant de l'auteur de l'observation
 * @property {string} date - Date et heure
 * @property {string} contenu - Texte de la remarque / correction demandée
 * @property {boolean} resolue - Si la remarque a été prise en compte
 * @property {string} [dateResolution] - Date de prise en compte
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Identifiant technique
 * @property {string} destinataireId - Utilisateur destinataire
 * @property {string} message - Message clair en français
 * @property {string} [dossierId] - Dossier lié (facultatif, ex. vide pour création de compte)
 * @property {string} date - Date et heure
 * @property {string} canal - "COURRIEL" | "APPLICATION" | "TOUS"
 * @property {boolean} lue - Statut de lecture
 * @property {string} type - "RECEPTION" | "AFFECTATION" | "VERSION" | "VALIDATION" | "IMPRESSION" | "SIGNATURE" | "TRANSMISSION" | "RETOUR" | "CREATION_COMPTE"
 */

/**
 * @typedef {Object} AccesExceptionnel
 * @property {string} id - Identifiant technique
 * @property {string} dossierId - Référence au dossier
 * @property {string} beneficiaireId - Utilisateur bénéficiaire de l'accès
 * @property {string} accordeParId - Autorité ayant accordé l'accès
 * @property {string} date - Date d'octroi
 * @property {string} [echeance] - Date limite de validité (facultatif)
 * @property {string} motif - Justification du besoin d'en connaître
 * @property {string} type - "EXCEPTIONNEL" (temporaire) ou "COMPLEMENTAIRE" (conseiller autonome / comptable)
 */

/**
 * @typedef {Object} AutorisationAdjoint
 * @property {string} id - Identifiant technique
 * @property {string} dossierId - Référence au dossier
 * @property {string} titulaireId - Titulaire empêché (ex. Chef de bureau)
 * @property {string} adjointId - Adjoint habilité à agir
 * @property {string} dateHeure - Date et heure de prise en charge
 * @property {string} auteurId - Autorité ayant validé la prise en charge
 * @property {boolean} active - Indique si la prise en charge est active
 * @property {{ signature: boolean, affecter: boolean, valider: boolean, imprimer: boolean }} portee - Périmètre des actions déléguées
 */

/**
 * @typedef {Object} MouvementDossier
 * @property {string} id - Identifiant technique
 * @property {string} [dossierId] - Dossier concerné (FACULTATIF, ex. création de compte sans dossier)
 * @property {string} date - Date et heure précise du mouvement
 * @property {string} auteurId - Auteur de l'action
 * @property {string} typeMouvement - Valeur issue de TypeMouvement
 * @property {string} [compteConcerneId] - Utilisateur concerné par l'action (facultatif)
 * @property {string} description - Description détaillée et horodatée de l'opération
 */

