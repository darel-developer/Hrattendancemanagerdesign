# HR Attendance Manager

Application web de gestion des ressources humaines multi-entreprises : présences, congés, employés, rapports, notifications, kiosque de pointage, évaluations de performance, documents RH et planning des équipes.

---

## Prérequis

| Outil | Version minimale | Notes |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MySQL | 8.0+ | XAMPP, WAMP, ou installation standalone |
| npm | 9+ | Inclus avec Node.js |

---

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite 6 + Tailwind CSS v4 + Framer Motion
- **Backend** : Express.js (port 3001)
- **Base de données** : MySQL 8 (`hr_attendance_db`)
- **Authentification** : SHA-256 (module `crypto` natif Node.js)
- **Graphiques** : Recharts (AreaChart, BarChart, LineChart, PieChart)
- **PWA** : manifest.json + service worker (installable sur mobile/desktop)

---

## Installation

### 1. Cloner et installer les dépendances frontend

```bash
npm install
```

### 2. Installer les dépendances backend

```bash
cd server
npm install
cd ..
```

> Ou depuis la racine : `npm run server:install`

### 3. Créer la base de données

1. Ouvrir **phpMyAdmin** (ou tout client MySQL)
2. Créer une base de données nommée `hr_attendance_db`
3. Importer le fichier `database.sql` à la racine du projet

Cela crée toutes les tables de base et insère les données de démonstration (2 entreprises, 10 employés).

4. Importer ensuite `migration.sql` pour créer les tables des nouvelles fonctionnalités :

```sql
-- Dans phpMyAdmin ou via la CLI MySQL :
SOURCE migration.sql;
```

> Ce fichier utilise uniquement `CREATE TABLE IF NOT EXISTS` — aucune donnée existante n'est modifiée.

> La table `reports` est créée automatiquement au premier démarrage du serveur si elle n'existe pas encore.

### 4. Configurer le backend

Le fichier `server/.env` est déjà présent. Modifie-le si nécessaire :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # ton mot de passe MySQL (vide par défaut sous XAMPP)
DB_NAME=hr_attendance_db
PORT=3001
SUPER_ADMIN_PASSWORD=superadmin2024
```

---

## Lancer l'application

Ouvre **deux terminaux** :

**Terminal 1 — Backend**
```bash
cd server
node server.js
```
> Le serveur démarre sur `http://localhost:3001`

**Terminal 2 — Frontend**
```bash
npm run dev
```
> L'application démarre sur `http://localhost:5173`

---

## Comptes de démonstration

Mot de passe universel : **`admin1234`**

| Rôle | Email | Accès |
|---|---|---|
| Admin | sophie.moreau@company.com | Accès total (TechCorp Solutions) |
| Manager | thomas.dubois@company.com | Son département uniquement |
| Employé | lucas.bernard@company.com | Vue personnelle |
| Admin | amara.diallo@innogroup.com | Accès total (InnoGroup Afrique) |

---

## Pages et fonctionnalités

### Application principale

| Route | Description | Rôles |
|---|---|---|
| `/login` | Connexion par email + mot de passe | Tous |
| `/dashboard` | Vue d'ensemble : KPIs, présences du jour, congés en attente, graphiques | Tous |
| `/employees` | Liste, recherche, filtres, ajout/modification d'employés, **export CSV** | Admin |
| `/employees/:id` | Détail complet d'un employé (infos, historique présence, congés) | Admin, Manager |
| `/attendance` | Pointages journaliers avec navigation par date, filtres, stats, **export CSV** | Tous |
| `/calendar` | Vue calendrier mensuel des présences et congés — dots colorés par employé | Tous |
| `/leaves` | Demandes de congé : soumission, approbation/refus, solde, **export CSV** — mise à jour automatique | Tous |
| `/planning` | Grille hebdomadaire des quarts de travail (Matin/Après-midi/Nuit/Repos) | Admin, Manager |
| `/performance` | Évaluations de performance avec notation 5 étoiles, périodes, objectifs | Tous |
| `/documents` | Documents RH par employé avec alertes d'expiration | Tous |
| `/reports` | Rapports persistés, boîte de réception, graphiques filtrables, export PDF | Tous |
| `/notifications` | Centre de notifications : lire, supprimer, tout marquer lu — mise à jour automatique | Tous |
| `/settings` | Profil, changement de mot de passe, configuration entreprise, préférences notifications | Tous |

### Pages spéciales

| Route | Description | Accès |
|---|---|---|
| `/kiosk` | Terminal de pointage public par code PIN — aucune connexion requise | Public |
| `/superadmin` | Gestion des entreprises et de leurs administrateurs | Mot de passe plateforme |

---

## Détail des fonctionnalités

### Authentification
- Connexion par email + mot de passe (SHA-256)
- Session persistée dans `localStorage`
- Changement de mot de passe depuis les paramètres
- Déconnexion avec effacement de session

### Gestion des employés
- Liste paginée avec recherche, filtres par département / statut / contrat
- **Édition en modal** : tous les champs modifiables (nom, poste, département, salaire, rôle, adresse, mot de passe optionnel)
- Ajout et suppression d'employés
- Page de détail avec onglets : informations, historique présence, congés
- Affichage de l'ancienneté, du solde de congés, du taux journalier
- **Export CSV** : téléchargement direct de la liste filtrée (UTF-8 avec BOM)

### Présences (Attendance)
- **Employé** : widget de pointage personnel (entrée / sortie), mode présentiel ou télétravail, saisie manuelle de l'heure d'arrivée, historique des 10 derniers jours
- **Manager** : widget de pointage personnel **en haut de page** + tableau de présence de son département
- **Admin** : tableau de présence de toute l'entreprise avec navigation par date, statistiques (présents / absents / retards / congés), filtre par statut
- Calcul automatique des heures travaillées à la sortie
- **Restauration d'état après reconnexion** : le widget reprend l'état correct sans re-créer de doublon
- **Export CSV** : export des pointages filtrés du jour sélectionné

### Calendrier
- Vue mensuelle avec navigation mois par mois
- **Admin / Manager** : grille à 42 cellules (Lun–Dim), dots colorés par type de présence pour chaque employé du scope, panneau latéral au clic sur un jour listant l'état de chaque employé
- **Employé** : fond coloré par jour selon son propre statut (présent, absent, congé, télétravail)
- Aujourd'hui mis en évidence avec un contour indigo

### Planning des équipes
- Grille hebdomadaire : employés en lignes, jours en colonnes
- Types de quart : **Matin** (indigo), **Après-midi** (ambre), **Nuit** (violet), **Repos** (gris)
- Cliquer sur une cellule ouvre un modal pour ajouter ou modifier le quart : type, heure début/fin, note
- Navigation semaine par semaine, bouton "Cette semaine"
- Données persistées en base (`team_shifts`)

### Évaluations de performance
- **Admin / Manager** : créer/modifier/supprimer des évaluations pour les employés de leur scope
- **Employé** : consulter ses propres évaluations (lecture seule)
- **Notation 5 étoiles** interactive avec survol
- Champs : période (trimestre/annuel), points forts, axes d'amélioration, objectifs
- Statuts : **Brouillon → Soumis → Acquitté**
- Filtrage par période, compteurs par statut

### Documents RH
- Gestion des documents par employé : Contrat, Bulletin de salaire, Pièce d'identité, Médical, Diplôme, Attestation, Autre
- **Alertes visuelles** : rouge pour les documents expirés, orange pour ceux expirant dans moins de 30 jours
- Lien direct vers le fichier (ouverture dans un onglet)
- **Admin / Manager** : ajout/suppression, filtrage par employé et par type
- **Employé** : vue de ses propres documents

### Congés
- Soumission d'une demande (type, dates, motif) avec calcul automatique des jours
- **Notification automatique** créée à l'envoi d'une demande
- Approbation / refus par Admin ou Manager avec commentaire
- Mise à jour du solde de congés restants
- Filtres par statut
- **Mise à jour dynamique** : la liste se rafraîchit automatiquement toutes les 30 secondes
- **Export CSV** : téléchargement de la liste filtrée

### Rapports
- **Rédaction et envoi** : titre, type, contenu libre, modèles rapides (bilan mensuel, performance, absences)
- **Persistance en base de données** : chaque rapport stocké dans la table `reports`
- **Boîte de réception** : rapports reçus avec indicateur de non-lus
- **Lecture complète** : modal avec marquage automatique comme lu
- **Vue Employé** : envoi uniquement au manager (destinataire verrouillé), liste chronologique envoyés/reçus
- **Graphiques filtrables** par période (semaine / mois / trimestre) : taux de présence, absences & retards, heures travaillées, répartition des congés
- **Export PDF** : rapport imprimable via `window.print()`

### Notifications
- Types : absence, congé, document, retard, système
- Marquage individuel ou global comme lu, suppression individuelle ou totale
- **Mise à jour automatique** toutes les 30 secondes
- **Filtrage par utilisateur** : un Employé ne voit que ses propres notifications
- **Badges dynamiques** dans la sidebar (disparaissent dès que tout est lu)
- **Préférences** (Settings > Notifications) : activation/désactivation par type, persistée dans le navigateur
- **Notifications automatiques serveur** :
  - Chaque jour à 09h30 : détection des absences → notification (doublon évité)
  - Le 1er de chaque mois à 08h00 : rapport mensuel de présence aux administrateurs

### Kiosque de pointage (`/kiosk`)
- Page publique sans authentification — conçue pour une tablette en entrée de bureau
- Sélection de l'entreprise, grille des employés avec avatar
- Clavier PIN numérique pour s'identifier
- Check-in / Check-out avec détection automatique des retards
- Confirmation visuelle 5 secondes puis retour à l'accueil

### Super Administration (`/superadmin`)
- Connexion par mot de passe plateforme (`SUPER_ADMIN_PASSWORD`, défaut : `superadmin2024`)
- Créer / supprimer des entreprises (nom, secteur, adresse, email RH, heure de début, tolérance retard)
- Ajouter / supprimer des administrateurs par entreprise
- Vue des statistiques globales (entreprises, admins, employés)

### PWA (Progressive Web App)
- Installable sur mobile et desktop via le navigateur
- Service worker : cache-first pour les assets statiques, network-first pour les appels API
- Fonctionne partiellement hors ligne (lecture du cache)
- Manifest avec thème indigo et icônes

---

## Architecture du projet

```
├── public/
│   ├── manifest.json            # Manifest PWA
│   └── sw.js                    # Service worker
│
├── src/app/components/
│   └── AppLogo.tsx              # Logo SVG dégradé indigo/violet
│
├── server/                      # Backend Express.js
│   ├── routes/
│   │   ├── auth.js              # Login, changement de mot de passe
│   │   ├── employees.js         # CRUD employés
│   │   ├── attendance.js        # Pointages (create, update, query)
│   │   ├── leaves.js            # Congés (create, update, query)
│   │   ├── notifications.js     # Notifications (CRUD + mark-read)
│   │   ├── reports.js           # Rapports persistés (create, get, mark-read)
│   │   ├── performance.js       # Évaluations de performance (CRUD)
│   │   ├── documents.js         # Documents RH (CRUD)
│   │   ├── planning.js          # Planning des quarts (CRUD + upsert)
│   │   ├── companies.js         # Entreprises (CRUD)
│   │   ├── kiosk.js             # API kiosque (PIN, check-in/out)
│   │   └── superadmin.js        # Vérification mot de passe super admin
│   ├── db.js                    # Pool MySQL2
│   ├── server.js                # Point d'entrée + scheduler auto-notifications
│   └── .env                     # Variables d'environnement
│
├── src/app/
│   ├── context/
│   │   ├── AuthContext.tsx      # Session utilisateur + CRUD employés
│   │   ├── LayoutContext.tsx    # État sidebar mobile
│   │   └── ThemeContext.tsx     # Mode clair / sombre
│   ├── data/
│   │   └── mockData.ts          # Interfaces TypeScript (Employee, Leave, Report,
│   │                            #   PerformanceReview, EmployeeDocument, TeamShift…)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeesPage.tsx    # + export CSV
│   │   ├── EmployeeDetailPage.tsx
│   │   ├── AttendancePage.tsx   # PersonalCheckIn + export CSV
│   │   ├── CalendarPage.tsx     # Vue calendrier mensuel
│   │   ├── LeavesPage.tsx       # + export CSV
│   │   ├── PlanningPage.tsx     # Grille hebdomadaire des quarts
│   │   ├── PerformancePage.tsx  # Évaluations 5 étoiles
│   │   ├── DocumentsPage.tsx    # Documents RH + alertes expiration
│   │   ├── ReportsPage.tsx      # Inbox + graphiques + export PDF
│   │   ├── NotificationsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── KioskPage.tsx
│   │   └── SuperAdminPage.tsx
│   ├── components/
│   │   └── layout/
│   │       ├── Layout.tsx       # Sidebar responsive
│   │       ├── Header.tsx       # Recherche globale + hamburger mobile
│   │       └── Sidebar.tsx      # Navigation + badges dynamiques
│   ├── services/
│   │   └── api.ts               # Tous les appels API
│   └── routes.tsx               # Routes React Router v7
│
├── database.sql                 # Script SQL complet (tables + données démo)
└── migration.sql                # Migration safe pour les nouvelles tables
```

---

## API Backend

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/change-password` | Changement de mot de passe |
| GET | `/api/employees` | Liste (filtrable par `companyId`, `role`) |
| POST | `/api/employees` | Créer un employé |
| PUT | `/api/employees/:id` | Modifier un employé |
| DELETE | `/api/employees/:id` | Supprimer un employé |
| GET | `/api/attendance` | Pointages (filtrable par `date`, `employeeId`, `startDate`, `endDate`) |
| POST | `/api/attendance` | Créer un pointage |
| PUT | `/api/attendance/:id` | Modifier un pointage |
| GET | `/api/leaves` | Congés (filtrable par `employeeId`, `companyId`) |
| POST | `/api/leaves` | Soumettre une demande |
| PUT | `/api/leaves/:id` | Approuver / refuser |
| GET | `/api/notifications` | Notifications (filtrable par `companyId`) |
| POST | `/api/notifications` | Créer une notification |
| PUT | `/api/notifications/:id/read` | Marquer comme lu |
| PUT | `/api/notifications/read-all` | Tout marquer lu |
| DELETE | `/api/notifications/:id` | Supprimer |
| DELETE | `/api/notifications` | Tout supprimer |
| GET | `/api/reports` | Rapports (filtrable par `senderId`, `recipientId`) |
| POST | `/api/reports` | Créer un rapport |
| PUT | `/api/reports/:id/read` | Marquer comme lu |
| GET | `/api/performance` | Évaluations (filtrable par `employeeId`, `reviewerId`, `companyId`) |
| POST | `/api/performance` | Créer une évaluation |
| PUT | `/api/performance/:id` | Modifier une évaluation |
| DELETE | `/api/performance/:id` | Supprimer une évaluation |
| GET | `/api/documents` | Documents (filtrable par `employeeId`, `companyId`) |
| POST | `/api/documents` | Ajouter un document |
| PUT | `/api/documents/:id` | Modifier un document |
| DELETE | `/api/documents/:id` | Supprimer un document |
| GET | `/api/planning` | Quarts de travail (filtrable par `employeeId`, `companyId`, `startDate`, `endDate`) |
| POST | `/api/planning` | Créer / mettre à jour un quart (upsert par employé + date) |
| PUT | `/api/planning/:id` | Modifier un quart |
| DELETE | `/api/planning/:id` | Supprimer un quart |
| GET | `/api/companies` | Liste des entreprises |
| POST | `/api/companies` | Créer une entreprise |
| PUT | `/api/companies/:id` | Modifier une entreprise |
| DELETE | `/api/companies/:id` | Supprimer une entreprise |
| GET | `/api/kiosk/employees/:companyId` | Employés pour le kiosque |
| POST | `/api/kiosk/checkin` | Check-in/out via PIN |
| POST | `/api/superadmin/verify` | Vérifier le mot de passe super admin |

---

## Schéma des nouvelles tables (migration.sql)

```sql
-- Évaluations de performance
performance_reviews (id, employee_id, reviewer_id, period, rating, strengths, improvements, goals, status, created_at)

-- Documents RH
employee_documents (id, employee_id, title, type, file_url, expiry_date, created_at)

-- Planning des quarts
team_shifts (id, employee_id, date, start_time, end_time, shift_type, note, created_at)
-- Contrainte UNIQUE sur (employee_id, date) → upsert possible
```

---

## Sécurité des mots de passe

Les mots de passe sont hachés en **SHA-256** via le module `crypto` natif de Node.js. Le fichier `database.sql` utilise `SHA2('admin1234', 256)` qui produit le même résultat.

---

## Devises

Tous les salaires sont affichés en **FCFA** (Franc CFA).

---

## Notes techniques

- Le proxy Vite redirige `/api/*` → `http://localhost:3001` (configuré dans `vite.config.ts`)
- Le backend doit être lancé **avant** le frontend
- La session est stockée dans `localStorage` (clé : `hr_session`)
- La session super admin est stockée dans `sessionStorage` (clé : `hr_superadmin`)
- Le scheduler de notifications démarre automatiquement avec le serveur
- Les données de démonstration peuvent être réimportées à tout moment via `database.sql`
- Le service worker se met à jour automatiquement à chaque nouveau déploiement (versioning du cache)
