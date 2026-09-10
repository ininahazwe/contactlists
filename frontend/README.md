# Contact Platform Frontend

Frontend React basique (Vite + TypeScript, sans bibliothèque UI) pour la plateforme
de gestion de contacts. Branché sur l'API `contactLists` (Express + MySQL).

## Fonctionnalités

- Connexion via Google Sign-In (Google Identity Services), session en cookie httpOnly
- Liste, recherche, création, édition, suppression de contacts
- Liste et création rapide d'organisations
- Liste et création rapide de dossiers d'investigation (le back applique déjà l'accès
  par dossier : un non-admin ne voit que ceux où il est membre)

Volontairement minimal pour l'instant : pas de gestion des relations entre contacts,
pas d'upload de documents, pas de vue du journal d'audit côté interface — ces
fonctionnalités existent déjà côté API et pourront être ajoutées à l'écran ensuite.

## Démarrage

```bash
cp .env .env
# renseigner VITE_API_URL et VITE_GOOGLE_CLIENT_ID (même client ID que le back)
npm install
npm run dev
```

L'API (`contactLists`) doit tourner en parallèle (voir son propre README) et son
`CLIENT_URL` doit pointer vers `http://localhost:5173` pour que le CORS/cookies
fonctionnent en développement.

## Structure

```
src/
  api/client.ts         petit wrapper fetch (cookies inclus, gestion des erreurs)
  auth/                  AuthContext (session courante) + ProtectedRoute
  components/Layout.tsx  nav + structure de page commune
  pages/                 une page par écran, appelle directement l'API
  types/                 types partagés avec le back (Contact, Organization, ...)
```

Pas de gestion d'état globale (Redux/Zustand) ni de couche d'abstraction sur les
appels API : chaque page fait ses propres appels via `api.get/post/patch/delete`.
