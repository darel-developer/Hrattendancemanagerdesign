import React, { useState, useEffect } from 'react';
import { jobDescriptionsApi } from '@/app/services/api';
import { JobDescription } from '@/app/data/personnelManagementTypes';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';
import { Edit2, Lock, Globe, Archive } from 'lucide-react';

export default function JobDescriptionsPage() {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [filters, setFilters] = useState({ status: 'Active', isPublic: '' });
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobLevel: 'Junior' as any,
    jobFamily: '',
    jobResponsibilities: '',
    jobSkillsRequired: '',
    workLocation: '',
    isPublic: false,
  });

  const jobLevels = ['Junior', 'Confirmé', 'Senior', 'Expert', 'Manager', 'Directeur'];

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobDescriptionsApi.getAll(filters);
      setJobs(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!formData.jobTitle || !formData.jobFamily) {
      toast.error('Remplissez les champs obligatoires');
      return;
    }

    try {
      await jobDescriptionsApi.create(formData as any);
      toast.success('Fiche de poste créée');
      setShowModal(false);
      setFormData({
        jobTitle: '',
        jobLevel: 'Junior',
        jobFamily: '',
        jobResponsibilities: '',
        jobSkillsRequired: '',
        workLocation: '',
        isPublic: false,
      });
      fetchJobs();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fiches de Poste</h1>
          <p className="text-gray-600 mt-2">Gérez les descriptions des postes</p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              jobTitle: '',
              jobLevel: 'Junior',
              jobFamily: '',
              jobResponsibilities: '',
              jobSkillsRequired: '',
              workLocation: '',
              isPublic: false,
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nouvelle Fiche
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Draft">Brouillon</option>
            <option value="Active">Actif</option>
            <option value="Archived">Archivé</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Visibilité</label>
          <select
            value={filters.isPublic}
            onChange={(e) => setFilters({ ...filters, isPublic: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Tous</option>
            <option value="true">Public</option>
            <option value="false">Privé</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucune fiche de poste
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border rounded-lg p-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{job.jobTitle}</h3>
                  <p className="text-sm text-gray-600">{job.jobFamily}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.isPublic ? (
                    <Globe className="w-5 h-5 text-blue-600" title="Public" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" title="Privé" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Niveau</span>
                  <span className="font-medium">{job.jobLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Localisation</span>
                  <span className="font-medium">{job.workLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium">{job.version}</span>
                </div>
              </div>

              {job.jobResponsibilities && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 font-medium mb-1">Responsabilités</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {job.jobResponsibilities}
                  </p>
                </div>
              )}

              {job.jobSkillsRequired && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 font-medium mb-1">Compétences requises</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {job.jobSkillsRequired}
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Détails
                </Button>
                {job.status !== 'Archived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.info('Archive: À implémenter')
                    }
                    className="text-gray-600"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nouvelle Fiche de Poste</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre du Poste *</label>
                  <Input
                    type="text"
                    placeholder="Ex: Développeur React Senior"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau *</label>
                  <select
                    value={formData.jobLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, jobLevel: e.target.value as any })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    {jobLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Famille de Poste *</label>
                  <Input
                    type="text"
                    placeholder="Ex: Technique"
                    value={formData.jobFamily}
                    onChange={(e) =>
                      setFormData({ ...formData, jobFamily: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Localisation</label>
                  <Input
                    type="text"
                    placeholder="Ex: Bureau Paris"
                    value={formData.workLocation}
                    onChange={(e) =>
                      setFormData({ ...formData, workLocation: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Responsabilités</label>
                <textarea
                  rows={4}
                  placeholder="Description des responsabilités..."
                  value={formData.jobResponsibilities}
                  onChange={(e) =>
                    setFormData({ ...formData, jobResponsibilities: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Compétences Requises</label>
                <textarea
                  rows={3}
                  placeholder="Compétences requises..."
                  value={formData.jobSkillsRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, jobSkillsRequired: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-sm">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Publier cette fiche (visible à tous)
                </label>
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
                onClick={handleCreateJob}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Créer Fiche
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedJob.jobTitle}</h2>
                <p className="text-gray-600">{selectedJob.jobFamily}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Niveau</p>
                  <p className="font-semibold">{selectedJob.jobLevel}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Localisation</p>
                  <p className="font-semibold">{selectedJob.workLocation}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Statut</p>
                  <p className="font-semibold">{selectedJob.status}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Version</p>
                  <p className="font-semibold">v{selectedJob.version}</p>
                </div>
              </div>

              {selectedJob.jobResponsibilities && (
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Responsabilités</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.jobResponsibilities}</p>
                </div>
              )}

              {selectedJob.jobSkillsRequired && (
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Compétences Requises</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.jobSkillsRequired}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
