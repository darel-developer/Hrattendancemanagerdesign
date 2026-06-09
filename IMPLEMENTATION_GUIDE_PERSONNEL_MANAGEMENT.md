# 📋 Guide d'Implémentation - Gestion Administrative du Personnel

## 🎯 Vue d'ensemble

Ce guide couvre l'implémentation complète des fonctionnalités de gestion administrative du personnel dans HR Attendance Manager.

### Modules à implémenter

1. **Gestion des Contrats** - Upload, consultation, archivage
2. **Dossier Numérique du Personnel** - Documents personnels numérisés
3. **Fiches de Poste** - Numérotation, versioning, publication
4. **Règlement Intérieur** - Distribution, reconnaissance obligatoire

---

## 🗄️ Setup Base de Données

### 1. Exécuter le script de migration

```bash
# Depuis la racine du projet
psql -U postgres -h localhost -d hr_attendance_db -f scripts/1_personnel_management_schema.sql

# Ou via Node.js
npm run db:migrate
```

### 2. Vérifier l'installation

```sql
-- Vérifier les tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Résultat attendu:
-- contracts
-- company_regulations
-- job_descriptions
-- personnel_documents
-- personnel_document_audit_log
-- regulation_acknowledgments
```

---

## 🔌 API Backend - Routes Express

### 1. Routes Contrats (`/api/contracts`)

#### GET /api/contracts
**Récupérer les contrats (paginé, filtré)**

```typescript
// Query params:
// ?companyId=xxx&employeeId=yyy&status=Active&page=1&pageSize=10&sortBy=startDate&sortOrder=DESC

// Response:
{
  success: true,
  data: [
    {
      id: "uuid",
      employeeId: "uuid",
      contractType: "CDI",
      contractNumber: "CONT-2024-001",
      startDate: "2024-01-15",
      endDate: null,
      jobTitle: "Développeur Senior",
      salaryBase: 50000,
      status: "Active",
      createdAt: "2024-01-10T10:00:00Z"
    }
  ],
  pagination: { page: 1, pageSize: 10, total: 25 }
}
```

#### GET /api/contracts/:id
**Récupérer un contrat spécifique**

```typescript
// Response:
{
  success: true,
  data: {
    id: "uuid",
    // ... toutes les propriétés du contrat
    documentFileName: "contrat_emploi.pdf",
    documentFilePath: "/contracts/2024/uuid.pdf",
    documentFileSize: 245632,
    documentFileMimeType: "application/pdf"
  }
}
```

#### POST /api/contracts
**Créer un nouveau contrat**

```typescript
// Body:
{
  employeeId: "uuid",
  contractType: "CDI",
  contractNumber: "CONT-2024-001",
  startDate: "2024-01-15",
  jobTitle: "Développeur Senior",
  jobDescription: "Développement applications React/Node.js",
  salaryBase: 50000,
  workScheduleHours: 35,
  probationPeriodDays: 90,
  notes: "Contrat principal"
}

// Response: 201 Created
{
  success: true,
  data: { id: "uuid", ... },
  message: "Contrat créé avec succès"
}
```

#### POST /api/contracts/:id/document
**Upload du fichier contrat (multipart/form-data)**

```typescript
// Form data:
// - file: <binary>
// - type: "application/pdf"

// Response:
{
  success: true,
  data: {
    documentFileName: "contrat_emploi.pdf",
    documentFilePath: "/contracts/2024/uuid.pdf",
    documentFileSize: 245632,
    fileChecksum: "sha256hash..."
  }
}
```

#### PUT /api/contracts/:id
**Modifier un contrat**

```typescript
// Body: Propriétés à modifier
{ salaryBase: 55000 }

// Response: 200 OK
```

#### DELETE /api/contracts/:id
**Supprimer un contrat**

```typescript
// Response: 200 OK
{ success: true, message: "Contrat supprimé" }
```

---

### 2. Routes Documents Personnels (`/api/personnel-documents`)

#### GET /api/personnel-documents
**Récupérer les documents (paginé, filtré)**

```typescript
// Query params:
// ?employeeId=xxx&documentType=CNI&expiryStatus=EXPIRED&page=1

// Response:
{
  success: true,
  data: [
    {
      id: "uuid",
      employeeId: "uuid",
      documentType: "CNI",
      documentTitle: "Carte d'Identité Nationale",
      documentNumber: "AB123456",
      issueDate: "2020-03-15",
      expiryDate: "2030-03-15",
      fileName: "cni_john_doe.pdf",
      isVerified: true,
      verifiedBy: "admin-uuid",
      verifiedAt: "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### GET /api/personnel-documents/expiring-soon
**Récupérer les documents en cours d'expiration**

```typescript
// Query params:
// ?daysWindow=90 (par défaut)

// Response:
{
  success: true,
  data: [
    {
      id: "uuid",
      employeeId: "uuid",
      documentType: "Permis Conduire",
      expiryDate: "2024-07-15",
      expiryStatus: "Expiring soon (< 30 days)",
      daysRemaining: 15,
      employeeName: "John Doe",
      employeeNumber: "EMP-2024-001001"
    }
  ]
}
```

#### POST /api/personnel-documents
**Créer un document personnel (multipart/form-data)**

```typescript
// Form data:
// - employeeId: "uuid"
// - documentType: "CNI"
// - documentTitle: "Carte d'Identité Nationale"
// - documentNumber: "AB123456"
// - issueDate: "2020-03-15"
// - expiryDate: "2030-03-15"
// - file: <binary>

// Response: 201 Created
```

#### PUT /api/personnel-documents/:id/verify
**Vérifier un document**

```typescript
// Body:
{
  isVerified: true,
  verificationNotes: "Document vérifié et archivé"
}

// Response:
{
  success: true,
  data: { isVerified: true, verifiedAt: "2024-01-10..." }
}
```

#### GET /api/personnel-documents/:id/download
**Télécharger un document (protégé)**

```typescript
// Response: File download + audit log
```

---

### 3. Routes Fiches de Poste (`/api/job-descriptions`)

#### GET /api/job-descriptions
**Récupérer les fiches de poste**

```typescript
// Query params:
// ?status=Active&isPublic=true&page=1

// Response: List paginated
```

#### POST /api/job-descriptions
**Créer une fiche de poste**

```typescript
// Body:
{
  jobTitle: "Développeur React Senior",
  jobLevel: "Senior",
  jobFamily: "Technique",
  jobResponsibilities: "Développement et maintenance applications React...",
  jobSkillsRequired: "React, TypeScript, Node.js, PostgreSQL",
  workLocation: "Bureau Paris",
  isPublic: true
}
```

#### GET /api/job-descriptions/:id/download
**Télécharger la fiche de poste**

---

### 4. Routes Règlement Intérieur (`/api/regulations`)

#### GET /api/regulations
**Récupérer les règlements actifs**

```typescript
// Response:
{
  success: true,
  data: [
    {
      id: "uuid",
      regulationTitle: "Règlement Intérieur 2024",
      regulationVersion: "2.0",
      effectiveDate: "2024-01-01",
      isMandatoryAcknowledgment: true,
      status: "Active"
    }
  ]
}
```

#### GET /api/regulations/:id/content
**Récupérer le contenu d'un règlement**

```typescript
// Response:
{
  success: true,
  data: {
    id: "uuid",
    regulationTitle: "Règlement Intérieur 2024",
    regulationContent: "<html>...</html>",
    workingHours: "35h/semaine...",
    leavePolicy: "25 jours/an..."
  }
}
```

#### POST /api/regulations/:id/acknowledge
**Reconnaître le règlement**

```typescript
// Body:
{
  acknowledgmentType: "Acknowledged",
  notes: "Règlement lu et accepté"
}

// Response:
{
  success: true,
  data: {
    id: "uuid",
    employeeId: "xxx",
    regulationId: "yyy",
    acknowledgedAt: "2024-01-10T15:30:00Z"
  }
}
```

#### GET /api/regulations/acknowledgment-status
**Statut reconnaissance par entreprise**

```typescript
// Response:
{
  success: true,
  data: {
    regulationId: "uuid",
    regulationTitle: "Règlement Intérieur 2024",
    totalEmployees: 150,
    acknowledgedCount: 142,
    notAcknowledgedCount: 8,
    acknowledgmentPercentage: 94.67
  }
}
```

---

## 📱 Composants Frontend - React

### 1. Composant Gestion Contrats

```typescript
// src/app/pages/ContractsPage.tsx

import React, { useState, useEffect } from 'react';
import { contractsApi } from '../services/api';
import { ContractFormData, Contract, PaginationParams } from '../data/personnelManagementTypes';

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'startDate',
    sortOrder: 'DESC'
  });

  useEffect(() => {
    fetchContracts();
  }, [pagination]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await contractsApi.getAll(pagination);
      setContracts(data);
    } catch (err) {
      console.error('Erreur chargement contrats:', err);
      // Toast error
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (contractId: string, file: File) => {
    try {
      await contractsApi.uploadDocument(contractId, file);
      // Toast success
      fetchContracts();
    } catch (err) {
      console.error('Erreur upload:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Contrats</h1>
      </div>

      {/* List contracts */}
      <div className="grid gap-4">
        {contracts.map(contract => (
          <div key={contract.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{contract.jobTitle}</h3>
            <p className="text-sm text-gray-600">{contract.contractType} - {contract.startDate}</p>
            {/* More details */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Composant Dossier Numérique

```typescript
// src/app/pages/PersonnelDocumentsPage.tsx

export function PersonnelDocumentsPage() {
  const [documents, setDocuments] = useState<PersonnelDocument[]>([]);
  const [filters, setFilters] = useState<PersonnelDocumentFilters>({});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dossier Numérique du Personnel</h1>

      {/* Filters */}
      <DocumentFilters onChange={setFilters} />

      {/* Documents list with type badges */}
      <DocumentsList documents={documents} filters={filters} />

      {/* Upload modal */}
      <UploadDocumentModal />

      {/* Expiring alerts */}
      <ExpiringDocumentsAlert />
    </div>
  );
}
```

### 3. Composant Fiches de Poste

```typescript
// src/app/pages/JobDescriptionsPage.tsx

export function JobDescriptionsPage() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fiches de Poste</h1>

      {/* Create new */}
      <CreateJobDescriptionButton />

      {/* Grid de fiches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobDescriptions.map(job => (
          <JobDescriptionCard key={job.id} jobDescription={job} />
        ))}
      </div>
    </div>
  );
}
```

### 4. Composant Règlement Intérieur

```typescript
// src/app/pages/RegulationsPage.tsx

export function RegulationsPage() {
  const [regulations, setRegulations] = useState<CompanyRegulation[]>([]);
  const [selectedRegulation, setSelectedRegulation] = useState<CompanyRegulation | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = async () => {
    try {
      await regulationsApi.acknowledge(selectedRegulation!.id, {
        acknowledgmentType: 'Acknowledged',
        notes: 'Règlement lu et accepté'
      });
      setAcknowledged(true);
      // Toast success
    } catch (err) {
      console.error('Erreur reconnaissance:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Règlement Intérieur</h1>

      {/* Regulation viewer */}
      {selectedRegulation && (
        <RegulationViewer regulation={selectedRegulation} />
      )}

      {/* Acknowledgment section */}
      {!acknowledged && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold">Reconnaissance Obligatoire</h3>
          <p className="text-sm text-gray-600 mb-4">
            Vous devez reconnaître avoir lu et accepté le règlement intérieur
          </p>
          <button
            onClick={handleAcknowledge}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Je reconnais avoir lu et accepté
          </button>
        </div>
      )}

      {acknowledged && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          ✅ Règlement reconnu le {new Date().toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Services API - Frontend

```typescript
// src/app/services/api.ts - Ajouter les nouvelles fonctions

export const contractsApi = {
  getAll: (pagination?: PaginationParams) =>
    request<Contract[]>('/contracts', { params: pagination }),

  getById: (id: string) =>
    request<Contract>(`/contracts/${id}`),

  create: (data: ContractFormData) =>
    request<Contract>('/contracts', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),

  uploadDocument: (contractId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<FileUploadResponse>(`/contracts/${contractId}/document`, {
      method: 'POST',
      body: formData
    });
  },

  update: (id: string, data: Partial<Contract>) =>
    request<Contract>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/contracts/${id}`, { method: 'DELETE' })
};

export const personnelDocumentsApi = {
  getAll: (employeeId?: string, filters?: PersonnelDocumentFilters) =>
    request<PersonnelDocument[]>('/personnel-documents', { params: { employeeId, ...filters } }),

  getExpiringsoon: () =>
    request<ExpiringDocument[]>('/personnel-documents/expiring-soon'),

  create: (formData: FormData) =>
    request<PersonnelDocument>('/personnel-documents', {
      method: 'POST',
      body: formData
    }),

  verify: (id: string, verified: boolean, notes?: string) =>
    request<PersonnelDocument>(`/personnel-documents/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ isVerified: verified, verificationNotes: notes })
    }),

  download: (id: string) =>
    fetch(`/api/personnel-documents/${id}/download`)
};

export const jobDescriptionsApi = {
  getAll: (filters?: JobDescriptionFilters) =>
    request<JobDescription[]>('/job-descriptions', { params: filters }),

  getById: (id: string) =>
    request<JobDescription>(`/job-descriptions/${id}`),

  create: (formData: FormData) =>
    request<JobDescription>('/job-descriptions', {
      method: 'POST',
      body: formData
    })
};

export const regulationsApi = {
  getActive: () =>
    request<CompanyRegulation[]>('/regulations'),

  getById: (id: string) =>
    request<CompanyRegulation>(`/regulations/${id}/content`),

  acknowledge: (id: string, payload: AcknowledgeRegulationPayload) =>
    request<RegulationAcknowledgment>(`/regulations/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getAcknowledgmentStatus: () =>
    request<RegulationAcknowledgmentStatus>('/regulations/acknowledgment-status')
};
```

---

## 📊 Mise à jour du README

Ajouter une nouvelle section au README.md:

```markdown
## Gestion Administrative du Personnel (Nouveau)

### Fonctionnalités

- **Gestion des Contrats** : Upload, versioning, suivi expiration
- **Dossier Numérique** : Documents CNI, diplômes, permis, RIB, etc.
- **Fiches de Poste** : Numérotation, public/private, versioning
- **Règlement Intérieur** : Distribution, reconnaissance obligatoire, audit

### Types de documents supportés

- CNI / Passeport
- Diplômes / Certifications
- Permis de conduire
- Attestations de travail
- RIB / Coordonnées bancaires
- Contrats
- Certificats médicaux
- Et plus...

### Routes API

- `GET/POST /api/contracts` - Gestion contrats
- `GET/POST /api/personnel-documents` - Documents personnels
- `GET/POST /api/job-descriptions` - Fiches de poste
- `GET /api/regulations` - Règlement intérieur

### Sécurité

- ✅ Chiffrement des documents sensibles
- ✅ Audit complet des accès (JSONB logs)
- ✅ Contrôle d'accès par rôle
- ✅ Conformité RGPD
```

---

## ✅ Checklist Implémentation

- [ ] Exécuter le script SQL de migration
- [ ] Créer les routes Express backend
- [ ] Implémenter les contrôleurs (CRUD + upload)
- [ ] Implémenter les services API frontend
- [ ] Créer les composants React (Pages)
- [ ] Ajouter les modals de création/modification
- [ ] Implémenter upload de fichiers
- [ ] Ajouter filtres et recherche
- [ ] Implémenter audit logging
- [ ] Tester workflow complet
- [ ] Documenter l'API
- [ ] Former les utilisateurs

---

## 📚 Ressources

- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [File Upload Best Practices](https://developer.mozilla.org/en-US/docs/Learn/Forms/Sending_forms_through_JavaScript)
- [RGPD Compliance](https://gdpr-info.eu/)

---

**Document créé:** 2026-06-09  
**Version:** 1.0
