// ==============================================================================
// Types & Interfaces - Gestion Administrative du Personnel
// ==============================================================================

/**
 * Type pour le genre de l'employé
 */
export type Gender = 'Masculin' | 'Féminin' | 'Autre';

/**
 * Type pour la situation matrimoniale
 */
export type MaritalStatus = 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve' | 'PACS';

/**
 * Type pour le type de contrat
 */
export type ContractType = 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Alternance' | 'Apprentissage';

/**
 * Type pour le statut du contrat
 */
export type ContractStatus = 'Draft' | 'Active' | 'Suspended' | 'Terminated' | 'Expired';

/**
 * Type pour le type de document personnel
 */
export type PersonnelDocumentType = 
  | 'CNI' 
  | 'Passeport' 
  | 'Diplôme' 
  | 'CV' 
  | 'Contrat' 
  | 'Certificat Médical' 
  | 'Permis Conduire' 
  | 'Attestation Travail' 
  | 'RIB' 
  | 'Autre';

/**
 * Type pour le niveau de poste
 */
export type JobLevel = 'Junior' | 'Confirmé' | 'Senior' | 'Expert' | 'Manager' | 'Directeur';

/**
 * Type pour la famille de poste
 */
export type JobFamily = 'Technique' | 'Commercial' | 'Support' | 'Management' | 'Administratif' | 'Autre';

/**
 * Type pour le statut de la fiche de poste
 */
export type JobDescriptionStatus = 'Draft' | 'Active' | 'Archived' | 'Obsolete';

/**
 * Type pour le statut du règlement
 */
export type RegulationStatus = 'Draft' | 'Active' | 'Archived' | 'Superseded';

/**
 * Type pour le type de reconnaissance du règlement
 */
export type AcknowledgmentType = 'Read' | 'Acknowledged' | 'Signed' | 'Refused';

/**
 * Type pour les actions d'audit
 */
export type AuditAction = 'Upload' | 'Download' | 'View' | 'Verify' | 'Update' | 'Delete' | 'Share' | 'Expire_Alert';

/**
 * Type pour le niveau de visibilité des documents
 */
export type DocumentVisibility = 'Admin_Only' | 'Employee_View' | 'Public';

/**
 * Type pour la source d'upload des documents
 */
export type UploadSource = 'Admin' | 'Employee' | 'System';

// ==============================================================================
// INTERFACES
// ==============================================================================

/**
 * Informations personnelles détaillées de l'employé
 */
export interface PersonnelInfo {
  gender?: Gender;
  birthDate?: string; // ISO date
  maritalStatus?: MaritalStatus;
  childrenCount?: number;
  idNumber?: string; // CNI, Passeport, etc.
  jobGrade?: string; // Grade/niveau hiérarchique
  jobEchelon?: string; // Échelon
  bankAccountNumber?: string; // RIB
  bankAccountHolder?: string; // Titulaire compte
}

/**
 * Contrat de travail
 */
export interface Contract {
  id: string;
  companyId: string;
  employeeId: string;
  
  contractType: ContractType;
  contractNumber?: string;
  startDate: string; // ISO date
  endDate?: string; // ISO date (null pour CDI)
  
  jobTitle: string;
  jobDescription?: string;
  
  salaryBase?: number;
  salaryCurrency?: string;
  
  workSchedule?: string;
  workScheduleHours?: number;
  probationPeriodDays?: number;
  
  documentFileName?: string;
  documentFilePath?: string;
  documentFileSize?: number;
  documentFileMimeType?: string;
  documentUploadedAt?: string;
  
  notes?: string;
  status: ContractStatus;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Création/modification de contrat
 */
export interface ContractFormData {
  contractType: ContractType;
  contractNumber?: string;
  startDate: string;
  endDate?: string;
  jobTitle: string;
  jobDescription?: string;
  salaryBase?: number;
  workSchedule?: string;
  workScheduleHours?: number;
  probationPeriodDays?: number;
  notes?: string;
  documentFile?: File; // Pour upload
}

/**
 * Document personnel numérisé
 */
export interface PersonnelDocument {
  id: string;
  companyId: string;
  employeeId: string;
  
  documentType: PersonnelDocumentType;
  documentTitle?: string;
  documentNumber?: string;
  
  issueDate?: string; // ISO date
  expiryDate?: string; // ISO date
  issueCountry?: string;
  
  fileName: string;
  filePath: string;
  fileSize: number;
  fileMimeType: string;
  fileChecksum?: string;
  documentPreviewUrl?: string;
  
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  
  isExpirationAlertSent: boolean;
  alertSentAt?: string;
  
  uploadSource: UploadSource;
  visibility: DocumentVisibility;
  
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Création/modification de document personnel
 */
export interface PersonnelDocumentFormData {
  documentType: PersonnelDocumentType;
  documentTitle?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issueCountry?: string;
  visibility?: DocumentVisibility;
  notes?: string;
  documentFile: File; // Requis
}

/**
 * Document expirées ou en cours d'expiration
 */
export interface ExpiringDocument extends PersonnelDocument {
  expiryStatus: 'No expiry' | 'EXPIRED' | 'Expiring soon (< 30 days)' | 'Expiring soon (< 90 days)' | 'Valid';
  daysRemaining?: number;
}

/**
 * Fiche de poste
 */
export interface JobDescription {
  id: string;
  companyId: string;
  departmentId?: string;
  
  jobTitle: string;
  jobReference?: string;
  jobLevel?: JobLevel;
  jobFamily?: JobFamily;
  
  jobSummary?: string;
  jobResponsibilities?: string;
  jobSkillsRequired?: string;
  jobQualifications?: string;
  jobExperienceRequired?: number; // Années
  
  reportingTo?: string;
  subordinatesCount?: number;
  
  workLocation?: string;
  workSchedule?: string;
  travelRequired?: boolean;
  travelPercentage?: number;
  
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileMimeType?: string;
  documentUploadedAt?: string;
  
  status: JobDescriptionStatus;
  version: number;
  
  approvedBy?: string;
  approvedAt?: string;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  
  isPublic: boolean;
}

/**
 * Création/modification de fiche de poste
 */
export interface JobDescriptionFormData {
  jobTitle: string;
  jobReference?: string;
  jobLevel?: JobLevel;
  jobFamily?: JobFamily;
  jobSummary?: string;
  jobResponsibilities?: string;
  jobSkillsRequired?: string;
  jobQualifications?: string;
  jobExperienceRequired?: number;
  reportingTo?: string;
  subordinatesCount?: number;
  workLocation?: string;
  workSchedule?: string;
  travelRequired?: boolean;
  travelPercentage?: number;
  isPublic?: boolean;
  documentFile?: File;
}

/**
 * Règlement intérieur
 */
export interface CompanyRegulation {
  id: string;
  companyId: string;
  
  regulationTitle: string;
  regulationVersion?: string;
  
  regulationContent?: string; // HTML
  regulationSummary?: string;
  
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileMimeType?: string;
  documentUploadedAt?: string;
  
  // Sections principales
  workingHours?: string;
  leavePolicy?: string;
  codeOfConduct?: string;
  healthSafety?: string;
  disciplinaryMeasures?: string;
  remoteWorkPolicy?: string;
  overtimePolicy?: string;
  otherClauses?: string;
  
  status: RegulationStatus;
  effectiveDate: string; // ISO date
  endDate?: string; // ISO date
  isMandatoryAcknowledgment: boolean;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Création/modification de règlement intérieur
 */
export interface CompanyRegulationFormData {
  regulationTitle: string;
  regulationVersion?: string;
  regulationContent?: string;
  regulationSummary?: string;
  workingHours?: string;
  leavePolicy?: string;
  codeOfConduct?: string;
  healthSafety?: string;
  disciplinaryMeasures?: string;
  remoteWorkPolicy?: string;
  overtimePolicy?: string;
  otherClauses?: string;
  effectiveDate: string;
  endDate?: string;
  isMandatoryAcknowledgment?: boolean;
  documentFile?: File;
}

/**
 * Reconnaissance du règlement par employé
 */
export interface RegulationAcknowledgment {
  id: string;
  companyId: string;
  employeeId: string;
  regulationId: string;
  
  acknowledgmentType: AcknowledgmentType;
  acknowledgedAt: string;
  
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  
  notes?: string;
  
  createdAt: string;
}

/**
 * Réponse pour la reconnaissance du règlement
 */
export interface AcknowledgeRegulationPayload {
  regulationId: string;
  acknowledgmentType: AcknowledgmentType;
  notes?: string;
}

/**
 * Statut de reconnaissance du règlement (Vue)
 */
export interface RegulationAcknowledgmentStatus {
  companyId: string;
  regulationId: string;
  regulationTitle: string;
  regulationVersion?: string;
  totalEmployees: number;
  acknowledgedCount: number;
  notAcknowledgedCount: number;
  acknowledgmentPercentage: number;
}

/**
 * Entrée de journal d'audit
 */
export interface PersonnelDocumentAuditLog {
  id: string;
  documentId: string;
  employeeId: string;
  
  action: AuditAction;
  actionBy: string;
  actionReason?: string;
  
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  ipAddress?: string;
  userAgent?: string;
  
  actionTimestamp: string;
}

/**
 * Vue détaillée des employés
 */
export interface EmployeeDetailed {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeNumber?: string;
  department: string;
  position: string;
  role: 'Admin' | 'Manager' | 'Employee';
  status: 'Actif' | 'Inactif' | 'En congé';
  startDate: string;
  
  // Infos personnelles
  gender?: Gender;
  birthDate?: string;
  maritalStatus?: MaritalStatus;
  childrenCount?: number;
  address?: string;
  idNumber?: string;
  jobGrade?: string;
  jobEchelon?: string;
  
  // Contrat actuel
  contractType?: ContractType;
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  salaryBase?: number;
  
  // Compteurs
  documentsCount: number;
  latestContractDate?: string;
  latestDocumentDate?: string;
}

/**
 * Réponse d'upload de fichier
 */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileChecksum: string;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Erreur de validation de fichier
 */
export interface FileValidationError {
  code: 'INVALID_SIZE' | 'INVALID_TYPE' | 'INVALID_NAME' | 'DUPLICATE' | 'SCAN_FAILED';
  message: string;
  details?: Record<string, any>;
}

/**
 * Paramètres de pagination pour listes
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

/**
 * Filtres pour documents personnels
 */
export interface PersonnelDocumentFilters {
  documentType?: PersonnelDocumentType;
  isVerified?: boolean;
  expiryStatus?: 'EXPIRED' | 'EXPIRING_SOON' | 'VALID';
  visibility?: DocumentVisibility;
  uploadSource?: UploadSource;
  startDate?: string;
  endDate?: string;
}

/**
 * Filtres pour contrats
 */
export interface ContractFilters {
  contractType?: ContractType;
  status?: ContractStatus;
  department?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Filtres pour fiches de poste
 */
export interface JobDescriptionFilters {
  jobLevel?: JobLevel;
  jobFamily?: JobFamily;
  status?: JobDescriptionStatus;
  isPublic?: boolean;
  department?: string;
}

// ==============================================================================
// TYPES UTILITAIRES
// ==============================================================================

/**
 * Résultat avec message
 */
export interface Result<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: string;
    details?: Record<string, any>;
  };
}

/**
 * Statistiques personnel
 */
export interface PersonnelStatistics {
  totalEmployees: number;
  activeContracts: number;
  expiredDocuments: number;
  expiringDocumentsNextMonth: number;
  regulationAcknowledgmentRate: number; // Pourcentage
  unacknowledgedEmployees: number;
}
