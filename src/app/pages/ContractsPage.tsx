import React, { useState, useEffect, useRef } from 'react';
import { contractsApi } from '@/app/services/api';
import { Contract, ContractStatus, ContractType } from '@/app/data/personnelManagementTypes';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Download, Upload, Trash2, Edit2 } from 'lucide-react';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<Partial<Contract>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    status: 'Active' as ContractStatus,
    contractType: '' as any,
  });

  useEffect(() => {
    fetchContracts();
  }, [page, filters]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await contractsApi.getAll({
        page,
        pageSize: 10,
        ...filters,
      });
      setContracts(data || []);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      toast.error('Erreur lors du chargement des contrats');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (
      !formData.employeeId ||
      !formData.contractType ||
      !formData.startDate ||
      !formData.jobTitle
    ) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }

    try {
      await contractsApi.create(formData as any);
      toast.success('Contrat créé avec succès');
      setShowModal(false);
      setFormData({});
      fetchContracts();
    } catch (error) {
      toast.error('Erreur lors de la création du contrat');
    }
  };

  const handleUploadDocument = async (file: File, contractId: string) => {
    try {
      await contractsApi.uploadDocument(contractId, file);
      toast.success('Document uploadé avec succès');
      fetchContracts();
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    }
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;

    try {
      await contractsApi.delete(selectedContract.id);
      toast.success('Contrat supprimé');
      setShowDeleteDialog(false);
      fetchContracts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDownloadDocument = async (contractId: string) => {
    try {
      await contractsApi.downloadDocument(contractId);
      toast.success('Téléchargement en cours...');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading && contracts.length === 0) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Contrats</h1>
          <p className="text-gray-600 mt-2">
            Gérez les contrats de travail de vos employés
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({});
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nouveau Contrat
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end bg-white p-4 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value as any });
              setPage(1);
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Active">Actif</option>
            <option value="Suspended">Suspendu</option>
            <option value="Terminated">Terminé</option>
            <option value="Expired">Expiré</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            value={filters.contractType}
            onChange={(e) => {
              setFilters({ ...filters, contractType: e.target.value });
              setPage(1);
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Tous les types</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Stage">Stage</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>
      </div>

      {/* Contracts List */}
      <div className="grid gap-4">
        {contracts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun contrat trouvé
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white border rounded-lg p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{contract.jobTitle}</h3>
                  <p className="text-sm text-gray-600">
                    {contract.contractType} • {contract.contractNumber}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Début: {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                    {contract.endDate &&
                      ` • Fin: ${new Date(contract.endDate).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    contract.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Salaire annuel</p>
                  <p className="font-semibold">{contract.salaryBase?.toLocaleString('fr-FR')} €</p>
                </div>
                <div>
                  <p className="text-gray-600">Horaires</p>
                  <p className="font-semibold">{contract.workScheduleHours} h/semaine</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedContract(contract);
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>

                {contract.documentFilePath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(contract.id)}
                  >
                    <Download className="w-4 h-4 mr-2" /> Télécharger
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedContract(contract);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          if (e.target.files?.[0] && selectedContract) {
            handleUploadDocument(e.target.files[0], selectedContract.id);
          }
        }}
      />

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Précédent
        </Button>
        <span className="px-4 py-2">{page}</span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
        >
          Suivant
        </Button>
      </div>

      {/* Modal Nouveau Contrat */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouveau Contrat</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employé *</label>
                  <Input
                    type="text"
                    placeholder="ID Employé"
                    value={formData.employeeId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type de Contrat *</label>
                  <select
                    value={formData.contractType || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contractType: e.target.value as any })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Numéro Contrat</label>
                  <Input
                    type="text"
                    placeholder="Ex: CONT-2024-001"
                    value={formData.contractNumber || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contractNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Poste *</label>
                  <Input
                    type="text"
                    placeholder="Poste"
                    value={formData.jobTitle || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de Début *</label>
                  <Input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de Fin</label>
                  <Input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Salaire de Base</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={formData.salaryBase || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryBase: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horaires (h/semaine)</label>
                  <Input
                    type="number"
                    placeholder="35"
                    value={formData.workScheduleHours || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, workScheduleHours: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setFormData({});
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateContract}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Créer Contrat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contrat?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contrat de {selectedContract?.jobTitle} sera supprimé. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContract}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
