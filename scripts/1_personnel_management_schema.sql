-- ============================================================================
-- Script SQL - Gestion Administrative du Personnel
-- Base de données: PostgreSQL
-- Version: 1.0
-- Date: 2026-06-09
-- ============================================================================

-- ============================================================================
-- 1. EXTENSION DE LA TABLE EMPLOYEES
-- ============================================================================
-- Ajout de colonnes pour les informations personnelles détaillées

ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
-- Valeurs: 'Masculin', 'Féminin', 'Autre'

ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
-- Valeurs: 'Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'PACS'

ALTER TABLE employees ADD COLUMN IF NOT EXISTS children_count INT DEFAULT 0;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_number VARCHAR(100) UNIQUE;
-- Numéro d'identité (CNI, Passeport, etc.)

ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_grade VARCHAR(100);
-- Grade/Niveau hiérarchique

ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_echelon VARCHAR(100);
-- Échelon

ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50) UNIQUE;
-- Matricule généré automatiquement

ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
-- Numéro de RIB / Compte bancaire

ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);
-- Titulaire du compte bancaire

-- ============================================================================
-- 2. TABLE DES CONTRATS DE TRAVAIL
-- ============================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Informations de contrat
    contract_type VARCHAR(50) NOT NULL,
    -- Valeurs: 'CDI', 'CDD', 'Stage', 'Freelance', 'Alternance', 'Apprentissage'
    
    contract_number VARCHAR(100) UNIQUE,
    -- Numéro unique du contrat
    
    start_date DATE NOT NULL,
    -- Date de début
    
    end_date DATE,
    -- Date de fin (NULL pour CDI)
    
    job_title VARCHAR(255) NOT NULL,
    -- Intitulé du poste exact
    
    job_description TEXT,
    -- Description brève des responsabilités
    
    salary_base DECIMAL(12, 2),
    -- Salaire de base
    
    salary_currency VARCHAR(3) DEFAULT 'EUR',
    -- Devise
    
    work_schedule VARCHAR(100),
    -- Horaires: 'Temps plein', 'Temps partiel', 'Flexible', etc.
    
    work_schedule_hours INT,
    -- Nombre d'heures par semaine
    
    probation_period_days INT,
    -- Durée période d'essai en jours
    
    document_file_path VARCHAR(500),
    -- Chemin du fichier PDF/DOC du contrat
    
    document_file_name VARCHAR(255),
    -- Nom du fichier
    
    document_file_size INT,
    -- Taille en bytes
    
    document_file_mime_type VARCHAR(100),
    -- Type MIME
    
    document_uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Date d'upload du document
    
    document_updated_at TIMESTAMP,
    -- Date de dernière mise à jour
    
    notes TEXT,
    -- Notes/Commentaires
    
    status VARCHAR(50) DEFAULT 'Active',
    -- Status: 'Draft', 'Active', 'Suspended', 'Terminated', 'Expired'
    
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    -- Admin qui a créé le contrat
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT contracts_dates_check CHECK (end_date IS NULL OR end_date > start_date),
    UNIQUE(employee_id, start_date, end_date)
);

CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

-- ============================================================================
-- 3. TABLE DES DOCUMENTS PERSONNELS NUMÉRISÉS
-- ============================================================================

CREATE TABLE IF NOT EXISTS personnel_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Informations du document
    document_type VARCHAR(100) NOT NULL,
    -- Valeurs: 'CNI', 'Passeport', 'Diplôme', 'CV', 'Contrat', 
    --          'Certificat Médical', 'Permis Conduire', 'Attestation Travail', 
    --          'RIB', 'Autre'
    
    document_title VARCHAR(255),
    -- Titre du document
    
    document_number VARCHAR(100),
    -- Numéro du document (ex: numéro de CNI)
    
    issue_date DATE,
    -- Date de délivrance
    
    expiry_date DATE,
    -- Date d'expiration (NULL si pas d'expiration)
    
    issue_country VARCHAR(100),
    -- Pays de délivrance
    
    file_path VARCHAR(500) NOT NULL,
    -- Chemin du fichier stocké
    
    file_name VARCHAR(255) NOT NULL,
    -- Nom du fichier
    
    file_size INT NOT NULL,
    -- Taille en bytes
    
    file_mime_type VARCHAR(100),
    -- Type MIME (pdf, image/jpeg, etc.)
    
    file_checksum VARCHAR(64),
    -- Hash SHA-256 du fichier pour vérification intégrité
    
    document_preview_url VARCHAR(500),
    -- URL pour aperçu du document
    
    is_verified BOOLEAN DEFAULT FALSE,
    -- Document vérifié/validé par admin
    
    verified_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    -- Admin qui a validé
    
    verified_at TIMESTAMP,
    -- Date de vérification
    
    verification_notes TEXT,
    -- Notes de vérification
    
    is_expiration_alert_sent BOOLEAN DEFAULT FALSE,
    -- Alerte d'expiration envoyée
    
    alert_sent_at TIMESTAMP,
    -- Date envoi alerte
    
    upload_source VARCHAR(50) DEFAULT 'Admin',
    -- 'Admin', 'Employee', 'System'
    
    visibility VARCHAR(50) DEFAULT 'Admin_Only',
    -- 'Admin_Only', 'Employee_View', 'Public'
    
    notes TEXT,
    -- Commentaires
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT personnel_docs_expiry_check CHECK (
        expiry_date IS NULL OR expiry_date > issue_date
    )
);

CREATE INDEX IF NOT EXISTS idx_personnel_docs_company ON personnel_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_personnel_docs_employee ON personnel_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_personnel_docs_type ON personnel_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_personnel_docs_expiry ON personnel_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_personnel_docs_verified ON personnel_documents(is_verified);

-- ============================================================================
-- 4. TABLE DES FICHES DE POSTE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id VARCHAR(255),
    -- Référence au département
    
    -- Informations de base
    job_title VARCHAR(255) NOT NULL,
    -- Titre du poste
    
    job_reference VARCHAR(100) UNIQUE,
    -- Référence unique du poste
    
    job_level VARCHAR(100),
    -- Niveau: 'Junior', 'Confirmé', 'Senior', 'Expert', 'Manager', 'Directeur'
    
    job_family VARCHAR(100),
    -- Famille de postes: 'Technique', 'Commercial', 'Support', 'Management', etc.
    
    -- Description du poste
    job_summary TEXT,
    -- Résumé du poste
    
    job_responsibilities TEXT,
    -- Responsabilités principales
    
    job_skills_required TEXT,
    -- Compétences requises (JSON ou texte structuré)
    
    job_qualifications TEXT,
    -- Qualifications minimales
    
    job_experience_required INT,
    -- Années d'expérience requises
    
    -- Hiérarchie
    reporting_to VARCHAR(255),
    -- Reportage à (titre du poste)
    
    subordinates_count INT DEFAULT 0,
    -- Nombre de collaborateurs
    
    -- Conditions de travail
    work_location VARCHAR(255),
    -- Lieu de travail
    
    work_schedule VARCHAR(100),
    -- Type d'horaires
    
    travel_required BOOLEAN DEFAULT FALSE,
    -- Déplacements requis
    
    travel_percentage INT DEFAULT 0,
    -- Pourcentage de déplacements
    
    -- Documents
    file_path VARCHAR(500),
    -- Chemin du fichier PDF numérisé
    
    file_name VARCHAR(255),
    -- Nom du fichier
    
    file_size INT,
    -- Taille fichier
    
    file_mime_type VARCHAR(100),
    -- Type MIME
    
    document_uploaded_at TIMESTAMP,
    -- Date d'upload
    
    -- Métadonnées
    status VARCHAR(50) DEFAULT 'Active',
    -- 'Draft', 'Active', 'Archived', 'Obsolete'
    
    version INT DEFAULT 1,
    -- Numéro de version
    
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    -- Approuvé par (admin)
    
    approved_at TIMESTAMP,
    -- Date d'approbation
    
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    -- Créé par
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    is_public BOOLEAN DEFAULT FALSE
    -- Accessible à tous les employés
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_company ON job_descriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_title ON job_descriptions(job_title);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_family ON job_descriptions(job_family);

-- ============================================================================
-- 5. TABLE DU RÈGLEMENT INTÉRIEUR
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Informations de base
    regulation_title VARCHAR(255) NOT NULL,
    -- Titre du règlement
    
    regulation_version VARCHAR(20),
    -- Version (ex: 1.0, 2.1)
    
    -- Contenu
    regulation_content TEXT,
    -- Contenu HTML du règlement
    
    regulation_summary TEXT,
    -- Résumé du règlement
    
    -- Document numérisé
    file_path VARCHAR(500),
    -- Chemin du fichier PDF/DOC
    
    file_name VARCHAR(255),
    -- Nom du fichier
    
    file_size INT,
    -- Taille en bytes
    
    file_mime_type VARCHAR(100),
    -- Type MIME
    
    document_uploaded_at TIMESTAMP,
    -- Date d'upload
    
    -- Sections principales
    working_hours TEXT,
    -- Horaires de travail
    
    leave_policy TEXT,
    -- Politique de congés
    
    code_of_conduct TEXT,
    -- Code de conduite
    
    health_safety TEXT,
    -- Hygiène et sécurité
    
    disciplinary_measures TEXT,
    -- Mesures disciplinaires
    
    remote_work_policy TEXT,
    -- Télétravail
    
    overtime_policy TEXT,
    -- Rémunération heures supplémentaires
    
    other_clauses TEXT,
    -- Autres clauses
    
    -- Gestion
    status VARCHAR(50) DEFAULT 'Active',
    -- 'Draft', 'Active', 'Archived', 'Superseded'
    
    effective_date DATE NOT NULL,
    -- Date d'entrée en vigueur
    
    end_date DATE,
    -- Date de fin de validité (NULL = indéfini)
    
    is_mandatory_acknowledgment BOOLEAN DEFAULT TRUE,
    -- Reconnaissance obligatoire
    
    -- Métadonnées
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    -- Créé par
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT regulations_dates_check CHECK (
        end_date IS NULL OR end_date > effective_date
    )
);

CREATE INDEX IF NOT EXISTS idx_regulations_company ON company_regulations(company_id);
CREATE INDEX IF NOT EXISTS idx_regulations_status ON company_regulations(status);
CREATE INDEX IF NOT EXISTS idx_regulations_effective_date ON company_regulations(effective_date);

-- ============================================================================
-- 6. TABLE DE RECONNAISSANCE DU RÈGLEMENT INTÉRIEUR
-- ============================================================================

CREATE TABLE IF NOT EXISTS regulation_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    regulation_id UUID NOT NULL REFERENCES company_regulations(id) ON DELETE CASCADE,
    
    -- Reconnaissance
    acknowledgment_type VARCHAR(50),
    -- 'Read', 'Acknowledged', 'Signed', 'Refused'
    
    acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Date de reconnaissance
    
    ip_address VARCHAR(45),
    -- Adresse IP (IPv4 ou IPv6)
    
    user_agent VARCHAR(500),
    -- User agent du navigateur
    
    device_id VARCHAR(100),
    -- ID unique du device
    
    notes TEXT,
    -- Notes/commentaires
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, regulation_id)
);

CREATE INDEX IF NOT EXISTS idx_acknowledgments_company ON regulation_acknowledgments(company_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_employee ON regulation_acknowledgments(employee_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_regulation ON regulation_acknowledgments(regulation_id);

-- ============================================================================
-- 7. TABLE D'AUDIT DES DOCUMENTS PERSONNELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS personnel_document_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES personnel_documents(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Action effectuée
    action VARCHAR(100) NOT NULL,
    -- 'Upload', 'Download', 'View', 'Verify', 'Update', 'Delete', 'Share'
    
    action_by UUID NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
    -- Utilisateur qui a effectué l'action
    
    action_reason TEXT,
    -- Raison de l'action
    
    old_values JSONB,
    -- Anciennes valeurs (pour updates)
    
    new_values JSONB,
    -- Nouvelles valeurs (pour updates)
    
    ip_address VARCHAR(45),
    -- Adresse IP
    
    user_agent VARCHAR(500),
    -- User agent
    
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT audit_log_action_check CHECK (action IN (
        'Upload', 'Download', 'View', 'Verify', 'Update', 
        'Delete', 'Share', 'Expire_Alert'
    ))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_document ON personnel_document_audit_log(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_employee ON personnel_document_audit_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON personnel_document_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON personnel_document_audit_log(action_timestamp);

-- ============================================================================
-- 8. FONCTION TRIGGER - Mise à jour du matricule employé (auto-génération)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_number IS NULL THEN
        NEW.employee_number := 'EMP-' || 
                              TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                              LPAD(NEXTVAL('employee_number_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer la séquence pour les numéros d'employés
CREATE SEQUENCE IF NOT EXISTS employee_number_seq START 1000 INCREMENT 1;

-- Trigger pour auto-générer le matricule
DROP TRIGGER IF NOT EXISTS trigger_generate_employee_number ON employees;
CREATE TRIGGER trigger_generate_employee_number
BEFORE INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION generate_employee_number();

-- ============================================================================
-- 9. FONCTION TRIGGER - Mise à jour du timestamp updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF NOT EXISTS trigger_update_contracts_timestamp ON contracts;
CREATE TRIGGER trigger_update_contracts_timestamp
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF NOT EXISTS trigger_update_personnel_docs_timestamp ON personnel_documents;
CREATE TRIGGER trigger_update_personnel_docs_timestamp
BEFORE UPDATE ON personnel_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF NOT EXISTS trigger_update_job_descriptions_timestamp ON job_descriptions;
CREATE TRIGGER trigger_update_job_descriptions_timestamp
BEFORE UPDATE ON job_descriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF NOT EXISTS trigger_update_regulations_timestamp ON company_regulations;
CREATE TRIGGER trigger_update_regulations_timestamp
BEFORE UPDATE ON company_regulations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================================================
-- 10. VUE - Employés avec informations détaillées
-- ============================================================================

CREATE OR REPLACE VIEW employees_detailed_view AS
SELECT 
    e.id,
    e.company_id,
    e.first_name,
    e.last_name,
    e.email,
    e.phone,
    e.employee_number,
    e.department,
    e.position,
    e.role,
    e.status,
    e.start_date,
    e.gender,
    e.birth_date,
    e.marital_status,
    e.children_count,
    e.address,
    e.id_number,
    e.job_grade,
    e.job_echelon,
    c.contract_type,
    c.contract_number,
    c.start_date AS contract_start_date,
    c.end_date AS contract_end_date,
    c.salary_base,
    COUNT(DISTINCT pd.id) AS documents_count,
    MAX(c.created_at) AS latest_contract_date,
    MAX(pd.created_at) AS latest_document_date
FROM employees e
LEFT JOIN contracts c ON e.id = c.employee_id AND c.status = 'Active'
LEFT JOIN personnel_documents pd ON e.id = pd.employee_id
GROUP BY 
    e.id, e.company_id, e.first_name, e.last_name, e.email, e.phone,
    e.employee_number, e.department, e.position, e.role, e.status,
    e.start_date, e.gender, e.birth_date, e.marital_status, e.children_count,
    e.address, e.id_number, e.job_grade, e.job_echelon, 
    c.id, c.contract_type, c.contract_number, c.start_date, c.end_date, 
    c.salary_base, c.created_at;

-- ============================================================================
-- 11. VUE - Documents expirés ou à expiration proche
-- ============================================================================

CREATE OR REPLACE VIEW personnel_documents_expiring_soon_view AS
SELECT 
    pd.id,
    pd.company_id,
    pd.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    e.employee_number,
    pd.document_type,
    pd.document_title,
    pd.expiry_date,
    CASE 
        WHEN pd.expiry_date IS NULL THEN 'No expiry'
        WHEN pd.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN pd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring soon (< 30 days)'
        WHEN pd.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'Expiring soon (< 90 days)'
        ELSE 'Valid'
    END AS expiry_status,
    (pd.expiry_date - CURRENT_DATE) AS days_remaining
FROM personnel_documents pd
JOIN employees e ON pd.employee_id = e.id
WHERE pd.expiry_date IS NOT NULL
ORDER BY pd.expiry_date ASC;

-- ============================================================================
-- 12. VUE - Statut reconnaissance du règlement
-- ============================================================================

CREATE OR REPLACE VIEW regulation_acknowledgment_status_view AS
SELECT 
    c.id AS company_id,
    cr.id AS regulation_id,
    cr.regulation_title,
    cr.regulation_version,
    COUNT(DISTINCT e.id) AS total_employees,
    COUNT(DISTINCT ra.id) AS acknowledged_count,
    COUNT(DISTINCT e.id) - COUNT(DISTINCT ra.id) AS not_acknowledged_count,
    ROUND(
        (COUNT(DISTINCT ra.id)::NUMERIC / COUNT(DISTINCT e.id)::NUMERIC) * 100, 2
    ) AS acknowledgment_percentage
FROM companies c
LEFT JOIN company_regulations cr ON c.id = cr.company_id
LEFT JOIN employees e ON c.id = e.company_id AND e.status = 'Actif'
LEFT JOIN regulation_acknowledgments ra ON cr.id = ra.regulation_id 
    AND e.id = ra.employee_id
    AND cr.id = (SELECT id FROM company_regulations WHERE company_id = c.id AND status = 'Active' ORDER BY effective_date DESC LIMIT 1)
WHERE cr.status = 'Active'
GROUP BY c.id, cr.id, cr.regulation_title, cr.regulation_version;

-- ============================================================================
-- 13. COMMENTAIRES INFORMATIFS
-- ============================================================================

COMMENT ON TABLE contracts IS 'Gestion des contrats de travail des employés';
COMMENT ON TABLE personnel_documents IS 'Stockage des documents numérisés du personnel (CNI, diplômes, contrats, etc.)';
COMMENT ON TABLE job_descriptions IS 'Fiches de poste numérisées';
COMMENT ON TABLE company_regulations IS 'Règlement intérieur de l''entreprise';
COMMENT ON TABLE regulation_acknowledgments IS 'Suivi de la reconnaissance du règlement par les employés';
COMMENT ON TABLE personnel_document_audit_log IS 'Audit des actions sur les documents personnels';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Exécution: psql -U postgres -d hr_attendance_db -f 1_personnel_management_schema.sql
-- Ou depuis votre application backend: node scripts/migrate.js
