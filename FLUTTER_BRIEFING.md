# HR Attendance Mobile — Briefing Claude Code

> Pose ce fichier à la racine de `hr-attendance-mobile/` avant d'ouvrir le projet dans Claude Code.

---

## Contexte du projet

Application mobile Flutter **indépendante** du frontend React existant.  
Elle consomme **uniquement** le backend Express/PostgreSQL déjà en production.

| Élément | Valeur |
|---------|--------|
| Backend URL (dev) | `http://localhost:3002/api` |
| Backend URL (prod) | variable d'env `API_BASE_URL` (Koyeb) |
| Flutter version | 3.24.5 (stable) |
| Comptes supportés | **Employee** et **Kiosk** uniquement (pas Admin/Manager) |
| Repo web (référence UI) | `/Hrattendancemanagerdesign` |

---

## Backend API — Endpoints existants (à consommer tels quels)

### Auth
```
POST /api/auth/login
  body: { email, password, deviceId }
  → { token, user: { id, email, role, companyId, firstName, lastName, avatar, department, position } }

POST /api/auth/change-password
  header: Bearer <token>
  body: { employeeId, currentPassword, newPassword }
```

### Kiosk Auth (compte kiosk = tablette)
```
POST /api/kiosk/auth/login
  body: { email, password, deviceId }
  → { token, kioskId, companyId, companyName, label }

GET  /api/kiosk/token/:companyId
  header: Bearer <kiosk_token>   ← JWT role "Kiosk"
  → { token, companyId, expiresAt }   ← QR token valide 30s
```

### Attendance
```
GET  /api/attendance?employeeId=&date=
  header: Bearer <token>
  → AttendanceRecord[]

POST /api/attendance
  header: Bearer <token>
  body: { employeeId, date, checkIn, status, note, deviceId, latitude?, longitude? }
  → AttendanceRecord

PUT  /api/attendance/:id
  header: Bearer <token>
  body: { checkOut, hoursWorked }
  → AttendanceRecord

POST /api/kiosk/scan
  header: Bearer <employee_token>
  body: { token, companyId, deviceId, latitude?, longitude? }
  → { success, action: "check_in"|"check_out", time, status, hoursWorked?, employee }
```

### Leaves
```
GET  /api/leaves?employeeId=&status=
  header: Bearer <token>
  → LeaveRequest[]

POST /api/leaves
  header: Bearer <token>
  body: { employeeId, type, startDate, endDate, reason, status:"En attente" }
  → LeaveRequest

PUT  /api/leaves/:id
  header: Bearer <token>
  body: { status }
```

### Notifications
```
GET  /api/notifications?employeeId=
  header: Bearer <token>
  → Notification[]

PUT  /api/notifications/:id/read
  header: Bearer <token>
```

### Employee profile
```
GET  /api/employees/:id
  header: Bearer <token>
  → Employee

GET  /api/employees?companyId=
  header: Bearer <token>
  → Employee[]
```

### Devices
```
POST /api/devices/register
  header: Bearer <token>
  body: { deviceId, deviceName }
  → { success } | 409 conflict | 403 blocked
```

---

## Modèles de données (JSON → Dart)

```json
// Employee
{
  "id": "EMP001",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@company.com",
  "role": "Employee",          // "Employee" | "Manager" | "Admin"
  "companyId": "COMP001",
  "department": "IT",
  "position": "Développeur",
  "avatar": "https://...",
  "status": "Actif",
  "workDays": ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"],
  "workStart": "09:00",
  "workEnd": "17:30",
  "phone": "+33..."
}

// AttendanceRecord
{
  "id": "ATT001",
  "employeeId": "EMP001",
  "date": "2026-05-21",
  "checkIn": "09:05",
  "checkOut": "17:30",
  "status": "Présent",         // "Présent"|"Absent"|"Retard"|"Congé"|"Télétravail"
  "hoursWorked": 8.5,
  "note": ""
}

// LeaveRequest
{
  "id": "LEA001",
  "employeeId": "EMP001",
  "type": "Congé annuel",      // "Congé annuel"|"Maladie"|"RTT"|"Congé sans solde"|"Autre"
  "startDate": "2026-06-01",
  "endDate": "2026-06-05",
  "reason": "Vacances",
  "status": "En attente",      // "En attente"|"Approuvé"|"Refusé"
  "createdAt": "2026-05-21T..."
}

// Notification
{
  "id": "NOTIF001",
  "employeeId": "EMP001",
  "type": "info",              // "info"|"warning"|"success"|"error"
  "title": "Congé approuvé",
  "message": "Votre demande du 01/06 a été approuvée",
  "read": false,
  "createdAt": "2026-05-21T..."
}
```

---

## Architecture obligatoire

```
lib/
├── main.dart
├── core/
│   ├── constants/
│   │   ├── api_constants.dart       # URLs, headers, timeouts
│   │   └── app_constants.dart       # deviceId key, cache durations
│   ├── network/
│   │   ├── dio_client.dart          # Dio setup + interceptors JWT
│   │   └── network_info.dart        # connectivity check
│   ├── services/
│   │   ├── storage_service.dart     # flutter_secure_storage (JWT)
│   │   ├── device_service.dart      # UUID persistent deviceId
│   │   ├── location_service.dart    # geolocator GPS
│   │   └── biometric_service.dart   # local_auth
│   └── errors/
│       ├── exceptions.dart
│       └── failures.dart
├── data/
│   ├── datasources/
│   │   ├── remote/                  # Dio API calls
│   │   └── local/                   # sqflite cache + offline queue
│   ├── models/                      # JSON ↔ Dart (freezed)
│   └── repositories/                # implementation
├── domain/
│   ├── entities/                    # pure Dart classes
│   ├── repositories/                # abstracts
│   └── usecases/
├── presentation/
│   ├── providers/                   # Riverpod providers
│   ├── blocs/                       # BLoC (auth, attendance)
│   ├── pages/
│   │   ├── splash/
│   │   ├── auth/                    # login
│   │   ├── employee/                # home, attendance, leaves, notifications, profile
│   │   └── kiosk/                   # QR display (rotating, 15s)
│   ├── widgets/                     # reusable
│   └── theme/
│       ├── app_theme.dart
│       └── app_colors.dart
└── config/
    ├── router.dart                  # GoRouter — route vers kiosk OU employee selon role JWT
    └── injection.dart               # GetIt DI
```

---

## Deux modes selon le rôle JWT

```
JWT role == "Kiosk"    → KioskShell   (QR display rotatif, logout discret)
JWT role == "Employee" → EmployeeShell (bottom nav: Accueil, Pointer, Congés, Notifications, Profil)
```

Le router lit le rôle depuis le JWT stocké en secure storage et redirige automatiquement.

---

## Écrans — Tier 1 (MVP obligatoire)

### Splash Screen
- Logo HR Manager centré + animation fade-in
- Vérifie JWT en secure storage → redirige login ou home selon rôle
- Durée minimale 1.5s

### Login
- Email + password
- Toggle show/hide password
- Bouton biométrie (fingerprint/face) si JWT existant
- Détecter role dans réponse → router vers kiosk ou employee shell
- Enregistrer deviceId via POST /api/devices/register après login Employee
- Stocker JWT dans flutter_secure_storage

### Employee Shell
Bottom navigation : Accueil | Pointer | Congés | Notifications | Profil

**Accueil** : card statut du jour (checkIn/checkOut/heures), historique 7 jours  
**Pointer** : bouton "Scanner le QR" → ouvre mobile_scanner → scanne le QR kiosk → POST /api/kiosk/scan → confirmation (vibration + son)  
**Congés** : solde estimé + liste demandes + bouton nouvelle demande  
**Notifications** : liste + mark as read  
**Profil** : infos readonly + change password

### Kiosk Shell
- Plein écran, pas de bottom nav
- QR image générée côté client depuis le token (package qr_flutter)
- Refresh token toutes les 15s via GET /api/kiosk/token/:companyId avec kiosk JWT
- Barre de décompte animée
- Horloge temps réel
- Bouton déconnexion discret en bas

---

## Design System (extraire du frontend React existant)

```dart
// Couleurs principales
primary      = Color(0xFF6366F1)   // indigo-500
primaryDark  = Color(0xFF4F46E5)   // indigo-600
secondary    = Color(0xFF8B5CF6)   // violet-500
success      = Color(0xFF10B981)   // emerald-500
warning      = Color(0xFFF59E0B)   // amber-500
error        = Color(0xFFEF4444)   // red-500

// Background
bgDark       = Color(0xFF0B1437)   // kiosk bg
bgCard       = Color(0xFF1E1B4B)   // kiosk card

// Text
textPrimary  = Color(0xFF0F172A)   // slate-900 (light mode)
textMuted    = Color(0xFF64748B)   // slate-500
```

---

## Sécurité mobile

- JWT stocké dans `flutter_secure_storage` (Keychain iOS / Keystore Android)
- `deviceId` = UUID v4 persistant dans `flutter_secure_storage`
- Biométrie : `local_auth` avec fallback PIN système
- Pas de certificat pinning en v1 (prévu v2)
- Jailbreak/root detection : `safe_device` package

---

## Offline Queue (sqflite)

Table `sync_queue` :
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
action TEXT NOT NULL,       -- "check_in" | "check_out" | "leave_request"
payload TEXT NOT NULL,      -- JSON
created_at TEXT NOT NULL,
retries INTEGER DEFAULT 0,
status TEXT DEFAULT 'pending'  -- "pending" | "failed"
```

Stratégie :
1. Action lancée → si online : POST direct, si offline : insert dans queue
2. `connectivity_plus` listener → quand online : `SyncManager.processQueue()`
3. Max 3 retries avec backoff exponentiel (2s, 4s, 8s)

---

## pubspec.yaml — Dépendances clés

```yaml
dependencies:
  # State
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  flutter_bloc: ^8.1.6

  # Network
  dio: ^5.6.0
  connectivity_plus: ^6.0.3

  # Storage
  flutter_secure_storage: ^9.2.2
  sqflite: ^2.3.3+1
  shared_preferences: ^2.3.2

  # QR
  mobile_scanner: ^5.2.3    # scan (employee)
  qr_flutter: ^4.1.0        # display (kiosk)

  # Location
  geolocator: ^13.0.2
  permission_handler: ^11.3.1

  # Biometric
  local_auth: ^2.3.0

  # UI
  google_fonts: ^6.2.1
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  lottie: ^3.1.0             # splash animation

  # Utils
  get_it: ^8.0.2
  uuid: ^4.4.2
  equatable: ^2.0.5
  intl: ^0.19.0
  dartz: ^0.10.1

dev_dependencies:
  build_runner: ^2.4.11
  freezed: ^2.5.2
  json_serializable: ^6.8.0
  riverpod_generator: ^2.4.3
```

---

## Checklist d'implémentation (dans l'ordre)

- [ ] `pubspec.yaml` avec toutes les dépendances
- [ ] `lib/core/` — DioClient, StorageService, DeviceService
- [ ] `lib/domain/entities/` — Employee, AttendanceRecord, LeaveRequest, Notification
- [ ] `lib/data/models/` — JSON serialization (freezed)
- [ ] `lib/data/datasources/remote/` — AuthRemote, AttendanceRemote, LeaveRemote, KioskRemote
- [ ] `lib/data/datasources/local/` — SyncQueue (sqflite)
- [ ] `lib/data/repositories/` — implémentations
- [ ] `lib/config/injection.dart` — GetIt setup
- [ ] `lib/config/router.dart` — GoRouter avec redirect selon rôle JWT
- [ ] `lib/presentation/blocs/auth/` — AuthBloc
- [ ] `lib/presentation/pages/splash/` — SplashPage
- [ ] `lib/presentation/pages/auth/login_page.dart`
- [ ] `lib/presentation/pages/employee/` — tous les écrans employee
- [ ] `lib/presentation/pages/kiosk/` — KioskPage
- [ ] `lib/main.dart` — entry point avec ProviderScope + BlocProvider

---

## Référence frontend React

Pour matcher l'UX exactement, consulter ces fichiers dans `/Hrattendancemanagerdesign` :
- `src/app/pages/KioskPage.tsx` → logique QR kiosk (timer 15s, countdown bar)
- `src/app/pages/AttendancePage.tsx` → logique check-in/check-out + offline queue
- `src/app/pages/LeavesPage.tsx` → logique congés
- `src/app/context/AuthContext.tsx` → gestion JWT + session
- `src/app/utils/deviceId.ts` → logique deviceId (UUID persistant)

---

*Généré le 21 mai 2026 — HR Attendance Manager*
