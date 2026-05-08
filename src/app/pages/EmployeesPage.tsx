import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Navigate } from "react-router";
import {
  Search, Plus, Eye, Edit2, Trash2, Phone, Mail, X, Euro, Shield,
  AlertCircle, Download
} from "lucide-react";
import { Employee, departments } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

const statusColor: Record<string, { bg: string; text: string }> = {
  "Actif": { bg: "#D1FAE5", text: "#16A34A" },
  "Inactif": { bg: "#F3F4F6", text: "#6B7280" },
  "En congé": { bg: "#EDE9FE", text: "#7C3AED" },
};

const roleColor: Record<string, { bg: string; text: string }> = {
  "Admin": { bg: "#FEF3C7", text: "#D97706" },
  "Manager": { bg: "#DBEAFE", text: "#2563EB" },
  "Employee": { bg: "#F3F4F6", text: "#374151" },
};

const contractColor: Record<string, { bg: string; text: string }> = {
  "CDI": { bg: "#D1FAE5", text: "#16A34A" },
  "CDD": { bg: "#FEF3C7", text: "#D97706" },
  "Stage": { bg: "#DBEAFE", text: "#2563EB" },
  "Freelance": { bg: "#FDE8FF", text: "#9333EA" },
};

interface AddEmployeeModalProps {
  onClose: () => void;
  onAdd: (emp: Employee & { password?: string; pin?: string }) => Promise<void>;
  allEmployees: Employee[];
}

function AddEmployeeModal({ onClose, onAdd, allEmployees }: AddEmployeeModalProps) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    department: "Ingénierie" as any,
    position: "",
    contractType: "CDI" as any,
    role: "Employee" as any,
    startDate: "",
    address: "",
    birthDate: "",
    salary: "",
    managerId: "",
    password: "",
    pin: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const managers = allEmployees.filter((e) => e.role === "Manager" || e.role === "Admin");

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.salary) {
      setError("Veuillez remplir tous les champs obligatoires (prénom, nom, email, salaire).");
      return;
    }
    const salary = parseFloat(form.salary);
    if (isNaN(salary) || salary <= 0) {
      setError("Le salaire doit être un nombre positif.");
      return;
    }
    const newEmp: Employee & { password?: string; pin?: string } = {
      id: `EMP${Date.now().toString(36).slice(-7).toUpperCase()}`,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop`,
      role: form.role,
      department: form.department,
      position: form.position,
      contractType: form.contractType,
      startDate: form.startDate || new Date().toISOString().split("T")[0],
      salary,
      status: "Actif",
      manager: form.managerId || null,
      address: form.address,
      birthDate: form.birthDate,
      leaveBalance: 25,
      leaveUsed: 0,
      password: form.password || "admin1234",
      pin: form.pin || "1234",
    };
    setLoading(true);
    try {
      await onAdd(newEmp);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'employé.");
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--hr-text)" }}>Nouvel employé</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>Remplissez les informations du collaborateur</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#FEE2E2" }}>
            <AlertCircle size={14} style={{ color: "#DC2626" }} />
            <p className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Prénom *", key: "firstName", placeholder: "Jean", col: 1 },
            { label: "Nom *", key: "lastName", placeholder: "Dupont", col: 1 },
            { label: "Email *", key: "email", placeholder: "jean.dupont@company.com", col: 2 },
            { label: "Téléphone", key: "phone", placeholder: "+33 6 xx xx xx xx", col: 1 },
            { label: "Poste", key: "position", placeholder: "Ex: Développeur Frontend", col: 1 },
          ].map((f) => (
            <div key={f.key} className={f.col === 2 ? "col-span-2" : ""}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <input
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              />
            </div>
          ))}

          {/* Salary field - prominent */}
          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Salaire mensuel brut (FCFA) *</label>
            <div className="relative">
              <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6366F1" }} />
              <input
                type="number"
                placeholder="Ex: 3500"
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid #6366F1", color: "var(--hr-text)" }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>
              Utilisé pour le calcul automatique des salaires (déductions, absences, etc.)
            </p>
          </div>

          {[
            { label: "Département", key: "department", options: ["Ingénierie", "RH", "Marketing", "Finance", "Direction", "Design"] },
            { label: "Type de contrat", key: "contractType", options: ["CDI", "CDD", "Stage", "Freelance"] },
            { label: "Rôle", key: "role", options: ["Employee", "Manager", "Admin"] },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
                {f.label}
                {f.key === "role" && <span className="ml-1 text-xs" style={{ color: "var(--hr-text-light)" }}>(le rôle détermine les accès)</span>}
              </label>
              <select
                value={(form as any)[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              >
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Date d'entrée</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Date de naissance</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Responsable direct</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
              <select
                value={form.managerId}
                onChange={(e) => set("managerId", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              >
                <option value="">— Aucun responsable —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Adresse</label>
            <input
              placeholder="123 Rue de la Paix, Paris"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Mot de passe initial</label>
            <input
              type="password"
              placeholder="admin1234 (défaut)"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>PIN pointage (4 chiffres)</label>
            <input
              type="text"
              maxLength={4}
              placeholder="1234 (défaut)"
              value={form.pin}
              onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>Utilisé pour le terminal de pointage kiosque</p>
          </div>
        </div>

        {/* Salary preview */}
        {form.salary && !isNaN(parseFloat(form.salary)) && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="text-xs" style={{ color: "var(--hr-text-muted)", fontWeight: 600 }}>Aperçu calcul mensuel</p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { label: "Brut mensuel", value: `${parseFloat(form.salary).toLocaleString("fr-FR")} FCFA` },
                { label: "Déduction/jour abs.", value: `${(parseFloat(form.salary) / 22).toFixed(0)} FCFA` },
                { label: "Net estimé (~77%)", value: `${(parseFloat(form.salary) * 0.77).toFixed(0)} FCFA` },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{item.label}</p>
                  <p className="text-sm mt-0.5" style={{ fontWeight: 700, color: "#6366F1" }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}
          >
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Création…</>
            ) : "Ajouter l'employé"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface EditEmployeeModalProps {
  emp: Employee;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Employee> & { password?: string }) => Promise<void>;
  allEmployees: Employee[];
}

function EditEmployeeModal({ emp, onClose, onSave, allEmployees }: EditEmployeeModalProps) {
  const [form, setForm] = useState({
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone || "",
    position: emp.position || "",
    department: emp.department as any,
    contractType: emp.contractType as any,
    role: emp.role as any,
    startDate: emp.startDate || "",
    birthDate: emp.birthDate || "",
    salary: emp.salary != null ? String(emp.salary) : "",
    managerId: emp.manager || "",
    address: emp.address || "",
    status: emp.status as any,
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const managers = allEmployees.filter((e) => (e.role === "Manager" || e.role === "Admin") && e.id !== emp.id);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email) {
      setError("Prénom, nom et email sont obligatoires.");
      return;
    }
    const salary = form.salary ? parseFloat(form.salary) : null;
    if (form.salary && (isNaN(salary!) || salary! <= 0)) {
      setError("Le salaire doit être un nombre positif.");
      return;
    }
    setLoading(true);
    try {
      await onSave(emp.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        position: form.position,
        department: form.department,
        contractType: form.contractType,
        role: form.role,
        startDate: form.startDate || null,
        birthDate: form.birthDate || null,
        salary,
        manager: form.managerId || null,
        address: form.address,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--hr-text)" }}>Modifier l'employé</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{emp.firstName} {emp.lastName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#FEE2E2" }}>
            <AlertCircle size={14} style={{ color: "#DC2626" }} />
            <p className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Prénom *", key: "firstName", placeholder: "Jean" },
            { label: "Nom *", key: "lastName", placeholder: "Dupont" },
            { label: "Email *", key: "email", placeholder: "jean@company.com", col2: true },
            { label: "Téléphone", key: "phone", placeholder: "+33 6 xx xx xx" },
            { label: "Poste", key: "position", placeholder: "Ex: Développeur" },
          ].map((f) => (
            <div key={f.key} className={(f as any).col2 ? "col-span-2" : ""}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <input
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Salaire mensuel (FCFA)</label>
            <div className="relative">
              <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6366F1" }} />
              <input
                type="number"
                placeholder="Ex: 3500"
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid #6366F1", color: "var(--hr-text)" }}
              />
            </div>
          </div>

          {[
            { label: "Département", key: "department", options: ["Ingénierie", "RH", "Marketing", "Finance", "Direction", "Design"] },
            { label: "Contrat", key: "contractType", options: ["CDI", "CDD", "Stage", "Freelance"] },
            { label: "Rôle", key: "role", options: ["Employee", "Manager", "Admin"] },
            { label: "Statut", key: "status", options: ["Actif", "Inactif", "En congé"] },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <select
                value={(form as any)[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              >
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Date d'entrée</label>
            <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Date de naissance</label>
            <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>

          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Responsable direct</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
              <select
                value={form.managerId}
                onChange={(e) => set("managerId", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              >
                <option value="">— Aucun responsable —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Adresse</label>
            <input placeholder="123 Rue de la Paix" value={form.address} onChange={(e) => set("address", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>

          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enregistrement…</>
            ) : "Enregistrer les modifications"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function EmployeesPage() {
  const navigate = useNavigate();
  const { currentUser, employees, addEmployee, updateEmployee, deleteEmployee } = useAuth();

  // Only admin can access this page
  if (currentUser?.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmpToEdit, setSelectedEmpToEdit] = useState<Employee | null>(null);

  const filtered = employees.filter((e) => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.position}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "Tous" || e.department === filterDept;
    const matchStatus = filterStatus === "Tous" || e.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const exportCSV = () => {
    const rows = [
      ["Prénom", "Nom", "Email", "Téléphone", "Rôle", "Département", "Poste", "Contrat", "Statut", "Date d'entrée", "Salaire (FCFA)", "Solde congés"],
      ...filtered.map((e) => [
        e.firstName, e.lastName, e.email, e.phone,
        e.role, e.department, e.position, e.contractType,
        e.status, e.startDate, String(e.salary), String(e.leaveBalance),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const depts = ["Tous", "Ingénierie", "RH", "Marketing", "Finance", "Direction", "Design"];
  const statuses = ["Tous", "Actif", "Inactif", "En congé"];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 min-w-52"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)" }}
        >
          <Search size={15} style={{ color: "var(--hr-text-light)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un employé…"
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: "var(--hr-text)" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={13} style={{ color: "var(--hr-text-light)" }} />
            </button>
          )}
        </div>

        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
        >
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
        >
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>

        <div className="flex rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--hr-card-border-hard)" }}>
          {(["table", "grid"] as const).map((v) => (
            <button key={v} onClick={() => setViewMode(v)}
              className="px-3 py-2 text-xs transition-all"
              style={{
                background: viewMode === v ? "#6366F1" : "var(--hr-card)",
                color: viewMode === v ? "white" : "var(--hr-text-muted)",
                fontWeight: viewMode === v ? 700 : 400,
              }}
            >
              {v === "table" ? "Liste" : "Grille"}
            </button>
          ))}
        </div>

        <button onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-sec)", fontWeight: 600 }}
        >
          <Download size={15} />
          CSV
        </button>

        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
        >
          <Plus size={15} />
          Nouvel employé
        </button>
      </motion.div>

      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
        {filtered.length} employé{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Table view */}
      {viewMode === "table" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--hr-table-head)", borderBottom: "1px solid var(--hr-card-border)" }}>
                  {["Employé", "Département", "Poste", "Rôle", "Contrat", "Salaire", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs"
                      style={{ color: "var(--hr-text-light)", fontWeight: 700, letterSpacing: "0.5px" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="border-b transition-colors"
                    style={{ borderColor: "var(--hr-card-border)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt={emp.firstName} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                        <div>
                          <p className="text-sm" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)" }}>
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: "var(--hr-text-sec)" }}>{emp.position}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: roleColor[emp.role]?.bg, color: roleColor[emp.role]?.text, fontWeight: 600 }}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: contractColor[emp.contractType]?.bg, color: contractColor[emp.contractType]?.text, fontWeight: 600 }}
                      >
                        {emp.contractType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ fontWeight: 700, color: "#6366F1" }}>
                        {emp.salary != null ? emp.salary.toLocaleString("fr-FR") : "—"} FCFA
                      </p>
                      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                        ~{emp.salary != null ? (emp.salary / 22).toFixed(0) : "—"} FCFA/j
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit"
                        style={{ background: statusColor[emp.status]?.bg, color: statusColor[emp.status]?.text, fontWeight: 600 }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[emp.status]?.text }} />
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/employees/${emp.id}`)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition-colors"
                          title="Voir profil"
                        >
                          <Eye size={13} style={{ color: "#6366F1" }} />
                        </button>
                        <button onClick={() => setSelectedEmpToEdit(emp)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors" title="Modifier">
                          <Edit2 size={13} style={{ color: "#F59E0B" }} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer ${emp.firstName} ${emp.lastName} ?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={13} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp, i) => (
            <motion.div key={emp.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer"
              style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
              onClick={() => navigate(`/employees/${emp.id}`)}
            >
              <div className="relative mb-3">
                <img src={emp.avatar} alt={emp.firstName} className="w-16 h-16 rounded-2xl object-cover" style={{ border: "3px solid #EDE9FE" }} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: statusColor[emp.status]?.text ?? "#ccc" }} />
              </div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
              <p className="text-xs mt-0.5 mb-1" style={{ color: "var(--hr-text-light)" }}>{emp.position}</p>
              <div className="flex gap-1 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EDE9FE", color: "#7C3AED", fontWeight: 600 }}>{emp.department}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: roleColor[emp.role]?.bg, color: roleColor[emp.role]?.text, fontWeight: 600 }}>{emp.role}</span>
              </div>
              <p className="text-sm mb-3" style={{ fontWeight: 700, color: "#6366F1" }}>{emp.salary != null ? emp.salary.toLocaleString("fr-FR") : "—"} FCFA/mois</p>
              <div className="flex gap-2 w-full">
                <a href={`mailto:${emp.email}`} className="flex-1 py-1.5 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-badge-bg)" }} onClick={(e) => e.stopPropagation()}>
                  <Mail size={12} style={{ color: "#6366F1" }} />
                </a>
                <a href={`tel:${emp.phone}`} className="flex-1 py-1.5 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-badge-bg)" }} onClick={(e) => e.stopPropagation()}>
                  <Phone size={12} style={{ color: "#6366F1" }} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddEmployeeModal
            onClose={() => setShowAddModal(false)}
            onAdd={addEmployee}
            allEmployees={employees}
          />
        )}
        {selectedEmpToEdit && (
          <EditEmployeeModal
            emp={selectedEmpToEdit}
            onClose={() => setSelectedEmpToEdit(null)}
            onSave={updateEmployee}
            allEmployees={employees}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
