# BESD — Structure des interfaces (frontend uniquement)

> Document destiné à l'agent IDE (Antigravity). Il décrit **quoi construire** dans le projet `besd-app`, en **s'inspirant et en portant du code** du template `next-shadcn-admin-dashboard` (dossier `../template`, **lecture seule, jamais modifié**), à partir des spécifications techniques BESD v2.1.
> **Le projet est en JavaScript (pas de TypeScript), avec le App Router.** Le code repris du template doit être converti de TypeScript en JavaScript.
> Périmètre : **interfaces uniquement**. Aucun backend, aucune API réelle. Toutes les données sont **simulées (mock)** derrière une couche d'accès isolée, pour pouvoir brancher l'API Django plus tard sans toucher aux écrans.

---

## 0. Consignes générales pour l'agent

1. **Langue de l'interface : français** (libellés, messages, dates `jj/MM/aaaa`, heures 24 h). Code et noms de fichiers en anglais.
2. **Stack à respecter** : Next.js (App Router), **JavaScript (.js / .jsx), sans TypeScript**, Tailwind CSS v4, shadcn/ui (version JSX), React Hook Form + Zod, TanStack Table, Zustand. Ne pas introduire d'autre bibliothèque UI.
3. **Architecture par colocation** (celle du template) : chaque fonctionnalité garde ses pages, composants et logique dans son dossier de route ; les éléments partagés vont dans `src/components`, `src/hooks`, `src/lib`, `src/config`. Avant de porter un élément, **inspecter le template** (`../template/src`) et en reprendre les conventions.
4. **Pas de backend** : créer `src/lib/mock/` (données de démonstration) et `src/lib/services/` (fonctions `async` qui renvoient les mocks). Les écrans n'appellent que `services/*`. Plus tard, seul ce dossier change.
5. **Rôle simulé** : un store Zustand `useSessionStore` (utilisateur courant + rôle) et un **sélecteur de rôle de démonstration** dans l'en-tête (visible seulement en mode dev) pour tester chaque profil sans authentification réelle.
6. **Contrôle d'accès côté UI** : navigation, boutons et sections filtrés par rôle via une configuration centralisée (`src/config/permissions.ts`). Rappel : le vrai contrôle sera fait côté serveur ; l'UI ne fait que refléter les droits.
7. **Simplicité (exigence 7.1 du cahier)** : peu de champs par étape, interface aérée, couleurs et icônes cohérentes par statut.
8. Chaque écran gère les 4 états : **chargement (skeleton)**, **vide**, **erreur**, **données**.
9. Responsive obligatoire ; thème clair/sombre conservé (déjà fourni par le template). Définir un preset de thème « BESD » sobre et institutionnel.

---

## 1. Analyse du template : porter, adapter, ignorer

> Le template n'est **pas nettoyé** : il reste intact dans `../template`. Les colonnes ci-dessous se lisent ainsi : « Réutiliser / Adapter » = **porter dans `besd-app` en JavaScript** ; « Supprimer / Mettre de côté » = **ne pas porter**.

Éléments connus du template (README) : tableaux de bord multiples, Users Management, Roles Management, Tasks, Kanban, File Manager, Email, Calendar, Invoice, Profile, 4 écrans d'authentification, sidebar repliable, presets de thème, TanStack Table.

| Élément du template | Décision | Usage dans BESD |
|---|---|---|
| Layout principal (sidebar + en-tête + contenu) | **Réutiliser** | Coque de l'application ; sidebar pilotée par rôle |
| Dashboard « Default » | **Adapter** | Base du *Tableau de bord* (cartes KPI, graphiques, liste) |
| Dashboard « Productivity » / Tasks | **Adapter** | Base du *Tableau de bord Conseiller* et de « Mes dossiers à traiter » |
| Dashboard « CRM » | **Inspiration** | Répartition par statut, tableaux de suivi |
| Dashboard « Finance » | **Mettre de côté** | Futur module financier (hors périmètre v2.1) |
| Composant Data Table (TanStack) des Users | **Réutiliser** | Base de **toutes** les listes (dossiers, notes, comptes, journal) |
| Users Management | **Adapter** | Gestion des comptes (4.6) |
| Roles Management | **Adapter en lecture seule** | Rôles fixes dans le code (7.5) : afficher la matrice des droits, sans édition |
| Kanban | **Adapter (optionnel, phase 2)** | Vue « par statut » des dossiers |
| File Manager | **Inspiration** | Liste des versions Word et pièces jointes |
| Email page | **Inspiration** | Centre de notifications (liste + détail) |
| Invoice page | **Inspiration** | Aperçu document / PDF avant impression |
| Profile | **Adapter** | Profil utilisateur |
| Authentification (4 écrans) | **Garder 1 écran** | Connexion uniquement (comptes créés en interne) ; supprimer inscription publique |
| Calendar | **Supprimer** (ou reporter) | Hors périmètre |
| Chat, E-commerce, Academy, Logistics, Infrastructure, Patient Monitoring, variantes « Legacy » | **Supprimer** | Non pertinents ; retirer routes, menus et données de démo |
| Barre de contrôle de thème / layout | **Garder** | Préférences utilisateur |

**Première tâche de l'agent** : porter dans `besd-app`, en JavaScript, uniquement le layout, la sidebar, le mécanisme de thème (presets) et la data-table, puis nommer le projet « BESD » et appliquer le preset de thème. Aucun écran de démo n'est repris.

---

## 2. Rôles et visibilité de la navigation

Rôles (fixes) : `SECRETARIAT`, `CHEF_BUREAU`, `CHEF_BUREAU_ADJOINT`, `CHEF_CELLULE`, `CHEF_CELLULE_ADJOINT`, `CONSEILLER`, `CONSEILLER_HORS_CELLULE`, `COMPTABLE`.

| Entrée de menu | Secr. | Chef bur. | Adj. bur. | Chef cell. | Adj. cell. | Conseiller | Cons. hors cell. | Comptable |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Tableau de bord | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (limité) |
| Dossiers (liste) | ✔ (enregistrement) | ✔ tous | ✔ tous (lecture) | ✔ sa cellule | ✔ sa cellule* | ✔ assignés | ✔ assignés | — |
| Nouveau dossier | ✔ | ✔ (origine directe) | — | — | — | — | — | — |
| À affecter | — | ✔ | ✔ | ✔ | ✔* | — | — | — |
| Mes dossiers à traiter | — | ✔ | ✔* | ✔ | ✔* | ✔ | ✔ | ✔ (si note confiée) |
| Notes à relire / valider | — | ✔ | ✔* | ✔ | ✔* | — | — | — |
| Circuit de signature | — | ✔ | ✔* | — | — | — | — | — |
| Secrétariat : cachet / transmission | ✔ | — | — | — | — | — | — | — |
| Retours du cabinet | ✔ | ✔ | ✔ | ✔ | — | — | — | — |
| Notifications | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Recherche | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Accès exceptionnels | — | ✔ | lecture | — | — | — | — | — |
| Prises en charge (adjoints) | — | ✔ | ✔ (les siennes) | ✔ | ✔ (les siennes) | — | — | — |
| Comptes utilisateurs | — | ✔ | ✔ | ✔ | ✔ | — | — | — |
| Cellules | — | ✔ | ✔ | lecture | lecture | — | — | — |
| Provenances | ✔ | ✔ | ✔ | — | — | — | — | — |
| Journal de traçabilité | — | ✔ | ✔ | — | — | — | — | — |
| Rôles et droits (lecture seule) | — | ✔ | ✔ | — | — | — | — | — |
| Profil | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

\* L'adjoint **voit** mais n'**agit** que si une prise en charge existe pour le dossier (règle 4.5). L'UI doit afficher les boutons d'action **désactivés avec infobulle** « Prise en charge requise » plutôt que de les masquer, pour que la règle soit lisible. Hypothèse pour l'adjoint de cellule : même lecture que son chef (point encore à trancher, section 11 du cahier) — à isoler dans `permissions.ts` pour changement facile.

---

## 3. Arborescence des routes

```
/auth/login                                  Connexion

/dashboard                                   Tableau de bord (contenu selon rôle)

/dossiers                                    Liste des dossiers
/dossiers/nouveau                            Enregistrement d'un dossier (secrétariat)
/dossiers/[id]                               Fiche dossier (onglets)
/dossiers/[id]/notes/[noteId]                Détail d'une note (versions, observations)
/dossiers/[id]/notes/[noteId]/validation     Écran de validation (Chef de bureau)

/a-affecter                                  Dossiers en attente d'affectation
/mes-dossiers                                Mes dossiers à traiter
/relectures                                  Notes à relire / valider
/signatures                                  Circuit impression → signature
/secretariat/cachets                         Notes signées en attente de cachet / transmission
/retours-cabinet                             Liste + enregistrement des retours
/notifications                               Centre de notifications
/recherche                                   Recherche intelligente

/administration/comptes                      Liste des comptes
/administration/comptes/nouveau              Création d'un compte
/administration/cellules                     Cellules
/administration/provenances                  Provenances
/administration/acces-exceptionnels          Accès exceptionnels / complémentaires
/administration/prises-en-charge             Prises en charge des adjoints
/administration/journal                      Journal de traçabilité
/administration/roles                        Matrice des rôles (lecture seule)

/profil                                      Profil utilisateur
```

---

## 4. Spécification des écrans

### 4.1 Connexion — `/auth/login`
- **Base** : écran d'authentification du template (garder une seule variante).
- Champs : email, mot de passe, « se souvenir de moi ». Pas d'inscription, pas de réseaux sociaux. Lien « Mot de passe oublié » (écran factice).
- Texte d'en-tête : « Application de gestion des dossiers du BESD ».

### 4.2 Tableau de bord — `/dashboard`
- **Base** : Dashboard Default (+ Productivity pour la version conseiller). Même logique, **données filtrées selon le rôle** (4.9).
- **Cartes KPI** : dossiers en cours ; en retard (seuil 7 jours sans avancement, hors temps chez un autre bureau) ; traités sur la période ; notes en attente de validation ; notes en attente de signature (Chef de bureau).
- **Graphique** : répartition des dossiers par statut (donut ou barres).
- **Graphique** : dossiers traités par période, par conseiller / par cellule.
- **Tableau** : dossiers en retard (référence, objet, statut, responsable, jours sans avancement).
- **Filtre de période** (7 j, 30 j, trimestre, personnalisé).
- **Variantes par rôle** :
  - *Secrétariat* : dossiers à enregistrer, notes imprimées à cacheter, lettres à récupérer au cabinet, retours à enregistrer.
  - *Chef de bureau / adjoint* : vue complète BESD, notes à valider/signer, dossiers à affecter.
  - *Chef de cellule / adjoint* : vue cellule, notes à relire, dossiers à affecter aux conseillers.
  - *Conseiller / hors cellule / comptable* : mes dossiers, mes notes en cours, observations à traiter.

### 4.3 Liste des dossiers — `/dossiers`
- **Base** : table de la page Users (TanStack Table).
- Colonnes : référence, objet, provenance, instruction du cabinet, statut du dossier (badge), cellule(s), responsable(s), date de réception BESD, jours sans avancement (rouge si > 7), origine (icône).
- **Filtres** : statut, cellule, provenance, instruction, origine, période, « en retard seulement », « en attente d'un autre bureau ».
- Recherche rapide, tri, pagination, sélection de colonnes visibles, export (bouton factice).
- Clic sur ligne → fiche dossier.
- Les lignes affichées dépendent du rôle (voir matrice 2 ; périmètre simulé dans le service mock).

### 4.4 Enregistrement d'un dossier — `/dossiers/nouveau`
- **Base** : formulaire shadcn (React Hook Form + Zod), en étapes si utile.
- Champs : numéro de référence, objet, date de transmission par l'institution d'origine, date de réception par le cabinet, date de réception par le BESD, **instruction du cabinet** (pour analyse / action / traitement / classement / info / suivi / autre), **provenance** (liste déroulante avec option « Autre » qui ouvre une mini-fenêtre d'ajout, 4.7), **origine** (via cabinet civil / direct chef de bureau / retour du cabinet sans dossier BESD préalable).
- **Multi-bureaux** : case « Dossier affecté à plusieurs bureaux » → champs : bureau précédent, rang du BESD, date de mise en attente ; message « Le dossier sera en attente d'un autre bureau tant que la date de réception effective n'est pas saisie ».
- **Téléversement de la première page (PDF)** avec aperçu ; mention « Seule la première page est numérisée ».
- Bouton « Enregistrer et transmettre au Chef de bureau ».
- Validation Zod : champs obligatoires, cohérence des dates (transmission ≤ réception cabinet ≤ réception BESD).

### 4.5 Fiche dossier — `/dossiers/[id]`
Écran central. **Disposition** : en-tête + colonne principale à onglets + panneau latéral (note en cours), conformément à la maquette 9.2.
- **En-tête** : référence, objet, badge statut dossier, cellule(s), provenance, instruction, actions contextuelles selon rôle et statut (Affecter, Confier à l'adjoint, Retour du cabinet, Clore…).
- **Onglets** :
  1. *Informations* : toutes les données d'enregistrement, première page PDF (visionneuse), alerte « En attente d'un autre bureau » le cas échéant.
  2. *Affectations* : historique (date, auteur, destinataire, type, conseiller préféré) et cellules principale / collaboratrice.
  3. *Notes* : liste des notes du dossier, regroupées par **cycle de traitement** (cycle initial, puis un cycle par retour du cabinet). Chaque note : type de document, destinataire, statut (badge), rédacteur, numéro officiel (si signée).
  4. *Historique* : frise chronologique unique (réception, affectation, dépôt de version, observation, validation, impression, signature, cachet, transmission, retour, réouverture, accès accordé), chaque ligne avec auteur, date, icône par type. Filtrable par type de mouvement.
  5. *Accès* (Chef de bureau / adjoint) : accès exceptionnels et prises en charge liés au dossier.
- **Panneau latéral « Note en cours »** : statut, dernière version, prochaine action attendue et son responsable, boutons d'action.
- **Restriction** : un chef de cellule hors périmètre voit **uniquement mots-clés et historique** (message « Accès limité — demander un accès exceptionnel au Chef de bureau »). Le secrétariat ne voit que la **première page** des notes.

### 4.6 Affectation (fenêtres de dialogue, depuis la fiche dossier et `/a-affecter`)
- **`/a-affecter`** : table des dossiers reçus non affectés (Chef de bureau, adjoint) ou des dossiers de la cellule non affectés (chef de cellule).
- **Affectation par le Chef de bureau** (dialogue) :
  - choix d'une ou deux cellules, avec désignation **principale / collaboratrice** ;
  - conseiller préféré (facultatif, liste filtrée par cellule) ;
  - option « Traiter moi-même » ;
  - option « Confier à un conseiller hors cellule » ;
  - **case « Confier le suivi et la prise en charge à mon adjoint jusqu'à la signature »** (règle 4.5, point « décidé, pas encore construit » du cahier) ; sélecteur de l'adjoint.
- **Affectation par le chef de cellule** : un ou deux conseillers (possiblement d'autres cellules), ou « Traiter moi-même ».
- Récapitulatif avant confirmation ; confirmation → toast « Affectation notifiée à … ».

### 4.7 Mes dossiers à traiter — `/mes-dossiers`
- **Base** : page Tasks du template (table + filtres), éventuellement vue Kanban en phase 2.
- Colonnes : dossier, note, statut de la note, prochaine action, échéance/jours sans avancement, observations non résolues.
- Raccourcis : « Déposer une version », « Voir les observations ».

### 4.8 Détail d'une note — `/dossiers/[id]/notes/[noteId]`
Cœur du circuit de relecture (3.3). **Pas d'édition en ligne** : téléchargement / dépôt de fichiers Word.
- **En-tête** : type de document (note au Chef de cabinet civil, note au Président, projet de lettre), destinataire (**deux champs distincts**), statut (badge), numéro officiel si attribué, rédacteur, conseillers assignés.
- **Bandeau de circuit** (stepper horizontal) : Brouillon → Relecture cellule → Relecture bureau → Validée → Imprimée → Signée → Cachetée → Transmise. L'étape courante est mise en évidence ; **auteur et date** sous chaque étape franchie.
- **Bandeau d'avertissement rouge** si la note a été rouverte après signature, avec lien vers la version signée d'origine.
- **Mots-clés** (obligatoires avant dépôt, saisie par badges).
- **Liste des versions** (V1, V2, …) : auteur, date, taille, boutons *Télécharger*, *Comparer* (désactivé / phase 2), badge « dernière version ». Base visuelle : File Manager.
- **Zone de dépôt d'une nouvelle version** (glisser-déposer .docx) avec champ de commentaire facultatif ; aide : « Téléchargez la dernière version, travaillez-la dans Word avec le suivi des modifications, puis redéposez-la ».
- **Observations** : fil de remarques courtes (auteur, date, contenu, case « résolue »), ajout rapide.
- **Actions selon rôle et statut** :
  - Rédacteur : *Déposer une version*, *Soumettre à la relecture*.
  - Chef de cellule : *Envoyer au Chef de bureau* ou *Renvoyer au rédacteur* (avec motif).
  - Chef de bureau / adjoint autorisé : *Envoyer en observation* (redescend) ou *Valider*.
  - Cellule CASEAG : indication « Délégation de correction au nom du Chef de bureau — validation finale réservée au Chef de bureau ».
- Notification affichée sous forme d'info : « Version déposée : le conseiller et le chef de cellule seront notifiés ».

### 4.9 Validation de la note — `/…/validation`
Reprend la maquette 9.3.
- Aperçu **PDF** (visionneuse intégrée) de la note.
- Boutons : **Valider**, **Renvoyer en observation** (motif obligatoire).
- Après validation : état « Validée, en attente d'impression » → bouton **Imprimer** (déclenche l'impression navigateur, puis statut « Imprimée », notification au secrétariat) → bouton **Marquer comme signée** (Chef de bureau, ou adjoint **si prise en charge** ; sinon bouton désactivé avec infobulle).
- Si l'adjoint signe : mention visible « Signée par [nom], adjoint, par prise en charge du [date] ».

### 4.10 Circuit de signature — `/signatures`
- Table des notes « validées / en attente d'impression / imprimées / en attente de signature » avec actions rapides (Valider, Imprimer, Signer).
- Compteurs en tête (4.9 : notes en attente de validation ou de signature).

### 4.11 Secrétariat : cachet et transmission — `/secretariat/cachets`
- Onglets : *Notes signées à cacheter* · *À transmettre au cabinet* · *Projets de lettre à récupérer au cabinet*.
- **Dialogue « Enregistrer le cachet »** : date du cachet ; le **numéro officiel est généré par l'application** (champ en lecture seule, format `0001/2026`, avec libellé « Généré automatiquement — à reporter sur le document papier ») ; téléversement de la première page signée et cachetée.
- Action **Transmettre au cabinet** → statut « transmise », statut dossier « transmis ».
- Cas projet de lettre : le secrétariat est notifié, récupère la lettre au cabinet, apporte cachet, date, référence, téléverse la première page.
- Le secrétariat voit uniquement la **première page** des notes (visionneuse limitée).

### 4.12 Retours du cabinet — `/retours-cabinet`
- Liste des retours (dossier, note d'origine, type de suite, date, bureaux en collaboration, statut du nouveau cycle).
- **Dialogue « Enregistrer un retour »** (secrétariat) : sélection du dossier et de la note d'origine renvoyée, type de suite attendu (projet de lettre / descente / autre), bureaux en collaboration, commentaire. Création → ouverture d'un **nouveau cycle de traitement**, visible dans la fiche dossier (onglet Notes) et dans l'historique.
- Cas particulier : **retour sans dossier BESD préalable** → formulaire de nouveau dossier avec origine préremplie.

### 4.13 Réouverture d'une note signée (dialogue sur la note)
- Visible pour les rôles habilités. Champs : **motif obligatoire**, autorité ayant autorisé, date.
- Avertissements : « La version signée d'origine est conservée. La nouvelle version aura sa propre validation, signature, numéro et date. »
- Résultat : bandeau rouge persistant sur la note + ligne dans l'historique.

### 4.14 Notifications — `/notifications` + cloche de l'en-tête
- **Cloche** dans l'en-tête avec badge de non-lus et menu déroulant des 5 dernières.
- **Page** (inspiration Email) : liste à gauche, détail à droite ; filtres *Tous / Non lus / par type* ; « Tout marquer comme lu ».
- Chaque notification : message, dossier lié (lien, facultatif — vide pour une création de compte), date, canal (icônes courriel / application), état lu / non lu.
- Types à couvrir : réception d'un dossier, affectation, dépôt de version, impression, signature, transmission de lettre, retour du cabinet, création de compte par un adjoint ou un chef de cellule.

### 4.15 Recherche intelligente — `/recherche`
- Barre de recherche unique + panneau de filtres (période, cellule, statut, provenance).
- Résultats : dossier (référence, objet), **mots-clés correspondants**, **extrait du texte de la dernière version** avec termes surlignés, type de correspondance (objet / mots-clés / texte de la note).
- Respect des droits : un résultat hors périmètre n'affiche que mots-clés et historique.
- Barre de recherche globale (raccourci clavier) dans l'en-tête, redirigeant vers cette page.

### 4.16 Comptes utilisateurs — `/administration/comptes`
- **Base** : Users Management.
- Table : nom, prénom, email, rôle, cellule, créé par, statut (actif / désactivé), date de création.
- Actions : *Créer*, *Désactiver / Réactiver* (jamais de suppression : message « L'historique de ses actions est préservé »).
- **Création (`/nouveau`)** : nom, prénom, email, rôle (liste des 8 rôles), cellule (facultative : désactivée pour Chef de bureau, comptable, conseiller hors cellule).
- Encadré d'information : « La création d'un compte ne donne pas à elle seule accès aux dossiers. Les droits dépendent du rôle, des dossiers assignés et des accès complémentaires. »
- Si le créateur n'est pas le Chef de bureau : message « Le Chef de bureau sera notifié automatiquement de cette création ».

### 4.17 Cellules — `/administration/cellules`
- Liste (CASEAG, Cellule2, Cellule3, extensible) : chef, chef adjoint (facultatif), conseiller attitré (oui / non), délégation de correction (badge pour CASEAG).
- Création / modification via dialogue (aucune liste codée en dur côté UI).

### 4.18 Provenances — `/administration/provenances`
- Liste enrichissable (ministère, institution, individuel, autre), ajout / renommage via dialogue.

### 4.19 Accès exceptionnels et complémentaires — `/administration/acces-exceptionnels`
- Table : dossier, bénéficiaire, accordé par, date, **durée / échéance**, motif du besoin.
- Dialogue d'octroi (Chef de bureau) : dossier, bénéficiaire, motif, durée (champ présent, valeur à confirmer — point 11 du cahier), type : *exceptionnel* ou *complémentaire (conseiller hors cellule / comptable)*.
- **Demande d'accès** (côté conseiller hors cellule) : dialogue « Demander l'accès à un dossier antérieur » avec besoin exprimé → notification au Chef de bureau.

### 4.20 Prises en charge des adjoints — `/administration/prises-en-charge`
- Table : dossier, titulaire, adjoint désigné, date et heure, auteur.
- Dialogue de création (hors affectation) : dossier, adjoint, confirmation. Possible **en cours de traitement**, y compris note déjà en préparation.
- Rappel d'étendue : texte d'aide « signature (et, selon décision à confirmer : affecter, valider, imprimer) ». Prévoir un indicateur de portée dans le modèle de données du mock.

### 4.21 Journal de traçabilité — `/administration/journal`
- Table en lecture seule, **non modifiable**, toutes actions : date, auteur, type de mouvement, dossier (facultatif), compte concerné, description.
- Filtres : période, auteur, type (réception, affectation, dépôt, observation, signature, transmission, retour, réouverture, accès accordé, **consultation par l'adjoint**, **création de compte**), dossier.
- Mise en évidence visuelle des consultations de l'adjoint.
- Export (bouton factice).

### 4.22 Rôles et droits — `/administration/roles`
- **Base** : Roles Management, **en lecture seule** (rôles fixes dans le code).
- Matrice rôle × capacité reprise de la section 2 de ce document ; description de chaque rôle (tableau du chapitre 2 du cahier).

### 4.23 Profil — `/profil`
- **Base** : Profile. Identité, rôle, cellule, changement de mot de passe (factice), préférences d'affichage (thème, layout).

---

## 5. Composants partagés à créer

| Composant | Rôle |
|---|---|
| `StatusBadge` (dossier / note) | Couleur et icône cohérentes par statut ; source unique `src/config/statuses.ts` |
| `WorkflowStepper` | Circuit de la note avec auteur et date par étape |
| `HistoryTimeline` | Frise chronologique du dossier / filtrable |
| `DataTable` générique | Colonnes, filtres, tri, pagination, visibilité des colonnes (basé sur le composant du template) |
| `PdfFirstPageViewer` | Visionneuse de première page (dossier, note signée) |
| `VersionList` + `VersionDropzone` | Versions Word, dépôt glisser-déposer |
| `ObservationThread` | Remarques courtes avec résolution |
| `AssignDialog` | Affectation (cellule, conseiller, adjoint) |
| `ProvenanceSelect` | Liste déroulante + « Autre » avec ajout |
| `KeywordInput` | Saisie de mots-clés en badges (obligatoire avant dépôt) |
| `PermissionGate` | Affiche, désactive avec infobulle ou masque selon `permissions.ts` |
| `RoleSwitcher` (dev) | Changer de rôle simulé |
| `NotificationBell` | Badge non lus + menu |
| `OverdueIndicator` | Jours sans avancement, rouge au-delà de 7 |
| `ReopenedBanner` | Avertissement note rouverte après signature |
| `EmptyState`, `ErrorState`, `TableSkeleton` | États standard |

**Codes couleur de statut proposés** (à ajuster au thème) :
- Dossier : reçu (bleu), en traitement (indigo), en attente d'un autre bureau (ambre), transmis (vert), actif après retour (violet), clôturé (gris).
- Note : brouillon (gris), relecture cellule (bleu clair), relecture bureau (bleu), validée (cyan), en attente d'impression (ambre), imprimée (orange), signée (vert), transmise (vert foncé), rouverte (rouge).

---

## 6. Modèles de données pour les mocks (JavaScript)

Créer `src/types/` reflétant le chapitre 5 du cahier (16 entités) : **objets constants `Object.freeze`** pour les enums (rôles, statuts, types) et **commentaires JSDoc `@typedef`** pour décrire la forme des données. Entités, au minimum :
`Utilisateur`, `Cellule`, `Provenance`, `Dossier`, `CycleTraitement`, `DossierCellule`, `Affectation`, `RetourCabinet`, `Note`, `NoteVersion`, `ReouvertureNote`, `Observation`, `Notification`, `AccesExceptionnel`, `AutorisationAdjoint`, `MouvementDossier`.

Points d'attention :
- `Dossier.id` (technique) distinct de `Dossier.reference` (métier).
- `Note.typeDocument` et `Note.destinataire` : **deux champs distincts**. Destinataire = liste enrichissable (valeurs initiales : Chef de cabinet civil, Président, copie pour information au Président).
- `Note.numeroOfficiel` au format `NNNN/AAAA`, **nul tant que le cachet n'est pas enregistré**.
- Deux enums séparés : `StatutDossier` et `StatutNote` (4.2).
- `Utilisateur.cellule` facultatif.
- `MouvementDossier.dossier` facultatif.

**Jeu de données de démonstration** (`src/lib/mock/`) : 8 comptes (un par rôle, cellules CASEAG, Cellule2, Cellule3), 15 à 25 dossiers couvrant **tous les statuts**, dont : un dossier multi-bureaux en attente, un dossier avec retour du cabinet et deux cycles, une note rouverte après signature, un projet de lettre, un dossier d'origine « direct chef de bureau », une prise en charge d'adjoint active, un accès exceptionnel, des dossiers en retard (> 7 jours).

---

## 7. Plan de réalisation proposé (prompts successifs pour l'agent)

1. **Fondations** : porter layout, sidebar, thème et data-table depuis le template (JavaScript), puis thème BESD, `useSessionStore`, `RoleSwitcher`, `permissions.ts`, sidebar par rôle, enums, mocks, services.
2. **Composants partagés** : `StatusBadge`, `DataTable`, `PermissionGate`, `HistoryTimeline`, `WorkflowStepper`, états vide / erreur / chargement.
3. **Dossiers** : liste, enregistrement, fiche dossier (onglets), historique.
4. **Affectation** : `/a-affecter`, dialogues d'affectation, prise en charge de l'adjoint.
5. **Notes** : détail, dépôt de versions, observations, relectures, validation, signatures.
6. **Secrétariat** : cachet avec numéro généré, transmission, lettres, retours du cabinet.
7. **Notifications, recherche, tableaux de bord par rôle.**
8. **Administration** : comptes, cellules, provenances, accès, prises en charge, journal, rôles.
9. **Cas particuliers** : réouverture, multi-bureaux, accès limité, dossiers hors périmètre.
10. **Finitions** : responsive, accessibilité, passage du lint, relecture des libellés français.

Chaque étape doit se terminer par une application qui compile (`npm run build`) et une navigation fonctionnelle avec les mocks.

---

## 8. Points du cahier encore à trancher (à rendre faciles à changer)

| Point ouvert | Comportement UI provisoire |
|---|---|
| Lecture par l'adjoint d'un chef de cellule | Même lecture que son chef (une seule ligne dans `permissions.ts`) |
| Étendue de la prise en charge | Signature obligatoire ; autres actions (affecter, valider, imprimer) paramétrables par un drapeau |
| Moment de génération du numéro | À l'enregistrement du cachet, affiché en lecture seule |
| Valeurs du destinataire | Liste enrichissable, trois valeurs initiales, pas de valeur par défaut |
| Durée de l'accès complémentaire | Champ « échéance » présent mais facultatif |
| Bouton de prise en charge à l'affectation | Implémenté dans `AssignDialog` (4.6) |

---

## 9. Hors périmètre

Gestion financière, congés, activités du personnel (modules futurs) ; envoi réel de courriels ; extraction de texte des fichiers Word ; génération réelle de PDF ; authentification réelle ; extension à d'autres bureaux. Prévoir seulement des **points d'extension** (services isolés, menu extensible).
