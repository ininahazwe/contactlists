# Contact Platform Backend

API Node.js/Express (TypeScript) pour la plateforme de gestion de contacts d'un site
d'investigation/audit. Même logique que le projet "asset management platform" :
Express pur, MySQL via `mysql2` sans ORM, JWT + Google OAuth, validation Zod.

Déployé sur un hébergement cPanel, en tant que processus Node autonome derrière
un reverse-proxy Apache (voir `.htaccess`).

## Stack

- Express 5 + TypeScript strict
- MySQL (mysql2/promise, requêtes SQL brutes, pas d'ORM)
- Auth: Google OAuth (Sign in with Google) restreint à un domaine Workspace + JWT applicatif en cookie httpOnly
- Documents: stockage S3-compatible (upload/download par URL présignée), seules les métadonnées sont en base
- Audit: table `audit_log` append-only (créations/modifications/suppressions + consultations), accessible aux admins uniquement

## Modèle de données

Voir `sql/001_init.sql` :

- `users` — comptes, rôle (admin / investigator / read_only)
- `organizations` — entités morales
- `contacts` — personnes, liées à une organisation
- `contact_relations` — graphe de relations entre contacts (type, confiance, source)
- `cases` — dossiers d'investigation
- `case_members` — accès "need-to-know" par dossier
- `case_contacts` — contacts rattachés à un dossier
- `documents` — métadonnées des pièces jointes (fichier réel en S3)
- `audit_log` — traçabilité complète, jamais modifiée/supprimée par l'application

## Démarrage (développement)

```bash
cp .env .env   # renseigner les variables (DB, Google OAuth, S3)
npm install
mysql -u root -p contact_platform < sql/001_init.sql
npm run dev             # serveur de dev avec rechargement (tsx watch)
npm run build && npm start   # build + démarrage en production
```

## Déploiement (cPanel)

1. Déposer ce dossier sur l'hébergement, `.env` renseigné avec les vraies valeurs.
2. `npm install --production` puis `npm run build` (ou builder en local et
   n'envoyer que `dist/`, `package.json`, `node_modules`, `.env`).
3. Démarrer le process Node (`npm start`), en général géré via cPanel > "Setup
   Node.js App" (Phusion Passenger) plutôt qu'à la main — c'est aussi la façon
   la plus fiable de faire tourner l'appli en tâche de fond et de la relancer
   automatiquement.
4. `.htaccess` fait le lien entre le domaine/sous-domaine public et le process
   Node local (`http://127.0.0.1:PORT`). Il suppose que `mod_proxy` est activé
   sur le compte — si ce n'est pas le cas (fréquent en mutualisé), utiliser
   directement "Setup Node.js App" qui s'occupe du proxy lui-même et rend ce
   fichier inutile.
5. Penser à mettre à jour `CLIENT_URL` dans `.env` avec l'URL Vercel du front
   une fois celle-ci connue, sinon les cookies de session cross-domain (CORS)
   seront refusés.

## Structure

```
app.ts / server.ts    assemblage de l'app Express et point d'entrée
config/env.ts          variables d'environnement centralisées et validées
db/pool.ts              pool mysql2 + helpers query()/withTransaction()
middleware/             auth (JWT), contrôle d'accès par dossier, audit, erreurs
modules/<domaine>/      routes.ts + controller.ts + service.ts + schema.ts (Zod)
  auth/ contacts/ organizations/ relations/ cases/ documents/ audit/
sql/001_init.sql        schéma MySQL complet
```

Chaque module suit le même pattern que le projet de référence : `routes.ts` déclare
les endpoints et les middlewares, `controller.ts` valide l'entrée (Zod) et orchestre
la réponse HTTP, `service.ts` contient les requêtes SQL. Rien n'est généré
automatiquement — tout le code est explicite et modifiable directement.
