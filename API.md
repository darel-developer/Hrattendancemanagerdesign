# HR Attendance Manager — Documentation API

<div align="center">

![REST API](https://img.shields.io/badge/REST-API-009688)
![JSON](https://img.shields.io/badge/Format-JSON-FFA000)
![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express)

**API REST JSON — Référence complète des endpoints**

</div>

---

## Présentation de l'API

L'API HR Attendance Manager est une API REST qui expose l'ensemble des fonctionnalités de gestion RH. Elle retourne et accepte exclusivement du **JSON** (`Content-Type: application/json`).

**Caractéristiques :**
- Architecture REST sans état (stateless)
- Authentification par session côté client (pas de JWT)
- Isolation multi-tenant via `companyId`
- Validation des entrées côté serveur
- Rate limiting par IP

---

## Base URL

| Environnement | URL |
|---|---|
| **Développement** | `http://localhost:3002/api` |
| **Production** | `https://api.votre-domaine.com/api` |

Tous les chemins dans ce document sont relatifs à la Base URL.

---

## Authentification

L'API ne génère pas de token JWT. La session est gérée côté client (localStorage) avec `{ userId, companyId }`.

**Chaque requête doit inclure les identifiants nécessaires** dans le corps ou en query params :
- `companyId` : pour filtrer les données de l'entreprise
- `employeeId` : pour les données personnelles

### Login

```http
POST /auth/login
```

**Corps :**
```json
{
  "email": "admin@exemple.com",
  "password": "motdepasse123"
}
```

**Réponse 200 :**
```json
{
  "id": "EMP001",
  "companyId": "COMP001",
  "firstName": "Sophie",
  "lastName": "Moreau",
  "email": "admin@exemple.com",
  "role": "Admin",
  "department": "Direction",
  "position": "Directrice RH",
  "status": "Actif",
  "avatar": null,
  "leaveBalance": 25,
  "leaveUsed": 3
}
```

**Erreurs :**
- `401` : `{ "error": "Email ou mot de passe invalide" }`

---

## Format des réponses

### Succès

```json
{
  "id": "...",
  "field": "value"
}
```

Pour les listes :
```json
[
  { "id": "...", ... },
  { "id": "...", ... }
]
```

### Erreur

```json
{
  "error": "Message d'erreur lisible"
}
```

---

## Codes HTTP

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Requête invalide (champ manquant, validation échouée) |
| `401` | Non authentifié (email/mot de passe invalide) |
| `403` | Accès refusé (hors périmètre géographique, etc.) |
| `404` | Ressource introuvable |
| `409` | Conflit (doublon email, département déjà existant…) |
| `429` | Trop de requêtes (rate limit dépassé) |
| `500` | Erreur serveur interne |

---

## Gestion des erreurs globale

| Erreur | HTTP | Corps |
|---|---|---|
| Champ requis manquant | `400` | `{ "error": "Le champ X est requis" }` |
| Email déjà utilisé | `409` | `{ "error": "Email déjà utilisé" }` |
| Ressource introuvable | `404` | `{ "error": "Employé introuvable" }` |
| Accès hors zone GPS | `403` | `{ "error": "Hors zone", "geoRequired": true }` |
| Rate limit dépassé | `429` | `{ "error": "Trop de requêtes" }` + `Retry-After: <secondes>` |
| Erreur serveur | `500` | `{ "error": "Erreur serveur" }` |

---

## Module Auth — `/auth`

> Rate limit : **10 requêtes / 15 minutes par IP**

---

### POST `/auth/login`

Authentifie un utilisateur.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `email` | string | Oui | Adresse email |
| `password` | string | Oui | Mot de passe en clair (haché SHA-256 côté serveur) |

**Réponse 200 — Objet Employee complet :**
```json
{
  "id": "EMPGM001",
  "companyId": "COMPGM001",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@globalmove.com",
  "phone": "+33 6 12 34 56 78",
  "avatar": null,
  "role": "Admin",
  "department": "Direction",
  "position": "Directeur Général",
  "contractType": "CDI",
  "startDate": "2022-01-15",
  "salary": 5500.00,
  "status": "Actif",
  "managerId": null,
  "address": "15 rue de la Paix, Paris",
  "birthDate": "1980-05-20",
  "leaveBalance": 25,
  "leaveUsed": 5
}
```

**Erreurs :**
- `400` : champ manquant
- `401` : identifiants invalides

---

### POST `/auth/change-password`

Change le mot de passe d'un employé.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `employeeId` | string | Oui | ID de l'employé |
| `currentPassword` | string | Oui | Mot de passe actuel |
| `newPassword` | string | Oui | Nouveau mot de passe (min 6 caractères) |

**Réponse 200 :**
```json
{ "success": true }
```

**Erreurs :**
- `400` : nouveau mot de passe trop court (< 6 caractères)
- `401` : mot de passe actuel incorrect
- `404` : employé introuvable

---

## Module Employés — `/employees`

---

### GET `/employees`

Retourne la liste des employés, filtrée par entreprise.

**Query params :**

| Param | Type | Requis | Description |
|---|---|---|---|
| `companyId` | string | Recommandé | Filtre par entreprise |
| `role` | string | Non | Filtre par rôle : `Admin`, `Manager`, `Employee` |

**Réponse 200 :**
```json
[
  {
    "id": "EMPGM001",
    "companyId": "COMPGM001",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@globalmove.com",
    "phone": "+33 6 12 34 56 78",
    "avatar": null,
    "role": "Admin",
    "department": "Direction",
    "position": "Directeur Général",
    "contractType": "CDI",
    "startDate": "2022-01-15",
    "salary": 5500.00,
    "status": "Actif",
    "managerId": null,
    "address": "15 rue de la Paix, Paris",
    "birthDate": "1980-05-20",
    "leaveBalance": 25,
    "leaveUsed": 5
  }
]
```

---

### GET `/employees/:id`

Retourne un employé par son ID.

**Réponse 200 :** Objet Employee (même format que ci-dessus)

**Erreurs :**
- `404` : employé introuvable

---

### POST `/employees`

Crée un nouvel employé.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `companyId` | string | Oui | ID de l'entreprise |
| `firstName` | string | Oui | Prénom |
| `lastName` | string | Oui | Nom |
| `email` | string | Oui | Email unique |
| `role` | string | Oui | `Admin`, `Manager`, `Employee` |
| `department` | string | Non | Département (texte libre) |
| `position` | string | Non | Poste |
| `contractType` | string | Non | `CDI`, `CDD`, `Stage`, `Freelance` |
| `startDate` | string (ISO) | Non | Date d'entrée |
| `salary` | number | Non | Salaire brut |
| `status` | string | Non | `Actif`, `Inactif`, `En congé` |
| `managerId` | string | Non | ID du manager |
| `phone` | string | Non | Téléphone |
| `avatar` | string | Non | Image en base64 |
| `address` | string | Non | Adresse |
| `birthDate` | string (ISO) | Non | Date de naissance |
| `leaveBalance` | number | Non | Solde congés (défaut : 25) |
| `password` | string | Non | Mot de passe (min 6 car., haché SHA-256) |
| `pin` | string | Non | PIN kiosque 4–8 chiffres |

**Réponse 201 :** Objet Employee créé

**Erreurs :**
- `400` : champ requis manquant, PIN invalide, mot de passe trop court
- `409` : email déjà utilisé

---

### PUT `/employees/:id`

Modifie un employé existant.

**Corps :** Mêmes champs que POST (tous optionnels sauf ceux à modifier).

**Réponse 200 :** Objet Employee mis à jour

**Erreurs :**
- `404` : employé introuvable
- `409` : email déjà utilisé

---

### DELETE `/employees/:id`

Supprime un employé.

**Réponse 200 :**
```json
{ "success": true }
```

**Erreurs :**
- `404` : employé introuvable

---

## Module Entreprises — `/companies`

---

### GET `/companies`

Retourne toutes les entreprises avec leurs compteurs.

**Réponse 200 :**
```json
[
  {
    "id": "COMPGM001",
    "name": "Global Move CN",
    "sector": "Conseil, Immigration, Formation et Services",
    "address": "Paris, France",
    "hrEmail": "rh@globalmove.com",
    "workStart": "08:30:00",
    "lateTolerance": 15,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "geoRadius": 200,
    "employeeCount": 46,
    "adminCount": 2,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET `/companies/:id`

Retourne une entreprise par son ID.

**Réponse 200 :** Objet Company (même format)

**Erreurs :**
- `404` : entreprise introuvable

---

### POST `/companies`

Crée une nouvelle entreprise.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique (ex: `COMP001`) |
| `name` | string | Oui | Nom de l'entreprise |
| `sector` | string | Non | Secteur d'activité |
| `address` | string | Non | Adresse |
| `hrEmail` | string | Non | Email RH |
| `workStart` | string | Non | Heure de début (format `HH:MM:SS`) |
| `lateTolerance` | number | Non | Tolérance retard en minutes (défaut : 5) |
| `latitude` | number | Non | Latitude GPS |
| `longitude` | number | Non | Longitude GPS |
| `geoRadius` | number | Non | Rayon de présence en mètres (défaut : 100) |

**Réponse 201 :** Objet Company créé

**Erreurs :**
- `400` : champ requis manquant
- `409` : ID déjà utilisé

---

### PUT `/companies/:id`

Modifie une entreprise (y compris les coordonnées GPS).

**Corps :** Mêmes champs que POST (tous optionnels).

**Réponse 200 :** Objet Company mis à jour

---

### DELETE `/companies/:id`

Supprime une entreprise (cascade sur les employés).

**Réponse 200 :**
```json
{ "success": true }
```

---

## Module Pointages — `/attendance`

---

### GET `/attendance`

Retourne les enregistrements de pointage.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise |
| `employeeId` | string | Filtre par employé |
| `date` | string (ISO) | Filtre par date exacte |
| `startDate` | string (ISO) | Début de période |
| `endDate` | string (ISO) | Fin de période |

**Réponse 200 :**
```json
[
  {
    "id": "ATT20240115EMP001",
    "employeeId": "EMPGM001",
    "date": "2024-01-15",
    "checkIn": "08:45:00",
    "checkOut": "17:30:00",
    "status": "Présent",
    "hoursWorked": 8.75,
    "note": null
  }
]
```

---

### POST `/attendance`

Crée ou met à jour un enregistrement (upsert par `id`).

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `employeeId` | string | Oui | ID de l'employé |
| `date` | string (ISO) | Oui | Date du pointage |
| `status` | string | Oui | `Présent`, `Absent`, `Retard`, `Congé`, `Télétravail` |
| `checkIn` | string | Non | Heure d'arrivée (HH:MM:SS) |
| `checkOut` | string | Non | Heure de départ (HH:MM:SS) |
| `hoursWorked` | number | Non | Heures travaillées |
| `note` | string | Non | Commentaire |

**Réponse 200/201 :** Objet AttendanceRecord

---

### PUT `/attendance/:id`

Modifie un enregistrement existant.

**Corps :** Mêmes champs que POST (tous optionnels).

**Réponse 200 :** Objet AttendanceRecord mis à jour

---

## Module Kiosque — `/kiosk`

> Route publique (sans authentification)  
> Rate limit : **30 requêtes / 10 minutes par IP**

---

### GET `/kiosk/employees/:companyId`

Retourne la liste des employés actifs d'une entreprise pour l'affichage kiosque.

**Réponse 200 :**
```json
[
  {
    "id": "EMPGM001",
    "firstName": "Jean",
    "lastName": "Dupont",
    "avatar": null,
    "position": "Directeur Général",
    "department": "Direction"
  }
]
```

---

### POST `/kiosk/checkin`

Enregistre un pointage via PIN. Détermine automatiquement si c'est une entrée ou une sortie.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `employeeId` | string | Oui | ID de l'employé |
| `pin` | string | Oui | PIN à 4–8 chiffres |
| `companyId` | string | Oui | ID de l'entreprise |
| `latitude` | number | Non | Latitude GPS du navigateur |
| `longitude` | number | Non | Longitude GPS du navigateur |

**Réponse 200 — Check-in :**
```json
{
  "success": true,
  "action": "check_in",
  "time": "08:47:23",
  "status": "Présent",
  "employee": {
    "id": "EMPGM001",
    "firstName": "Jean",
    "lastName": "Dupont"
  }
}
```

**Réponse 200 — Check-out :**
```json
{
  "success": true,
  "action": "check_out",
  "time": "17:32:10",
  "hoursWorked": 8.75,
  "status": "Présent",
  "employee": {
    "id": "EMPGM001",
    "firstName": "Jean",
    "lastName": "Dupont"
  }
}
```

**Erreurs :**
- `400` : champs manquants
- `401` : PIN incorrect (avec compteur de tentatives restantes)
- `403` : PIN bloqué (5 tentatives dépassées) ou hors zone GPS
- `404` : employé introuvable

**Réponse 403 — Hors zone géographique :**
```json
{
  "error": "Vous devez être à proximité de l'entreprise pour pointer.",
  "geoRequired": true,
  "distance": 523,
  "radius": 200
}
```

**Réponse 401 — PIN incorrect :**
```json
{
  "error": "PIN incorrect. 3 tentative(s) restante(s)."
}
```

**Réponse 403 — PIN bloqué :**
```json
{
  "error": "Compte bloqué après trop de tentatives. Réessayez dans 15 minutes."
}
```

---

## Module Congés — `/leaves`

---

### GET `/leaves`

Retourne les demandes de congé.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise |
| `employeeId` | string | Filtre par employé |

**Réponse 200 :**
```json
[
  {
    "id": "LEAVE001",
    "employeeId": "EMPGM001",
    "type": "Congé annuel",
    "startDate": "2024-08-01",
    "endDate": "2024-08-15",
    "days": 11,
    "reason": "Vacances d'été",
    "status": "Approuvé",
    "requestDate": "2024-07-01",
    "reviewedBy": "EMPGM002",
    "reviewDate": "2024-07-03",
    "comment": "Accordé"
  }
]
```

---

### POST `/leaves`

Crée une demande de congé.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `employeeId` | string | Oui | ID de l'employé |
| `type` | string | Oui | `Congé annuel`, `Maladie`, `Congé maternité`, `RTT`, `Exceptionnel` |
| `startDate` | string (ISO) | Oui | Date de début |
| `endDate` | string (ISO) | Oui | Date de fin |
| `days` | number | Oui | Nombre de jours |
| `reason` | string | Non | Motif |

**Réponse 201 :** Objet LeaveRequest créé (statut `En attente`)

---

### PUT `/leaves/:id`

Modifie ou approuve/refuse une demande.

**Corps :**

| Champ | Type | Description |
|---|---|---|
| `status` | string | `En attente`, `Approuvé`, `Refusé` |
| `reviewedBy` | string | ID du responsable qui traite la demande |
| `comment` | string | Commentaire de décision |

> Si `status` passe à `Approuvé`, le `leave_used` de l'employé est automatiquement incrémenté de `days`.

**Réponse 200 :** Objet LeaveRequest mis à jour

---

## Module Départements — `/departments`

---

### GET `/departments`

Retourne les départements d'une entreprise avec leur nombre d'employés.

**Query params :**

| Param | Type | Requis | Description |
|---|---|---|---|
| `companyId` | string | Oui | Filtre par entreprise |

**Réponse 200 :**
```json
[
  {
    "id": "DEPT001",
    "companyId": "COMPGM001",
    "name": "Direction",
    "employeeCount": 3,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "DEPT002",
    "companyId": "COMPGM001",
    "name": "Informatique",
    "employeeCount": 8,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST `/departments`

Crée un département.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `companyId` | string | Oui | ID de l'entreprise |
| `name` | string | Oui | Nom du département |

**Réponse 201 :** Objet Department créé

**Erreurs :**
- `409` : un département avec ce nom existe déjà dans cette entreprise

---

### PUT `/departments/:id`

Renomme un département. Met également à jour le champ `department` de tous les employés concernés (cascade).

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `name` | string | Oui | Nouveau nom |
| `companyId` | string | Oui | ID de l'entreprise (pour la cascade) |

**Réponse 200 :**
```json
{
  "id": "DEPT002",
  "name": "IT & Numérique",
  "companyId": "COMPGM001"
}
```

**Erreurs :**
- `409` : nom déjà utilisé par un autre département

---

### DELETE `/departments/:id`

Supprime un département. **Refusé si des employés y sont assignés.**

**Query params :**

| Param | Type | Requis | Description |
|---|---|---|---|
| `companyId` | string | Oui | ID de l'entreprise |

**Réponse 200 :**
```json
{ "success": true }
```

**Erreurs :**
- `409` : `{ "error": "Ce département contient 5 employé(s). Réassignez-les avant de supprimer." }`

---

## Module Notifications — `/notifications`

---

### GET `/notifications`

Retourne les notifications.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise (recommandé) |

**Réponse 200 :**
```json
[
  {
    "id": "NOT1A2B3C",
    "type": "absence",
    "title": "Absence non justifiée — Jean Dupont",
    "message": "Jean Dupont n'a pas pointé son arrivée aujourd'hui (2024-01-15).",
    "date": "2024-01-15T09:30:00.000Z",
    "isRead": false,
    "employeeId": "EMPGM001"
  }
]
```

**Types de notification :**

| Type | Déclencheur |
|---|---|
| `absence` | Auto-généré à 09h30 pour chaque employé actif sans pointage |
| `conge` | Création ou décision sur une demande de congé |
| `document` | Alerte expiration document RH |
| `retard` | Pointage avec retard détecté |
| `system` | Rapport mensuel, message système |

---

### POST `/notifications`

Crée une notification.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `type` | string | Oui | `absence`, `conge`, `document`, `retard`, `system` |
| `title` | string | Oui | Titre (max 255 caractères) |
| `message` | string | Oui | Contenu (max 1000 caractères) |
| `employeeId` | string | Oui | Destinataire |

**Réponse 201 :** Objet Notification créé

---

### PUT `/notifications/read-all`

Marque toutes les notifications comme lues.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise |

**Réponse 200 :**
```json
{ "success": true }
```

---

### PUT `/notifications/:id/read`

Marque une notification comme lue.

**Réponse 200 :**
```json
{ "success": true }
```

---

### DELETE `/notifications`

Supprime toutes les notifications d'une entreprise.

**Query params :**

| Param | Type | Requis | Description |
|---|---|---|---|
| `companyId` | string | Oui | ID de l'entreprise |

**Réponse 200 :**
```json
{ "success": true }
```

---

### DELETE `/notifications/:id`

Supprime une notification.

**Réponse 200 :**
```json
{ "success": true }
```

---

## Module Rapports — `/reports`

---

### GET `/reports`

Retourne les rapports reçus ou envoyés.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `recipientId` | string | Rapports reçus par cet employé |
| `senderId` | string | Rapports envoyés par cet employé |

**Réponse 200 :**
```json
[
  {
    "id": "REP001",
    "senderId": "EMPGM002",
    "recipientId": "EMPGM001",
    "title": "Rapport mensuel — Janvier 2024",
    "type": "Rapport mensuel",
    "content": "Taux de présence : 94%...",
    "createdAt": "2024-02-01T08:00:00.000Z",
    "isRead": false
  }
]
```

---

### POST `/reports`

Crée et envoie un rapport.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `senderId` | string | Oui | ID de l'expéditeur |
| `recipientId` | string | Non | ID du destinataire (null = diffusion) |
| `title` | string | Oui | Titre |
| `type` | string | Non | Catégorie (défaut : `Rapport`) |
| `content` | string | Oui | Contenu texte |

**Réponse 201 :** Objet Report créé

---

### PUT `/reports/:id/read`

Marque un rapport comme lu.

**Réponse 200 :**
```json
{ "success": true }
```

---

### DELETE `/reports/:id`

Supprime un rapport.

**Réponse 200 :**
```json
{ "success": true }
```

---

## Module Évaluations — `/performance`

---

### GET `/performance`

Retourne les évaluations de performance.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise |
| `employeeId` | string | Filtre par employé évalué |
| `reviewerId` | string | Filtre par évaluateur |

**Réponse 200 :**
```json
[
  {
    "id": "PERF001",
    "employeeId": "EMPGM003",
    "reviewerId": "EMPGM001",
    "period": "Q1 2024",
    "rating": 4,
    "strengths": "Excellente maîtrise technique, ponctualité exemplaire.",
    "improvements": "Communication à améliorer en réunion.",
    "goals": "Obtenir la certification AWS d'ici Q3.",
    "status": "Soumis",
    "createdAt": "2024-04-01T10:00:00.000Z"
  }
]
```

---

### POST `/performance`

Crée une évaluation.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `employeeId` | string | Oui | ID de l'employé évalué |
| `reviewerId` | string | Oui | ID de l'évaluateur |
| `period` | string | Oui | Période (ex: `Q1 2024`, `Annuel 2024`) |
| `rating` | number | Oui | Note 1 à 5 |
| `strengths` | string | Non | Points forts |
| `improvements` | string | Non | Axes d'amélioration |
| `goals` | string | Non | Objectifs |
| `status` | string | Non | `Brouillon`, `Soumis`, `Acquitté` |

**Réponse 201 :** Objet PerformanceReview créé

---

### PUT `/performance/:id`

Modifie une évaluation.

**Corps :** Mêmes champs que POST (tous optionnels).

**Réponse 200 :** Objet PerformanceReview mis à jour

---

### DELETE `/performance/:id`

Supprime une évaluation.

**Réponse 200 :**
```json
{ "success": true }
```

---

## Module Documents RH — `/documents`

---

### GET `/documents`

Retourne les documents RH.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise |
| `employeeId` | string | Filtre par employé |

**Réponse 200 :**
```json
[
  {
    "id": "DOC001",
    "employeeId": "EMPGM001",
    "title": "Contrat de travail CDI",
    "type": "Contrat",
    "fileUrl": "https://storage.exemple.com/contrat-001.pdf",
    "expiryDate": null,
    "createdAt": "2022-01-15T00:00:00.000Z"
  }
]
```

**Types de documents :**
`Contrat`, `Bulletin de salaire`, `Pièce d'identité`, `Médical`, `Diplôme`, `Attestation`, `Autre`

---

### POST `/documents`

Crée un document RH.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `employeeId` | string | Oui | ID de l'employé |
| `title` | string | Oui | Nom du document |
| `type` | string | Oui | Catégorie |
| `fileUrl` | string | Non | URL du fichier |
| `expiryDate` | string (ISO) | Non | Date d'expiration (pour alertes) |

**Réponse 201 :** Objet Document créé

---

### PUT `/documents/:id`

Modifie un document.

**Corps :** Mêmes champs que POST (tous optionnels).

**Réponse 200 :** Objet Document mis à jour

---

### DELETE `/documents/:id`

Supprime un document.

**Réponse 200 :**
```json
{ "success": true }
```

---

## Module Planning — `/planning`

---

### GET `/planning`

Retourne les quarts de travail planifiés.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `companyId` | string | Filtre par entreprise |
| `employeeId` | string | Filtre par employé |
| `startDate` | string (ISO) | Début de période |
| `endDate` | string (ISO) | Fin de période |

**Réponse 200 :**
```json
[
  {
    "id": "SHIFT001",
    "employeeId": "EMPGM003",
    "date": "2024-01-15",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "shiftType": "Matin",
    "note": null,
    "createdAt": "2024-01-10T14:00:00.000Z"
  }
]
```

**Types de quarts :** `Matin`, `Après-midi`, `Nuit`, `Repos`

---

### POST `/planning`

Crée un quart de travail (upsert sur `employee_id + date`).

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `id` | string | Oui | Identifiant unique |
| `employeeId` | string | Oui | ID de l'employé |
| `date` | string (ISO) | Oui | Date |
| `shiftType` | string | Oui | Type de quart |
| `startTime` | string | Non | Heure de début |
| `endTime` | string | Non | Heure de fin |
| `note` | string | Non | Commentaire |

**Réponse 201 :** Objet TeamShift créé

---

### PUT `/planning/:id`

Modifie un quart.

**Réponse 200 :** Objet TeamShift mis à jour

---

### DELETE `/planning/:id`

Supprime un quart.

**Réponse 200 :**
```json
{ "success": true }
```

---

## Module Super Admin — `/superadmin`

> Rate limit : **5 requêtes / 30 minutes par IP**

---

### POST `/superadmin/verify`

Vérifie le mot de passe super administrateur.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `password` | string | Oui | Mot de passe défini dans `SUPER_ADMIN_PASSWORD` |

**Réponse 200 :**
```json
{ "valid": true }
```

**Réponse 401 :**
```json
{ "valid": false }
```

---

## Sécurité de l'API

### Headers de sécurité

Tous les endpoints retournent les en-têtes suivants :

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

| Route | Limite | Fenêtre |
|---|---|---|
| `POST /auth/*` | 10 req | 15 min par IP |
| `* /kiosk/*` | 30 req | 10 min par IP |
| `* /superadmin/*` | 5 req | 30 min par IP |
| `* /api/*` (global) | 200 req | 1 min par IP |

En cas de dépassement :
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 47
Content-Type: application/json

{ "error": "Trop de requêtes. Réessayez dans 47 secondes." }
```

### Validation des entrées

Toutes les entrées sont validées côté serveur :
- Types et longueurs de champs
- Valeurs des champs ENUM (role, status, contractType, shiftType…)
- Format des PINs (4–8 chiffres uniquement)
- Longueur minimale des mots de passe (6 caractères)
- Unicité des emails et noms de départements

### Isolation multi-tenant

Chaque requête retournant des données d'une entreprise exige un `companyId`. Les requêtes sans `companyId` reçoivent soit une liste vide, soit `400 Bad Request`.

---

## Géolocalisation — Détail technique

### Fonctionnement

1. Le kiosque frontal détecte la position GPS via `navigator.geolocation.getCurrentPosition`
2. Les coordonnées (`latitude`, `longitude`) sont envoyées avec la requête `POST /kiosk/checkin`
3. Le serveur récupère les coordonnées de l'entreprise depuis la table `companies`
4. Si `latitude IS NOT NULL` côté entreprise, la distance est calculée

### Formule Haversine

```
R = 6 371 000 m (rayon moyen de la Terre)

φ1, φ2 = latitudes en radians
Δφ = φ2 - φ1
Δλ = λ2 - λ1

a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1-a))
d = R × c
```

**Précision :** ±1 à 5 mètres selon le signal GPS du navigateur.

### Configuration du rayon

- Champ `geo_radius` sur la table `companies` (en mètres)
- Valeur par défaut : **100 mètres**
- Modifiable depuis les paramètres entreprise (`PUT /companies/:id`)

### Comportement

| Cas | Résultat |
|---|---|
| Entreprise sans coordonnées GPS | Pointage accepté sans vérification |
| Coordonnées GPS absentes dans la requête | Accepté (vérification ignorée) |
| Distance ≤ `geo_radius` | Pointage accepté |
| Distance > `geo_radius` | `403 Forbidden` avec `geoRequired: true` |

---

## Exemples complets

### Flux de connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@globalmove.com",
  "password": "admin1234"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "EMPGM001",
  "companyId": "COMPGM001",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "Admin",
  ...
}
```

### Flux de pointage kiosque avec GPS

```http
POST /api/kiosk/checkin
Content-Type: application/json

{
  "employeeId": "EMPGM003",
  "pin": "1234",
  "companyId": "COMPGM001",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "action": "check_in",
  "time": "08:47:23",
  "status": "Retard",
  "employee": {
    "id": "EMPGM003",
    "firstName": "Marie",
    "lastName": "Curie"
  }
}
```

### Approbation d'un congé

```http
PUT /api/leaves/LEAVE042
Content-Type: application/json

{
  "status": "Approuvé",
  "reviewedBy": "EMPGM001",
  "comment": "Demande accordée. Bon repos !"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "LEAVE042",
  "status": "Approuvé",
  "reviewedBy": "EMPGM001",
  "reviewDate": "2024-01-15",
  "comment": "Demande accordée. Bon repos !"
}
```

### Création d'un département avec protection doublon

```http
POST /api/departments
Content-Type: application/json

{
  "companyId": "COMPGM001",
  "name": "Cybersécurité"
}
```

```http
HTTP/1.1 201 Created

{
  "id": "DEPT0142",
  "companyId": "COMPGM001",
  "name": "Cybersécurité",
  "employeeCount": 0
}
```

Tentative de doublon :

```http
HTTP/1.1 409 Conflict

{
  "error": "Un département 'Cybersécurité' existe déjà dans cette entreprise."
}
```

---

## Endpoint de santé

### GET `/health`

Vérifie que le serveur est opérationnel.

**Réponse 200 :**
```json
{ "status": "ok" }
```
