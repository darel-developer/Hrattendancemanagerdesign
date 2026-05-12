# HR Attendance Manager — Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?logo=mysql&logoColor=white)
![mysql2](https://img.shields.io/badge/mysql2-3.22.3-4479A1)

**API REST Express.js — Gestion RH multi-entreprises**

</div>

---

## Présentation

Le backend est une API REST construite avec Express.js et MySQL 8. Il expose l'ensemble des fonctionnalités métier de la plateforme HR Attendance Manager à travers des routes JSON sécurisées, avec isolation stricte des données par entreprise (multi-tenant via `company_id`).

### Rôle du backend

- Authentification des utilisateurs (Admin, Manager, Employee)
- Gestion des entreprises, employés et départements
- Enregistrement et gestion des pointages journaliers
- Traitement des demandes de congés
- Génération et distribution de notifications automatiques
- Sauvegarde automatique de la base de données MySQL
- Vérification géographique du pointage (Haversine)
- Exposition d'un kiosque de pointage public sécurisé par PIN

### Architecture globale

```
Client React (port 5175)
        │
        │ HTTP /api/*
        ▼
Express.js (port 3002)
  ├── Middleware : securityHeaders, CORS, JSON parser, rate limiter
  ├── Routes : /auth, /employees, /attendance, /leaves, /companies,
  │            /departments, /notifications, /kiosk, /reports,
  │            /performance, /documents, /planning, /superadmin
  └── MySQL Pool (mysql2/promise)
        │
        ▼
MySQL 8.0 — base : hr_attendance_db
```

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| **Node.js** | ≥ 18.x | Runtime JavaScript serveur |
| **Express.js** | 4.22.1 | Framework HTTP |
| **mysql2/promise** | 3.22.3 | Driver MySQL async (pool de connexions) |
| **dotenv** | 16.6.1 | Variables d'environnement depuis `.env` |
| **cors** | 2.8.6 | Middleware CORS configurable |
| **crypto (natif Node)** | — | Hachage SHA-256 des mots de passe |
| **nodemon** | 3.1.0 | Rechargement automatique en développement |

### Authentification & Sécurité

| Mécanisme | Description |
|---|---|
| **SHA-256** | Hachage des mots de passe (module `crypto` natif) |
| **Rate limiting** | 4 niveaux de limitation par IP (en mémoire) |
| **Security headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection… |
| **CORS** | Origines autorisées via variable d'environnement |
| **Session** | Côté client uniquement (`localStorage` : userId + companyId) |
| **Brute-force PIN** | 5 tentatives max, blocage 15 min (kiosque) |

### Base de données

| Aspect | Valeur |
|---|---|
| **SGBD** | MySQL 8.0+ |
| **Driver** | mysql2/promise (async/await natif) |
| **Pool** | 10 connexions max |
| **Charset** | utf8mb4 / utf8mb4_unicode_ci |
| **Migrations** | Auto-appliquées au démarrage du serveur |

---

## Architecture du projet

```
server/
├── routes/
│   ├── auth.js              # Connexion, changement de mot de passe
│   ├── attendance.js        # Pointages journaliers
│   ├── companies.js         # Entreprises + géolocalisation
│   ├── departments.js       # Départements + cascade employés
│   ├── documents.js         # Documents RH
│   ├── employees.js         # Employés CRUD
│   ├── kiosk.js             # Pointage public par PIN + Haversine
│   ├── leaves.js            # Congés + soldes
│   ├── notifications.js     # Notifications
│   ├── performance.js       # Évaluations de performance
│   ├── planning.js          # Quarts de travail
│   ├── reports.js           # Rapports persistés
│   └── superadmin.js        # Administration globale
├── backups/                 # Fichiers SQL de sauvegarde
├── .env                     # Variables d'environnement (non versionné)
├── backup.js                # Sauvegarde MySQL automatisée
├── db.js                    # Pool de connexion MySQL2
├── security.js              # Headers HTTP + rate limiters
├── server.js                # Point d'entrée Express
└── package.json
```

### Rôle de chaque fichier

| Fichier | Responsabilité |
|---|---|
| `server.js` | Bootstrap Express, montage des routes, schedulers auto, migrations au démarrage |
| `db.js` | Pool mysql2 partagé par toutes les routes |
| `security.js` | Classe `RateLimiter` + middleware `securityHeaders` |
| `backup.js` | Sauvegarde via `mysqldump`, gestion rétention, planification |
| `routes/employees.js` | CRUD employés, mappage colonnes DB → objet API |
| `routes/auth.js` | Login SHA-256, changement mot de passe |
| `routes/kiosk.js` | PIN check, brute-force, Haversine GPS, check-in/out |
| `routes/companies.js` | Entreprises + `ensureGeoColumns()` |
| `routes/departments.js` | Départements + `ensureTable()` |
| `routes/reports.js` | Rapports + `ensureTable()` |

---

## Installation

### Prérequis

- **Node.js** ≥ 18.x
- **MySQL** 8.0+ en cours d'exécution
- Base de données `hr_attendance_db` existante (voir section Base de données)

### 1. Installer les dépendances

```bash
cd server
npm install
```

Depuis la racine du projet :

```bash
npm run server:install
```

### 2. Configurer l'environnement

Créez le fichier `server/.env` à partir de l'exemple :

```bash
cp server/.env.example server/.env
# puis éditez les valeurs
```

Variables minimales requises :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=hr_attendance_db
PORT=3002
SUPER_ADMIN_PASSWORD=superadmin2024
ALLOWED_ORIGINS=http://localhost:5175
```

### 3. Initialiser la base de données

```bash
# Depuis la racine du projet
# Option A : via mysql CLI
mysql -u root -p < database.sql

# Option B : via le script Node fourni (ne nécessite pas mysql dans le PATH)
cd server && node migrate.js
```

### 4. Démarrer le serveur

**Mode développement** (rechargement automatique) :

```bash
cd server
npm run dev
```

**Mode production** :

```bash
cd server
npm start
```

**Depuis la racine du projet** :

```bash
npm run server
```

Le serveur démarre sur **http://localhost:3002**

---

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `DB_HOST` | Hôte MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | *(vide sur XAMPP local)* |
| `DB_NAME` | Nom de la base de données | `hr_attendance_db` |
| `PORT` | Port d'écoute du serveur Express | `3002` |
| `SUPER_ADMIN_PASSWORD` | Mot de passe d'accès super-administrateur | `superadmin2024` |
| `ALLOWED_ORIGINS` | Origines CORS autorisées (séparées par des virgules) | `http://localhost:5175,http://localhost:5173` |
| `AUTO_BACKUP` | Activer/désactiver la sauvegarde automatique | `true` |
| `BACKUP_RETENTION` | Nombre de backups à conserver | `30` |

---

## Base de données

### Schéma global

La base `hr_attendance_db` contient les tables suivantes :

```
companies             → Entreprises clientes (multi-tenant)
employees             → Employés rattachés à une entreprise
attendance_records    → Pointages journaliers
leave_requests        → Demandes de congé
notifications         → Notifications système et utilisateur
reports               → Rapports envoyés entre employés
performance_reviews   → Évaluations de performance
employee_documents    → Documents RH
team_shifts           → Quarts de travail planifiés
departments           → Départements par entreprise
```

### Relations principales

```
companies (1) ──────────────── (N) employees
employees (1) ──────────────── (N) attendance_records
employees (1) ──────────────── (N) leave_requests
employees (1) ──────────────── (N) notifications
employees (1) ──────────────── (N) performance_reviews  [reviewer]
employees (1) ──────────────── (N) performance_reviews  [employee]
employees (1) ──────────────── (N) employee_documents
employees (1) ──────────────── (N) team_shifts
employees (N) ──────────────── (1) employees            [manager_id self-ref]
companies (1) ──────────────── (N) departments
```

### Détail des tables principales

#### `companies`

```sql
CREATE TABLE companies (
  id             VARCHAR(10)    PRIMARY KEY,
  name           VARCHAR(100)   NOT NULL,
  sector         VARCHAR(100),
  address        VARCHAR(255),
  hr_email       VARCHAR(150),
  work_start     TIME           DEFAULT '09:00:00',
  late_tolerance INT            DEFAULT 5,
  latitude       DECIMAL(10,7)  NULL,       -- géolocalisation GPS
  longitude      DECIMAL(10,7)  NULL,
  geo_radius     INT            DEFAULT 100, -- rayon en mètres
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);
```

#### `employees`

```sql
CREATE TABLE employees (
  id             VARCHAR(10)    PRIMARY KEY,
  company_id     VARCHAR(10)    NOT NULL REFERENCES companies(id),
  first_name     VARCHAR(100)   NOT NULL,
  last_name      VARCHAR(100)   NOT NULL,
  email          VARCHAR(150)   UNIQUE NOT NULL,
  phone          VARCHAR(30),
  avatar         TEXT,          -- base64
  role           ENUM('Admin','Manager','Employee') DEFAULT 'Employee',
  department     VARCHAR(100)   NOT NULL DEFAULT '', -- personnalisable
  position       VARCHAR(100),
  contract_type  ENUM('CDI','CDD','Stage','Freelance') DEFAULT 'CDI',
  start_date     DATE,
  salary         DECIMAL(12,2),
  status         ENUM('Actif','Inactif','En congé') DEFAULT 'Actif',
  manager_id     VARCHAR(10)    NULL REFERENCES employees(id),
  address        VARCHAR(255),
  birth_date     DATE,
  leave_balance  INT            DEFAULT 25,
  leave_used     INT            DEFAULT 0,
  password_hash  VARCHAR(255)   NULL,
  pin            VARCHAR(10)    NULL DEFAULT '1234',
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);
```

#### `attendance_records`

```sql
CREATE TABLE attendance_records (
  id            VARCHAR(25)   PRIMARY KEY,
  employee_id   VARCHAR(10)   NOT NULL REFERENCES employees(id),
  date          DATE          NOT NULL,
  check_in      TIME          NULL,
  check_out     TIME          NULL,
  status        ENUM('Présent','Absent','Retard','Congé','Télétravail') NOT NULL,
  hours_worked  DECIMAL(5,2)  NULL,  -- calculé automatiquement
  note          TEXT,
  UNIQUE KEY (employee_id, date)     -- un seul pointage par jour par employé
);
```

#### `departments`

```sql
CREATE TABLE departments (
  id         VARCHAR(20)  PRIMARY KEY,
  company_id VARCHAR(10)  NOT NULL REFERENCES companies(id),
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (company_id, name)      -- nom unique par entreprise
);
```

### Migrations automatiques au démarrage

Le serveur applique automatiquement les migrations suivantes à chaque démarrage :

1. **Colonnes géolocalisation** (`ensureGeoColumns`) : ajoute `latitude`, `longitude`, `geo_radius` à `companies` si absentes
2. **Table reports** (`ensureReportsTable`) : crée la table si elle n'existe pas
3. **Table departments** (`ensureDepartmentsTable`) : crée la table si elle n'existe pas
4. **Migration ENUM→VARCHAR** : convertit `employees.department` de `ENUM` en `VARCHAR(100)` pour accepter les départements personnalisés

---

## Authentification et sécurité

### Hachage des mots de passe

Les mots de passe sont hachés avec **SHA-256** via le module `crypto` natif de Node.js, compatible avec `SHA2(password, 256)` de MySQL :

```javascript
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

Aucun mot de passe ni hash ne figure dans les réponses API. En cas d'erreur de connexion, le message est volontairement générique pour éviter l'énumération de comptes.

### Headers de sécurité HTTP

Appliqués sur toutes les réponses via `securityHeaders` :

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
Cache-Control: no-store
Pragma: no-cache
```

### Rate Limiting

Implémenté en mémoire (classe `RateLimiter` dans `security.js`) :

| Endpoint | Limite | Fenêtre |
|---|---|---|
| `/api/auth` | 10 requêtes | 15 min |
| `/api/kiosk` | 30 requêtes | 10 min |
| `/api/superadmin` | 5 requêtes | 30 min |
| `/api/*` (global) | 200 requêtes | 1 min |

En cas de dépassement : `HTTP 429 Too Many Requests` avec header `Retry-After`.

### Protection PIN kiosque

- Compteur de tentatives par `(companyId, employeeId)` en mémoire
- **5 tentatives max** avant blocage
- **Durée de blocage : 15 minutes**
- Réinitialisation automatique après succès ou expiration

### CORS

Les origines autorisées sont définies par `ALLOWED_ORIGINS` dans `.env`. Les requêtes sans en-tête `Origin` (outils CLI, tests) sont toujours autorisées.

### Isolation multi-tenant

Chaque endpoint filtrant des données requiert un `companyId` (query param ou body). Les requêtes sans `companyId` valide retournent `400 Bad Request` ou une liste vide.

---

## Fonctionnalités métier

### Pointage géolocalisé (kiosk)

1. L'employé s'identifie par PIN
2. Le kiosque envoie les coordonnées GPS du navigateur (optionnel)
3. Le serveur récupère les coordonnées GPS de l'entreprise depuis la DB
4. Si des coordonnées existent, la distance est calculée (formule Haversine)
5. Si `distance > geo_radius` → `HTTP 403` avec `{ geoRequired: true }`
6. Sinon → le check-in ou check-out est enregistré

**Formule Haversine :**
```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // rayon Terre en mètres
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### Calcul automatique des heures

À la sortie (`check_out` renseigné) :
```
hours_worked = (check_out - check_in) en décimal (ex: 08:00 → 17:00 = 9.00h)
```

### Calcul automatique des retards

Le statut `Retard` est déterminé si `check_in > work_start + late_tolerance` (en minutes).

### Gestion des congés

- Création d'une demande → statut `En attente`
- Approbation → `leave_used += days`, statut `Approuvé`
- Refus → aucune modification du solde, statut `Refusé`

### Notifications automatiques

Deux tâches planifiées s'exécutent en arrière-plan :

| Tâche | Heure | Action |
|---|---|---|
| Vérification absences | 09h30 chaque jour | Notification pour chaque employé actif sans pointage du jour |
| Rapport mensuel | 08h00 le 1er du mois | Rapport de présence du mois précédent envoyé aux admins |

### Sauvegarde automatique

- **mysqldump** exécuté quotidiennement à 02h00
- Nommage : `backup_hr_attendance_db_YYYYMMDD_HHMMSS.sql`
- Stockage : `server/backups/`
- Rétention automatique : les `BACKUP_RETENTION` fichiers les plus récents sont conservés (défaut : 30)
- Un backup est également effectué au démarrage si le dernier date de plus de 24h

---

## Scripts disponibles

```bash
# Démarrer en production
npm start

# Démarrer en développement (nodemon - rechargement auto)
npm run dev

# Effectuer un backup manuel immédiat
npm run backup

# Effectuer un backup immédiat puis planifier les suivants
npm run backup:schedule
```

---

## Déploiement

### Configuration serveur

**Prérequis production :**
- Node.js ≥ 18.x
- MySQL 8.0+
- Optionnel : PM2 pour la gestion du processus Node.js

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer le serveur avec PM2
pm2 start server.js --name hr-backend

# Démarrer au boot
pm2 startup
pm2 save
```

### Variables de production

Adaptez `server/.env` pour la production :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=hr_user
DB_PASSWORD=mot_de_passe_fort
DB_NAME=hr_attendance_db
PORT=3002
SUPER_ADMIN_PASSWORD=mot_de_passe_tres_fort
ALLOWED_ORIGINS=https://votre-domaine.com
AUTO_BACKUP=true
BACKUP_RETENTION=30
```

### Sécurité en production

- Utiliser un utilisateur MySQL dédié avec droits limités (pas de `root`)
- Activer SSL/TLS sur MySQL si la connexion est distante
- Placer le backend derrière un reverse proxy Nginx avec HTTPS
- Rotation régulière de `SUPER_ADMIN_PASSWORD`

### Configuration Nginx (reverse proxy)

```nginx
server {
    listen 443 ssl;
    server_name api.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/api.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Logs

Les logs sont écrits dans la console standard. En production avec PM2 :

```bash
pm2 logs hr-backend
pm2 logs hr-backend --lines 100
```

---

## Liens utiles

- [Documentation Frontend](../README.md)
- [Documentation API](../API.md)
- [Schéma base de données](../database.sql)
