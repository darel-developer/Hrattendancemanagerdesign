# Migration - Gestion Administrative du Personnel

## 📋 Description

Ce script SQL implémente les tables et fonctionnalités pour la **gestion administrative complète du personnel** :

- ✅ Gestion des contrats de travail
- ✅ Dossier numérique du personnel (documents personnels)
- ✅ Fiches de poste numérisées
- ✅ Règlement intérieur
- ✅ Suivi de reconnaissance du règlement

## 🗄️ Tables créées

### 1. **Extension table `employees`**
Ajout de colonnes pour enrichir les données personnelles :
- `gender` - Genre (Masculin, Féminin, Autre)
- `birth_date` - Date de naissance
- `marital_status` - Situation matrimoniale
- `children_count` - Nombre d'enfants
- `id_number` - Numéro d'identité
- `job_grade` - Grade/niveau hiérarchique
- `job_echelon` - Échelon
- `employee_number` - Matricule (généré automatiquement)
- `bank_account_number` - Numéro RIB
- `bank_account_holder` - Titulaire compte

### 2. **Table `contracts`**
Gestion complète des contrats de travail :
```
Colonnes principales:
- contract_type: CDI, CDD, Stage, Freelance, Alternance, Apprentissage
- contract_number: Numéro unique du contrat
- start_date / end_date: Dates du contrat
- job_title: Intitulé du poste
- salary_base: Salaire de base
- work_schedule_hours: Heures par semaine
- probation_period_days: Durée période d'essai
- document_file_path: Chemin PDF du contrat
- status: Draft, Active, Suspended, Terminated, Expired
```

### 3. **Table `personnel_documents`**
Stockage des documents numérisés :
```
Types de documents:
- CNI, Passeport, Diplôme, CV, Contrat
- Certificat Médical, Permis Conduire, Attestation Travail
- RIB, Autre

Colonnes principales:
- document_type: Type de document
- document_number: Numéro (CNI, passeport, etc.)
- issue_date / expiry_date: Dates de délivrance/expiration
- file_path: Chemin du fichier
- file_checksum: Hash SHA-256 pour intégrité
- is_verified: Vérifié par admin
- verified_by / verified_at: Admin et date de vérification
- is_expiration_alert_sent: Alerte d'expiration envoyée
- visibility: Admin_Only, Employee_View, Public
```

### 4. **Table `job_descriptions`**
Fiches de poste numérisées :
```
Colonnes principales:
- job_title: Titre du poste
- job_reference: Référence unique
- job_level: Junior, Confirmé, Senior, Expert, Manager, Directeur
- job_family: Technique, Commercial, Support, Management
- job_responsibilities: Responsabilités
- job_skills_required: Compétences requises
- job_qualifications: Qualifications
- job_experience_required: Années d'expérience
- reporting_to: Reportage à (titre)
- work_location: Lieu de travail
- travel_required / travel_percentage: Déplacements
- file_path: Chemin PDF fiche de poste
- status: Draft, Active, Archived, Obsolete
- version: Numéro de version
```

### 5. **Table `company_regulations`**
Règlement intérieur :
```
Colonnes principales:
- regulation_title: Titre du règlement
- regulation_version: Version (1.0, 2.1, etc.)
- regulation_content: Contenu HTML
- file_path: Chemin PDF
- Sections:
  - working_hours
  - leave_policy
  - code_of_conduct
  - health_safety
  - disciplinary_measures
  - remote_work_policy
  - overtime_policy
  - other_clauses
- status: Draft, Active, Archived, Superseded
- effective_date / end_date: Dates validité
- is_mandatory_acknowledgment: Reconnaissance obligatoire
```

### 6. **Table `regulation_acknowledgments`**
Suivi de la reconnaissance du règlement par les employés :
```
Colonnes principales:
- employee_id: Employé
- regulation_id: Règlement
- acknowledgment_type: Read, Acknowledged, Signed, Refused
- acknowledged_at: Date de reconnaissance
- ip_address: Adresse IP
- device_id: ID unique du device
```

### 7. **Table `personnel_document_audit_log`**
Audit complet des actions sur les documents :
```
Actions tracées:
- Upload, Download, View, Verify, Update
- Delete, Share, Expire_Alert

Enregistrements:
- action_by: Utilisateur qui a effectué l'action
- old_values / new_values: JSONB pour comparaison
- ip_address / user_agent: Contexte
```

## 🔧 Fonctionnalités implémentées

### Triggers
1. **`generate_employee_number`** - Auto-génère le matricule (EMP-YYYY-XXXXXX)
2. **`update_updated_at_timestamp`** - Met à jour automatiquement `updated_at`

### Vues
1. **`employees_detailed_view`** - Vue complète employés avec contrats et documents
2. **`personnel_documents_expiring_soon_view`** - Documents expirés ou à expiration proche
3. **`regulation_acknowledgment_status_view`** - Statut reconnaissance règlement par entreprise

## 📥 Installation

### Option 1 : Exécution depuis le terminal (recommandé)

```bash
# Connexion à PostgreSQL et exécution du script
psql -U postgres -h localhost -d hr_attendance_db -f scripts/1_personnel_management_schema.sql

# Vérification (optionnel)
psql -U postgres -h localhost -d hr_attendance_db -c "\dt"
```

### Option 2 : Exécution depuis Node.js

```javascript
// server/scripts/migrate.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function runMigration() {
    const sql = fs.readFileSync(
        path.join(__dirname, '1_personnel_management_schema.sql'),
        'utf8'
    );
    
    try {
        await pool.query(sql);
        console.log('✅ Migration personnel management réussie');
    } catch (err) {
        console.error('❌ Erreur migration:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
```

Puis exécuter :
```bash
node server/scripts/migrate.js
```

### Option 3 : Depuis PgAdmin

1. Connectez-vous à PgAdmin
2. Sélectionnez la base `hr_attendance_db`
3. Ouvrez l'outil Query Tool
4. Copiez le contenu du script SQL
5. Exécutez (F5 ou bouton Exécuter)

## 📊 Vérification post-installation

```sql
-- Vérifier les tables créées
\dt personnel_* contracts job_descriptions company_regulations regulation_acknowledgments personnel_document_audit_log

-- Vérifier les colonnes ajoutées à employees
\d employees

-- Vérifier les séquences
\ds employee_number_seq

-- Vérifier les vues
\dv *_view

-- Vérifier les triggers
\dy

-- Vérifier les index
\di
```

## 🔄 Rollback (annuler la migration)

Si vous avez besoin d'annuler les changements :

```sql
-- ⚠️ ATTENTION : Ceci supprimera toutes les tables et données !

DROP TRIGGER IF EXISTS trigger_update_regulations_timestamp ON company_regulations;
DROP TRIGGER IF EXISTS trigger_update_job_descriptions_timestamp ON job_descriptions;
DROP TRIGGER IF EXISTS trigger_update_personnel_docs_timestamp ON personnel_documents;
DROP TRIGGER IF EXISTS trigger_update_contracts_timestamp ON contracts;
DROP TRIGGER IF EXISTS trigger_generate_employee_number ON employees;

DROP FUNCTION IF EXISTS update_updated_at_timestamp();
DROP FUNCTION IF EXISTS generate_employee_number();

DROP VIEW IF EXISTS regulation_acknowledgment_status_view;
DROP VIEW IF EXISTS personnel_documents_expiring_soon_view;
DROP VIEW IF EXISTS employees_detailed_view;

DROP TABLE IF EXISTS personnel_document_audit_log CASCADE;
DROP TABLE IF EXISTS regulation_acknowledgments CASCADE;
DROP TABLE IF EXISTS company_regulations CASCADE;
DROP TABLE IF EXISTS job_descriptions CASCADE;
DROP TABLE IF EXISTS personnel_documents CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;

DROP SEQUENCE IF EXISTS employee_number_seq;

-- Supprimer les colonnes ajoutées à employees
ALTER TABLE employees DROP COLUMN IF EXISTS bank_account_holder;
ALTER TABLE employees DROP COLUMN IF EXISTS bank_account_number;
ALTER TABLE employees DROP COLUMN IF EXISTS employee_number;
ALTER TABLE employees DROP COLUMN IF EXISTS job_echelon;
ALTER TABLE employees DROP COLUMN IF EXISTS job_grade;
ALTER TABLE employees DROP COLUMN IF EXISTS id_number;
ALTER TABLE employees DROP COLUMN IF EXISTS children_count;
ALTER TABLE employees DROP COLUMN IF EXISTS marital_status;
ALTER TABLE employees DROP COLUMN IF EXISTS birth_date;
ALTER TABLE employees DROP COLUMN IF EXISTS gender;
```

## 💾 Considérations de stockage

Les documents sont stockés dans des fichiers. Configurez les chemins :

```bash
# Créer les répertoires de stockage
mkdir -p /var/hr-attendance/contracts
mkdir -p /var/hr-attendance/personnel_documents
mkdir -p /var/hr-attendance/job_descriptions
mkdir -p /var/hr-attendance/regulations

# Définir les permissions
chmod 755 /var/hr-attendance/*
chown www-data:www-data /var/hr-attendance/*
```

## 📱 Intégration Frontend

Les APIs frontend doivent gérer :

### 1. Upload de documents
- Vérification mime-type
- Calcul SHA-256 checksum
- Sauvegarde sur disque + base de données

### 2. Gestion des contrats
- CRUD complet
- Aperçu PDF
- Notification expiration

### 3. Affichage documents personnels
- Filtre par type
- Alerte expiration
- Téléchargement sécurisé

### 4. Règlement intérieur
- Affichage pour tous les employés
- Obligatoire: reconnaissance + signature
- Suivi des reconnaissances

## 📝 Notes importantes

1. **Sécurité** : Les documents sensibles doivent être chiffrés ou stockés hors serveur
2. **Backup** : Inclure les chemins de fichiers dans votre stratégie de sauvegarde
3. **Conformité** : Respecter les normes RGPD pour les données personnelles
4. **Audit** : Consulter `personnel_document_audit_log` pour traçabilité complète
5. **Expiration** : Configurer un cron job pour vérifier les expirations quotidiennement

## 🔗 Ressources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RGPD Conformité](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Gestion Documentaire](https://fr.wikipedia.org/wiki/Gestion_Documentaire)

---

**Script créé:** 2026-06-09  
**Version:** 1.0  
**Compatibilité:** PostgreSQL 12+
