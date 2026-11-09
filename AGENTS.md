<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Règles du projet BESD

- Application de gestion des dossiers du BESD, FRONTEND UNIQUEMENT (aucun backend).
- Référence fonctionnelle : docs/BESD_structure_interfaces.md. La relire avant chaque tâche. En cas de conflit, AGENTS.md prévaut.
- ../template est une RÉFÉRENCE EN LECTURE SEULE. Ne jamais le modifier. On s'en inspire en copiant et en adaptant le code dans ce projet.
- Ce projet est en JAVASCRIPT, sans TypeScript : fichiers .js / .jsx uniquement. Quand on reprend du code du template, le convertir (retirer types, interfaces, génériques, `as`, `import type`).
- Enums = objets constants Object.freeze. Forme des données = commentaires JSDoc @typedef.
- Stack : Next.js App Router, Tailwind v4, shadcn/ui (JSX), React Hook Form + Zod, TanStack Table, Zustand. Aucune autre bibliothèque UI.
- Interface en français ; code, noms de fichiers et variables en anglais.
- Les écrans n'accèdent aux données que via src/lib/services (qui renvoient des mocks de src/lib/mock).
- Chaque écran gère : chargement (skeleton), vide, erreur, données.
- Ne faire QUE la tâche demandée. Ne pas refactorer ce qui n'est pas concerné.
- Terminer chaque tâche par : npm run build, npm run lint, et un résumé des fichiers créés ou modifiés.
