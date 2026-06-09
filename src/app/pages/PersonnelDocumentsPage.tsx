import React, { useState, useEffect, useRef } from 'react';
import { personnelDocumentsApi } from '@/app/services/api';
import { PersonnelDocument } from '@/app/data/personnelManagementTypes';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PersonnelDocumentsPage() {
  const [documents, setDocuments] = useState<PersonnelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PersonnelDocument | null>(null);
  const [filters, setFilters] = useState({ documentType: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    documentType: 'CNI' as any,
    documentTitle: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
  });

  const documentTypes = [
    'CNI',
    'Passeport',
    'Diplôme',
    'CV',
    'Contrat',
    'Certificat Médical',
    'Permis Conduire',
    'Attestation Travail',
    'RIB',
    'Autre',
  ];

  useEffect(() => {
    fetchDocuments();
    fetchExpiringDocuments();
  }, [filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await personnelDocumentsApi.getAll(undefined, filters);
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringDocuments = async () => {
    try {
      const data = await personnelDocumentsApi.getExpiringNow();
      setExpiringDocs(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleUploadDocument = async (file: File) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('employeeId', formData.employeeId);
      formDataObj.append('documentType', formData.documentType);
      formDataObj.append('documentTitle', formData.documentTitle);
      formDataObj.append('documentNumber', formData.documentNumber);
      formDataObj.append('issueDate', formData.issueDate);
      formDataObj.append('expiryDate', formData.expiryDate);

      await personnelDocumentsApi.create(formDataObj);
      toast.success('Document uploadé avec succès');
      setShowModal(false);
      setFormData({
        employeeId: '',
        documentType: 'CNI',
        documentTitle: '',
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
      });
      fetchDocuments();
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      await personnelDocumentsApi.download(docId);
      toast.success('Téléchargement en cours...');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Supprimer ce document?')) {
      try {
        await personnelDocumentsApi.delete(docId);
        toast.success('Document supprimé');
        fetchDocuments();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: 'Expiré', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysLeft < 30) return { label: `Expire ${daysLeft}j`, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: `Valide ${daysLeft}j`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dossier Numérique</h1>
          <p className="text-gray-600 mt-2">Gestion des documents personnels</p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              employeeId: '',
              documentType: 'CNI',
              documentTitle: '',
              documentNumber: '',
              issueDate: '',
              expiryDate: '',
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nouveau Document
        </Button>
      </div>

      {/* Expiring Alert */}
      {expiringDocs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">Documents à renouveler</h3>
              <p className="text-sm text-orange-800 mt-1">
                {expiringDocs.length} document(s) expireront bientôt
              </p>
              <ul className="mt-2 space-y-1">
                {expiringDocs.slice(0, 3).map((doc) => (
                  <li key={doc.id} className="text-sm text-orange-800">
                    • {doc.documentType} - Expire le{' '}
                    {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Type de Document</label>
          <select
            value={filters.documentType}
            onChange={(e) => setFilters({ documentType: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Tous les types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucun document trouvé
          </div>
        ) : (
          documents.map((doc) => {
            const status = doc.expiryDate ? getExpiryStatus(doc.expiryDate) : null;
            return (
              <div
                key={doc.id}
                className="bg-white border rounded-lg p-4 hover:shadow-lg transition"
              >
                {/* Type Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {doc.documentType}
                  </span>
                  {status && (
                    <span className={`px-2 py-1 text-xs font-medium rounded ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </div>

                {/* Info */}
                <h3 className="font-semibold mb-2">{doc.documentTitle}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>Numéro: {doc.documentNumber}</p>
                  {doc.issueDate && (
                    <p>Émis: {new Date(doc.issueDate).toLocaleDateString('fr-FR')}</p>
                  )}
                  {doc.expiryDate && (
                    <p>Expire: {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>

                {/* Verification Status */}
                {doc.isVerified && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-green-600 bg-green-50 p-2 rounded">
                    <CheckCircle className="w-4 h-4" />
                    <span>Vérifié</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.id)}
                  >
                    <Download className="w-4 h-4 mr-1" /> Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouveau Document</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type de Document *</label>
                <select
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData({ ...formData, documentType: e.target.value as any })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <Input
                  type="text"
                  placeholder="Titre du document"
                  value={formData.documentTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, documentTitle: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Numéro *</label>
                <Input
                  type="text"
                  placeholder="Numéro du document"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'émission</label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, issueDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fichier *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadDocument(e.target.files[0]);
                    }
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" /> Sélectionner Fichier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
