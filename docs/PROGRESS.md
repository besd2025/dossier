# Suivi — Connexion et session simulée

- [x] Adapter une seule variante de connexion du template en français, avec identifiant, mot de passe, mémorisation, récupération factice et validation des comptes de démonstration.
- [x] Faire évoluer `useSessionStore` pour gérer explicitement les états connecté/déconnecté et persister la session selon « Se souvenir de moi ».
- [x] Ajouter Profil et Déconnexion au menu utilisateur ; la déconnexion doit vider la session puis ouvrir `/auth/login`.
- [x] Protéger les routes de l'application et rediriger vers `/auth/login` toute visite sans session, sans bloquer les routes d'authentification.
- [x] Vérifier le RoleSwitcher après authentification, puis exécuter lint et build et vérifier le parcours de connexion dans le navigateur.

## Suivi — Mes dossiers et relectures

- [x] Vérifier les consignes Next.js applicables, les mocks/services, les composants partagés et les actions déjà implémentées pour les notes.
- [x] Implémenter `/mes-dossiers` avec accès filtré par rôle/affectation, synthèse, onglets, filtres, actions rapides et états chargement/vide/erreur.
- [x] Implémenter `/relectures` avec périmètre des relecteurs, synthèse, onglets, filtres, actions protégées et états chargement/vide/erreur.
- [x] Factoriser et réutiliser les transitions métier existantes pour transférer, renvoyer en observation et renvoyer au rédacteur.
- [x] Valider les parcours pertinents, exécuter `npm run lint` et `npm run build`, puis finaliser cette checklist.
