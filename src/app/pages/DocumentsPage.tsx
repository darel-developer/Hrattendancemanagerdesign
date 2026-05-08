import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, FileText, AlertTriangle, X, Download, ExternalLink, User } from "lucide-react";
import { EmployeeDocument } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { documentsApi } from "../services/api";

const DOC_TYPES = ["Contrat", "Bulletin de salaire", "Pièce d'identité", "Médical", "Diplôme", "Attestation", "Autre"];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  "Contrat":           { bg: "rgba(99,102,241,0.15)",  text: "#6366F1" },
  "Bulletin de salaire": { bg: "rgba(16,185,129,0.15)", text: "#10B981" },
  "Pièce d'identité":  { bg: "rgba(245,158,11,0.15)",  text: "#F59E0B" },
  "Médical":           { bg: "rgba(239,68,68,0.15)",   text: "#EF4444" },
  "Diplôme":           { bg: "rgba(139,92,246,0.15)",  text: "#8B5CF6" },
  "Attestation":       { bg: "rgba(20,184,166,0.15)",  text: "#14B8A6" },
  "Autre":             { bg: "rgba(107,114,128,0.15)", text: "#9CA3AF" },
};

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface AddDocModalProps {
  employeeOptions: { id: string; name: string }[];
  onClose: () => void;
  onSave: (doc: Partial<EmployeeDocument>) => void;
  defaultEmployeeId?: string;
}

function AddDocModal({ employeeOptions, onClose, onSave, defaultEmployeeId }: AddDocModalProps) {
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId ?? (employeeOptions[0]?.id ?? ""),
    title: "",
    type: "Contrat",
    fileUrl: "",
    expiryDate: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.title || !form.employeeId) return;
    onSave({ ...form, expiryDate: form.expiryDate || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl w-full max-w-md"
        style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
          <h3 className="font-semibold text-base" style={{ color: "var(--hr-text)" }}>Ajouter un document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!defaultEmployeeId && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Employé</label>
              <select
                value={form.employeeId}
                onChange={(e) => set("employeeId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
              >
                {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Titre</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Contrat de travail CDI..."
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Type</label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: form.type === t ? (TYPE_COLORS[t]?.bg ?? "rgba(99,102,241,0.15)") : "var(--hr-input)",
                    color: form.type === t ? (TYPE_COLORS[t]?.text ?? "#6366F1") : "var(--hr-text-secondary)",
                    border: `1px solid ${form.type === t ? (TYPE_COLORS[t]?.text ?? "#6366F1") + "30" : "var(--hr-card-border)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>URL du fichier (optionnel)</label>
            <input
              type="url"
              value={form.fileUrl}
              onChange={(e) => set("fileUrl", e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Date d'expiration (optionnel)</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--hr-input)", color: "var(--hr-text-secondary)" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }}
          >
            Ajouter
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function DocumentsPage() {
  const { currentUser, employees } = useAuth();
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterEmp, setFilterEmp] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const isManager = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const scopeEmployees = isManager
    ? employees.filter((e) =>
        currentUser?.role === "Admin"
          ? e.companyId === currentUser.companyId
          : e.department === currentUser?.department
      )
    : [];

  const employeeOptions = scopeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const load = async () => {
    if (!currentUser) return;
    try {
      const params = isManager
        ? { companyId: currentUser.companyId ?? undefined }
        : { employeeId: currentUser.id };
      const data = await documentsApi.getAll(params);
      setDocs(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser?.id]);

  const handleSave = async (doc: Partial<EmployeeDocument>) => {
    try {
      await documentsApi.create(doc);
      setShowModal(false);
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await documentsApi.delete(id);
      load();
    } catch {}
  };

  const getEmployee = (id: string) => employees.find((e) => e.id === id);

  const expiringSoon = docs.filter((d) => {
    const days = daysUntilExpiry(d.expiryDate);
    return days !== null && days <= 30 && days > 0;
  });

  const expired = docs.filter((d) => {
    const days = daysUntilExpiry(d.expiryDate);
    return days !== null && days <= 0;
  });

  let filtered = docs;
  if (filterEmp !== "all") filtered = filtered.filter((d) => d.employeeId === filterEmp);
  if (filterType !== "all") filtered = filtered.filter((d) => d.type === filterType);

  const types = ["all", ...Array.from(new Set(docs.map((d) => d.type)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--hr-text)" }}>Documents RH</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hr-text-secondary)" }}>
            {filtered.length} document(s)
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white self-start"
            style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }}
          >
            <Plus size={16} />
            Ajouter un document
          </button>
        )}
      </div>

      {/* Alerts */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="space-y-2">
          {expired.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">
                {expired.length} document(s) expiré(s) — vérifiez et mettez à jour
              </p>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-400">
                {expiringSoon.length} document(s) expire(nt) dans moins de 30 jours
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {isManager && (
          <select
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
          >
            <option value="all">Tous les employés</option>
            {employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
        >
          {types.map((t) => <option key={t} value={t}>{t === "all" ? "Tous les types" : t}</option>)}
        </select>
      </div>

      {/* Documents list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileText size={40} className="text-gray-500" />
          <p className="text-sm" style={{ color: "var(--hr-text-secondary)" }}>Aucun document trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const emp = getEmployee(doc.employeeId);
            const days = daysUntilExpiry(doc.expiryDate);
            const isExpired = days !== null && days <= 0;
            const isExpiring = days !== null && days > 0 && days <= 30;
            const typeStyle = TYPE_COLORS[doc.type] ?? TYPE_COLORS["Autre"];

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: "var(--hr-card)",
                  border: `1px solid ${isExpired ? "rgba(239,68,68,0.4)" : isExpiring ? "rgba(245,158,11,0.4)" : "var(--hr-card-border)"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: typeStyle.bg }}
                    >
                      <FileText size={14} style={{ color: typeStyle.text }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--hr-text)" }}>{doc.title}</p>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: typeStyle.bg, color: typeStyle.text }}
                      >
                        {doc.type}
                      </span>
                    </div>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 flex-shrink-0"
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {isManager && emp && (
                  <div className="flex items-center gap-2">
                    {emp.avatar ? (
                      <img src={emp.avatar} className="w-5 h-5 rounded-full object-cover" alt={emp.firstName} />
                    ) : (
                      <User size={12} className="text-gray-500" />
                    )}
                    <p className="text-xs" style={{ color: "var(--hr-text-secondary)" }}>
                      {emp.firstName} {emp.lastName}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <div>
                    {doc.expiryDate ? (
                      <div className="flex items-center gap-1">
                        {(isExpired || isExpiring) && <AlertTriangle size={11} style={{ color: isExpired ? "#EF4444" : "#F59E0B" }} />}
                        <p
                          className="text-xs"
                          style={{ color: isExpired ? "#EF4444" : isExpiring ? "#F59E0B" : "var(--hr-text-secondary)" }}
                        >
                          {isExpired
                            ? `Expiré il y a ${Math.abs(days!)} j`
                            : isExpiring
                            ? `Expire dans ${days} j`
                            : `Exp. ${new Date(doc.expiryDate).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--hr-text-secondary)" }}>Pas d'expiration</p>
                    )}
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
                    >
                      <ExternalLink size={11} />
                      Ouvrir
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddDocModal
            employeeOptions={employeeOptions}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
