# 🌍 Gestion Multi-Environnements — HR Attendance Manager

Ce document explique l'architecture de configuration multi-environnements du projet.
Le système sépare la configuration en **3 instances** (development, staging, production) pour garantir des mises à jour sûres et éviter les bugs en production.

---

## 📋 Table des matières

1. [Principe de fonctionnement](#-principe-de-fonctionnement)
2. [Les 3 environnements](#-les-3-environnements)
3. [Structure des fichiers](#-structure-des-fichiers)
4. [Comment lancer chaque environnement](#-comment-lancer-chaque-environnement)
5. [Tableau comparatif](#-tableau-comparatif)
6. [Flux de déploiement recommandé](#-flux-de-déploiement-recommandé)
7. [Gestion des secrets](#-gestion-des-secrets)
8. [Ajouter une nouvelle variable](#-ajouter-une-nouvelle-variable)
9. [FAQ](#-faq)

---

## 🔧 Principe de fonctionnement

Le système repose sur la variable d'environnement `NODE_ENV` qui détermine quel fichier de configuration est chargé :

```
NODE_ENV=development  →  charge .env.development
NODE_ENV=staging      →  charge .env.staging
NODE_ENV=production   →  charge .env.production
```

### Module central : `server/config.js`

Ce module est le **point d'entrée unique** pour toute la configuration du serveur. Il :

1. **Détecte l'environnement** via `NODE_ENV` (défaut : `development`)
2. **Charge le fichier `.env.{NODE_ENV}`** correspondant
3. **Applique les surcharges locales** depuis `.env` (si présent)
4. **Valide les variables critiques** (JWT_SECRET, DB_PASSWORD, etc.)
5. **Bloque le démarrage** en production si des secrets manquent
6. **Affiche un résumé** de la configuration active au démarrage

```javascript
// Utilisation dans n'importe quel fichier du serveur :
const config = require('./config');

console.log(config.env);          // 'development' | 'staging' | 'production'
console.log(config.isDev);        // true / false
console.log(config.db.host);      // 'localhost' en dev, URL distante en prod
console.log(config.server.port);  // 3001 en dev, 8000 en prod
```

### Frontend (Vite)

Vite supporte nativement les fichiers `.env.{mode}`. Les variables préfixées par `VITE_` sont automatiquement injectées dans le code frontend :

```
pnpm dev              →  charge .env.development  (VITE_API_TARGET=http://localhost:3001)
pnpm dev:staging      →  charge .env.staging      (VITE_API_TARGET=https://api-staging....)
pnpm build:prod       →  charge .env.production   (VITE_API_TARGET=https://api....)
```

---

## 🟢🟡🔴 Les 3 environnements

### 🟢 Development (dev)

**Usage** : Développement local sur votre machine.

- Base de données PostgreSQL locale (`localhost`)
- Pas de SSL
- Logs en mode `debug` (très verbeux)
- JWT permissif (token long, secret faible autorisé)
- CORS ouvert (toutes les origines localhost)
- Backup automatique activé (pour tester le mécanisme)
- Rate limiting très permissif (x5 les limites de prod)

### 🟡 Staging (pré-production)

**Usage** : Tester les nouvelles fonctionnalités dans un environnement proche de la production.

- Base de données distante de staging (avec SSL)
- Logs en mode `info`
- JWT obligatoirement fort (min 32 caractères)
- CORS restreint aux URLs de staging
- Backup activé pour valider le mécanisme
- Rate limiting modéré (x2 les limites de prod)
- Les validations de sécurité émettent des **avertissements** mais ne bloquent pas

### 🔴 Production

**Usage** : Application en ligne accessible aux utilisateurs finaux.

- Base de données de production (avec SSL)
- Logs en mode `warn` (uniquement les erreurs et avertissements)
- JWT obligatoirement fort — **le serveur refuse de démarrer** sans
- CORS strictement limité au domaine de production
- Backup désactivé (filesystem éphémère sur le cloud)
- Rate limiting strict (valeurs de base)
- HSTS activé (force HTTPS)
- Toutes les validations de sécurité sont **bloquantes**

---

## 📁 Structure des fichiers

```
Hrattendancemanagerdesign/
│
├── .env.development          ← Config frontend dev (commité, pas de secrets)
├── .env.staging              ← Config frontend staging (commité)
├── .env.production           ← Config frontend prod (commité)
├── .env                      ← Surcharges locales frontend (⚠ GITIGNORED)
├── .env.local                ← Surcharges locales (⚠ GITIGNORED)
│
├── package.json              ← Scripts : dev, dev:staging, build:staging, build:prod
├── vite.config.ts            ← Charge automatiquement le .env selon le mode Vite
│
└── server/
    ├── config.js             ← ⭐ MODULE CENTRAL — charge et valide la config
    ├── .env.development      ← Config serveur dev (commité, valeurs d'exemple)
    ├── .env.staging          ← Config serveur staging (commité, valeurs d'exemple)
    ├── .env.production       ← Config serveur prod (commité, valeurs d'exemple)
    ├── .env                  ← Surcharges locales serveur (⚠ GITIGNORED)
    ├── .env.local            ← Surcharges locales (⚠ GITIGNORED)
    │
    ├── db.js                 ← Utilise config.db.*
    ├── server.js             ← Utilise config.server.*, config.cors.*, etc.
    ├── backup.js             ← Utilise config.db.*, config.backup.*
    ├── security.js           ← Rate limiting adaptatif selon config.env
    └── package.json          ← Scripts : dev, start:staging, start:prod
```

---

## 🚀 Comment lancer chaque environnement

### Serveur (backend)

```bash
# ─── Development (par défaut) ───────────────────────
cd server
npm run dev
# Ou directement :
# set NODE_ENV=development && node server.js

# ─── Staging ────────────────────────────────────────
cd server
npm run start:staging

# ─── Production ─────────────────────────────────────
cd server
npm run start:prod
```

### Frontend (Vite)

```bash
# ─── Development (par défaut) ───────────────────────
pnpm dev
# Ouvre http://localhost:5175, proxy vers http://localhost:3001

# ─── Staging ────────────────────────────────────────
pnpm dev:staging
# Ouvre http://localhost:5176, proxy vers l'API staging distante

# ─── Build staging ──────────────────────────────────
pnpm build:staging

# ─── Build production ──────────────────────────────
pnpm build:prod
```

### Docker (production)

```bash
# Le docker-compose.prod.yml définit déjà NODE_ENV=production
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 Tableau comparatif

| Paramètre | 🟢 Development | 🟡 Staging | 🔴 Production |
|---|---|---|---|
| `NODE_ENV` | `development` | `staging` | `production` |
| **Port serveur** | 3001 | 3002 | 8000 |
| **Port frontend** | 5175 | 5176 | 5177 |
| **DB Host** | `localhost` | Distant (staging) | Distant (prod) |
| **DB SSL** | ❌ Désactivé | ✅ Activé | ✅ Activé |
| **DB Connexions max** | 10 | 15 | 20 |
| **Log Level** | `debug` | `info` | `warn` |
| **JWT Secret** | Faible autorisé | Min 32 chars | Min 32 chars |
| **JWT Expiration** | 24h | 8h | 8h |
| **CORS** | `localhost:*` | URLs staging | Domaine prod |
| **Rate Limit** | x5 (permissif) | x2 (modéré) | x1 (strict) |
| **HSTS** | ❌ | ❌ | ✅ |
| **Backup auto** | ✅ (rétention 5) | ✅ (rétention 15) | ❌ (cloud) |
| **Validation sécurité** | Avertissements | Avertissements | **Bloquante** |

---

## 🔄 Flux de déploiement recommandé

Le flux recommandé suit le schéma classique **dev → staging → prod** :

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  🟢 DEV     │────▶│  🟡 STAGING │────▶│  🔴 PROD    │
│  localhost   │     │  test cloud  │     │  live        │
│  debug logs  │     │  info logs   │     │  warn logs   │
│  permissif   │     │  modéré      │     │  strict      │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Étapes :

1. **Développer en local** (`npm run dev`)
   - Coder et tester les nouvelles fonctionnalités
   - Corriger les bugs avec les logs `debug`
   - Les rate limits sont très permissifs

2. **Valider en staging** (`npm run start:staging`)
   - Déployer sur l'environnement de staging
   - Tester avec des données proches de la prod
   - Vérifier que la sécurité est correcte (JWT fort, CORS restreint)
   - Vérifier les performances avec des limites plus strictes

3. **Déployer en production** (`npm run start:prod`)
   - Déployer uniquement après validation staging
   - Le serveur **refuse de démarrer** si les secrets manquent
   - Logs minimaux, sécurité maximale

---

## 🔐 Gestion des secrets

### Règle d'or

> **Les fichiers `.env.{environment}` commités ne contiennent JAMAIS de vrais secrets.**
> Ils contiennent des **valeurs d'exemple** (`CHANGEZ_MOI_...`).

### Comment gérer les vrais secrets ?

#### Option 1 : Fichier `.env` local (développement)

Créez un fichier `server/.env` (gitignored) avec vos vraies valeurs :

```bash
# server/.env — CE FICHIER N'EST PAS COMMITÉ
DB_PASSWORD=mon_vrai_mot_de_passe
JWT_SECRET=a1b2c3d4e5f6...64_caracteres_aleatoires
SUPER_ADMIN_PASSWORD=MonSuperMotDePasse!
```

Ce fichier **surcharge** les valeurs du `.env.{environment}`.

#### Option 2 : Variables d'environnement système (staging/prod)

Sur le cloud (Koyeb, Vercel, Railway, etc.), définissez les variables directement dans le dashboard du service :

```
DB_HOST=mon-host-koyeb.app
DB_PASSWORD=secret_prod
JWT_SECRET=64_chars_aleatoires_prod
```

Ces variables système ont la **priorité maximale** sur tout fichier `.env`.

#### Priorité de chargement

```
1. Variables système (OS / cloud)        ← Priorité haute
2. server/.env (surcharges locales)      ← Surcharge fichier env
3. server/.env.{NODE_ENV}                ← Valeurs par défaut
```

---

## ➕ Ajouter une nouvelle variable

Pour ajouter une nouvelle variable de configuration :

### 1. Ajouter dans `server/config.js`

```javascript
const config = {
  // ... existant ...
  
  // Votre nouvelle section
  maFeature: {
    enabled: process.env.MA_FEATURE_ENABLED === 'true',
    apiKey: process.env.MA_FEATURE_API_KEY || '',
  },
};
```

### 2. Ajouter dans les 3 fichiers `.env`

```bash
# .env.development
MA_FEATURE_ENABLED=true
MA_FEATURE_API_KEY=dev_key_test

# .env.staging
MA_FEATURE_ENABLED=true
MA_FEATURE_API_KEY=CHANGEZ_MOI_staging_api_key

# .env.production
MA_FEATURE_ENABLED=true
MA_FEATURE_API_KEY=CHANGEZ_MOI_prod_api_key
```

### 3. Ajouter la validation si nécessaire

```javascript
// Dans config.js, section validations
if (config.isProd && !config.maFeature.apiKey) {
  errors.push('MA_FEATURE_API_KEY doit être défini en production');
}
```

### 4. Utiliser dans votre code

```javascript
const config = require('./config');

if (config.maFeature.enabled) {
  callApi(config.maFeature.apiKey);
}
```

---

## ❓ FAQ

### Q: Que se passe-t-il si je ne définis pas NODE_ENV ?
**R:** L'environnement par défaut est `development`. Le serveur démarre avec les paramètres les plus permissifs.

### Q: Le serveur refuse de démarrer en production, pourquoi ?
**R:** Vérifiez que `JWT_SECRET` (min 32 caractères), `SUPER_ADMIN_PASSWORD` et `DB_PASSWORD` sont définis. En production, `config.js` bloque le démarrage si ces valeurs manquent ou sont trop faibles.

### Q: Comment tester localement avec la config staging ?
**R:** Lancez `npm run start:staging` côté serveur et `pnpm dev:staging` côté frontend. Assurez-vous d'avoir un `.env` local avec les vrais credentials de la DB staging.

### Q: Est-ce que les fichiers .env.* sont commités dans Git ?
**R:** **Oui**, les fichiers `.env.development`, `.env.staging` et `.env.production` sont commités car ils ne contiennent que des valeurs d'exemple. Les fichiers `.env` et `.env.local` sont **gitignorés** car ils contiennent les vrais secrets.

### Q: Comment le frontend sait quel backend utiliser ?
**R:** Vite charge automatiquement le fichier `.env.{mode}` correspondant au `--mode` passé en argument. La variable `VITE_API_TARGET` est utilisée dans `vite.config.ts` pour configurer le proxy.

### Q: Les rate limits sont-ils les mêmes dans tous les environnements ?
**R:** Non ! Les limites sont multipliées par un facteur selon l'environnement :
- **Dev** : x5 (50 tentatives login au lieu de 10)
- **Staging** : x2 (20 tentatives login)
- **Prod** : x1 (10 tentatives login — valeur stricte)

---

## 📝 Résumé des commandes

```bash
# ─── Backend ──────────────────────────────────
cd server
npm run dev            # 🟢 Development (nodemon + hot reload)
npm run start:staging  # 🟡 Staging
npm run start:prod     # 🔴 Production
npm start              # Utilise NODE_ENV du système

# ─── Frontend ─────────────────────────────────
pnpm dev               # 🟢 Development
pnpm dev:staging       # 🟡 Staging
pnpm build:staging     # 🟡 Build staging
pnpm build:prod        # 🔴 Build production
pnpm build             # Build par défaut

# ─── Docker ───────────────────────────────────
docker compose -f docker-compose.prod.yml up -d  # 🔴 Production
```
