import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Building2, Users, Plus, Trash2, Edit2, X, Eye, EyeOff,
  Lock, LogOut, AlertCircle, Mail, Ban, CheckCircle2, AlertTriangle
} from "lucide-react";
import { superAdminApi, companiesApi, employeesApi, setAuthToken } from "../services/api";
import { Company, Employee } from "../data/mockData";

const SESSION_KEY = "hr_superadmin"; // stores the password for use in API calls

type CompanyWithCounts = Company & { employeeCount?: number; adminCount?: number };

// ─── Login screen ─────────────────────────────────────────────
function SuperAdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await superAdminApi.verify(password);
      sessionStorage.setItem(SESSION_KEY, token);
      setAuthToken(token);
      onLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("401")) {
        setError("Mot de passe incorrect");
      } else {
        setError("Impossible de joindre le serveur. Vérifiez que le backend tourne sur le port 3002.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #EC4899, transparent)" }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6366F1, #EC4899)" }}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-white text-2xl" style={{ fontWeight: 900, letterSpacing: "-0.5px" }}>
            Super Administration
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#94A3B8" }}>
            Accès réservé à l'administrateur de la plateforme
          </p>
        </div>

        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs mb-2 block" style={{ color: "#94A3B8", fontWeight: 600, letterSpacing: "0.5px" }}>
                MOT DE PASSE ADMINISTRATEUR
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6366F1" }} />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoFocus
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)" }}
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.2)" }}>
                <AlertCircle size={13} style={{ color: "#FCA5A5" }} />
                <p className="text-xs" style={{ color: "#FCA5A5", fontWeight: 600 }}>{error}</p>
              </div>
            )}

            <motion.button type="submit" disabled={loading || !password}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2"
              style={{
                background: password ? "linear-gradient(135deg, #6366F1, #EC4899)" : "rgba(255,255,255,0.1)",
                fontWeight: 700, opacity: !password ? 0.5 : 1,
              }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Shield size={16} /> Accéder au panneau</>}
            </motion.button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "#475569" }}>
          Cet espace n'est pas accessible depuis le site principal.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Company form modal ───────────────────────────────────────
function CompanyModal({
  company, onClose, onSave,
}: {
  company: CompanyWithCounts | null;
  onClose: () => void;
  onSave: (data: Partial<Company> & { id?: string }) => Promise<void>;
}) {
  const isEdit = !!company;
  const [form, setForm] = useState({
    id: company?.id ?? `COMP${Date.now().toString().slice(-6)}`,
    name: company?.name ?? "",
    sector: company?.sector ?? "",
    address: company?.address ?? "",
    hrEmail: company?.hrEmail ?? "",
    workStart: company?.workStart ?? "09:00",
    lateTolerance: company?.lateTolerance ?? 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Le nom est requis"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err: any) { setError(err.message || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-3xl p-7"
        style={{ background: "#1E1B4B", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg" style={{ fontWeight: 800 }}>
            {isEdit ? "Modifier l'entreprise" : "Nouvelle entreprise"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* ── Infos entreprise ── */}
        <div className="space-y-4">
          {!isEdit && (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#94A3B8", fontWeight: 600 }}>ID Entreprise *</label>
              <input value={form.id} onChange={(e) => set("id", e.target.value)}
                placeholder="Ex: COMP003"
                className="w-full px-4 py-3 rounded-2xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              <p className="text-xs mt-1" style={{ color: "#475569" }}>Identifiant unique (ex: COMP003)</p>
            </div>
          )}
          {[
            { label: "Nom de l'entreprise *", key: "name", placeholder: "TechCorp Solutions" },
            { label: "Secteur d'activité", key: "sector", placeholder: "Technologie, Finance…" },
            { label: "Adresse du siège", key: "address", placeholder: "123 Rue principale, Ville" },
            { label: "Email RH", key: "hrEmail", placeholder: "rh@entreprise.com" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs mb-1.5 block" style={{ color: "#94A4B8", fontWeight: 600 }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 rounded-2xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#94A3B8", fontWeight: 600 }}>Début journée</label>
              <input type="time" value={form.workStart} onChange={(e) => set("workStart", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#94A3B8", fontWeight: 600 }}>Tolérance (min)</label>
              <input type="number" value={form.lateTolerance} onChange={(e) => set("lateTolerance", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.2)" }}>
            <AlertCircle size={13} style={{ color: "#FCA5A5" }} />
            <p className="text-xs" style={{ color: "#FCA5A5" }}>{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm"
            style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-white text-sm"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "…" : isEdit ? "Enregistrer" : "Créer l'entreprise"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Admin manager modal ──────────────────────────────────────
function AdminModal({ company, onClose }: { company: CompanyWithCounts; onClose: () => void }) {
  const [admins, setAdmins] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", pin: "1234" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAdmins = () => {
    setLoading(true);
    superAdminApi.getAdmins(company.id)
      .then(setAdmins)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAdmins(); }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setError("Prénom, nom et email requis"); return; }
    if (!form.password) { setError("Le mot de passe est obligatoire"); return; }
    setSaving(true);
    setError("");
    try {
      const newId = `EMP${Date.now().toString().slice(-6)}`;
      await superAdminApi.saCreateEmployee({
        id: newId,
        companyId: company.id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop`,
        role: "Admin",
        department: "Direction",
        position: "Administrateur",
        contractType: "CDI",
        startDate: new Date().toISOString().split("T")[0],
        salary: 0,
        status: "Actif",
        manager: null,
        address: "",
        birthDate: "",
        leaveBalance: 25,
        leaveUsed: 0,
        password: form.password,
        pin: form.pin,
      });
      setShowForm(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "", pin: "1234" });
      loadAdmins();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cet administrateur ?")) return;
    await superAdminApi.saDeleteEmployee(id);
    setAdmins((p) => p.filter((a) => a.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg rounded-3xl p-7"
        style={{ background: "#1E1B4B", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-lg" style={{ fontWeight: 800 }}>Administrateurs</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8B7CF8" }}>{company.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Admins list */}
        <div className="space-y-2 mb-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: "#475569" }}>Aucun administrateur pour cette entreprise</p>
          ) : admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <img src={admin.avatar} alt={admin.firstName} className="w-9 h-9 rounded-xl object-cover" />
                <div>
                  <p className="text-sm text-white" style={{ fontWeight: 600 }}>
                    {admin.firstName} {admin.lastName}
                  </p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.2)", color: "#A5B4FC", fontWeight: 600 }}>
                  Admin
                </span>
                <button onClick={() => handleDelete(admin.id)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.15)" }}>
                  <Trash2 size={13} style={{ color: "#FCA5A5" }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add admin form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4">
              <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p className="text-xs text-white" style={{ fontWeight: 700 }}>Nouvel administrateur</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Prénom *", key: "firstName", placeholder: "Jean" },
                    { label: "Nom *", key: "lastName", placeholder: "Dupont" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs mb-1 block" style={{ color: "#94A3B8" }}>{f.label}</label>
                      <input value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  ))}
                </div>
                {[
                  { label: "Email *", key: "email", placeholder: "admin@entreprise.com" },
                  { label: "Téléphone", key: "phone", placeholder: "+225 07 xx xx xx xx" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs mb-1 block" style={{ color: "#94A3B8" }}>{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "#A5B4FC", fontWeight: 700 }}>
                    Mot de passe de connexion *
                  </label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Ex : MonMotDePasse2024"
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1.5px solid rgba(99,102,241,0.4)" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    L'administrateur utilisera ce mot de passe pour se connecter à l'application.
                  </p>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "#94A3B8" }}>PIN kiosque (4 chiffres)</label>
                  <input value={form.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
                    maxLength={4} placeholder="1234"
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                {error && <p className="text-xs" style={{ color: "#FCA5A5" }}>{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-xl text-xs" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8" }}>
                    Annuler
                  </button>
                  <button onClick={handleCreate} disabled={saving}
                    className="flex-1 py-2 rounded-xl text-white text-xs"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
                    {saving ? "…" : "Créer l'admin"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
            style={{ border: "1.5px dashed rgba(99,102,241,0.4)", color: "#A5B4FC", fontWeight: 600 }}>
            <Plus size={15} /> Ajouter un administrateur
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────
function SuperAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [companies, setCompanies] = useState<CompanyWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyModal, setShowCompanyModal] = useState<CompanyWithCounts | null | "new">(null);
  const [showAdminModal, setShowAdminModal] = useState<CompanyWithCounts | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [blockConfirm, setBlockConfirm] = useState<{ id: string; name: string; action: "block" | "unblock" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadCompanies = () => {
    setLoading(true);
    companiesApi.getAll().then(setCompanies).finally(() => setLoading(false));
  };

  useEffect(() => { loadCompanies(); }, []);

  const handleSaveCompany = async (data: any) => {
    const existing = companies.find((c) => c.id === data.id);
    if (existing) {
      await companiesApi.update(data.id, data);
    } else {
      await superAdminApi.createCompany(data);
    }
    loadCompanies();
  };

  const handleDeleteCompany = async (id: string) => {
    setActionLoading(id);
    try {
      await superAdminApi.deleteCompany(id);
      setDeleteConfirm(null);
      loadCompanies();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockToggle = async () => {
    if (!blockConfirm) return;
    setActionLoading(blockConfirm.id);
    try {
      if (blockConfirm.action === "block") {
        await superAdminApi.blockCompany(blockConfirm.id);
      } else {
        await superAdminApi.unblockCompany(blockConfirm.id);
      }
      setBlockConfirm(null);
      loadCompanies();
    } finally {
      setActionLoading(null);
    }
  };

  const totalEmployees = companies.reduce((s, c) => s + (c.employeeCount ?? 0), 0);
  const totalAdmins = companies.reduce((s, c) => s + (c.adminCount ?? 0), 0);

  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #0B1437 0%, #1E1B4B 40%, #0F172A 100%)" }}>

      {/* Modals */}
      <AnimatePresence>
        {showCompanyModal && (
          <CompanyModal
            company={showCompanyModal === "new" ? null : showCompanyModal as CompanyWithCounts}
            onClose={() => setShowCompanyModal(null)}
            onSave={handleSaveCompany}
          />
        )}
        {showAdminModal && (
          <AdminModal company={showAdminModal} onClose={() => { setShowAdminModal(null); loadCompanies(); }} />
        )}
      </AnimatePresence>

      {/* Block / Unblock confirm */}
      <AnimatePresence>
        {blockConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="rounded-3xl p-8 max-w-sm w-full text-center"
              style={{ background: "#1E1B4B", border: "1px solid rgba(255,255,255,0.12)" }}>
              {blockConfirm.action === "block" ? (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(239,68,68,0.2)" }}>
                    <Ban size={24} style={{ color: "#FCA5A5" }} />
                  </div>
                  <h3 className="text-white text-lg mb-2" style={{ fontWeight: 800 }}>Bloquer l'accès ?</h3>
                  <p className="text-sm mb-2" style={{ color: "#94A3B8" }}>
                    L'accès de <strong className="text-white">{blockConfirm.name}</strong> sera immédiatement suspendu.
                  </p>
                  <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>
                    Un email sera envoyé aux administrateurs pour les informer de la suspension.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setBlockConfirm(null)}
                      className="flex-1 py-3 rounded-2xl text-sm"
                      style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", fontWeight: 600 }}>
                      Annuler
                    </button>
                    <button onClick={handleBlockToggle} disabled={!!actionLoading}
                      className="flex-1 py-3 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
                      style={{ background: "#EF4444", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                      {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Ban size={14} /> Bloquer</>}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(16,185,129,0.2)" }}>
                    <CheckCircle2 size={24} style={{ color: "#6EE7B7" }} />
                  </div>
                  <h3 className="text-white text-lg mb-2" style={{ fontWeight: 800 }}>Rétablir l'accès ?</h3>
                  <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>
                    L'entreprise <strong className="text-white">{blockConfirm.name}</strong> retrouvera un accès complet à la plateforme.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setBlockConfirm(null)}
                      className="flex-1 py-3 rounded-2xl text-sm"
                      style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", fontWeight: 600 }}>
                      Annuler
                    </button>
                    <button onClick={handleBlockToggle} disabled={!!actionLoading}
                      className="flex-1 py-3 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
                      style={{ background: "#10B981", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                      {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 size={14} /> Débloquer</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="rounded-3xl p-8 max-w-sm w-full text-center"
              style={{ background: "#1E1B4B", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={24} style={{ color: "#FCA5A5" }} />
              </div>
              <h3 className="text-white text-lg mb-2" style={{ fontWeight: 800 }}>Supprimer définitivement ?</h3>
              <p className="text-sm mb-2" style={{ color: "#94A3B8" }}>
                Cette action est <strong className="text-red-400">irréversible</strong>.
              </p>
              <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>
                Tous les employés, pointages, congés et données associées seront effacés pour toujours.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-2xl text-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94A3B8", fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={() => handleDeleteCompany(deleteConfirm!)} disabled={!!actionLoading}
                  className="flex-1 py-3 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: "#EF4444", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2 size={14} /> Supprimer</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #EC4899)" }}>
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white text-base" style={{ fontWeight: 800 }}>Super Administration</p>
              <p className="text-xs" style={{ color: "#6366F1" }}>HR Manager · Panneau de contrôle</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Entreprises", value: companies.length, icon: Building2, color: "#6366F1", bg: "rgba(99,102,241,0.15)" },
            { label: "Administrateurs", value: totalAdmins, icon: Shield, color: "#EC4899", bg: "rgba(236,72,153,0.15)" },
            { label: "Employés total", value: totalEmployees, icon: Users, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.bg }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-3xl text-white" style={{ fontWeight: 900 }}>{loading ? "—" : s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Companies section */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-xl" style={{ fontWeight: 800 }}>Entreprises</h2>
          <button onClick={() => setShowCompanyModal("new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
            <Plus size={15} /> Nouvelle entreprise
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <Building2 size={40} style={{ color: "#475569" }} className="mx-auto mb-3" />
            <p style={{ color: "#475569" }}>Aucune entreprise. Créez la première.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {companies.map((company, i) => (
              <motion.div key={company.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-3xl p-6"
                style={{
                  background: company.isBlocked ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                  border: company.isBlocked ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                <div className="flex items-center gap-5">
                  {/* Company icon */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: company.isBlocked
                        ? "rgba(239,68,68,0.2)"
                        : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                      border: company.isBlocked ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(99,102,241,0.3)",
                    }}>
                    {company.isBlocked
                      ? <Ban size={22} style={{ color: "#FCA5A5" }} />
                      : <Building2 size={22} style={{ color: "#A5B4FC" }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-base" style={{ fontWeight: 800 }}>{company.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.2)", color: "#A5B4FC" }}>
                        {company.id}
                      </span>
                      {company.isBlocked && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: "rgba(239,68,68,0.2)", color: "#FCA5A5", fontWeight: 700 }}>
                          <Ban size={10} /> BLOQUÉ
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {company.sector} {company.address ? `· ${company.address}` : ""}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs" style={{ color: "#6366F1" }}>
                        <strong>{company.employeeCount ?? 0}</strong> employé{(company.employeeCount ?? 0) > 1 ? "s" : ""}
                      </span>
                      <span className="text-xs" style={{ color: "#EC4899" }}>
                        <strong>{company.adminCount ?? 0}</strong> admin{(company.adminCount ?? 0) > 1 ? "s" : ""}
                      </span>
                      {company.hrEmail && (
                        <span className="text-xs flex items-center gap-1" style={{ color: "#64748B" }}>
                          <Mail size={10} /> {company.hrEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button onClick={() => setShowAdminModal(company)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                      style={{ background: "rgba(236,72,153,0.15)", color: "#F9A8D4", fontWeight: 600, border: "1px solid rgba(236,72,153,0.2)" }}>
                      <Users size={13} /> Admins
                    </button>
                    <button onClick={() => setShowCompanyModal(company)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                      style={{ background: "rgba(99,102,241,0.15)", color: "#A5B4FC", fontWeight: 600, border: "1px solid rgba(99,102,241,0.2)" }}>
                      <Edit2 size={13} /> Modifier
                    </button>
                    {company.isBlocked ? (
                      <button
                        onClick={() => setBlockConfirm({ id: company.id, name: company.name, action: "unblock" })}
                        disabled={actionLoading === company.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#6EE7B7", fontWeight: 600, border: "1px solid rgba(16,185,129,0.2)" }}>
                        <CheckCircle2 size={13} /> Débloquer
                      </button>
                    ) : (
                      <button
                        onClick={() => setBlockConfirm({ id: company.id, name: company.name, action: "block" })}
                        disabled={actionLoading === company.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", fontWeight: 600, border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Ban size={13} /> Bloquer
                      </button>
                    )}
                    <button onClick={() => setDeleteConfirm(company.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <Trash2 size={14} style={{ color: "#FCA5A5" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="pb-8 text-center">
        <p className="text-xs" style={{ color: "#1E293B" }}>HR Manager Super Admin · Accès restreint</p>
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────
export function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (token) setAuthToken(token); // restaure le JWT pour les appels API
    return !!token;
  });

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setAuthenticated(false);
  };

  if (!authenticated) return <SuperAdminLogin onLogin={() => setAuthenticated(true)} />;
  return <SuperAdminDashboard onLogout={handleLogout} />;
}
