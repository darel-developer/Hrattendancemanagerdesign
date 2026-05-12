import React, { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Plus, Pencil, Trash2, X, Check, AlertTriangle, Users, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { departmentsApi, DepartmentItem } from "../services/api";

// ─── Modals ───────────────────────────────────────────────────────────────────

function DeptFormModal({
  title,
  initialName = "",
  onClose,
  onSubmit,
  loading,
  error,
}: {
  title: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  loading: boolean;
  error: string;
}) {
  const [name, setName] = useState(initialName);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "var(--hr-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm" style={{ fontWeight: 800, color: "var(--hr-text)" }}>{title}</h3>
          <button onClick={onClose}><X size={16} style={{ color: "var(--hr-text-muted)" }} /></button>
        </div>
        <div className="mb-4">
          <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
            Nom du département
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onSubmit(name.trim())}
            placeholder="Ex : Informatique"
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
            onBlur={(e) => (e.target.style.borderColor = "var(--hr-card-border-hard)")}
          />
        </div>
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{ background: "#FEE2E2" }}>
            <AlertTriangle size={13} style={{ color: "#DC2626" }} />
            <p className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>{error}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
            Annuler
          </button>
          <button
            onClick={() => name.trim() && onSubmit(name.trim())}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: !name.trim() || loading ? 0.6 : 1 }}>
            {loading ? "..." : "Enregistrer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({
  dept,
  onClose,
  onConfirm,
  loading,
}: {
  dept: DepartmentItem;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "var(--hr-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#FEE2E2" }}>
          <Trash2 size={20} style={{ color: "#DC2626" }} />
        </div>
        <h3 className="text-sm mb-1" style={{ fontWeight: 800, color: "var(--hr-text)" }}>
          Supprimer le département
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--hr-text-light)" }}>
          Êtes-vous sûr de vouloir supprimer <strong style={{ color: "var(--hr-text)" }}>« {dept.name} »</strong> ?
          Cette action est irréversible.
        </p>
        {dept.employeeCount > 0 && (
          <div className="mb-4 px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{ background: "#FEF3C7" }}>
            <AlertTriangle size={13} style={{ color: "#D97706" }} />
            <p className="text-xs" style={{ color: "#D97706", fontWeight: 600 }}>
              {dept.employeeCount} employé(s) sont dans ce département. Réaffectez-les d'abord.
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || dept.employeeCount > 0}
            className="flex-1 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#DC2626", fontWeight: 700, opacity: loading || dept.employeeCount > 0 ? 0.5 : 1 }}>
            {loading ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const { currentUser } = useAuth();

  if (currentUser?.role !== "Admin") return <Navigate to="/dashboard" replace />;

  const companyId = currentUser.companyId!;

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editDept, setEditDept] = useState<DepartmentItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteDept, setDeleteDept] = useState<DepartmentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const reload = async () => {
    try {
      const data = await departmentsApi.getAll(companyId);
      setDepartments(data);
    } catch {
      showToast("Impossible de charger les départements", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async (name: string) => {
    setCreateLoading(true);
    setCreateError("");
    try {
      const dept = await departmentsApi.create({ name, companyId });
      setDepartments((prev) => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      showToast(`Département « ${dept.name} » créé avec succès`);
    } catch (err: any) {
      setCreateError(err.message || "Erreur lors de la création");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (name: string) => {
    if (!editDept) return;
    setEditLoading(true);
    setEditError("");
    try {
      const updated = await departmentsApi.update(editDept.id, { name, companyId });
      setDepartments((prev) =>
        prev.map((d) => (d.id === editDept.id ? updated : d)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditDept(null);
      showToast(`Département renommé en « ${updated.name} »`);
    } catch (err: any) {
      setEditError(err.message || "Erreur lors de la modification");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    setDeleteLoading(true);
    try {
      await departmentsApi.delete(deleteDept.id, companyId);
      setDepartments((prev) => prev.filter((d) => d.id !== deleteDept.id));
      setDeleteDept(null);
      showToast(`Département supprimé`);
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression", false);
      setDeleteDept(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const deptColors = [
    "#6366F1", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B",
    "#10B981", "#3B82F6", "#EF4444", "#F97316", "#06B6D4",
  ];

  return (
    <div className="max-w-3xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl"
            style={{ background: toast.ok ? "#10B981" : "#EF4444" }}>
            {toast.ok ? <Check size={15} className="text-white" /> : <AlertTriangle size={15} className="text-white" />}
            <p className="text-white text-sm" style={{ fontWeight: 700 }}>{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <DeptFormModal
            title="Créer un département"
            onClose={() => { setShowCreate(false); setCreateError(""); }}
            onSubmit={handleCreate}
            loading={createLoading}
            error={createError}
          />
        )}
        {editDept && (
          <DeptFormModal
            title="Modifier le département"
            initialName={editDept.name}
            onClose={() => { setEditDept(null); setEditError(""); }}
            onSubmit={handleEdit}
            loading={editLoading}
            error={editError}
          />
        )}
        {deleteDept && (
          <DeleteConfirmModal
            dept={deleteDept}
            onClose={() => setDeleteDept(null)}
            onConfirm={handleDelete}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Départements</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hr-text-light)" }}>
            {departments.length} département{departments.length !== 1 ? "s" : ""} · gérez les divisions de votre entreprise
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
          <Plus size={16} />
          Nouveau département
        </button>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un département…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
        />
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--hr-hover)" }}>
              <Building2 size={28} style={{ color: "var(--hr-text-light)" }} />
            </div>
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
              {search ? "Aucun résultat" : "Aucun département"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>
              {search ? "Essayez un autre terme de recherche" : "Créez votre premier département pour commencer."}
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] px-5 py-3 text-xs"
              style={{ borderBottom: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text-light)", fontWeight: 700, letterSpacing: "0.5px" }}>
              <span>DÉPARTEMENT</span>
              <span className="text-right pr-8">EMPLOYÉS</span>
              <span>ACTIONS</span>
            </div>
            <AnimatePresence>
              {filtered.map((dept, i) => {
                const color = deptColors[i % deptColors.length];
                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 transition-all hover:bg-white/5"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--hr-card-border)" : "none" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}1A` }}>
                        <Building2 size={16} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                          {dept.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>ID : {dept.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pr-8">
                      <Users size={13} style={{ color: "var(--hr-text-light)" }} />
                      <span className="text-sm" style={{ fontWeight: 700, color: dept.employeeCount > 0 ? "var(--hr-text)" : "var(--hr-text-light)" }}>
                        {dept.employeeCount}
                      </span>
                      <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                        employé{dept.employeeCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditDept(dept); setEditError(""); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: "rgba(99,102,241,0.1)" }}
                        title="Modifier">
                        <Pencil size={14} style={{ color: "#6366F1" }} />
                      </button>
                      <button
                        onClick={() => setDeleteDept(dept)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.1)" }}
                        title="Supprimer">
                        <Trash2 size={14} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary card */}
      {departments.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 px-5 py-4 rounded-2xl flex items-center gap-4"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.1)" }}>
            <Building2 size={18} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
              {departments.length} département{departments.length !== 1 ? "s" : ""} ·{" "}
              {departments.reduce((s, d) => s + d.employeeCount, 0)} employé{departments.reduce((s, d) => s + d.employeeCount, 0) !== 1 ? "s" : ""} au total
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
              Les modifications de nom sont répercutées automatiquement sur les employés.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
