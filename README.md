# HR Attendance Manager — Fullstack

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4.2-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38BDF8?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?logo=postgresql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.13.0-FFCA28?logo=firebase&logoColor=white)

**Application web complète de gestion RH, pointage multi-entreprises et notifications en temps réel**

</div>

---

## Présentation du projet

HR Attendance Manager est une **application web full-stack** complète de gestion des ressources humaines multi-entreprises. Le frontend React fournit une interface utilisateur réactive, multilingue (FR/EN) et multi-thèmes (clair/sombre) permettant à plusieurs entreprises de gérer indépendamment leurs employés, pointages géolocalisés, congés, plannings, évaluations, documents et rapports avec notifications en temps réel via Firebase Cloud Messaging.

### Objectifs de l'application

- **Centraliser** la gestion RH complète par entreprise (multi-tenant avec isolation stricte)
- **Gérer** le cycle de vie complet des employés et des pointages
- **Localiser** les pointages en temps réel (GPS Haversine) avec vérification du rayon autorisé
- **Automatiser** les notifications, les calculs de congés et les rapports
- **Offrir** un kiosque public accessible par PIN (QR code, scan, digital signage)
- **Générer** des rapports analytics, PDF et Excel pour la direction
- **Assurer** une accessibilité complète (Radix UI, WCAG) et une expérience mobile native (PWA)

### Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| **Authentification** | Connexion email/mot de passe, session persistante localStorage, multi-device detection |
| **Tableau de bord** | KPIs, graphiques Recharts, alertes temps réel, statistiques par département |
| **Gestion des employés** | CRUD complet, profil détaillé, import/export CSV, avatars base64, recherche avancée |
| **Pointage géolocalisé** | Calendrier journalier, vérification GPS Haversine, statuts (Présent, Absent, Retard, Congé, Télétravail) |
| **Kiosque public** | Pointage par PIN 4–8 chiffres, génération QR code, scan QR, géolocalisation optionnelle, protection brute-force (5 tentatives/15 min) |
| **Scan de document** | Lecture QR code pour identification rapide employés, intégration KioskScanPage |
| **Congés** | Demandes, approbations par manager, soldes automatiques, calcul multi-types (annuel, maladie, RTT, exceptionnel) |
| **Planning** | Grille drag-and-drop, quarts de travail (Matin, Après-midi, Nuit, Repos), gestion hebdomadaire |
| **Évaluations** | Performances avec notation 1–5 étoiles, période d'évaluation, suivi des améliorations |
| **Documents RH** | Gestion de liens/URLs, alertes d'expiration, catégorisation, suivi des documents critiques |
| **Rapports** | Rapports analytiques, rapports managers, génération PDF/Excel, graphiques Recharts avancés |
| **Analytics** | Statistiques détaillées par période, département, employé avec export |
| **Notifications FCM** | Centre temps réel, notifications Firebase Cloud Messaging, marquage lu/non-lu, auto-génération des alertes |
| **Départements** | CRUD, cascade sur employés, comptage dynamique, protection suppression si employés assignés |
| **Paramètres entreprise** | Géolocalisation GPS, rayon autorisé (Haversine), horaires de travail, tolérances de retard |
| **Paramètres utilisateur** | Profil personnel, changement mot de passe, thème clair/sombre, langue FR/EN |
| **Super Admin** | Gestion multi-entreprises, blocage/déverrouillage entreprises, super admin password dedicated |
| **i18n** | Interface entièrement bilingue (FR/EN) avec traductions en temps réel |
| **PWA** | Manifest.json, Service Worker, installation sur appareil, mode offline partiel |
| **Sécurité** | JWT pour kiosque, rate limiting IP, CORS configurable, headers de sécurité, isolation multi-tenant |

---

## Stack technique complet

### Frontend

#### Framework & Langage

| Technologie | Version | Rôle |
|---|---|---|
| **React** | 18.3.1 | Framework UI principal |
| **TypeScript** | 5.x | Typage statique |
| **Vite** | 6.4.2 | Build tool & serveur de développement |
| **React Router** | 7.13.0 | SPA routing et navigation |

#### UI & Styling

| Technologie | Version | Rôle |
|---|---|---|
| **Tailwind CSS** | 4.1.12 | Styling utilitaire moderne |
| **Radix UI** | 1.x | Composants accessibles (Dialog, Popover, Select, Tabs, Dropdown…) |
| **shadcn/ui** | Latest | Couche composants sur Radix UI |
| **Lucide React** | 0.487.0 | Bibliothèque 400+ icônes SVG |
| **Framer Motion** | 12.23.24 | Animations, transitions, variantes |
| **MUI / Emotion** | 7.3.5 | Composants Material Design additionnels |

#### Gestion d'état & Context

| Technologie | Rôle |
|---|---|
| **React Context API** | AuthContext, ThemeContext, LayoutContext |
| **useState / useReducer** | État local composants |
| **localStorage** | Session utilisateur, préférences (thème, langue) |

#### Formulaires & Validation

| Technologie | Version | Rôle |
|---|---|---|
| **React Hook Form** | 7.55.0 | Gestion performante, validation, soumission |

#### Appels API & Données

| Technologie | Rôle |
|---|---|
| **Fetch API (native)** | Client HTTP via wrapper centralisé `api.ts` |
| **Vite Proxy** | Redirection `/api/*` vers backend en développement |

#### Graphiques & Visualisation

| Technologie | Version | Rôle |
|---|---|---|
| **Recharts** | 2.15.2 | Graphiques (barres, lignes, camembert, aires) pour analytics |

#### Export & Rapports

| Technologie | Version | Rôle |
|---|---|---|
| **xlsx** | 0.18.5 | Export Excel / CSV pour employés, pointages, rapports |
| **jsPDF** | 4.2.1 | Génération PDF dynamique |
| **html2canvas** | 1.4.1 | Capture HTML → image pour PDF |

#### Dates & Calendrier

| Technologie | Version | Rôle |
|---|---|---|
| **date-fns** | 3.6.0 | Manipulation, formatage, calculs dates |
| **react-day-picker** | 8.10.1 | Composant calendrier pour sélection dates |

#### Notifications UI

| Technologie | Version | Rôle |
|---|---|---|
| **Sonner** | 2.0.3 | Toast notifications non-bloquantes |

#### QR Code & Scan

| Technologie | Version | Rôle |
|---|---|---|
| **qrcode** | 1.5.4 | Génération QR code pour kiosque |
| **jsqr** | 1.4.0 | Détection et décodage QR code depuis vidéo |

#### Drag & Drop & Carrousel

| Technologie | Version | Rôle |
|---|---|---|
| **react-dnd** | 16.0.1 | Drag & drop pour planning hebdomadaire |
| **react-dnd-html5-backend** | 16.0.1 | Backend HTML5 drag & drop |
| **embla-carousel-react** | 8.6.0 | Carrousel responsive |

#### Firebase & Notifications

| Technologie | Version | Rôle |
|---|---|---|
| **firebase** | 12.13.0 | Client FCM pour notifications push temps réel |
| **next-themes** | 0.4.6 | Gestion thème système |

#### Utilitaires

| Technologie | Version | Rôle |
|---|---|---|
| **clsx** | 2.1.1 | Composition classes CSS conditionnelles |
| **tailwind-merge** | 3.2.0 | Fusion intelligente classes Tailwind |
| **canvas-confetti** | 1.9.4 | Effets confetti animés |

### Backend

#### Runtime & Framework

| Technologie | Version | Rôle |
|---|---|---|
| **Node.js** | 18+ | Runtime JavaScript serveur |
| **Express.js** | 4.22.1 | Framework HTTP REST |

#### Base de données & ORM

| Technologie | Version | Rôle |
|---|---|---|
| **PostgreSQL** | Latest | SGBD relationnel principal |
| **pg** | 8.13.0 | Driver PostgreSQL asynchrone avec pool |

#### Authentification & Sécurité

| Technologie | Version | Rôle |
|---|---|---|
| **bcrypt** | 5.1.1 | Hachage sécurisé des mots de passe |
| **jsonwebtoken** | 9.0.3 | Génération JWT pour kiosque |
| **cors** | 2.8.6 | Middleware CORS configurable |

#### Notifications Temps Réel

| Technologie | Version | Rôle |
|---|---|---|
| **firebase-admin** | 13.10.0 | FCM server-side push notifications |

#### Email & Communication

| Technologie | Version | Rôle |
|---|---|---|
| **nodemailer** | 6.9.16 | Envoi d'emails automatiques (rapports, notifications) |

#### Environnement & Config

| Technologie | Version | Rôle |
|---|---|---|
| **dotenv** | 16.6.1 | Variables d'environnement depuis `.env` |
| **nodemon** | 3.1.0 (dev) | Rechargement automatique en développement |

#### Géolocalisation

| Rôle | Implémentation |
|---|---|
| **Calcul distance GPS** | Algorithm Haversine côté serveur |
| **Rayon autorisé** | Configuration par entreprise |
| **Détection hors zone** | Alertes affichées au kiosque |

---

## Structure du projet

```
e:\Travail\Hrattendancemanagerdesign/
├── src/
│   ├── app/
│   │   ├── components/                    # Composants réutilisables
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx            # Wrapper principal (Sidebar + Header + Outlet)
│   │   │   │   ├── Header.tsx            # Barre supérieure responsive
│   │   │   │   ├── Sidebar.tsx           # Navigation latérale avec badges
│   │   │   │   └── BottomNav.tsx         # Navigation mobile inférieure
│   │   │   ├── ui/                       # 40+ composants Radix UI / shadcn
│   │   │   │   ├── button.tsx, dialog.tsx, form.tsx, input.tsx, select.tsx
│   │   │   │   ├── table.tsx, card.tsx, badge.tsx, tabs.tsx, pagination.tsx
│   │   │   │   ├── calendar.tsx, chart.tsx, carousel.tsx, sidebar.tsx, sheet.tsx
│   │   │   │   ├── drawer.tsx, tooltip.tsx, popover.tsx, dropdown-menu.tsx
│   │   │   │   └── ... (40+ composants total)
│   │   │   ├── figma/
│   │   │   │   └── ImageWithFallback.tsx  # Composant images dynamiques
│   │   │   ├── AppLogo.tsx               # Logo SVG dégradé
│   │   │   ├── NotificationPrompt.tsx    # Demande permission FCM
│   │   │   ├── RequireRole.tsx           # Wrapper authentification
│   │   │   ├── AnalyticsReportsSection.tsx
│   │   │   └── ManagerReportsSection.tsx
│   │   ├── context/                      # Contextes globaux
│   │   │   ├── AuthContext.tsx           # Session + CRUD employés
│   │   │   ├── ThemeContext.tsx          # Thème + langue + i18n
│   │   │   └── LayoutContext.tsx         # Sidebar responsive
│   │   ├── data/
│   │   │   ├── mockData.ts               # Interfaces TypeScript
│   │   │   └── translations.ts           # Traductions FR/EN
│   │   ├── hooks/
│   │   │   └── useFcm.ts                 # Hook Firebase
│   │   ├── pages/                        # Pages application
│   │   │   ├── LoginPage.tsx, DashboardPage.tsx, EmployeesPage.tsx
│   │   │   ├── EmployeeDetailPage.tsx, AttendancePage.tsx, CalendarPage.tsx
│   │   │   ├── LeavesPage.tsx, PlanningPage.tsx, PerformancePage.tsx
│   │   │   ├── DocumentsPage.tsx, ReportsPage.tsx, NotificationsPage.tsx
│   │   │   ├── SettingsPage.tsx, DepartmentsPage.tsx
│   │   │   ├── KioskPage.tsx, KioskScanPage.tsx, SuperAdminPage.tsx
│   │   ├── services/
│   │   │   └── api.ts                    # Client API centralisé
│   │   ├── utils/
│   │   │   ├── attendanceQueue.ts        # Queue offline
│   │   │   └── deviceId.ts               # ID unique appareil
│   │   ├── App.tsx, routes.tsx, main.tsx
│   ├── styles/, firebase.ts, index.html
│
├── server/
│   ├── routes/
│   │   ├── auth.js, employees.js, attendance.js, companies.js
│   │   ├── departments.js, devices.js, documents.js, kiosk.js
│   │   ├── leaves.js, notifications.js, performance.js
│   │   ├── planning.js, reports.js, analytics.js
│   │   ├── managerReports.js, superadmin.js
│   ├── middleware/, services/, scripts/
│   ├── backups/, server.js, db.js, security.js, backup.js
│   ├── firebase-service-account.json, package.json, README.md, Dockerfile
│
├── public/, guidelines/, vite.config.ts, postcss.config.mjs
├── package.json, pnpm-lock.yaml, docker-compose.prod.yml
├── Dockerfile, nginx.conf, vercel.json
├── README.md, REPORT.md, API.md, ATTRIBUTIONS.md
├── database.sql, migration.sql, deploy_export.sql, deploy_pg.sql
└── hr_attendance_db.sql, FLUTTER_BRIEFING.md, generate-icons.cjs
```

### Pages et accès par rôle

| Route | Page | Rôles autorisés | Description |
|---|---|---|---|
| `/login` | LoginPage | Public | Authentification email/password |
| `/kiosk` | KioskPage | Public | Pointage PIN + génération QR code |
| `/kiosk/scan` | KioskScanPage | Public | Scan QR code pour identification |
| `/superadmin` | SuperAdminPage | Super Admin | Gestion multi-entreprises |
| `/dashboard` | DashboardPage | Admin, Manager, Employee | Vue d'ensemble KPIs |
| `/employees` | EmployeesPage | Admin | Gestion employés CRUD |
| `/employees/:id` | EmployeeDetailPage | Admin, Manager, Employee | Profil détaillé |
| `/attendance` | AttendancePage | Admin, Manager, Employee | Pointages quotidiens |
| `/calendar` | CalendarPage | Admin, Manager | Vue calendrier |
| `/leaves` | LeavesPage | Admin, Manager, Employee | Congés demandes/approvals |
| `/planning` | PlanningPage | Admin, Manager | Planning drag-drop |
| `/performance` | PerformancePage | Admin, Manager, Employee | Évaluations |
| `/documents` | DocumentsPage | Admin, Manager, Employee | Documents RH |
| `/reports` | ReportsPage | Admin, Manager, Employee | Rapports + export |
| `/notifications` | NotificationsPage | Admin, Manager, Employee | Centre notifications FCM |
| `/departments` | DepartmentsPage | Admin | Gestion départements |
| `/settings` | SettingsPage | Admin, Manager, Employee | Profil + paramètres |

---

## Installation & Configuration

### Prérequis

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x ou **pnpm** ≥ 10.x
- **PostgreSQL** ≥ 12 (base de données backend)
- **Git** pour cloner le projet
- **Firebase Project** (pour notifications FCM) — optionnel mais recommandé

### 1. Cloner le projet

```bash
git clone https://github.com/darel-developer/Hrattendancemanagerdesign.git
cd Hrattendancemanagerdesign
```

### 2. Configuration Backend

#### Installer les dépendances backend

```bash
cd server
npm install
# ou
pnpm install
```

#### Créer le fichier `.env` backend

Créez `server/.env` avec vos paramètres PostgreSQL :

```env
# Backend config
PORT=3002
LOG_LEVEL=info

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=hr_attendance_db
DB_SSL=false

# CORS & Sécurité
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Firebase Admin (pour FCM notifications)
# Téléchargez firebaseServiceAccountKey.json depuis Firebase Console
# FIREBASE_ADMIN_SDK_PATH=./firebase-service-account.json
```

#### Initialiser la base de données

```bash
# Import du schéma PostgreSQL
psql -U postgres -h localhost -d hr_attendance_db < ../database.sql

# Ou exécuter les migrations
psql -U postgres -h localhost -d hr_attendance_db < ../deploy_pg.sql
```

#### Démarrer le backend

```bash
# Développement avec hot reload
npm run dev

# Production
npm run start
```

Backend accessible sur `http://localhost:3002/api`

### 3. Configuration Frontend

#### Installer les dépendances frontend

Retour à la racine du projet :

```bash
cd ..
npm install
# ou
pnpm install
```

> **Note sur NODE_ENV :** Si `NODE_ENV=production` est défini globalement, forcez les devDependencies :
> ```bash
> NODE_ENV=development npm install --include=dev
> ```

#### Configuration Firebase (Notifications FCM)

Téléchargez votre fichier de configuration Firebase depuis [Firebase Console](https://console.firebase.google.com) :

1. Créez un projet Firebase
2. Générez la clé privée (Settings → Service Accounts)
3. Sauvegardez dans `server/firebase-service-account.json`
4. Créez `src/firebase.ts` avec votre config client :

```typescript
// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
```

#### Configuration Vite (proxy API)

Vérifiez `vite.config.ts` pour le proxy backend :

```typescript
server: {
  port: 5175,
  proxy: {
    '/api': {
      target: process.env.VITE_API_TARGET || 'http://localhost:3002',
      changeOrigin: true,
    },
  },
},
```

#### Démarrer le frontend

```bash
# Développement
npm run dev

# Accès sur http://localhost:5175
```

### 4. Configuration Docker (Production)

Utilisez le `docker-compose.prod.yml` pour déployer frontend + backend :

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Nginx reverse proxy sur port 80 → frontend + backend API.

---

## Configuration & Variables d'environnement

### Frontend (Vite)

| Variable | Fichier | Description | Par défaut |
|---|---|---|---|
| `VITE_API_URL` | Système | URL API externe (production) | `/api` (proxy Vite) |
| `VITE_API_TARGET` | `.env` | URL proxy développement | `http://localhost:3002` |
| `VITE_PORT` | `.env` | Port serveur Vite | `5175` |

### Backend (Express + PostgreSQL)

| Variable | Fichier | Description | Par défaut |
|---|---|---|---|
| `PORT` | `.env` | Port serveur Express | `3002` |
| `LOG_LEVEL` | `.env` | Niveau logs (debug, info, warn, error) | `info` |
| `DB_HOST` | `.env` | Hôte PostgreSQL | `localhost` |
| `DB_PORT` | `.env` | Port PostgreSQL | `5432` |
| `DB_USER` | `.env` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | `.env` | Mot de passe PostgreSQL | `` |
| `DB_NAME` | `.env` | Nom base de données | `hr_attendance_db` |
| `DB_SSL` | `.env` | SSL connexion PostgreSQL | `false` |
| `ALLOWED_ORIGINS` | `.env` | CORS origins autorisées | `http://localhost:5173` |

### Stockage Client

| Clé | Type | Description | Scope |
|---|---|---|---|
| `hr_session` | JSON | `{ userId, companyId, token }` | localStorage |
| `hr-theme` | String | `"light"` \| `"dark"` | localStorage |
| `hr-language` | String | `"fr"` \| `"en"` | localStorage |
| `hr_kiosk` | JSON | Session kiosque persistée | localStorage |
| `hr_superadmin` | String | JWT super admin | sessionStorage |

---

## Scripts disponibles

### Frontend

```bash
npm run dev        # Serveur développement Vite (http://localhost:5175)
npm run build      # Build production (dist/)
npm run server     # Lance le backend depuis la racine
npm run server:install  # Installe dépendances backend
```

### Backend

```bash
cd server
npm run start      # Production
npm run dev        # Développement avec nodemon
npm run backup     # Sauvegarde manuelle PostgreSQL
npm run backup:schedule  # Sauvegarde automatique quotidienne
```

---

## Détail des Fonctionnalités Principales

### Authentification & Sécurité

- **Connexion** : Email/password avec hash SHA-256 côté serveur
- **Session** : Persistée dans localStorage avec auto-restauration
- **Multi-device** : Détection conflits d'appareils (nouvelle connexion = déconnexion anciens appareils)
- **JWT** : Utilisé pour kiosque public et super admin
- **Rate limiting** : 5 tentatives pour login/kiosk, puis blocage 15 min
- **Headers sécurité** : CORS configurable, X-Frame-Options, X-Content-Type-Options

### Pointage & Géolocalisation

**KioskPage (/kiosk)** :
- Accessible sans authentification
- PIN 4–8 chiffres (brute-force protection)
- Génération automatique QR code pour affichage écran
- Détection entrée/sortie automatique
- Vérification GPS optionnelle (Haversine distance calculation)
- Bandeau alerte rouge si hors zone autorisée
- Calcul heures travaillées à la sortie
- Session JWT pour sécurité

**KioskScanPage (/kiosk/scan)** :
- Scan QR code pour identification rapide
- Redirection vers pointage après identification
- Support caméra web HTML5

**Géolocalisation backend** :
- Algorithm **Haversine** pour calcul distance GPS
- Rayon autorisé configurable par entreprise
- Alertes temps réel au kiosque

### Gestion des Employés

- CRUD complet (Admin uniquement)
- Import/export CSV batch
- Avatars en base64
- Profil détaillé : contrat, dates, salaire, manager, etc.
- Recherche textuelle + filtres (département, statut, rôle)
- Affichage pointages/congés/évaluations liées
- Gestion multi-device tracking

### Pointage Quotidien

- Calendrier vue jour/mois/semaine
- Statuts : Présent, Absent, Retard, Congé, Télétravail
- Affichage heure check-in/check-out
- Calcul automatique heures travaillées
- Notes/commentaires
- Export CSV

### Congés

- Demande multi-types : Annuel, Maladie, Maternité, RTT, Exceptionnel
- Approbation/refus par manager
- Calcul automatique soldes annuels
- Historique demandes
- Alertes expiration documents liés

### Planning

- Grille **drag-and-drop** React DnD
- Quarts : Matin, Après-midi, Nuit, Repos
- Vue hebdomadaire
- Modification rapide
- Export calendrier

### Évaluations de Performance

- Notation 1–5 étoiles
- Périodes d'évaluation
- Suivi des améliorations objectives et subjectives
- Export rapports

### Documents RH

- Gestion liens/URLs documents
- Alertes expiration automatiques
- Catégorisation
- Suivi criticité

### Rapports & Analytics

**Rapports généraux** :
- Génération PDF/Excel
- Graphiques Recharts avancés
- Export données
- Multi-format

**Analytics** :
- Statistiques par période/département/employé
- KPIs temps réel
- Tendances

**Rapports Managers** :
- Rapports périodiques par manager
- Approbation workflow
- Statut tracking

### Notifications Firebase FCM

- Centre notifications temps réel
- Types : absence, congé, document, retard, system
- Marquage lu/non-lu
- Suppression batch
- Auto-génération d'alertes (absences 09h30, rapports mensuel 1er)
- Notifications push device

### Gestion Départements

- CRUD complet (Admin)
- Cascade automatique sur employés
- Comptage employés dynamique
- Protection suppression si employés assignés
- Noms personnalisés

### Paramètres

**Profil utilisateur** :
- Modification données personnelles
- Changement mot de passe
- Avatar
- Thème clair/sombre
- Langue FR/EN

**Entreprise** (Admin) :
- Coordonnées
- Horaires de travail
- Tolérances retard
- Géolocalisation + rayon autorisé
- Email RH

### Super Admin

- Gestion multi-entreprises
- Création/suppression entreprises
- Blocage/déverrouillage clients
- Mot de passe dédié

### Multi-langue & Thème

- **i18n** : FR/EN via ThemeContext
- **Thème** : Light/Dark via CSS custom variables
- **Persistance** : localStorage `hr-language` et `hr-theme`

### PWA & Offline

- Manifest.json avec icônes
- Service Worker offline partial
- Installation sur appareil (Android, iOS, Desktop)
- Queue offline pour pointages

---

## Architecture & Bonnes Pratiques

### Conventions de code

- **TypeScript strict** : toutes les interfaces définies dans `src/app/data/mockData.ts`
- **Un composant par fichier** : nommage PascalCase correspondant au nom du fichier
- **Alias `@`** : `@/app/...` plutôt que chemins relatifs profonds
- **Pas de commentaires évidents** : le code s'explique via des noms expressifs

### Architecture

- **Context pour l'état global** : `AuthContext`, `ThemeContext`, `LayoutContext`
- **Services centralisés** : toutes les requêtes HTTP dans `api.ts`, aucun `fetch()` direct dans les composants
- **Pages auto-suffisantes** : chaque page gère ses propres états locaux et appels API
- **Composants UI sans logique métier** : les composants `ui/` sont purement présentationnels

### Gestion des erreurs

- Catch systématique dans les appels API avec affichage via `sonner`
- Formulaires avec validation React Hook Form avant soumission
- Fallback UI pour les états de chargement (spinners) et d'erreur

### Organisation des composants

```
ui/          → Composants génériques réutilisables (aucune logique métier)
layout/      → Composants de structure (une seule instance par app)
pages/       → Écrans complets (une page = une route)
context/     → État global React
services/    → Couche d'accès aux données
data/        → Types, interfaces TypeScript, traductions
```

---

## Déploiement Production

### Build Frontend

```bash
npm run build
# Génère dist/ → SPA statique prête à être servie
```

### Déploiement avec Docker Compose

Le projet inclut `docker-compose.prod.yml` pour déploiement complet :

```bash
# Build et lancement
docker-compose -f docker-compose.prod.yml up --build

# Services lancés :
# - Frontend React (Vite) → port 5173
# - Backend Express → port 3002
# - Nginx reverse proxy → port 80 (frontend) + /api (backend)
```

### Configuration Production

#### Variables Frontend

Créez `server/.env.production` :

```env
PORT=3002
LOG_LEVEL=warn
DB_HOST=postgres-server
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secure_password
DB_NAME=hr_attendance_db
DB_SSL=true
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

#### Variables Backend

```env
NODE_ENV=production
VITE_API_URL=https://api.votre-domaine.com
```

### Hébergement recommandé

| Plateforme | Notes | Configuration |
|---|---|---|
| **Vercel** | Frontend uniquement | Déploiement auto depuis GitHub, envoyez API_URL |
| **Netlify** | Frontend uniquement | SPA-friendly, redirections auto `/index.html` |
| **AWS EC2** | Fullstack | Docker, PostgreSQL RDS, Nginx reverse proxy |
| **DigitalOcean** | Fullstack | App Platform, Managed PostgreSQL |
| **Koyeb** | Fullstack | Container deployment, PostgreSQL managed |
| **Railway** | Fullstack | Docker support, PostgreSQL included |
| **Heroku** | Fullstack (legacy) | Node.js + PostgreSQL add-on |
| **OVH/Hetzner** | Fullstack | VPS Linux, Docker, PostgreSQL self-managed |

### Configuration Nginx (Reverse Proxy)

Fichier `nginx.conf` fourni dans le projet :

```nginx
upstream frontend {
    server frontend:5173;
}

upstream backend {
    server backend:3002;
}

server {
    listen 80;
    server_name votre-domaine.com;

    # Redirect HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Certificats SSL

Utilisez Let's Encrypt pour les certificats gratuits :

```bash
# Certbot installation
apt-get install certbot python3-certbot-nginx

# Certificat automatique
certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique via cron
0 0 1 * * certbot renew --quiet
```

### Sauvegarde PostgreSQL

Sauvegarde automatique quotidienne :

```bash
# Script inclus : server/backup.js
npm run backup          # Sauvegarde manuelle
npm run backup:schedule # Sauvegarde quotidienne programmée

# Ou via cron :
0 2 * * * pg_dump -h localhost -U postgres hr_attendance_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Migration MySQL → PostgreSQL

Le projet utilise PostgreSQL (migration de MySQL complétée).

Script migration inclus : `server/scripts/export_to_pg.js`

```bash
node server/scripts/export_to_pg.js
```

---

## Architecture Système

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet / DNS                              │
└────────────────┬─────────────────────────────────────────────────────┘
                 │ HTTPS port 443
                 ▼
        ┌────────────────────┐
        │  Nginx Reverse     │
        │      Proxy         │
        │   (SSL/TLS)        │
        └────┬──────────┬────┘
             │          │
        ┌────▼┐    ┌────▼──────────┐
        │React     │  Express.js   │
        │Frontend  │   Backend     │
        │(Vite)    │   (Node.js)   │
        │Port 5173 │   Port 3002   │
        └─────┘    └────┬──────────┘
                        │
                   ┌────▼──────────┐
                   │ PostgreSQL    │
                   │ Database      │
                   │ Port 5432     │
                   └──────────────┘
                        ▲
                        │
                   ┌────┴──────────┐
                   │   Firebase    │
                   │   (FCM)       │
                   │   (Optionnel) │
                   └───────────────┘
```

---

## Troubleshooting

### Frontend

| Problème | Solution |
|---|---|
| **Port 5175 déjà utilisé** | `lsof -i :5175` puis `kill -9 <PID>` ou changer port dans `.env` |
| **CORS error** | Vérifier `ALLOWED_ORIGINS` dans `server/.env` |
| **Notifications FCM ne fonctionnent pas** | Vérifier `firebase-service-account.json` et permissions |
| **localStorage vide après rechargement** | Vérifier modo incognito (session storage désactivé) |
| **Thème ne persiste pas** | Nettoyer localStorage : `localStorage.clear()` |

### Backend

| Problème | Solution |
|---|---|
| **Connexion PostgreSQL refuse** | Vérifier `DB_HOST`, `DB_USER`, `DB_PASSWORD` dans `.env` |
| **Migrations SQL échouent** | Exécuter manuellement : `psql -U postgres -d hr_attendance_db < database.sql` |
| **Port 3002 déjà utilisé** | `lsof -i :3002` puis `kill -9 <PID>` ou changer `PORT` dans `.env` |
| **Rate limiting trop strict** | Augmenter `RATE_LIMIT` dans `server/security.js` |
| **JWT expiration errors** | Vérifier synchronisation temps serveur |
| **Fichier firebase-service-account.json manquant** | Télécharger depuis Firebase Console ou désactiver FCM |

### Database

| Problème | Solution |
|---|---|
| **Erreur permission PostgreSQL** | `ALTER ROLE postgres WITH PASSWORD 'newpassword';` |
| **Base de données corrompue** | Restaurer depuis backup : `psql -U postgres -d hr_attendance_db < backup.sql` |
| **Pool connections max atteint** | Augmenter pool size dans `server/db.js` |

### Docker

| Problème | Solution |
|---|---|
| **Conteneur ne démarre pas** | `docker logs container_name` pour logs détaillés |
| **Network issues** | `docker network ls` et vérifier service names dans compose |
| **Volume permissions** | Chown : `sudo chown -R 1000:1000 /path/to/data` |

---

## Bonnes Pratiques & Conventions

### Frontend (React/TypeScript)

- **Composants** : Un fichier = un composant, nommage PascalCase
- **Interfaces** : Centralisées dans `data/mockData.ts`
- **Imports** : Utiliser alias `@/` pour éviter `../../../`
- **Fetching** : Tous les appels API via `api.ts`, pas de `fetch()` direct
- **État** : Context API pour global, useState pour local
- **Erreurs** : Toast via Sonner, pas d'alert()
- **Formulaires** : React Hook Form + validation antes de submit
- **Types** : Strict mode TypeScript, pas de `any`

### Backend (Express/Node.js)

- **Routes** : Fichiers séparés par ressource dans `/routes`
- **Middleware** : Centralisé dans `/middleware` (auth, validation)
- **Erreurs** : Messages structurés en JSON avec status codes HTTP
- **Sécurité** : Rate limiting, CORS, headers sécurité
- **Logs** : Via logger centralisé avec niveaux (debug, info, warn, error)
- **SQL** : Prepared statements avec paramètres (injection protection)
- **Async** : Utiliser async/await, pas de callbacks
- **Validation** : Valider TOUTES les entrées côté serveur

### Base de données (PostgreSQL)

- **Migrations** : Fichiers SQL versionnés dans `server/scripts/`
- **Indexes** : Sur colonnes filtrées/triées fréquemment (companyId, employeeId)
- **Foreign Keys** : Cascades appropriées pour intégrité référentielle
- **Transactions** : Pour opérations multi-tables
- **Backup** : Quotidienne automatique + test restauration

---

## Documentation Additionnelle

- [Documentation Complète Backend](server/README.md)
- [Référence API REST](API.md)
- [Audit Technique Détaillé](REPORT.md)
- [Schéma Base de Données](database.sql)
- [Attributions Bibliothèques](ATTRIBUTIONS.md)
- [Guidelines Développement](guidelines/Guidelines.md)

---

## Support & Contribution

- **Issues** : Signalez bugs ou demandes sur GitHub Issues
- **Pull Requests** : Forks + PR bienvenues, respectez conventions
- **Code Review** : Tous les PR passent par review + tests

---

## Licences & Crédits

Voir [ATTRIBUTIONS.md](ATTRIBUTIONS.md) pour liste complète bibliothèques et licenses.

---

**Application développée avec ❤️ pour la gestion RH efficace et transparente.**


