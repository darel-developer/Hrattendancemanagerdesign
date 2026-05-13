# RAPPORT D'AUDIT TECHNIQUE — HR Attendance Manager

<div align="center">

**Audit applicatif complet · Architecture Fullstack · Analyse de sécurité**

*Généré le 13 mai 2026 · Version 1.0*

</div>

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Objectifs métier](#2-objectifs-métier)
3. [Architecture globale](#3-architecture-globale)
4. [Technologies utilisées](#4-technologies-utilisées)
5. [Structure frontend](#5-structure-frontend)
6. [Structure backend](#6-structure-backend)
7. [Analyse détaillée des modules](#7-analyse-détaillée-des-modules)
8. [Analyse des flux fonctionnels](#8-analyse-des-flux-fonctionnels)
9. [Analyse de la base de données](#9-analyse-de-la-base-de-données)
10. [Analyse des API](#10-analyse-des-api)
11. [Analyse de la sécurité](#11-analyse-de-la-sécurité)
12. [Analyse des performances](#12-analyse-des-performances)
13. [Forces de l'application](#13-forces-de-lapplication)
14. [Faiblesses et risques techniques](#14-faiblesses-et-risques-techniques)
15. [Bugs potentiels identifiés](#15-bugs-potentiels-identifiés)
16. [Problèmes d'architecture](#16-problèmes-darchitecture)
17. [Recommandations d'amélioration](#17-recommandations-damélioration)
18. [Recommandations de sécurité](#18-recommandations-de-sécurité)
19. [Optimisations possibles](#19-optimisations-possibles)
20. [Bonnes pratiques à appliquer](#20-bonnes-pratiques-à-appliquer)
21. [Conclusion technique globale](#21-conclusion-technique-globale)

---

## 1. Présentation générale

HR Attendance Manager est une application web fullstack de gestion des ressources humaines conçue pour un contexte **multi-entreprises**. Elle couvre l'ensemble du cycle de vie RH : gestion des employés, pointage géolocalisé, congés, planning, évaluations de performance, documents, rapports et notifications automatiques.

### Caractéristiques architecturales principales

| Critère | Valeur |
|---|---|
| Type | SPA (Single Page Application) + API REST |
| Modèle | Multi-tenant (isolation par `company_id`) |
| Authentification | Session localStorage (pas de JWT) |
| Base de données | MySQL 8.0, relationnelle |
| Déploiement cible | Local / VPS Linux |
| Internationalisation | Français / Anglais |
| PWA | Oui (manifest + service worker) |
| Accessibilité | Radix UI (primitives accessibles) |

### État général

L'application est **fonctionnelle et complète** dans ses fonctionnalités métier. Elle présente cependant des lacunes importantes en matière de **sécurité des API**, de **gestion des autorisations côté serveur** et de **robustesse technique** qui doivent être adressées avant tout déploiement en production exposé à Internet.

---

## 2. Objectifs métier

L'application répond aux besoins suivants :

### Gestion des ressources humaines
- Centraliser l'information employé (coordonnées, contrat, poste, ancienneté)
- Gérer les organigrammes via la hiérarchie manager/employé
- Suivre les soldes et consommations de congés

### Suivi de la présence
- Enregistrer les entrées et sorties en temps réel via kiosque tactile
- Valider la présence physique par géolocalisation GPS
- Calculer automatiquement les heures travaillées et les retards

### Administration RH
- Gérer les départements avec affectation des employés
- Approuver/refuser les demandes de congés
- Planifier les équipes et les quarts de travail

### Reporting et analytics
- Générer des tableaux de bord avec KPIs en temps réel
- Exporter les données en CSV et PDF
- Diffuser des rapports mensuels automatiques

### Supervision multi-entreprises
- Permettre à un super-administrateur de gérer plusieurs entreprises clientes
- Isoler strictement les données de chaque entreprise

---

## 3. Architecture globale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Navigateur)                      │
│                                                             │
│  React 18 + TypeScript + Vite 6                            │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  AuthContext  │  │ ThemeContext  │  │  LayoutContext  │ │
│  └───────┬───────┘  └──────────────┘  └─────────────────┘ │
│          │                                                  │
│  ┌───────▼───────────────────────────────────────────────┐ │
│  │           React Router v7 (14 routes)                 │ │
│  └───────────────────────────┬───────────────────────────┘ │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐ │
│  │              api.ts (Fetch + /api proxy)               │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (proxy Vite → port 3002)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  SERVEUR (Node.js / Express)                 │
│                                                             │
│  Middlewares: securityHeaders, CORS, JSON, rateLimiter      │
│                                                             │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ /auth  │ │/employees│ │/kiosk    │ │ /companies      │ │
│  │/leaves │ │/attendance│ │/depts    │ │ /notifications  │ │
│  │/reports│ │/performance│ │/planning │ │ /documents      │ │
│  └────────┘ └──────────┘ └──────────┘ └─────────────────┘ │
│                                                             │
│  Schedulers: absences@09:30 · rapport mensuel@1er 08:00    │
│  Backup: mysqldump quotidien@02:00                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ mysql2/promise (pool 10)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    MySQL 8.0 (port 3306)                     │
│              Base : hr_attendance_db                        │
│  10 tables : companies, employees, attendance_records,      │
│  leave_requests, notifications, reports, departments,       │
│  performance_reviews, employee_documents, team_shifts       │
└─────────────────────────────────────────────────────────────┘
```

### Flux de démarrage du serveur

Au démarrage (`app.listen`), le serveur exécute séquentiellement :
1. `ensureReportsTable()` — crée la table `reports` si absente
2. `ensureDepartmentsTable()` — crée la table `departments` si absente
3. `ensureGeoColumns()` — ajoute `latitude`, `longitude`, `geo_radius` à `companies`
4. Migration `ENUM → VARCHAR` sur `employees.department`
5. `scheduleAutoNotifications()` — planifie les tâches cron
6. Backup conditionnel au démarrage (si dernier backup > 24h)

### Modèle multi-tenant

L'isolation des données repose sur un champ `company_id` présent dans toutes les tables. Le filtre est appliqué par les routes via des query params (`?companyId=...`). **Ce mécanisme est déclaratif, non contraint côté serveur** (voir section Sécurité).

---

## 4. Technologies utilisées

### Frontend

| Catégorie | Technologie | Version | Justification |
|---|---|---|---|
| Framework | React | 18.3.1 | Écosystème, hooks, performance |
| Langage | TypeScript | 5.x | Sécurité typage, maintenance |
| Build | Vite | 6.4.2 | HMR rapide, ESM natif |
| Styling | Tailwind CSS | 4.1.12 | Utilitaire, performance CSS |
| UI primitives | Radix UI | 1.x | Accessibilité WAI-ARIA |
| Design system | shadcn/ui | — | Composants sur Radix |
| Icônes | Lucide React | 0.487.0 | SVG optimisés |
| Animations | Framer Motion | 12.23.24 | Transitions fluides |
| Routing | React Router | 7.13.0 | SPA, nested routes |
| Formulaires | React Hook Form | 7.55.0 | Performance (no re-render) |
| Graphiques | Recharts | 2.15.2 | Responsive SVG charts |
| Export | xlsx + jsPDF | 0.18.5 + 4.2.1 | Excel et PDF côté client |
| Dates | date-fns | 3.6.0 | Léger, tree-shakeable |
| Toasts | Sonner | 2.0.3 | Accessibles, animés |
| MUI | Material UI | 7.3.5 | Composants complémentaires |
| i18n | Dictionnaire custom | — | FR/EN (translations.ts) |

### Backend

| Catégorie | Technologie | Version | Justification |
|---|---|---|---|
| Runtime | Node.js | ≥18.x | JavaScript universel |
| Framework HTTP | Express.js | 4.22.1 | Léger, modulaire |
| Base de données | MySQL | 8.0+ | Relationnelle, ACID |
| Driver DB | mysql2/promise | 3.22.3 | Async/await natif |
| Variables env | dotenv | 16.6.1 | Standard Node |
| CORS | cors | 2.8.6 | Middleware officiel |
| Hachage | crypto (natif) | — | SHA-256 (voir ⚠️) |
| Dev | nodemon | 3.1.0 | Rechargement auto |

### Outillage

| Outil | Usage |
|---|---|
| Vite Proxy | Redirige `/api/*` → `localhost:3002` en dev |
| .npmrc `include=dev` | Contourne `NODE_ENV=production` global |
| mysqldump | Sauvegarde SQL automatisée |
| Service Worker | Caching PWA |

---

## 5. Structure frontend

### Arborescence complète

```
src/
├── app/
│   ├── App.tsx                    # Providers ThemeProvider > AuthProvider > RouterProvider
│   ├── main.tsx                   # ReactDOM.createRoot, import CSS global
│   ├── routes.tsx                 # createBrowserRouter : 14 routes + fallback
│   │
│   ├── context/
│   │   ├── AuthContext.tsx        # Session, CRUD employés, login/logout
│   │   ├── ThemeContext.tsx       # Thème light/dark + langue + t()
│   │   └── LayoutContext.tsx      # État sidebar mobile (mobileOpen)
│   │
│   ├── data/
│   │   ├── mockData.ts            # Interfaces TypeScript (Employee, Company…)
│   │   └── translations.ts        # Dictionnaire FR/EN (TranslationKey)
│   │
│   ├── services/
│   │   └── api.ts                 # Client HTTP (13 namespaces, fetch natif)
│   │
│   ├── pages/                     # 16 pages, une par route
│   │   ├── LoginPage.tsx          # Formulaire email/password, redirect post-login
│   │   ├── DashboardPage.tsx      # KPIs + graphiques Recharts (547 lignes)
│   │   ├── EmployeesPage.tsx      # Liste + CRUD + import/export CSV
│   │   ├── EmployeeDetailPage.tsx # Profil employé avec onglets
│   │   ├── AttendancePage.tsx     # Pointages journaliers + export
│   │   ├── CalendarPage.tsx       # Vue calendrier mensuel
│   │   ├── LeavesPage.tsx         # Congés + workflow approbation
│   │   ├── PlanningPage.tsx       # Grille hebdomadaire des quarts
│   │   ├── PerformancePage.tsx    # Évaluations 1–5 étoiles
│   │   ├── DocumentsPage.tsx      # Documents + alertes expiration
│   │   ├── ReportsPage.tsx        # Messagerie interne + export PDF
│   │   ├── NotificationsPage.tsx  # Centre notifications
│   │   ├── SettingsPage.tsx       # Profil + géolocalisation entreprise
│   │   ├── DepartmentsPage.tsx    # CRUD départements (Admin only)
│   │   ├── KioskPage.tsx          # Pointage public PIN + GPS (469 lignes)
│   │   └── SuperAdminPage.tsx     # Gestion entreprises globale
│   │
│   └── components/
│       ├── layout/
│       │   ├── Layout.tsx         # Guard auth + Sidebar + Header + Outlet
│       │   ├── Sidebar.tsx        # Navigation + badges notifications
│       │   └── Header.tsx         # Barre supérieure + hamburger mobile
│       ├── ui/                    # ~40 composants Radix/shadcn
│       ├── AppLogo.tsx            # Logo SVG dégradé indigo-violet
│       └── figma/
│           └── ImageWithFallback.tsx
```

### Hiérarchie des providers

```
ThemeProvider (thème CSS, langue, traduction t())
  └── AuthProvider (session, employés, CRUD)
        └── RouterProvider
              ├── /login  → LoginPage  (public)
              ├── /kiosk  → KioskPage  (public, aucune auth)
              ├── /superadmin → SuperAdminPage (mot de passe dédié)
              └── /  → Layout (guard: redirect /login si !isAuthenticated)
                    └── Outlet → pages authentifiées
```

### Guard d'authentification

Le seul guard de l'application est dans `Layout.tsx` (lignes 19–21) :

```typescript
if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}
```

**Observation critique** : Ce guard protège toutes les routes enfants de `/`, mais `/kiosk` et `/superadmin` sont des routes de premier niveau — elles ne passent **pas** par `Layout` et n'ont **aucun guard**.

### Gestion des rôles côté frontend

Les rôles contrôlent uniquement :
- L'affichage des éléments de navigation dans `Sidebar.tsx` (prop `roles: string[]`)
- L'affichage conditionnel de certains boutons dans les pages

**Il n'y a aucun guard de route par rôle** : un Employee qui connaît l'URL `/departments` peut y accéder directement en naviguant manuellement.

### Gestion de l'état

| Donnée | Stockage | Durée |
|---|---|---|
| Utilisateur connecté | `AuthContext` (mémoire) + `localStorage.hr_session` | Permanente |
| Liste employés de l'entreprise | `AuthContext` (mémoire) | Session |
| Thème | `ThemeContext` + `localStorage.hr-theme` | Permanente |
| Langue | `ThemeContext` + `localStorage.hr-language` | Permanente |
| Sidebar mobile | `LayoutContext` (mémoire) | Volatile |
| Vérification super-admin | `sessionStorage.hr_superadmin` | Session onglet |
| Données spécifiques aux pages | `useState` local | Volatile |

---

## 6. Structure backend

### Arborescence

```
server/
├── server.js          # Point d'entrée, montage routes, schedulers, migrations
├── db.js              # Pool mysql2 (10 connexions, dateStrings: true)
├── security.js        # securityHeaders middleware + classe RateLimiter
├── backup.js          # mysqldump automatique, gestion rétention
├── package.json       # 4 dépendances prod, 1 dev
│
└── routes/
    ├── auth.js            # POST /login, POST /change-password
    ├── employees.js       # CRUD employés + mapEmployee()
    ├── attendance.js      # CRUD pointages + upsert par date
    ├── kiosk.js           # PIN check + Haversine + check-in/out (172 lignes)
    ├── companies.js       # CRUD entreprises + ensureGeoColumns()
    ├── departments.js     # CRUD + cascade rename + ensureTable()
    ├── leaves.js          # CRUD congés + cascade soldes
    ├── notifications.js   # CRUD notifications + bulk read/delete
    ├── reports.js         # CRUD rapports + ensureTable()
    ├── performance.js     # CRUD évaluations
    ├── documents.js       # CRUD documents RH
    ├── planning.js        # CRUD quarts + upsert par (employee,date)
    └── superadmin.js      # POST /verify (mot de passe en clair)
```

### Montage des routes dans server.js

```
Rate limiters appliqués :
  /api/auth      → authLimiter      (10 req / 15 min)
  /api/kiosk     → kioskLimiter     (30 req / 10 min)
  /api/superadmin→ superadminLimiter (5 req / 30 min)
  /api/*         → generalLimiter   (200 req / 60 sec)

Routes standards (pas de middleware d'autorisation) :
  /api/employees, /api/attendance, /api/leaves,
  /api/notifications, /api/companies, /api/reports,
  /api/departments, /api/performance, /api/documents,
  /api/planning
```

### Pattern de mappage DB → API

Chaque route définit une fonction `mapXxx(row)` qui :
- Transforme les noms `snake_case` en `camelCase`
- Exclut les champs sensibles (`password_hash`, `pin`)
- Parse les types MySQL (float, int, boolean)
- Formate les dates ISO

Exemple (`mapEmployee`) :
```javascript
function mapEmployee(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    firstName: row.first_name,
    // ... pas de password_hash ni pin dans la réponse
    leaveBalance: parseInt(row.leave_balance),
    leaveUsed: parseInt(row.leave_used),
  };
}
```

---

## 7. Analyse détaillée des modules

### 7.1 Module Authentification

**Fichiers** : `server/routes/auth.js`, `src/app/context/AuthContext.tsx`, `src/app/pages/LoginPage.tsx`

**Flux de connexion** :
```
[LoginPage] email + password
    → authApi.login()
    → POST /api/auth/login
    → Recherche employee par email (case-insensitive)
    → Compare SHA256(password) vs password_hash
    → Retourne Employee complet (sans hash)
    → AuthContext : setCurrentUser + setEmployees + setCurrentCompany
    → localStorage.setItem('hr_session', {userId, companyId})
```

**Restauration de session** :
```
useEffect au montage AuthProvider
    → Lit localStorage.hr_session
    → Promise.all([getAll(companyId), getById(companyId)])
    → Reconstruit state complet
    → Erreur réseau → clear localStorage
```

**Points d'attention** :
- SHA-256 sans sel — vulnérable aux attaques par dictionnaire et rainbow tables
- Pas d'expiration de session — session permanente jusqu'à `logout()` explicite
- Pas de gestion de token de rafraîchissement
- Message d'erreur générique côté serveur (bonne pratique respectée)

### 7.2 Module Employés

**Fichiers** : `server/routes/employees.js`, `src/app/pages/EmployeesPage.tsx`, `src/app/pages/EmployeeDetailPage.tsx`

**Fonctionnalités** :
- Liste filtrée par `companyId`, `role`, recherche textuelle côté client
- CRUD complet avec validation côté serveur (email regex, PIN 4–8 chiffres)
- Avatar stocké en base64 dans la colonne `TEXT` de MySQL
- Import CSV (onglet dans `AddEmployeeModal`)
- Export CSV via bibliothèque `xlsx`
- Profil détaillé avec onglets : infos, pointages, congés, évaluations, documents

**Validation serveur** (`employees.js`) :
```
firstName, lastName : string ≤ 100 chars
email              : regex RFC + UNIQUE MySQL
role               : Admin | Manager | Employee
contractType       : CDI | CDD | Stage | Freelance
status             : Actif | Inactif | En congé
pin                : /^\d{4,8}$/ (optionnel)
password           : ≥ 6 chars (optionnel)
salary             : float ≥ 0
```

**Problème identifié** : Le type TypeScript `department` dans `mockData.ts` est encore typé comme l'ancien `ENUM` hardcodé :
```typescript
// mockData.ts - type obsolète
export type Department = "Ingénierie" | "RH" | "Marketing" | "Finance" | "Direction" | "Design";
```
La colonne DB est `VARCHAR(100)` depuis la migration, mais le type TS n'a pas été mis à jour vers `string`.

### 7.3 Module Kiosque de Pointage

**Fichier** : `server/routes/kiosk.js` (172 lignes), `src/app/pages/KioskPage.tsx` (469 lignes)

**Flux complet** :
```
1. Affichage liste employés actifs (GET /kiosk/employees/:companyId)
2. Sélection employé + saisie PIN
3. Détection GPS navigateur (hook useGeolocation, refresh 30s)
4. Envoi POST /kiosk/checkin (employeeId, pin, companyId, lat?, lng?)

Côté serveur :
5. Vérification lockout PIN (Map en mémoire)
6. Requête employee + company (JOIN unique SQL)
7. Vérification Haversine si coordonnées company présentes
8. Vérification PIN (SHA256)
9. Logique : premier check-in du jour OU check-out
10. Calcul retard (nowTime vs work_start + late_tolerance)
11. INSERT / UPDATE attendance_records
12. Retour action + statut
```

**Formule Haversine implémentée** :
```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // mètres
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

**Protection brute-force** :
- Map en mémoire : `pinFailures = new Map()`
- MAX_ATTEMPTS = 5, LOCKOUT_MS = 900000 (15 min)
- Clé : `${companyId}:${employeeId}`
- **Limitation** : état perdu au redémarrage du serveur

### 7.4 Module Congés

**Fichier** : `server/routes/leaves.js`, `src/app/pages/LeavesPage.tsx`

**Workflow** :
```
Employee       → Crée demande (status: "En attente")
Admin/Manager  → Approuve (leave_used += days, status: "Approuvé")
             → Refuse  (pas de modification solde, status: "Refusé")
```

**Calcul du solde** : À l'approbation, `leave_used += days`. La vérification de solde disponible (`leave_balance - leave_used`) n'est pas contrôlée côté serveur — il est possible d'approuver plus de jours que le solde disponible.

### 7.5 Module Départements

**Fichier** : `server/routes/departments.js`, `src/app/pages/DepartmentsPage.tsx`

**Fonctionnalités avancées** :
- `ensureTable()` : population initiale depuis `DISTINCT department` des employés existants
- Renommage avec `UPDATE employees SET department = nouveau_nom WHERE company_id = ? AND department = ?` (cascade non transactionnelle)
- Suppression bloquée si `employeeCount > 0`

**Point positif** : La contrainte `UNIQUE(company_id, name)` en DB prévient les doublons.

### 7.6 Module Notifications automatiques

**Fichier** : `server/server.js` (lignes 76–197)

**Tâche 1 — Vérification absences (09h30 quotidien)** :
```javascript
// Employés actifs sans pointage aujourd'hui → notification "absence"
// Évite les doublons : vérifie l'existence en DB avant insertion
// ID : NOT + Date.now().toString(36).slice(-7).toUpperCase()
```

**Tâche 2 — Rapport mensuel (1er du mois à 08h00)** :
```javascript
// Pour chaque entreprise : calcule présents/absents/retards
// Envoie notification à chaque Admin de l'entreprise
// Replanifie automatiquement pour le mois suivant
```

**Limitation** : Utilise `setTimeout` / `setInterval` en mémoire — les timers sont perdus au redémarrage du processus.

### 7.7 Module Sauvegarde automatique

**Fichier** : `server/backup.js` (137 lignes)

**Comportement** :
```
Au démarrage : backup si dernier > 24h
Quotidien    : 02h00 (setTimeout recalculé dynamiquement)
Rétention    : 30 fichiers (configurable BACKUP_RETENTION)
Format       : backup_hr_attendance_db_YYYYMMDD_HHMMSS.sql
Options dump : --single-transaction --routines --triggers --add-drop-table
```

**Détection du chemin mysqldump** :
```javascript
// Windows : HKLM:\SOFTWARE\MySQL Installer for Windows
// Linux/Mac : which mysqldump
// Fallback : 'mysqldump' dans PATH
```

**Problème** : Sur Windows sans MySQL dans le PATH, le backup peut silencieusement échouer.

### 7.8 Module Rapports

Messagerie interne entre employés. Données persistées en table `reports` (créée à la demande).

### 7.9 Module Planning

Grille hebdomadaire des quarts (Matin, Après-midi, Nuit, Repos). Upsert sur `(employee_id, date)` — modification directe si le quart existe déjà.

### 7.10 Module Super Admin

Interface pour créer/supprimer des entreprises. Vérification par mot de passe simple en clair (`SUPER_ADMIN_PASSWORD`). Accès contrôlé côté frontend par `sessionStorage.hr_superadmin`.

---

## 8. Analyse des flux fonctionnels

### 8.1 Flux de démarrage de l'application

```
1. index.html charge main.tsx
2. React monte : ThemeProvider > AuthProvider > RouterProvider
3. AuthProvider.useEffect :
   a. Lit localStorage.hr_session
   b. Si session : GET /api/employees?companyId + GET /api/companies/:id
   c. Reconstruit currentUser, employees, currentCompany
   d. loading → false
4. Layout.tsx : si !loading && !isAuthenticated → /login
5. Si authentifié → Dashboard
```

### 8.2 Flux de pointage complet

```
Kiosque (tablette)
├── Charge liste employés (GET /kiosk/employees/:companyId)
├── Employé choisit son nom
├── Saisit PIN (4-8 chiffres)
├── Navigator.geolocation.getCurrentPosition()
├── useGeolocation hook → vérifie distance vs rayon toutes les 30s
│
└── POST /kiosk/checkin
    ├── [Serveur] Vérifie lockout brute-force
    ├── [Serveur] Vérifie distance GPS (si company a coordonnées)
    │   └── distance > radius → 403 geoRequired: true
    ├── [Serveur] Compare PIN hash
    │   └── Erreur → compteur +1, 5 max → lockout 15min
    ├── [Serveur] Premier pointage du jour ?
    │   ├── OUI → check_in, calcul retard → INSERT
    │   └── NON → check_out, calcul heures → UPDATE
    └── Retour : action, time, status, employee
```

### 8.3 Flux d'approbation de congé

```
Employee → POST /api/leaves (status: "En attente")
         → Notification créée pour Admin/Manager
Admin    → GET /api/leaves?companyId=...
         → PUT /api/leaves/:id {status: "Approuvé", reviewedBy, comment}
         → [Serveur] leave_used += days (UPDATE employees)
         → Notification créée pour l'employé
```

### 8.4 Flux notifications automatiques

```
Scheduler 09:30 (setTimeout 24h)
└── SELECT employees WHERE status='Actif'
└── SELECT DISTINCT employee_id FROM attendance WHERE date=today
└── Pour chaque absent :
    └── Vérifier doublon notification today
    └── INSERT notification type='absence'

Scheduler 1er du mois 08:00 (setTimeout recalculé)
└── Pour chaque entreprise :
    └── Calcul stats mois précédent
    └── Pour chaque Admin : INSERT notification type='system'
```

---

## 9. Analyse de la base de données

### 9.1 Schéma complet

```sql
companies (10 colonnes)
├── id VARCHAR(10) PK
├── name, sector, address, hr_email
├── work_start TIME (défaut '09:00:00')
├── late_tolerance INT (défaut 5)
├── latitude DECIMAL(10,7) NULL         ← ajouté par migration auto
├── longitude DECIMAL(10,7) NULL        ← ajouté par migration auto
└── geo_radius INT DEFAULT 100          ← ajouté par migration auto

employees (21 colonnes)
├── id VARCHAR(10) PK
├── company_id FK → companies(id) CASCADE DELETE
├── first_name, last_name, email UNIQUE, phone
├── avatar TEXT                          ← base64, pas de limite de taille
├── role ENUM('Admin','Manager','Employee')
├── department VARCHAR(100)              ← migré de ENUM à VARCHAR
├── position, contract_type, start_date, salary
├── status ENUM('Actif','Inactif','En congé')
├── manager_id FK → employees(id) SET NULL
├── address, birth_date
├── leave_balance INT DEFAULT 25
├── leave_used INT DEFAULT 0
├── password_hash VARCHAR(255) NULL
└── pin VARCHAR(10) NULL DEFAULT '1234'

attendance_records (9 colonnes)
├── id VARCHAR(25) PK
├── employee_id FK → employees(id) CASCADE DELETE
├── date DATE
├── check_in TIME NULL, check_out TIME NULL
├── status ENUM('Présent','Absent','Retard','Congé','Télétravail')
├── hours_worked DECIMAL(5,2) NULL
├── note TEXT
└── UNIQUE(employee_id, date)           ← contrainte clé

leave_requests (12 colonnes)
├── id VARCHAR(20) PK
├── employee_id FK → employees(id) CASCADE DELETE
├── type ENUM('Congé annuel','Maladie','Congé maternité','RTT','Exceptionnel')
├── start_date, end_date, days
├── reason TEXT, status ENUM, request_date
├── reviewed_by FK → employees(id) NULL
└── review_date, comment

notifications (8 colonnes)
├── id VARCHAR(20) PK
├── type ENUM('absence','conge','document','retard','system')
├── title VARCHAR(255), message TEXT
├── date DATETIME, is_read BOOLEAN
└── employee_id FK → employees(id) NULL

reports (7 colonnes)
├── id VARCHAR(20) PK
├── sender_id FK → employees(id) CASCADE DELETE
├── recipient_id FK → employees(id) SET NULL
├── title VARCHAR(255), type VARCHAR(100)
├── content TEXT
└── is_read BOOLEAN DEFAULT FALSE

performance_reviews (9 colonnes)
├── id VARCHAR(20) PK
├── employee_id, reviewer_id FK → employees(id)
├── period VARCHAR(50), rating INT NULL
├── strengths, improvements, goals TEXT
└── status ENUM('Brouillon','Soumis','Acquitté')

employee_documents (7 colonnes)
├── id VARCHAR(20) PK
├── employee_id FK → employees(id)
├── title, type VARCHAR, file_url TEXT
└── expiry_date DATE NULL

team_shifts (8 colonnes)
├── id VARCHAR(20) PK
├── employee_id FK → employees(id)
├── date DATE
├── start_time, end_time TIME NULL
├── shift_type ENUM('Matin','Après-midi','Nuit','Repos')
├── note TEXT
└── UNIQUE(employee_id, date)

departments (4 colonnes)
├── id VARCHAR(50) PK
├── company_id FK → companies(id)
├── name VARCHAR(100)
└── UNIQUE(company_id, name)
```

### 9.2 Relations et intégrité

| Relation | Type | Contrainte |
|---|---|---|
| employees → companies | N:1 | FK CASCADE DELETE |
| attendance → employees | N:1 | FK CASCADE DELETE |
| leave_requests → employees | N:1 | FK CASCADE DELETE |
| notifications → employees | N:1 | FK (nullable) |
| reports → employees | N:1 | CASCADE DELETE (sender) / SET NULL (recipient) |
| performance → employees | N:1 (x2) | FK (employé + évaluateur) |
| employee_documents → employees | N:1 | FK |
| team_shifts → employees | N:1 | FK + UNIQUE(employee,date) |
| employees → employees | N:1 (self) | manager_id, SET NULL |
| departments → companies | N:1 | FK |

### 9.3 Points d'attention sur la base de données

**Absences d'index identifiées** :
- `employees.company_id` — pas d'index déclaré explicitement (FK crée souvent un index implicite sous MySQL, à vérifier)
- `attendance_records.date` — colonne très filtrée, devrait avoir un index
- `notifications.employee_id` — filtrée fréquemment
- `leave_requests.status` — filtrée pour les congés en attente

**Problème de taille** :
- `employees.avatar TEXT` stocke les avatars en base64 directement en DB. Un avatar JPEG 300×300 peut peser 80–150 Ko après encodage base64. Sur 100 employés = 10–15 Mo dans une seule table.

**Absence de mécanisme d'audit** :
- Aucune table d'historique ni de champ `updated_at` dans la plupart des tables
- Impossible de savoir qui a modifié quoi et quand

**Migrations non versionnées** :
- Les migrations sont appliquées au démarrage de manière idempotente (ADD COLUMN IF NOT EXISTS) mais sans système de versioning (Flyway, Liquibase, ou équivalent Node)

**Valeur par défaut du PIN** :
- `pin VARCHAR(10) NULL DEFAULT '1234'` — tous les nouveaux employés ont par défaut le PIN `1234` s'il n'est pas spécifié

---

## 10. Analyse des API

### 10.1 Inventaire complet des endpoints

| Module | Méthode | Route | Description |
|---|---|---|---|
| **Auth** | POST | `/auth/login` | Connexion |
| | POST | `/auth/change-password` | Changement mot de passe |
| **Employees** | GET | `/employees` | Liste (filtre companyId, role) |
| | GET | `/employees/:id` | Détail |
| | POST | `/employees` | Création |
| | PUT | `/employees/:id` | Modification |
| | DELETE | `/employees/:id` | Suppression |
| **Attendance** | GET | `/attendance` | Liste (filtres multiples) |
| | POST | `/attendance` | Upsert |
| | PUT | `/attendance/:id` | Modification |
| **Kiosk** | GET | `/kiosk/employees/:companyId` | Liste kiosque |
| | POST | `/kiosk/checkin` | Check-in/out par PIN |
| **Companies** | GET | `/companies` | Toutes entreprises |
| | GET | `/companies/:id` | Détail |
| | POST | `/companies` | Création |
| | PUT | `/companies/:id` | Modification |
| | DELETE | `/companies/:id` | Suppression |
| **Leaves** | GET | `/leaves` | Liste congés |
| | POST | `/leaves` | Création demande |
| | PUT | `/leaves/:id` | Approbation/refus |
| **Departments** | GET | `/departments` | Liste avec counts |
| | POST | `/departments` | Création |
| | PUT | `/departments/:id` | Renommage + cascade |
| | DELETE | `/departments/:id` | Suppression |
| **Notifications** | GET | `/notifications` | Liste |
| | POST | `/notifications` | Création |
| | PUT | `/notifications/read-all` | Tout marquer lu |
| | PUT | `/notifications/:id/read` | Marquer lu |
| | DELETE | `/notifications` | Tout supprimer |
| | DELETE | `/notifications/:id` | Supprimer une |
| **Reports** | GET | `/reports` | Liste |
| | POST | `/reports` | Envoi rapport |
| | PUT | `/reports/:id/read` | Marquer lu |
| | DELETE | `/reports/:id` | Supprimer |
| **Performance** | GET | `/performance` | Liste évaluations |
| | POST | `/performance` | Création |
| | PUT | `/performance/:id` | Modification |
| | DELETE | `/performance/:id` | Suppression |
| **Documents** | GET | `/documents` | Liste documents |
| | POST | `/documents` | Upload |
| | PUT | `/documents/:id` | Modification |
| | DELETE | `/documents/:id` | Suppression |
| **Planning** | GET | `/planning` | Liste quarts |
| | POST | `/planning` | Upsert quart |
| | PUT | `/planning/:id` | Modification |
| | DELETE | `/planning/:id` | Suppression |
| **SuperAdmin** | POST | `/superadmin/verify` | Vérification mdp |
| **Health** | GET | `/health` | Statut serveur |

**Total : 38 endpoints**

### 10.2 Cohérence et conventions

**Points positifs** :
- Conventions REST respectées (GET/POST/PUT/DELETE)
- Format de réponse JSON cohérent
- Messages d'erreur lisibles dans `{ "error": "..." }`
- Codes HTTP appropriés (201 à la création, 409 en cas de conflit, 429 pour rate limit)

**Points problématiques** :
- Pas de versioning d'API (`/v1/...`) — changements cassants impossibles sans coordination
- Mélange de query params et de body pour les filtres (inconsistant entre routes)
- Absence de pagination sur toutes les listes (risque sur gros volumes)
- `GET /notifications` avec `LIMIT 500` codé en dur — peu maintenable
- Les IDs sont générés côté client sur certains endpoints (POST employees) — risque de collision

### 10.3 Absence d'authentification API

**Aucun middleware d'authentification n'est présent sur les routes backend.**

Toute requête HTTP qui connaît l'URL et le `companyId` peut lire, créer, modifier ou supprimer des données sans présenter aucune preuve d'identité. Cette architecture convient à un usage intranet fermé mais est **inacceptable sur un déploiement exposé à Internet**.

---

## 11. Analyse de la sécurité

### 11.1 Tableau des risques

| Risque | Gravité | Probabilité | Priorité |
|---|---|---|---|
| API sans authentification token | Critique | Haute (si exposé) | P0 |
| SHA-256 sans sel pour les mots de passe | Haute | Moyenne | P1 |
| Escalade de privilèges horizontale | Haute | Moyenne | P1 |
| Session localStorage (XSS) | Haute | Basse | P2 |
| Super admin password plaintext | Haute | Basse | P2 |
| Absence de HTTPS enforcement | Haute | Haute (prod) | P2 |
| Absence de CSRF protection | Moyenne | Basse | P3 |
| PIN par défaut '1234' | Moyenne | Haute | P2 |
| Base64 avatar sans limite | Faible | Haute | P3 |
| Lockout PIN en mémoire (non persistant) | Faible | Basse | P4 |

### 11.2 Absence d'authentification sur les routes API

**Description** : Les routes backend (`/api/employees`, `/api/attendance`, etc.) ne disposent d'aucun middleware vérifiant que l'appelant est authentifié. N'importe quel client HTTP peut appeler :

```bash
# Lire tous les employés d'une entreprise connue
curl http://localhost:3002/api/employees?companyId=COMPGM001

# Supprimer un employé
curl -X DELETE http://localhost:3002/api/employees/EMPGM001

# Modifier un pointage
curl -X PUT http://localhost:3002/api/attendance/ATT001 \
  -H "Content-Type: application/json" \
  -d '{"status":"Présent","checkIn":"08:00"}'
```

**Impact** : Sur un déploiement en production accessible depuis Internet, toutes les données seraient exposées à quiconque connaît ou devine l'URL.

**Solution recommandée** : Implémenter un middleware JWT :
```javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}
```

### 11.3 Escalade de privilèges horizontale

**Description** : Le filtre `companyId` est consultatif. Un utilisateur de la société A peut requêter les données de la société B en changeant le paramètre dans sa requête :

```bash
# Utilisateur authentifié comme COMPGM001 lisant les données de COMP002
GET /api/employees?companyId=COMP002
```

**Solution** : Vérifier côté serveur que le `companyId` demandé correspond à celui de l'utilisateur authentifié (extrait du JWT).

### 11.4 Hachage SHA-256 des mots de passe

**Description** : SHA-256 est un algorithme de hachage rapide, conçu pour la performance — l'inverse de ce qu'on veut pour les mots de passe. Sans sel, deux utilisateurs avec le même mot de passe ont le même hash. Vulnérable aux attaques par dictionnaire et rainbow tables.

```javascript
// Actuel (faible)
crypto.createHash('sha256').update(password).digest('hex')

// Recommandé
await bcrypt.hash(password, 12)  // ~250ms intentionnel
```

**Impact** : En cas de fuite de la base de données, tous les mots de passe pourraient être craqués rapidement.

### 11.5 Session dans localStorage (XSS)

**Description** : La session `{ userId, companyId }` est stockée dans `localStorage`. En cas de faille XSS (injection de script dans la page), un attaquant peut voler cette session.

**Solution** : Utiliser des cookies `HttpOnly; Secure; SameSite=Strict` pour les tokens d'authentification — inaccessibles via JavaScript.

### 11.6 Mot de passe super-admin en clair dans l'environnement

**Fichier** : `server/routes/superadmin.js`

```javascript
// Comparaison en clair
if (password !== process.env.SUPER_ADMIN_PASSWORD) {
  return res.status(401).json({ valid: false });
}
```

**Risque** : Si le fichier `.env` est accidentellement versionné ou exposé, le mot de passe super-admin est immédiatement compromis.

### 11.7 Headers de sécurité (point positif)

Les headers suivants sont correctement appliqués sur toutes les réponses :
```
✅ X-Content-Type-Options: nosniff
✅ X-Frame-Options: DENY
✅ X-XSS-Protection: 1; mode=block
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: geolocation=(), camera=(), microphone=()
✅ Cache-Control: no-store
✅ Pragma: no-cache
```

### 11.8 Rate limiting (point positif)

Implémentation correcte avec 4 niveaux adaptés aux endpoints sensibles.

**Limitation** : Implémentation en mémoire Node.js — en cas de déploiement multi-instances ou redémarrage, les compteurs sont remis à zéro. Pour la production, utiliser Redis avec `express-rate-limit` + `rate-limit-redis`.

### 11.9 Protection CORS (point positif)

Whitelist d'origines correctement configurée via `ALLOWED_ORIGINS` en variables d'environnement.

---

## 12. Analyse des performances

### 12.1 Frontend

**Taille du bundle** :
- Avertissement Vite lors du build : chunk > 500 KB
- Pas de lazy loading des routes (`React.lazy + Suspense`)
- 20+ dépendances Radix UI importées en bloc
- MUI + Emotion + Radix + shadcn = risque de duplication de styles

**Appels API au chargement** :
- `AuthContext.useEffect` : 2 appels parallèles (employés + entreprise)
- Chaque page fait ses propres appels indépendants (pas de cache)
- Rechargement complet des données à chaque navigation

**Mémorisation** :
- Aucune utilisation de `useMemo` ou `useCallback` observée dans les composants principaux
- Les filtres et tris sont recalculés à chaque render

**Pagination** :
- Absente côté client — toutes les listes sont chargées en une fois
- Sur 1000+ enregistrements d'attendance, la page peut devenir lente

### 12.2 Backend

**Connexions DB** :
- Pool de 10 connexions — adéquat pour < 50 utilisateurs simultanés
- Pas de cache applicatif (Redis) — chaque requête frappe la DB

**Requêtes SQL observées** :
- `GET /companies` : JOIN avec COUNT sur employees — peut être lent sur grande volumétrie
- `GET /kiosk/employees/:companyId` : simple SELECT — performant
- `POST /kiosk/checkin` : 2 requêtes (employee+company) + 1 attendance — acceptable
- Notifications auto : boucle `for...of` avec `await db.query` à l'intérieur — N+1 problème potentiel sur gros volume d'employés

**Taille des réponses** :
- `employees` avec avatars base64 : chaque employé peut peser 100+ Ko
- `GET /employees?companyId=X` retourne l'intégralité des champs (y compris avatars) même quand seuls nom/prénom sont nécessaires

**Schedulers** :
- Utilisation de `setTimeout` chaîné pour le rapport mensuel — fonctionnel mais fragile (décalages possibles si le serveur est occupé)

---

## 13. Forces de l'application

### Architecture et code

| Force | Détail |
|---|---|
| **Modularité backend** | 13 fichiers de routes indépendants, chacun avec sa responsabilité claire |
| **Mappage DB → API** | Fonctions `mapXxx()` dans chaque route — séparation propre entre modèle DB et contrat API |
| **Contextes React bien structurés** | Séparation Auth / Thème / Layout respectée |
| **Client API centralisé** | Toutes les requêtes HTTP dans `api.ts` — facile à maintenir |
| **TypeScript** | Interfaces partagées dans `mockData.ts` — cohérence frontend |
| **Composants Radix UI** | Accessibilité WAI-ARIA native, sans effort supplémentaire |

### Fonctionnalités métier

| Force | Détail |
|---|---|
| **Géolocalisation kiosque** | Formule Haversine côté serveur — calcul fiable |
| **Protection brute-force PIN** | Lockout 15 min après 5 tentatives — bonne pratique |
| **Migrations automatiques** | Colonnes geo + VARCHAR migration au démarrage — zero-downtime |
| **Backup automatique** | mysqldump quotidien avec gestion de rétention |
| **Notifications schedulées** | Absences et rapports mensuels auto — valeur ajoutée sans intervention |
| **Multi-tenant** | Isolation par `company_id` sur toutes les tables |
| **i18n** | Support FR/EN natif dans toute l'interface |
| **PWA** | Manifest + Service Worker — installable sur mobile |
| **Export CSV/PDF** | Disponible sur les principales listes |
| **Rate limiting** | 4 niveaux adaptés aux risques de chaque endpoint |
| **Headers de sécurité** | Ensemble complet correctement configuré |

### Expérience utilisateur

| Force | Détail |
|---|---|
| **Mode sombre/clair** | Persisté en localStorage, toggle instantané |
| **Responsive** | Sidebar collapsible, overlay mobile |
| **Toasts informatifs** | Sonner pour les retours utilisateur (Sonner) |
| **Animations** | Framer Motion pour les transitions |
| **Profil détaillé** | EmployeeDetailPage avec onglets complets |
| **Kiosque autonome** | /kiosk sans auth — utilisable sur tablette dédiée |

---

## 14. Faiblesses et risques techniques

### Faiblesses critiques

| N° | Faiblesse | Impact | Module concerné |
|---|---|---|---|
| F1 | Aucune authentification sur les routes API | Exposition totale des données | Toutes les routes |
| F2 | Pas de contrôle d'autorisation serveur (RBAC) | Escalade de privilèges | Toutes les routes |
| F3 | SHA-256 sans sel pour mots de passe | Craquage trivial en cas de fuite DB | `auth.js`, `employees.js` |
| F4 | Session localStorage (XSS) | Vol de session par injection | `AuthContext` |
| F5 | companyId non vérifié côté serveur | Lecture/écriture cross-tenant | Toutes les routes |

### Faiblesses majeures

| N° | Faiblesse | Impact | Module concerné |
|---|---|---|---|
| F6 | Aucun système de pagination | Performance sur gros volumes | Toutes les listes |
| F7 | Absence de logs structurés | Debug production impossible | Backend entier |
| F8 | Pas de tests automatisés | Régressions non détectées | Tout |
| F9 | Rate limiting en mémoire (non distribué) | Inopérant en multi-instances | `security.js` |
| F10 | Schedulers via setTimeout (non persistants) | Tâches perdues au redémarrage | `server.js` |
| F11 | Avatars base64 en DB | Performances et taille DB | `employees` table |
| F12 | Type `Department` obsolète dans TypeScript | Erreurs silencieuses à la compilation | `mockData.ts` |
| F13 | Vérification solde congés absente côté serveur | Dépassement de solde possible | `leaves.js` |
| F14 | Cascades DB non atomiques (departments) | Incohérence possible en cas d'erreur | `departments.js` |
| F15 | PIN par défaut '1234' non forcé à changer | Sécurité kiosque compromise | `database.sql` |

### Risques techniques

| Risque | Probabilité | Impact |
|---|---|---|
| Fuite base de données → mots de passe craqués (SHA-256) | Faible | Très élevé |
| Panne serveur → schedulers perdus → absences non notifiées | Moyenne | Moyen |
| Croissance données → lenteur sans pagination | Haute | Élevé |
| Backup silencieusement échoué (mysqldump introuvable) | Moyenne | Élevé |
| Bundle JS trop gros → UX mobile dégradée | Haute | Moyen |

---

## 15. Bugs potentiels identifiés

### Bug #1 — Incohérence nomenclature Notification (Haute priorité)

**Fichier** : `src/app/data/mockData.ts` (ligne 75) vs `server/routes/notifications.js`

**Description** : L'interface TypeScript utilise `read: boolean`, tandis que le serveur retourne `isRead`.

```typescript
// mockData.ts
export interface Notification {
  read: boolean;    // ← attend "read"
}

// notifications.js - mapNotif()
return {
  isRead: row.is_read === 1  // ← retourne "isRead"
}
```

**Impact** : La propriété `read` sera toujours `undefined` côté React — les notifications ne seront jamais marquées comme lues dans l'UI.

---

### Bug #2 — Type Department obsolète (Moyenne priorité)

**Fichier** : `src/app/data/mockData.ts` (lignes 3–4)

**Description** : Le type `Department` est un union literal figé depuis la migration ENUM → VARCHAR.

```typescript
// OBSOLÈTE — correspond à l'ancien ENUM MySQL
export type Department = "Ingénierie" | "RH" | "Marketing" | "Finance" | "Direction" | "Design";

// Dans Employee :
department: Department;  // ← rejet TypeScript si valeur hors liste
```

**Impact** : Les départements personnalisés (ex: "Informatique", "Call Center") créent des erreurs TypeScript silencieuses ou des warnings. La compilation ne détecte pas les incohérences.

**Correction** :
```typescript
export type Department = string;  // ou supprimer le type alias
```

---

### Bug #3 — managerId vs manager dans Employee (Moyenne priorité)

**Fichier** : `src/app/data/mockData.ts` vs `server/routes/employees.js`

**Description** : L'interface TypeScript déclare `manager: string | null` mais `mapEmployee()` retourne `managerId`.

```typescript
// mockData.ts - reçu par l'UI
manager: string | null;

// employees.js - envoyé par le serveur
{ managerId: row.manager_id }  // champ "managerId", pas "manager"
```

**Impact** : `employee.manager` sera toujours `undefined` — l'affichage du manager dans les profils sera vide.

---

### Bug #4 — Fallback hardcodé "COMP001" dans AuthContext (Basse priorité)

**Fichier** : `src/app/context/AuthContext.tsx` (ligne 79)

```typescript
const withCompany = {
  ...emp,
  companyId: emp.companyId || currentUser?.companyId || "COMP001"
  //                                                      ↑ ID hardcodé
};
```

**Impact** : Si `companyId` n'est pas disponible (cas limite), un employé est rattaché à `COMP001` au lieu de lever une erreur claire.

---

### Bug #5 — Calcul heures travaillées en cas de pointage nocturne (Basse priorité)

**Fichier** : `server/routes/kiosk.js`

**Description** : Le calcul `hoursWorked` compare simplement les heures en décimal. Pour un employé en quart de nuit (ex: check-in 22h00, check-out 06h00), le résultat serait négatif (-16h).

**Impact** : Heures travaillées incorrectes pour les équipes de nuit.

---

### Bug #6 — Dépassement de solde de congés (Basse priorité)

**Fichier** : `server/routes/leaves.js`

**Description** : L'approbation d'un congé incrémente `leave_used` sans vérifier que `leave_balance - leave_used >= days`.

**Impact** : Possible approbation de plus de jours de congé que le solde disponible.

---

### Bug #7 — Race condition sur les notifications (Très basse priorité)

**Fichier** : `server/server.js` (lignes 82–114)

**Description** : La vérification anti-doublon des notifications d'absence (SELECT + INSERT) n'est pas atomique. Si deux instances du serveur tournent simultanément et s'exécutent au même instant, des doublons peuvent être créés.

---

## 16. Problèmes d'architecture

### P1 — Absence de couche d'autorisation serveur

L'architecture actuelle ne distingue pas l'**authentification** (qui êtes-vous ?) de l'**autorisation** (que pouvez-vous faire ?). Il n'existe aucun RBAC (Role-Based Access Control) côté serveur.

**Architecture actuelle** :
```
Client → Route Express → DB
```

**Architecture cible** :
```
Client → Route Express → [AuthMiddleware] → [RoleMiddleware] → DB
```

### P2 — Couplage fort entre AuthContext et gestion des employés

`AuthContext` gère à la fois la session utilisateur ET la liste des employés de l'entreprise. Ces deux responsabilités devraient être séparées.

**Problème** :
- La liste des employés en mémoire peut devenir obsolète (autre onglet, autre utilisateur)
- Toute modification d'un employé nécessite une mise à jour manuelle du state local
- Le contexte d'auth est rechargé à chaque accès à la liste

### P3 — Routage sans guards de rôle

Les routes React sont définies dans `routes.tsx` sans aucun garde basé sur les rôles. L'accès à `/departments` (Admin uniquement) n'est contrôlé qu'au niveau visuel (sidebar), pas au niveau de la route.

```typescript
// Actuel : aucune protection
{ path: "departments", Component: DepartmentsPage }

// Recommandé
{ path: "departments", element: <RequireRole roles={["Admin"]}><DepartmentsPage /></RequireRole> }
```

### P4 — Migrations au démarrage sans versioning

Les migrations SQL sont appliquées automatiquement à chaque démarrage. Cette approche est :
- Risquée en production (une migration erronée peut être rejouée)
- Non traçable (impossible de savoir quelle version de schema est appliquée)
- Non réversible (pas de mécanisme de rollback)

### P5 — Pas de séparation des environnements

Un seul fichier `.env` sans distinction dev/staging/production. La même base de données et les mêmes credentials peuvent être utilisés en dev et en prod par erreur.

### P6 — IDs générés côté client

Plusieurs endpoints acceptent un `id` fourni par le client :
```javascript
// POST /employees - l'ID est fourni dans le body
const id = req.body.id || `EMP${Date.now().toString(36).toUpperCase()}`;
```

**Problèmes** :
- Risque de collision si deux clients créent simultanément
- Le client peut injecter n'importe quel ID, y compris l'ID d'un employé existant d'une autre entreprise

### P7 — Bundle non optimisé (code splitting absent)

Toutes les pages sont importées statiquement dans `routes.tsx`. Le bundle initial contient donc l'intégralité du code de l'application — y compris les pages admin que les employés ne verront jamais.

---

## 17. Recommandations d'amélioration

### Priorité 1 — Sécurité critique (avant mise en production)

**R1 : Implémenter l'authentification JWT**

```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken');
module.exports = function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentification requise' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

// Appliquer sur toutes les routes sauf /auth/login et /kiosk
app.use('/api/employees', requireAuth, employeesRouter);
```

**R2 : Migrer SHA-256 vers bcrypt**

```bash
npm install bcrypt --save
```

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Création
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Vérification
const valid = await bcrypt.compare(password, storedHash);
```

**R3 : Vérification du companyId côté serveur**

```javascript
// middleware/checkCompany.js
module.exports = function checkCompany(req, res, next) {
  const requestedCompany = req.query.companyId || req.body.companyId;
  if (requestedCompany && requestedCompany !== req.user.companyId) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
};
```

### Priorité 2 — Qualité et maintenabilité

**R4 : Corriger les bugs d'interface TypeScript**

```typescript
// mockData.ts
export type Department = string;  // au lieu de l'union obsolète

export interface Notification {
  isRead: boolean;  // aligner sur l'API (isRead, pas read)
}

export interface Employee {
  managerId: string | null;  // aligner sur l'API (managerId, pas manager)
}
```

**R5 : Ajouter des guards de route par rôle**

```tsx
// components/RequireRole.tsx
function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// routes.tsx
{ path: "departments", element: <RequireRole roles={["Admin"]}><DepartmentsPage /></RequireRole> }
```

**R6 : Code splitting des routes**

```typescript
// routes.tsx - lazy loading
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
// ... pour chaque page

{ path: "departments", element: <Suspense fallback={<Spinner />}><DepartmentsPage /></Suspense> }
```

**R7 : Ajouter un logger structuré**

```bash
npm install pino --save  # ou winston
```

```javascript
// server/logger.js
const pino = require('pino');
module.exports = pino({ level: process.env.LOG_LEVEL || 'info' });

// Dans chaque route
logger.info({ employeeId, companyId }, 'Login réussi');
logger.error({ err, route: '/employees' }, 'Erreur base de données');
```

### Priorité 3 — Fonctionnel

**R8 : Ajouter la pagination**

```javascript
// Exemple : GET /employees?companyId=X&page=1&limit=25
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const offset = (page - 1) * limit;
  const [rows, [{ total }]] = await Promise.all([
    db.query('SELECT ... LIMIT ? OFFSET ?', [limit, offset]),
    db.query('SELECT COUNT(*) AS total FROM employees WHERE company_id = ?', [companyId])
  ]);
  res.json({ data: rows.map(mapEmployee), total, page, limit });
});
```

**R9 : Implémenter un système de versioning des migrations**

```bash
npm install db-migrate --save-dev
```

Structure recommandée :
```
server/migrations/
├── 001_initial_schema.sql
├── 002_add_geo_columns.sql
├── 003_department_varchar.sql
└── 004_add_indexes.sql
```

**R10 : Ajouter des index MySQL**

```sql
-- Colonnes fréquemment filtrées
ALTER TABLE employees ADD INDEX idx_company_id (company_id);
ALTER TABLE attendance_records ADD INDEX idx_date (date);
ALTER TABLE attendance_records ADD INDEX idx_employee_date (employee_id, date);
ALTER TABLE notifications ADD INDEX idx_employee_read (employee_id, is_read);
ALTER TABLE leave_requests ADD INDEX idx_status (status);
```

**R11 : Externaliser le stockage des avatars**

Stocker les avatars sur un service d'objet (S3, Cloudflare R2, ou dossier statique servi par Nginx) et ne conserver que l'URL en base.

```sql
ALTER TABLE employees MODIFY COLUMN avatar VARCHAR(500) NULL;
```

**R12 : Vérification du solde de congés**

```javascript
// leaves.js - PUT /:id
if (status === 'Approuvé') {
  const [[emp]] = await db.query(
    'SELECT leave_balance, leave_used FROM employees WHERE id = ?', [leave.employee_id]
  );
  const remaining = emp.leave_balance - emp.leave_used;
  if (leave.days > remaining) {
    return res.status(422).json({ error: `Solde insuffisant : ${remaining} jour(s) disponible(s)` });
  }
}
```

**R13 : Persister le lockout PIN en base**

```sql
CREATE TABLE pin_lockouts (
  key VARCHAR(100) PRIMARY KEY,  -- 'companyId:employeeId'
  attempts INT DEFAULT 0,
  locked_until DATETIME NULL
);
```

---

## 18. Recommandations de sécurité

### RS1 — Utiliser des cookies HttpOnly pour la session

```javascript
// Serveur : définir un cookie sécurisé
res.cookie('hr_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000  // 8 heures
});
```

```typescript
// Côté client : supprimer le localStorage.hr_session
// Gérer l'auth via cookie automatiquement envoyé par le navigateur
```

### RS2 — Hacher le mot de passe super-admin

```javascript
// Générer une fois
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('votre_mdp_fort', 12);
// Stocker le hash dans .env : SUPER_ADMIN_PASSWORD_HASH=...

// Vérifier
const valid = await bcrypt.compare(password, process.env.SUPER_ADMIN_PASSWORD_HASH);
```

### RS3 — Ajouter des index sur les tables sensibles

Les requêtes sans index sur de grandes tables peuvent entraîner des scans complets — vecteur de DoS lent.

### RS4 — Forcer le PIN à changer au premier accès

Mettre un champ `pin_must_change BOOLEAN DEFAULT TRUE` et forcer l'employé à choisir un PIN lors du premier pointage kiosque.

### RS5 — Valider les IDs côté serveur

Générer les IDs côté serveur (UUID v4 ou ULID) plutôt que de les accepter du client :

```javascript
const { v4: uuidv4 } = require('uuid');
const id = `EMP${uuidv4().replace(/-/g,'').slice(0,8).toUpperCase()}`;
```

### RS6 — Configurer HTTPS en production

```nginx
server {
    listen 443 ssl http2;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### RS7 — Ajouter une protection CSRF

Pour les endpoints mutants appelés par le frontend :

```bash
npm install csurf --save  # ou utiliser le pattern double-submit cookie
```

### RS8 — Auditer les suppressions

Ajouter une table d'audit pour les opérations destructives :

```sql
CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  action ENUM('DELETE','UPDATE_PASSWORD','UPDATE_SALARY') NOT NULL,
  table_name VARCHAR(50),
  record_id VARCHAR(50),
  performed_by VARCHAR(10),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSON
);
```

---

## 19. Optimisations possibles

### Frontend

| Optimisation | Impact | Complexité |
|---|---|---|
| Lazy loading des routes | Bundle initial réduit ~60% | Faible |
| `React.memo` sur les composants liste | Moins de re-renders | Faible |
| `useMemo` pour les filtres/tris | Performance sur grandes listes | Faible |
| Service Worker étendu (offline first) | UX dégradée gracieusement | Moyenne |
| Virtualisation des longues listes (`react-window`) | Scroll fluide sur 500+ lignes | Moyenne |
| Cache API côté client (React Query / SWR) | Moins d'appels, UX plus rapide | Moyenne |
| Compression gzip/brotli sur les assets | Chargement initial 3× plus rapide | Faible |

### Backend

| Optimisation | Impact | Complexité |
|---|---|---|
| Cache Redis pour listes fréquentes | Réduction charge DB | Moyenne |
| Pagination sur toutes les listes | Requêtes DB bornées | Faible |
| Index MySQL sur colonnes filtrées | Requêtes 10–100× plus rapides | Faible |
| Avatars sur stockage fichiers | Réduction taille DB | Moyenne |
| Cron job via node-cron (pas setTimeout) | Fiabilité des schedulers | Faible |
| Requêtes paramétrées groupées (batch) | Réduction N+1 sur notifications | Moyenne |
| Compression des réponses (express-compression) | Trafic réseau réduit ~70% | Très faible |

### Base de données

| Optimisation | Impact | Complexité |
|---|---|---|
| Index sur `employees.company_id` | Requêtes entreprise 10× | Faible |
| Index sur `attendance_records.date` | Filtres date 10× | Faible |
| Partitionnement `attendance_records` par mois | Archivage automatique | Haute |
| `soft_delete` (deleted_at) | Récupération accidentelle | Faible |
| Valeurs `updated_at` sur tables clés | Traçabilité | Faible |

---

## 20. Bonnes pratiques à appliquer

### Code backend

```javascript
// 1. Utiliser des transactions pour les opérations multi-tables
const conn = await db.getConnection();
try {
  await conn.beginTransaction();
  await conn.query('UPDATE departments SET name = ? WHERE id = ?', [newName, id]);
  await conn.query('UPDATE employees SET department = ? WHERE department = ?', [newName, oldName]);
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}

// 2. Générer les IDs côté serveur (UUID)
const id = `EMP${Date.now().toString(36).toUpperCase().slice(-8)}`;

// 3. Logger toutes les erreurs avec contexte
logger.error({ err, route, body: req.body }, 'Erreur inattendue');

// 4. Valider les inputs avec Joi/Zod
const schema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('Admin', 'Manager', 'Employee').required(),
});
const { error } = schema.validate(req.body);
if (error) return res.status(400).json({ error: error.details[0].message });
```

### Code frontend

```typescript
// 1. Aligner les interfaces TypeScript sur les réponses API réelles
export interface Employee {
  managerId: string | null;  // pas "manager"
}
export interface Notification {
  isRead: boolean;  // pas "read"
}
export type Department = string;  // pas l'union figée

// 2. Créer un hook usePagination
function usePagination<T>(data: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const paged = data.slice((page-1)*pageSize, page*pageSize);
  return { data: paged, page, setPage, total: data.length };
}

// 3. Centraliser la gestion des erreurs API
const { data, error, loading } = useApiCall(() => employeesApi.getAll({ companyId }));

// 4. Guards de route par rôle
<RequireRole roles={["Admin"]}>
  <DepartmentsPage />
</RequireRole>
```

### Variables d'environnement

```bash
# Ne jamais versionner .env
echo ".env" >> .gitignore
echo "server/.env" >> .gitignore

# Fournir .env.example versionné
# server/.env.example
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=hr_attendance_db
PORT=3002
JWT_SECRET=                     # générer avec: openssl rand -hex 64
SUPER_ADMIN_PASSWORD_HASH=      # générer avec bcrypt
ALLOWED_ORIGINS=http://localhost:5175
AUTO_BACKUP=true
BACKUP_RETENTION=30
```

### Tests

Ajouter au minimum :
```bash
# Backend
npm install --save-dev jest supertest

# Tests critiques à couvrir
- POST /auth/login : succès + échec
- POST /kiosk/checkin : check-in, check-out, PIN invalide, hors zone
- Rate limiting : 429 après dépassement
- CRUD employees : création, validation email unique
```

---

## 21. Conclusion technique globale

### Synthèse

HR Attendance Manager est une application fullstack **fonctionnellement complète** et bien conçue pour son périmètre métier. La couverture des modules RH est impressionnante (pointage GPS, congés, planning, évaluations, documents, notifications automatiques, backup), et l'architecture modulaire du backend facilite la maintenance et l'évolution.

### Ce qui fonctionne bien

L'application démontre une maîtrise solide des patterns React modernes (Context API, hooks, composants), une architecture Express propre et modulaire, et des fonctionnalités avancées comme la géolocalisation et le backup automatique. La qualité UX est élevée : responsive, multilingue, thèmes, animations, accessibilité via Radix UI.

### Ce qui doit être corrigé avant production

Le point le plus critique est l'**absence totale d'authentification sur les routes backend**. Dans l'état actuel, quiconque peut accéder à l'URL de l'API peut lire et modifier toutes les données de toutes les entreprises. Ce n'est pas un oubli mineur — c'est un prérequis fondamental qui doit être adressé avant tout déploiement sur un réseau non entièrement contrôlé.

Le second point est le **hachage SHA-256** des mots de passe, vulnérable en cas de fuite de base de données. La migration vers `bcrypt` est une journée de travail et apporte une protection indispensable.

Les **bugs d'interface TypeScript** (`read` vs `isRead`, `manager` vs `managerId`, type `Department` obsolète) sont simples à corriger et doivent l'être rapidement pour garantir un comportement prévisible de l'application.

### Roadmap recommandée

| Phase | Priorité | Actions clés | Durée estimée |
|---|---|---|---|
| **Phase 0 — Sécurité critique** | Immédiate | JWT + bcrypt + HTTPS + vérification companyId | 3–5 jours |
| **Phase 1 — Qualité** | Court terme | Corriger bugs TS, guards routes, logger, tests unitaires | 1–2 semaines |
| **Phase 2 — Robustesse** | Moyen terme | Pagination, indexes DB, transactions, versioning migrations | 2–3 semaines |
| **Phase 3 — Performance** | Long terme | Lazy loading, cache Redis, avatars S3, cron persistants | 1 mois |
| **Phase 4 — Évolution** | Futur | API versioning, RBAC granulaire, audit trail, multi-langue étendu | > 1 mois |

### Score global

| Critère | Note | Commentaire |
|---|---|---|
| Couverture fonctionnelle | 9/10 | Complète pour une app RH standard |
| Qualité du code | 7/10 | Propre et modulaire, quelques incohérences |
| Sécurité | 4/10 | Critique : pas d'auth API, SHA-256 faible |
| Performance | 6/10 | Correcte, pagination et cache à ajouter |
| Maintenabilité | 7/10 | Bonne structure, tests manquants |
| Expérience utilisateur | 8/10 | Soignée, responsive, accessible |
| **Score global** | **6.8/10** | Application solide à sécuriser avant production |

---

*Ce rapport a été généré après analyse automatisée et revue complète du code source. Les recommandations sont classées par priorité d'impact sur la sécurité et la stabilité de l'application.*
