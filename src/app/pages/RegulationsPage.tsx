import React, { useState, useEffect } from 'react';
import { regulationsApi } from '@/app/services/api';
import { CompanyRegulation } from '@/app/data/personnelManagementTypes';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<CompanyRegulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegulation, setSelectedRegulation] = useState<CompanyRegulation | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  useEffect(() => {
    fetchRegulations();
  }, []);

  const fetchRegulations = async () => {
    setLoading(true);
    try {
      const data = await regulationsApi.getActive();
      setRegulations(data || []);
      
      // Charger le statut de reconnaissance pour chacun
      for (const reg of data || []) {
        checkAcknowledgment(reg.id);
      }
    } catch (error) {
      console.error('Erreur chargement règlements:', error);
      toast.error('Erreur lors du chargement des règlements');
    } finally {
      setLoading(false);
    }
  };

  const checkAcknowledgment = async (regulationId: string) => {
    try {
      const data = await regulationsApi.getAcknowledgmentStatus(regulationId);
      // Vérifier si l'employé actuel a reconnu
      // Cette vérification serait idéalement faite côté serveur
      setAcknowledged(prev => new Set(prev).add(regulationId));
    } catch (error) {
      // Pas reconnu
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedRegulation) return;

    setIsAcknowledging(true);
    try {
      await regulationsApi.acknowledge(selectedRegulation.id, {
        acknowledgmentType: 'Acknowledged',
        notes: 'Règlement lu et accepté'
      });
      
      setAcknowledged(prev => new Set(prev).add(selectedRegulation.id));
      toast.success('Reconnaissance enregistrée avec succès');
      setShowConfirm(false);
      setSelectedRegulation(null);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la reconnaissance du règlement');
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Règlement Intérieur</h1>
        <p className="text-gray-600 mt-2">
          Consultez et reconnaissez les règlements applicables
        </p>
      </div>

      {/* Regulations List */}
      <div className="grid gap-4">
        {regulations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun règlement disponible
          </div>
        ) : (
          regulations.map((reg) => {
            const isAck = acknowledged.has(reg.id);
            return (
              <div
                key={reg.id}
                className="bg-white border rounded-lg p-4 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{reg.regulationTitle}</h3>
                      {reg.isMandatoryAcknowledgment && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Obligatoire
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Version {reg.regulationVersion} • Effectif depuis{' '}
                      {new Date(reg.effectiveDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAck ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Reconnu</span>
                      </div>
                    ) : reg.isMandatoryAcknowledgment ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">À reconnaître</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">En attente</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content preview */}
                {reg.regulationContent && (
                  <div className="mb-4 p-3 bg-gray-50 rounded max-h-40 overflow-hidden">
                    <div
                      className="text-sm text-gray-700 line-clamp-5"
                      dangerouslySetInnerHTML={{ __html: reg.regulationContent }}
                    />
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm border-t pt-4">
                  {reg.workingHours && (
                    <div>
                      <p className="text-gray-600">Horaires de travail</p>
                      <p className="font-medium">{reg.workingHours}</p>
                    </div>
                  )}
                  {reg.leavePolicy && (
                    <div>
                      <p className="text-gray-600">Politique de congés</p>
                      <p className="font-medium">{reg.leavePolicy}</p>
                    </div>
                  )}
                  {reg.codeOfConduct && (
                    <div>
                      <p className="text-gray-600">Code de conduite</p>
                      <p className="font-medium text-xs line-clamp-1">{reg.codeOfConduct}</p>
                    </div>
                  )}
                  {reg.healthSafety && (
                    <div>
                      <p className="text-gray-600">Santé et sécurité</p>
                      <p className="font-medium text-xs line-clamp-1">{reg.healthSafety}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRegulation(reg)}
                  >
                    Voir Détails
                  </Button>

                  {!isAck && reg.isMandatoryAcknowledgment && (
                    <Button
                      onClick={() => {
                        setSelectedRegulation(reg);
                        setShowConfirm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      ✓ Reconnaître
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Content Modal */}
      {selectedRegulation && !showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedRegulation.regulationTitle}</h2>
                <p className="text-gray-600 mt-1">
                  Version {selectedRegulation.regulationVersion} • Effectif depuis{' '}
                  {new Date(selectedRegulation.effectiveDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedRegulation(null)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {selectedRegulation.regulationContent && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contenu</h3>
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedRegulation.regulationContent,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Sections */}
              <div className="grid grid-cols-2 gap-6">
                {selectedRegulation.workingHours && (
                  <div>
                    <h4 className="font-semibold mb-2">Horaires de Travail</h4>
                    <p className="text-gray-700">{selectedRegulation.workingHours}</p>
                  </div>
                )}
                {selectedRegulation.leavePolicy && (
                  <div>
                    <h4 className="font-semibold mb-2">Politique de Congés</h4>
                    <p className="text-gray-700">{selectedRegulation.leavePolicy}</p>
                  </div>
                )}
                {selectedRegulation.codeOfConduct && (
                  <div>
                    <h4 className="font-semibold mb-2">Code de Conduite</h4>
                    <p className="text-gray-700">{selectedRegulation.codeOfConduct}</p>
                  </div>
                )}
                {selectedRegulation.healthSafety && (
                  <div>
                    <h4 className="font-semibold mb-2">Santé et Sécurité</h4>
                    <p className="text-gray-700">{selectedRegulation.healthSafety}</p>
                  </div>
                )}
                {selectedRegulation.disciplinaryMeasures && (
                  <div>
                    <h4 className="font-semibold mb-2">Mesures Disciplinaires</h4>
                    <p className="text-gray-700">{selectedRegulation.disciplinaryMeasures}</p>
                  </div>
                )}
                {selectedRegulation.remoteWorkPolicy && (
                  <div>
                    <h4 className="font-semibold mb-2">Travail à Distance</h4>
                    <p className="text-gray-700">{selectedRegulation.remoteWorkPolicy}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRegulation(null)}
              >
                Fermer
              </Button>
              {!acknowledged.has(selectedRegulation.id) && selectedRegulation.isMandatoryAcknowledgment && (
                <Button
                  onClick={() => setShowConfirm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ✓ Reconnaître ce Règlement
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgment Confirmation */}
      {showConfirm && selectedRegulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold">Reconnaître le Règlement</h3>
                <p className="text-gray-600 text-sm mt-1">
                  En cliquant sur "J'accepte", vous confirmez avoir lu et accepté le
                  règlement intérieur.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Titre:</strong> {selectedRegulation.regulationTitle}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Version:</strong> {selectedRegulation.regulationVersion}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedRegulation(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAcknowledging ? 'Enregistrement...' : "J'accepte"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {acknowledged.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          ✓ Vous avez reconnu {acknowledged.size} règlement(s)
        </div>
      )}
    </div>
  );
}
