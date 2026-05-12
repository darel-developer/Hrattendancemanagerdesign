# HR Attendance Manager — Frontend

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4.2-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38BDF8?logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7.13.0-CA4245?logo=react-router&logoColor=white)

**Application web de gestion RH et de pointage multi-entreprises**

</div>

---

## Présentation du projet

HR Attendance Manager est une application web full-stack de gestion des ressources humaines. Le frontend React fournit une interface utilisateur réactive, multilingue (FR/EN) et multi-thèmes (clair/sombre) permettant à plusieurs entreprises de gérer indépendamment leurs employés, pointages, congés, plannings, évaluations et documents.

### Objectifs du frontend

- Offrir un tableau de bord centralisé pour chaque entreprise
- Permettre la gestion complète du cycle de vie des employés
- Fournir un kiosque de pointage autonome accessible sans authentification
- Garantir l'isolation des données par entreprise (multi-tenant)
- Fonctionner en mode responsive (desktop, tablette, mobile)

### Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| **Authentification** | Connexion email/mot de passe, gestion de session persistante |
| **Tableau de bord** | KPIs, graphiques, alertes en temps réel |
| **Gestion des employés** | CRUD complet, profil détaillé, import CSV, export CSV |
| **Pointage** | Calendrier journalier, gestion des statuts, export CSV |
| **Kiosque** | Pointage par PIN sans authentification, avec vérification GPS optionnelle |
| **Congés** | Demandes, approbations, soldes automatiques, export CSV |
| **Planning** | Grille hebdomadaire des quarts (Matin, Après-midi, Nuit, Repos) |
| **Évaluations** | Évaluations de performance avec notation 1–5 étoiles |
| **Documents RH** | Upload de liens, alertes d'expiration, catégorisation |
| **Rapports** | Génération PDF/Word, graphiques Recharts, messagerie interne |
| **Notifications** | Centre de notifications avec marquage lu/non-lu, auto-génération |
| **Départements** | CRUD complet, comptage d'employés, protection contre suppression |
| **Paramètres** | Profil, mot de passe, géolocalisation entreprise, thème, langue |
| **Super Admin** | Gestion des entreprises (création, suppression, liste) |
| **i18n** | Interface entièrement disponible en Français et Anglais |
| **PWA** | Manifest + Service Worker pour installation sur appareil |

---

## Stack technique

### Framework & Langage

| Technologie | Version | Rôle |
|---|---|---|
| **React** | 18.3.1 | Framework UI principal |
| **TypeScript** | 5.x | Typage statique |
| **Vite** | 6.4.2 | Build tool & serveur de développement |

### UI & Styling

| Technologie | Version | Rôle |
|---|---|---|
| **Tailwind CSS** | 4.1.12 | Styling utilitaire |
| **Radix UI** | 1.x | Composants accessibles (Dialog, Popover, Select, Tabs…) |
| **shadcn/ui** | — | Couche composants sur Radix UI |
| **Lucide React** | 0.487.0 | Bibliothèque d'icônes SVG |
| **Framer Motion** | 12.23.24 | Animations et transitions |
| **MUI / Emotion** | 7.3.5 | Composants Material Design complémentaires |
| **tw-animate-css** | 1.3.8 | Animations utilitaires Tailwind |

### Routing & Navigation

| Technologie | Version | Rôle |
|---|---|---|
| **React Router** | 7.13.0 | SPA routing, routes imbriquées |

### Gestion d'état

| Technologie | Rôle |
|---|---|
| **React Context API** | État global : authentification, thème, langue, layout |
| **useState / useReducer** | État local des composants |
| **localStorage** | Persistance session, thème, langue |

### Formulaires & Validation

| Technologie | Version | Rôle |
|---|---|---|
| **React Hook Form** | 7.55.0 | Gestion performante des formulaires |

### Appels API

| Technologie | Rôle |
|---|---|
| **Fetch API (native)** | Client HTTP via wrapper `request()` dans `api.ts` |
| **Vite Proxy** | Redirige `/api/*` vers le backend Express en développement |

### Graphiques & Visualisation

| Technologie | Version | Rôle |
|---|---|---|
| **Recharts** | 2.15.2 | Graphiques (barres, lignes, camembert, aires) |

### Export & Rapports

| Technologie | Version | Rôle |
|---|---|---|
| **xlsx** | 0.18.5 | Export Excel / CSV |
| **jsPDF** | 4.2.1 | Génération de PDF |
| **html2canvas** | 1.4.1 | Capture HTML → image pour PDF |

### Dates & Calendrier

| Technologie | Version | Rôle |
|---|---|---|
| **date-fns** | 3.6.0 | Manipulation et formatage des dates |
| **react-day-picker** | 8.10.1 | Composant calendrier |

### Notifications UI

| Technologie | Version | Rôle |
|---|---|---|
| **Sonner** | 2.0.3 | Toast notifications |

### Drag & Drop / Carousel

| Technologie | Version | Rôle |
|---|---|---|
| **react-dnd** | 16.0.1 | Drag & drop (planning) |
| **embla-carousel-react** | 8.6.0 | Carrousel de composants |

### Géolocalisation

| Technologie | Rôle |
|---|---|
| **Browser Geolocation API** | Détection position GPS pour le kiosque et les paramètres entreprise |

---

## Structure du projet

```
src/
├── app/
│   ├── components/              # Composants réutilisables
│   │   ├── layout/
│   │   │   ├── Layout.tsx       # Wrapper principal (Sidebar + Header + Outlet)
│   │   │   ├── Header.tsx       # Barre supérieure responsive
│   │   │   └── Sidebar.tsx      # Navigation latérale avec badges
│   │   ├── ui/                  # 40+ composants Radix UI / shadcn
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...              # card, badge, tabs, calendar, chart…
│   │   ├── AppLogo.tsx          # Logo SVG dégradé indigo/violet
│   │   └── figma/
│   │       └── ImageWithFallback.tsx
│   ├── context/                 # Contextes React globaux
│   │   ├── AuthContext.tsx      # Session utilisateur + CRUD employés
│   │   ├── ThemeContext.tsx     # Thème clair/sombre + langue + i18n
│   │   └── LayoutContext.tsx    # État sidebar mobile
│   ├── data/
│   │   ├── mockData.ts          # Interfaces TypeScript et types
│   │   └── translations.ts      # Dictionnaires FR/EN
│   ├── pages/                   # Pages de l'application (une par route)
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeesPage.tsx
│   │   ├── EmployeeDetailPage.tsx
│   │   ├── AttendancePage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── LeavesPage.tsx
│   │   ├── PlanningPage.tsx
│   │   ├── PerformancePage.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── DepartmentsPage.tsx
│   │   ├── KioskPage.tsx
│   │   └── SuperAdminPage.tsx
│   ├── services/
│   │   └── api.ts               # Client API centralisé (tous les namespaces)
│   ├── App.tsx                  # Point d'entrée, providers imbriqués
│   ├── routes.tsx               # Configuration React Router v7
│   └── main.tsx                 # Bootstrap Vite / ReactDOM.createRoot
├── styles/                      # CSS globaux et variables CSS custom
├── assets/                      # Polices, images, SVG statiques
└── index.html                   # Template HTML entry point
public/
├── manifest.json                # Manifest PWA
└── sw.js                        # Service Worker
```

### Pages et accès par rôle

| Route | Page | Rôles autorisés |
|---|---|---|
| `/login` | LoginPage | Public |
| `/kiosk` | KioskPage | Public (PIN uniquement) |
| `/superadmin` | SuperAdminPage | Super Admin (mot de passe dédié) |
| `/dashboard` | DashboardPage | Admin, Manager, Employee |
| `/employees` | EmployeesPage | Admin |
| `/employees/:id` | EmployeeDetailPage | Admin, Manager |
| `/attendance` | AttendancePage | Admin, Manager, Employee |
| `/calendar` | CalendarPage | Admin, Manager, Employee |
| `/leaves` | LeavesPage | Admin, Manager, Employee |
| `/planning` | PlanningPage | Admin, Manager |
| `/performance` | PerformancePage | Admin, Manager, Employee |
| `/documents` | DocumentsPage | Admin, Manager, Employee |
| `/reports` | ReportsPage | Admin, Manager, Employee |
| `/notifications` | NotificationsPage | Admin, Manager, Employee |
| `/departments` | DepartmentsPage | Admin |
| `/settings` | SettingsPage | Admin, Manager, Employee |

---

## Installation

### Prérequis

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Backend Express démarré (voir [server/README.md](server/README.md))
- Base de données MySQL configurée

### 1. Cloner le projet

```bash
git clone https://github.com/darel-developer/Hrattendancemanagerdesign.git
cd Hrattendancemanagerdesign
```

### 2. Installer les dépendances frontend

```bash
npm install
```

> **Note :** Si `NODE_ENV=production` est défini globalement sur votre système, forcez l'installation des devDependencies :
> ```bash
> NODE_ENV=development npm install --include=dev
> ```
> Ou ajoutez `include=dev` dans votre fichier `.npmrc` à la racine du projet.

### 3. Configurer le proxy Vite

Vérifiez que `vite.config.ts` pointe vers le bon port du backend :

```typescript
// vite.config.ts
server: {
  port: 5175,
  proxy: {
    '/api': {
      target: 'http://localhost:3002',  // Port du backend Express
      changeOrigin: true,
    },
  },
},
```

### 4. Démarrer en développement

```bash
npm run dev
```

L'application est accessible sur **http://localhost:5175**

### 5. Build de production

```bash
npm run build
```

Les fichiers compilés sont générés dans `dist/`.

---

## Variables d'environnement

Le frontend ne nécessite pas de fichier `.env` — la configuration passe par `vite.config.ts`.

### Proxy Vite (développement)

| Paramètre | Fichier | Description | Valeur par défaut |
|---|---|---|---|
| `server.port` | `vite.config.ts` | Port du serveur Vite | `5175` |
| `proxy['/api'].target` | `vite.config.ts` | URL du backend Express | `http://localhost:3002` |

### localStorage (runtime, auto-géré)

| Clé | Type | Description |
|---|---|---|
| `hr_session` | `{ userId, companyId }` | Session utilisateur persistée |
| `hr-theme` | `"light" \| "dark"` | Préférence de thème |
| `hr-language` | `"fr" \| "en"` | Langue de l'interface |

### sessionStorage (runtime, auto-géré)

| Clé | Type | Description |
|---|---|---|
| `hr_superadmin` | `boolean` | Accès super admin vérifié pour la session |

---

## Fonctionnalités principales

### Authentification

- Connexion via email + mot de passe (SHA-256 côté serveur)
- Session persistée dans `localStorage` (`hr_session`)
- Restauration automatique de session au rechargement
- Déconnexion nettoyant le localStorage
- Changement de mot de passe depuis les paramètres

### Gestion des rôles

| Rôle | Accès |
|---|---|
| **Admin** | Accès complet : employés, départements, paramètres entreprise, rapports, planning |
| **Manager** | Lecture équipe, approbation congés, évaluations, planning |
| **Employee** | Consultation propres données : pointages, congés, documents, évaluations |

### Pointage (KioskPage)

- Accessible sur `/kiosk` sans authentification
- Saisie du PIN à 4–8 chiffres
- Détection automatique de l'action (entrée ou sortie)
- Vérification GPS optionnelle si les coordonnées sont configurées pour l'entreprise
- Bandeau rouge affiché si l'utilisateur est hors du rayon autorisé
- Calcul automatique des heures travaillées à la sortie
- Protection brute-force : 5 tentatives max, blocage 15 min

### Géolocalisation

- **Kiosque** : hook `useGeolocation()` vérifiant la position toutes les 30 secondes, avec calcul de distance Haversine côté serveur
- **Paramètres** : bouton "Utiliser ma position actuelle" pour remplir automatiquement les coordonnées de l'entreprise
- **Indicateur** : badge actif/inactif selon que des coordonnées sont configurées

### Gestion des employés

- Liste filtrée par département, statut, rôle avec recherche textuelle
- Création manuelle ou import depuis un fichier (onglet dans le modal de création)
- Profil complet : informations, pointages, congés, documents, évaluations
- Export CSV de la liste filtrée
- Avatar stocké en base64

### Gestion des départements

- CRUD complet réservé aux Admins
- Affichage du nombre d'employés par département
- Renommage avec cascade automatique sur les employés
- Suppression bloquée si des employés y sont assignés
- Noms de départements personnalisés (pas de liste fixe)

### Notifications

- Centre avec types : `absence`, `conge`, `document`, `retard`, `system`
- Marquage lu individuel ou en masse
- Génération automatique côté backend (absences à 09h30, rapport mensuel le 1er du mois)
- Badge dynamique dans la sidebar

---

## Scripts disponibles

```bash
# Démarrer le serveur de développement Vite (http://localhost:5175)
npm run dev

# Compiler pour la production (sortie dans dist/)
npm run build

# Démarrer le backend Express (depuis la racine du projet)
npm run server

# Installer les dépendances du backend
npm run server:install
```

---

## Bonnes pratiques

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

## Déploiement

### Build de production

```bash
npm run build
# Le dossier dist/ contient une SPA statique prête à être servie
```

### Variables de production

Pour un déploiement en production, pointez l'API vers l'URL réelle. Créez un fichier `.env.production` et adaptez `api.ts` :

```env
# .env.production
VITE_API_URL=https://api.votre-domaine.com
```

```typescript
// src/app/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api';
```

### Hébergement recommandé

| Plateforme | Notes |
|---|---|
| **Vercel** | Déploiement automatique depuis GitHub, CDN global |
| **Netlify** | SPA-friendly, redirections `/index.html` automatiques |
| **Nginx** | Serveur statique + reverse proxy vers le backend Express |

### Configuration Nginx (exemple)

```nginx
server {
    listen 80;
    root /var/www/hr-attendance/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Liens utiles

- [Documentation Backend](server/README.md)
- [Documentation API](API.md)
- [Schéma base de données](database.sql)
