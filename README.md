# Contact Lists

Plateforme de gestion de contacts pour un site d'investigation/audit (Mfwa).

Deux applications indépendantes, chacune avec son propre `package.json` et sa
propre chaîne de build — voir leur README respectif pour le détail :

- [`backend/`](./backend/README.md) — API Express + TypeScript + MySQL (sans ORM),
  auth Google OAuth, déployée sur cPanel comme processus Node derrière un
  reverse-proxy Apache (`backend/.htaccess`).
- [`frontend/`](./frontend/README.md) — interface React + Vite + TypeScript,
  déployée sur Vercel dans un premier temps (`vercel.json` à la racine — Vercel
  le lit toujours depuis la racine du repo même quand le "Root Directory" du
  projet est réglé sur `frontend`).

## Déploiement

| App      | Hébergement                              | Notes |
|----------|-------------------------------------------|-------|
| backend  | cPanel (processus Node + reverse-proxy)    | voir `backend/README.md` |
| frontend | Vercel (tests grand public, pour l'instant) | Root Directory du projet Vercel = `frontend` |

Le `CLIENT_URL` du backend et le `VITE_API_URL` du frontend doivent pointer
l'un vers l'autre une fois les deux déployés, sans quoi les cookies de session
cross-domain seront bloqués par CORS.

## Démarrage en local

```bash
cd backend && cp .env .env && npm install && npm run dev
cd frontend && cp .env .env && npm install && npm run dev
```
