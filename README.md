# HR Attendance Manager

Application web de gestion des ressources humaines multi-entreprises : présences, congés, employés, rapports, notifications et kiosque de pointage.

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

Cela crée toutes les tables et insère les données de démonstration (2 entreprises, 10 employés).

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
npm audit

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
| `/employees` | Liste, recherche, filtres, ajout et modification d'employés | Admin, Manager |
| `/employees/:id` | Détail complet d'un employé (infos, historique de présence, congés) | Admin, Manager |
| `/attendance` | Pointages journaliers avec navigation par date, filtres, stats | Tous |
| `/leaves` | Demandes de congé : soumission, approbation / refus, solde — **mise à jour automatique** | Tous |
| `/reports` | Rapports persistés, boîte de réception, graphiques filtrables, export PDF — **vue simplifiée pour Employé** | Tous |
| `/notifications` | Centre de notifications : lire, supprimer, tout marquer lu — **mise à jour automatique** | Tous |
| `/settings` | Profil, changement de mot de passe, configuration entreprise, **préférences de notifications persistées** | Tous |

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

### Présences (Attendance)
- **Employé** : widget de pointage personnel (entrée / sortie), mode présentiel ou télétravail, saisie manuelle de l'heure d'arrivée, historique des 10 derniers jours
- **Manager** : widget de pointage personnel **en haut de page** + tableau de présence de son département
- **Admin** : tableau de présence de toute l'entreprise avec navigation par date, statistiques (présents / absents / retards / congés), filtre par statut
- Calcul automatique des heures travaillées à la sortie
- **Restauration d'état après reconnexion** : si l'utilisateur avait déjà pointé son entrée avant de se déconnecter, le widget reprend l'état correct (bouton "Sortie" visible) sans re-créer de doublon

### Congés
- Soumission d'une demande (type, dates, motif) avec calcul automatique des jours
- **Notification automatique** créée à l'envoi d'une demande
- Approbation / refus par Admin ou Manager avec commentaire
- Mise à jour du solde de congés restants
- Filtres par statut, type, département
- **Mise à jour dynamique** : la liste se rafraîchit automatiquement toutes les 30 secondes sans rechargement de page

### Rapports
- **Rédaction et envoi** : titre, type, contenu libre, modèles rapides (bilan mensuel, performance, absences)
- **Persistance en base de données** : chaque rapport envoyé est stocké dans la table `reports`
- **Boîte de réception** : section "Rapports reçus" affichant tous les rapports adressés à l'utilisateur connecté, avec indicateur de non-lus
- **Lecture complète** : modal d'affichage du contenu intégral avec marquage automatique comme lu
- **Vue Employé** : un employé peut envoyer un rapport uniquement à son manager (destinataire verrouillé automatiquement), voir ses rapports envoyés et reçus dans une liste chronologique
- **Graphiques filtrables** par période (semaine / mois / trimestre) calculés depuis les données réelles (Admin / Manager uniquement) :
  - Taux de présence (courbe aire)
  - Absences & retards (courbe ligne)
  - Heures travaillées (barres)
  - Répartition des types de congés (camembert)
- **Export PDF** : génération d'un rapport imprimable via `window.print()` (liste des employés, statistiques par département, masse salariale)
- **Calcul salarial** (Admin) : tableau des déductions par absence non justifiée

### Notifications
- Types : absence, congé, document, retard, système
- Marquage individuel ou global comme lu
- Suppression individuelle ou totale
- **Mise à jour automatique** : la liste et les badges se rafraîchissent toutes les 30 secondes sans rechargement de page
- **Filtrage par utilisateur** : un Employé ne voit que ses propres notifications (et les notifications système), jamais celles des autres employés
- **Badges dynamiques** dans la sidebar : disparaissent automatiquement dès que tout est lu
- **Préférences** (Settings > Notifications) : chaque type de notification peut être activé / désactivé individuellement, réglage persisté dans le navigateur
- **Recherche globale** dans le header : barre de recherche avec dropdown affichant les employés correspondants (nom, département, poste), navigation directe vers la fiche au clic
- **Notifications automatiques serveur** :
  - Chaque jour à 09h30 : détection des employés actifs sans pointage → création d'une notification d'absence (doublon évité)
  - Le 1er de chaque mois à 08h00 : envoi d'un rapport mensuel de présence aux administrateurs de chaque entreprise

### Kiosque de pointage (`/kiosk`)
- Page publique sans authentification — conçue pour une tablette en entrée de bureau
- Sélection de l'entreprise
- Grille des employés avec avatar
- Clavier PIN numérique pour s'identifier
- Check-in / Check-out automatique avec détection des retards (basée sur `workStart` + `lateTolerance` de l'entreprise)
- Confirmation visuelle 5 secondes puis retour à l'accueil

### Super Administration (`/superadmin`)
- Connexion par mot de passe plateforme (`SUPER_ADMIN_PASSWORD`, défaut : `superadmin2024`)
- Créer / supprimer des entreprises (nom, secteur, adresse, email RH, heure de début, tolérance retard)
- Ajouter / supprimer des administrateurs par entreprise
- Vue des statistiques globales (entreprises, admins, employés)

---

## Architecture du projet

```
├── src/app/components/
│   └── AppLogo.tsx              # Logo SVG dégradé indigo/violet de l'application
│
├── server/                      # Backend Express.js
│   ├── routes/
│   │   ├── auth.js              # Login, changement de mot de passe
│   │   ├── employees.js         # CRUD employés
│   │   ├── attendance.js        # Pointages (create, update, query)
│   │   ├── leaves.js            # Congés (create, update, query)
│   │   ├── notifications.js     # Notifications (CRUD + mark-read)
│   │   ├── reports.js           # Rapports persistés (create, get, mark-read)
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
│   │   ├── LayoutContext.tsx    # État sidebar mobile (partagé Layout ↔ Header)
│   │   └── ThemeContext.tsx     # Mode clair / sombre
│   ├── data/
│   │   └── mockData.ts          # Interfaces TypeScript (Employee, Leave, Report…)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeesPage.tsx    # Avec EditEmployeeModal
│   │   ├── EmployeeDetailPage.tsx
│   │   ├── AttendancePage.tsx   # PersonalCheckIn pour Employee et Manager
│   │   ├── LeavesPage.tsx
│   │   ├── ReportsPage.tsx      # Inbox + ReadReportModal + WriteReportModal
│   │   ├── NotificationsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── KioskPage.tsx
│   │   └── SuperAdminPage.tsx
│   ├── components/
│   │   └── layout/
│   │       ├── Layout.tsx       # Sidebar responsive (overlay mobile)
│   │       ├── Header.tsx       # Hamburger menu mobile
│   │       └── Sidebar.tsx
│   ├── services/
│   │   └── api.ts               # Tous les appels API (employees, attendance, leaves,
│   │                            #   notifications, reports, auth, superAdmin, kiosk)
│   └── routes.tsx               # Routes React Router v7
│
└── database.sql                 # Script SQL complet (tables + données démo)
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
| GET | `/api/attendance` | Pointages (filtrable par `date`, `employeeId`) |
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
| GET | `/api/companies` | Liste des entreprises |
| POST | `/api/companies` | Créer une entreprise |
| PUT | `/api/companies/:id` | Modifier une entreprise |
| DELETE | `/api/companies/:id` | Supprimer une entreprise |
| GET | `/api/kiosk/employees/:companyId` | Employés pour le kiosque |
| POST | `/api/kiosk/checkin` | Check-in/out via PIN |
| POST | `/api/superadmin/verify` | Vérifier le mot de passe super admin |

---

## Sécurité des mots de passe

Les mots de passe sont hachés en **SHA-256** via le module `crypto` natif de Node.js. Aucune dépendance externe (pas de bcrypt). Le fichier `database.sql` utilise `SHA2('admin1234', 256)` qui produit le même résultat.

---

## Devises

Tous les salaires sont affichés en **FCFA** (Franc CFA).

---

## Notes techniques

- Le proxy Vite redirige `/api/*` → `http://localhost:3001` (configuré dans `vite.config.ts`)
- Le backend doit être lancé **avant** le frontend
- La session est stockée dans `localStorage` (clé : `hr_session`)
- La session super admin est stockée dans `sessionStorage` (clé : `hr_superadmin`)
- Le scheduler de notifications (`setTimeout` / `setInterval`) démarre automatiquement avec le serveur
- Les données de démonstration peuvent être réimportées à tout moment via `database.sql`
