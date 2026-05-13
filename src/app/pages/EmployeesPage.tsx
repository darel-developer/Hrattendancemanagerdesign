import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Navigate } from "react-router";
import {
  Search, Plus, Eye, Edit2, Trash2, Phone, Mail, X, Euro, Shield,
  AlertCircle, Download, Building2, Upload, FileText, CheckCircle2,
  RefreshCw, AlertTriangle, Minus
} from "lucide-react";
import * as XLSX from "xlsx";
import { Employee } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { departmentsApi } from "../services/api";

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

// ─── Modale création département ─────────────────────────────────────────────
function CreateDeptModal({ onConfirm, onClose }: { onConfirm: (name: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Veuillez saisir un nom."); return; }
    setLoading(true);
    try { await onConfirm(trimmed); }
    catch (e: any) { setError(e.message || "Erreur"); setLoading(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--hr-card)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Building2 size={18} color="white" />
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: "1rem", color: "var(--hr-text)" }}>Nouveau département</h3>
            <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Disponible pour votre entreprise uniquement</p>
          </div>
          <button onClick={onClose} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={14} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>
        {error && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "#FEE2E2", color: "#DC2626" }}>{error}</p>}
        <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Nom du département *</label>
        <input autoFocus placeholder="Ex : Commercial, Logistique…" value={name}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-5"
          style={{ background: "var(--hr-input-bg)", border: "1.5px solid #6366F1", color: "var(--hr-text)" }} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>Annuler</button>
          <button onClick={handleAdd} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Ajout…</> : <><Plus size={14} />Ajouter</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Champ département réutilisable ───────────────────────────────────────────
function DeptSelect({ value, onChange, departments, onCreateDept }: {
  value: string; onChange: (v: string) => void;
  departments: string[]; onCreateDept: (name: string) => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div className="flex gap-2">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
          {departments.length === 0 && <option value="">— Aucun département —</option>}
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button type="button" onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 hover:opacity-80 transition-all"
          style={{ background: "rgba(99,102,241,0.1)", border: "1.5px solid #6366F1", color: "#6366F1", fontWeight: 600, whiteSpace: "nowrap" }}>
          <Plus size={14} />Créer
        </button>
      </div>
      <AnimatePresence>
        {showModal && (
          <CreateDeptModal
            onConfirm={async (name) => { await onCreateDept(name); onChange(name); setShowModal(false); }}
            onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Modale import fichier ────────────────────────────────────────────────────
interface ParsedImportRow {
  firstName: string; lastName: string; email: string;
  phone: string; department: string; position: string;
  contractType: string; role: string; status: string;
  salary: number | null; address: string; startDate: string;
  birthDate: string; password: string; pin: string;
  action: "create" | "update" | "skip" | "error";
  existingId?: string;
  changes?: string[];
  errorMsg?: string;
}

function parseRawToRow(raw: Record<string, string>): Omit<ParsedImportRow, "action" | "existingId" | "changes" | "errorMsg"> {
  const g = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k] ?? raw[k.normalize("NFD").replace(/[̀-ͯ]/g, "")] ?? "";
      if (v.trim()) return v.trim();
    }
    return "";
  };
  const salaryRaw = g("salaire", "salary", "remuneration", "rémunération");
  const salary = salaryRaw ? parseFloat(salaryRaw.replace(/\s/g, "").replace(",", ".")) : null;
  return {
    firstName: g("prénom", "prenom", "firstname", "first_name", "first name"),
    lastName: g("nom", "lastname", "last_name", "nom de famille"),
    email: g("email", "e-mail", "mail", "courriel"),
    phone: g("téléphone", "telephone", "tel", "phone", "mobile"),
    department: g("département", "departement", "department", "dept"),
    position: g("poste", "position", "fonction", "job", "titre"),
    contractType: g("contrat", "contract", "type contrat", "type de contrat") || "CDI",
    role: g("rôle", "role") || "Employee",
    status: g("statut", "status", "état", "etat") || "Actif",
    salary: isNaN(salary as number) ? null : salary,
    address: g("adresse", "address"),
    startDate: g("date entrée", "date entree", "start_date", "date_entree", "startdate"),
    birthDate: g("date naissance", "date_naissance", "birth_date", "birthdate"),
    password: g("mot de passe", "password", "mdp"),
    pin: g("pin", "code pin"),
  };
}

function buildImportRows(rawRows: Record<string, string>[], existingEmployees: Employee[]): ParsedImportRow[] {
  return rawRows.map((raw) => {
    const r = parseRawToRow(raw);
    if (!r.firstName || !r.lastName || !r.email) {
      return { ...r, action: "error", errorMsg: "Prénom, nom ou email manquant" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
      return { ...r, action: "error", errorMsg: "Email invalide" };
    }
    const existing = existingEmployees.find((e) => e.email.toLowerCase() === r.email.toLowerCase());
    if (!existing) return { ...r, action: "create" };
    const changes: string[] = [];
    const checks: [keyof Employee, string, string | number | null][] = [
      ["firstName", "Prénom", r.firstName], ["lastName", "Nom", r.lastName],
      ["phone", "Téléphone", r.phone], ["department", "Département", r.department],
      ["position", "Poste", r.position], ["contractType", "Contrat", r.contractType],
      ["role", "Rôle", r.role], ["status", "Statut", r.status],
      ["salary", "Salaire", r.salary],
    ];
    for (const [field, label, newVal] of checks) {
      if (newVal !== null && newVal !== "" && String(newVal) !== String(existing[field] ?? "")) {
        changes.push(label);
      }
    }
    if (changes.length === 0) return { ...r, action: "skip", existingId: existing.id };
    return { ...r, action: "update", existingId: existing.id, changes };
  });
}

async function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
        if (arr.length < 2) { reject(new Error("Fichier vide ou sans données.")); return; }
        const headers = (arr[0] as string[]).map((h) => String(h).toLowerCase().trim());
        const rows = (arr.slice(1) as string[][])
          .filter((row) => row.some((c) => String(c).trim()))
          .map((row) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = String(row[i] ?? ""); });
            return obj;
          });
        resolve(rows);
      } catch (err: any) { reject(new Error("Impossible de lire le fichier : " + err.message)); }
    };
    reader.onerror = () => reject(new Error("Erreur lecture fichier"));
    reader.readAsBinaryString(file);
  });
}

interface ImportModalProps {
  onClose: () => void;
  employees: Employee[];
  departments: string[];
  companyId: string;
  onCreateDept: (name: string) => Promise<void>;
  onImportDone: () => void;
  addEmployee: (emp: Employee & { password?: string; pin?: string }) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee> & { password?: string }) => Promise<void>;
}

function ImportEmployeesModal({
  onClose, employees, departments, companyId,
  onCreateDept, onImportDone, addEmployee, updateEmployee,
}: ImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ created: 0, updated: 0, skipped: 0, errors: 0 });
  const [parseError, setParseError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setParseError("");
    try {
      const raw = await parseFile(file);
      const parsed = buildImportRows(raw, employees);
      setRows(parsed);
      setStep("preview");
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const downloadTemplate = () => {
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "Département", "Poste", "Contrat", "Rôle", "Statut", "Salaire", "Mot de passe", "PIN", "Date entrée", "Adresse"];
    const example = ["Jean", "Dupont", "jean.dupont@company.com", "+237600000000", "Commercial", "Vendeur", "CDI", "Employee", "Actif", "50000", "motdepasse", "1234", "2024-01-15", "Yaoundé"];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employés");
    XLSX.writeFile(wb, "modele_import_employes.xlsx");
  };

  const runImport = async () => {
    setStep("importing");
    const toProcess = rows.filter((r) => r.action !== "skip");
    let created = 0, updated = 0, skipped = rows.filter((r) => r.action === "skip").length, errors = 0;

    // Create missing departments first
    const allDepts = [...new Set(rows.map((r) => r.department).filter(Boolean))];
    for (const d of allDepts) {
      if (!departments.includes(d)) {
        try { await onCreateDept(d); } catch { /* already exists */ }
      }
    }

    for (let i = 0; i < toProcess.length; i++) {
      setProgress(Math.round(((i + 1) / toProcess.length) * 100));
      const r = toProcess[i];
      try {
        if (r.action === "create") {
          await addEmployee({
            id: `EMP${Date.now().toString(36).slice(-7).toUpperCase()}`,
            firstName: r.firstName, lastName: r.lastName, email: r.email,
            phone: r.phone, department: r.department, position: r.position,
            contractType: (r.contractType || "CDI") as any,
            role: (r.role || "Employee") as any,
            status: (r.status || "Actif") as any,
            salary: r.salary ?? 0,
            address: r.address, startDate: r.startDate || new Date().toISOString().split("T")[0],
            birthDate: r.birthDate, leaveBalance: 25, leaveUsed: 0,
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
            manager: null,
            password: r.password || "admin1234",
            pin: r.pin || "1234",
            companyId,
          } as any);
          created++;
        } else if (r.action === "update" && r.existingId) {
          const updates: Partial<Employee> & { password?: string } = {};
          if (r.changes?.includes("Prénom")) updates.firstName = r.firstName;
          if (r.changes?.includes("Nom")) updates.lastName = r.lastName;
          if (r.changes?.includes("Téléphone")) updates.phone = r.phone;
          if (r.changes?.includes("Département")) updates.department = r.department;
          if (r.changes?.includes("Poste")) updates.position = r.position;
          if (r.changes?.includes("Contrat")) updates.contractType = r.contractType as any;
          if (r.changes?.includes("Rôle")) updates.role = r.role as any;
          if (r.changes?.includes("Statut")) updates.status = r.status as any;
          if (r.changes?.includes("Salaire")) updates.salary = r.salary ?? undefined;
          if (r.password) updates.password = r.password;
          await updateEmployee(r.existingId, updates);
          updated++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }
    setResults({ created, updated, skipped, errors });
    setStep("done");
    onImportDone();
  };

  const counts = {
    create: rows.filter((r) => r.action === "create").length,
    update: rows.filter((r) => r.action === "update").length,
    skip: rows.filter((r) => r.action === "skip").length,
    error: rows.filter((r) => r.action === "error").length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="w-full rounded-2xl"
        style={{ background: "var(--hr-card)", maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--hr-card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              <Upload size={18} color="white" />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--hr-text)" }}>Importer des employés</h2>
              <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                {step === "upload" && "Fichier Excel (.xlsx) ou CSV/TXT accepté"}
                {step === "preview" && `${rows.length} ligne(s) analysée(s)`}
                {step === "importing" && "Import en cours…"}
                {step === "done" && "Import terminé"}
              </p>
            </div>
          </div>
          {step !== "importing" && (
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
              <X size={16} style={{ color: "var(--hr-text-muted)" }} />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* STEP 1 — Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${dragging ? "#6366F1" : "var(--hr-card-border-hard)"}`,
                  padding: "2.5rem 1.5rem",
                  background: dragging ? "rgba(99,102,241,0.05)" : "var(--hr-input-bg)",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.1)" }}>
                  <FileText size={26} style={{ color: "#6366F1" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Glisser-déposer votre fichier ici</p>
                  <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>ou cliquer pour sélectionner — .xlsx, .xls, .csv, .txt</p>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {parseError && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEE2E2" }}>
                  <AlertCircle size={14} style={{ color: "#DC2626" }} />
                  <p className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>{parseError}</p>
                </div>
              )}

              <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p className="text-xs mb-2" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Colonnes attendues (dans n'importe quel ordre) :</p>
                <div className="flex flex-wrap gap-1.5">
                  {[["Prénom*", true], ["Nom*", true], ["Email*", true], ["Téléphone", false], ["Département", false],
                    ["Poste", false], ["Contrat", false], ["Rôle", false], ["Statut", false], ["Salaire", false],
                    ["Mot de passe", false], ["PIN", false], ["Date entrée", false], ["Adresse", false]
                  ].map(([label, req]) => (
                    <span key={label as string} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: req ? "rgba(99,102,241,0.15)" : "var(--hr-badge-bg)", color: req ? "#6366F1" : "var(--hr-badge-text)", fontWeight: req ? 700 : 400 }}>
                      {label as string}
                    </span>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--hr-text-light)" }}>
                  * Obligatoires · Les colonnes sont détectées automatiquement (accents inclus) · Si un email existe déjà, les champs modifiés seront mis à jour
                </p>
              </div>

              <button onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full justify-center"
                style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-sec)", fontWeight: 600 }}>
                <Download size={15} /> Télécharger le modèle Excel
              </button>
            </div>
          )}

          {/* STEP 2 — Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Résumé */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "À créer", count: counts.create, bg: "#D1FAE5", color: "#16A34A", icon: <Plus size={14} /> },
                  { label: "À mettre à jour", count: counts.update, bg: "#FEF3C7", color: "#D97706", icon: <RefreshCw size={14} /> },
                  { label: "Identiques", count: counts.skip, bg: "var(--hr-badge-bg)", color: "var(--hr-badge-text)", icon: <Minus size={14} /> },
                  { label: "Erreurs", count: counts.error, bg: "#FEE2E2", color: "#DC2626", icon: <AlertTriangle size={14} /> },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 flex items-center gap-2" style={{ background: s.bg }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <div>
                      <p className="text-lg leading-none" style={{ fontWeight: 800, color: s.color }}>{s.count}</p>
                      <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.85 }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table aperçu */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hr-card-border)", maxHeight: 320, overflowY: "auto" }}>
                <table className="w-full text-xs">
                  <thead style={{ background: "var(--hr-table-head)", position: "sticky", top: 0 }}>
                    <tr>
                      {["Action", "Prénom Nom", "Email", "Département", "Poste", "Détails"].map((h) => (
                        <th key={h} className="text-left px-3 py-2.5" style={{ color: "var(--hr-text-light)", fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const actionStyle = {
                        create: { bg: "#D1FAE5", color: "#16A34A", label: "NOUVEAU" },
                        update: { bg: "#FEF3C7", color: "#D97706", label: "MODIFIER" },
                        skip: { bg: "var(--hr-badge-bg)", color: "var(--hr-text-muted)", label: "IDENTIQUE" },
                        error: { bg: "#FEE2E2", color: "#DC2626", label: "ERREUR" },
                      }[r.action];
                      return (
                        <tr key={i} className="border-b" style={{ borderColor: "var(--hr-card-border)" }}>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: actionStyle.bg, color: actionStyle.color, fontWeight: 700 }}>
                              {actionStyle.label}
                            </span>
                          </td>
                          <td className="px-3 py-2" style={{ color: "var(--hr-text)", fontWeight: 600 }}>{r.firstName} {r.lastName}</td>
                          <td className="px-3 py-2" style={{ color: "var(--hr-text-light)" }}>{r.email}</td>
                          <td className="px-3 py-2" style={{ color: "var(--hr-text-sec)" }}>{r.department || "—"}</td>
                          <td className="px-3 py-2" style={{ color: "var(--hr-text-sec)" }}>{r.position || "—"}</td>
                          <td className="px-3 py-2" style={{ color: r.action === "error" ? "#DC2626" : "var(--hr-text-light)" }}>
                            {r.action === "error" && r.errorMsg}
                            {r.action === "update" && r.changes?.join(", ")}
                            {r.action === "skip" && "Aucune modification"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("upload")} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
                  Changer de fichier
                </button>
                <button onClick={runImport} disabled={counts.create + counts.update === 0}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: counts.create + counts.update === 0 ? 0.5 : 1 }}>
                  <Upload size={15} />
                  Importer ({counts.create + counts.update} employé{counts.create + counts.update > 1 ? "s" : ""})
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Importing */}
          {step === "importing" && (
            <div className="py-10 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.1)" }}>
                <div className="w-8 h-8 border-4 border-t-indigo-500 rounded-full animate-spin" style={{ borderColor: "rgba(99,102,241,0.2)", borderTopColor: "#6366F1" }} />
              </div>
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Import en cours…</p>
                <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>{progress}% traité</p>
              </div>
              <div className="w-full max-w-xs rounded-full overflow-hidden" style={{ height: 6, background: "var(--hr-badge-bg)" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }} />
              </div>
            </div>
          )}

          {/* STEP 4 — Done */}
          {step === "done" && (
            <div className="py-8 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#D1FAE5" }}>
                <CheckCircle2 size={32} style={{ color: "#16A34A" }} />
              </div>
              <div className="text-center">
                <p className="text-base" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Import terminé</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                {[
                  { label: "Créés", value: results.created, color: "#16A34A", bg: "#D1FAE5" },
                  { label: "Mis à jour", value: results.updated, color: "#D97706", bg: "#FEF3C7" },
                  { label: "Identiques (ignorés)", value: results.skipped, color: "var(--hr-text-muted)", bg: "var(--hr-badge-bg)" },
                  { label: "Erreurs", value: results.errors, color: "#DC2626", bg: "#FEE2E2" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <p className="text-2xl" style={{ fontWeight: 800, color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.85 }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={onClose}
                className="px-8 py-2.5 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modale ajout employé ─────────────────────────────────────────────────────
interface AddEmployeeModalProps {
  onClose: () => void;
  onAdd: (emp: Employee & { password?: string; pin?: string }) => Promise<void>;
  allEmployees: Employee[];
  departments: string[];
  onCreateDept: (name: string) => Promise<void>;
  onSwitchToImport: () => void;
}

function AddEmployeeModal({ onClose, onAdd, allEmployees, departments, onCreateDept, onSwitchToImport }: AddEmployeeModalProps) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    department: "" as string,
    position: "", contractType: "CDI" as any, role: "Employee" as any,
    startDate: "", address: "", birthDate: "", salary: "", managerId: "", password: "", pin: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync department when list loads
  useEffect(() => {
    if (departments.length > 0 && !form.department) {
      setForm((p) => ({ ...p, department: departments[0] }));
    }
  }, [departments]);

  const managers = allEmployees.filter((e) => e.role === "Manager" || e.role === "Admin");
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.salary) {
      setError("Prénom, nom, email et salaire sont obligatoires."); return;
    }
    if (!form.department) {
      setError("Veuillez sélectionner ou créer un département."); return;
    }
    const salary = parseFloat(form.salary);
    if (isNaN(salary) || salary <= 0) { setError("Le salaire doit être un nombre positif."); return; }
    const newEmp: Employee & { password?: string; pin?: string } = {
      id: `EMP${Date.now().toString(36).slice(-7).toUpperCase()}`,
      firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      role: form.role, department: form.department, position: form.position,
      contractType: form.contractType,
      startDate: form.startDate || new Date().toISOString().split("T")[0],
      salary, status: "Actif", manager: form.managerId || null,
      address: form.address, birthDate: form.birthDate,
      leaveBalance: 25, leaveUsed: 0,
      password: form.password || "admin1234", pin: form.pin || "1234",
    };
    setLoading(true);
    try { await onAdd(newEmp); onClose(); }
    catch (err: any) { setError(err.message || "Erreur lors de la création."); setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--hr-text)" }}>Nouvel employé</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        {/* Tabs : créer manuellement | importer */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "var(--hr-hover)" }}>
          <div className="flex-1 py-2 rounded-lg text-xs text-center"
            style={{ background: "var(--hr-card)", fontWeight: 700, color: "var(--hr-text)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Plus size={12} className="inline mr-1.5 -mt-0.5" />
            Créer manuellement
          </div>
          <button onClick={onSwitchToImport}
            className="flex-1 py-2 rounded-lg text-xs text-center transition-all hover:opacity-80 flex items-center justify-center gap-1.5"
            style={{ color: "#6366F1", fontWeight: 600 }}>
            <Upload size={12} />
            Importer un fichier
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
            { label: "Téléphone", key: "phone", placeholder: "+237 6 xx xx xx xx", col: 1 },
            { label: "Poste", key: "position", placeholder: "Ex: Développeur Frontend", col: 1 },
          ].map((f) => (
            <div key={f.key} className={f.col === 2 ? "col-span-2" : ""}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Salaire mensuel brut (FCFA) *</label>
            <div className="relative">
              <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6366F1" }} />
              <input type="number" placeholder="Ex: 50000" value={form.salary} onChange={(e) => set("salary", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid #6366F1", color: "var(--hr-text)" }} />
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Département *</label>
            <DeptSelect value={form.department} onChange={(v) => set("department", v)}
              departments={departments} onCreateDept={onCreateDept} />
          </div>
          {[
            { label: "Type de contrat", key: "contractType", options: ["CDI", "CDD", "Stage", "Freelance"] },
            { label: "Rôle", key: "role", options: ["Employee", "Manager", "Admin"] },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <select value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
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
              <select value={form.managerId} onChange={(e) => set("managerId", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
                <option value="">— Aucun responsable —</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>)}
              </select>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Adresse</label>
            <input placeholder="123 Rue de la Paix" value={form.address} onChange={(e) => set("address", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Mot de passe initial</label>
            <input type="password" placeholder="admin1234 (défaut)" value={form.password} onChange={(e) => set("password", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>PIN pointage (4 chiffres)</label>
            <input type="text" maxLength={4} placeholder="1234 (défaut)" value={form.pin}
              onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
          </div>
        </div>
        {form.salary && !isNaN(parseFloat(form.salary)) && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="grid grid-cols-3 gap-3">
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
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Création…</> : "Ajouter l'employé"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modale modification employé ─────────────────────────────────────────────
interface EditEmployeeModalProps {
  emp: Employee;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Employee> & { password?: string }) => Promise<void>;
  allEmployees: Employee[];
  departments: string[];
  onCreateDept: (name: string) => Promise<void>;
}

function EditEmployeeModal({ emp, onClose, onSave, allEmployees, departments, onCreateDept }: EditEmployeeModalProps) {
  const [form, setForm] = useState({
    firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
    phone: emp.phone || "", position: emp.position || "",
    department: emp.department || "",
    contractType: emp.contractType as any, role: emp.role as any,
    startDate: emp.startDate || "", birthDate: emp.birthDate || "",
    salary: emp.salary != null ? String(emp.salary) : "",
    managerId: emp.managerId || "", address: emp.address || "",
    status: emp.status as any, password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (departments.length > 0 && !form.department) {
      setForm((p) => ({ ...p, department: departments[0] }));
    }
  }, [departments]);

  const managers = allEmployees.filter((e) => (e.role === "Manager" || e.role === "Admin") && e.id !== emp.id);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email) {
      setError("Prénom, nom et email sont obligatoires."); return;
    }
    const salary = form.salary ? parseFloat(form.salary) : null;
    if (form.salary && (isNaN(salary!) || salary! <= 0)) {
      setError("Le salaire doit être un nombre positif."); return;
    }
    setLoading(true);
    try {
      await onSave(emp.id, {
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone, position: form.position, department: form.department,
        contractType: form.contractType, role: form.role,
        startDate: form.startDate || null, birthDate: form.birthDate || null,
        salary, manager: form.managerId || null, address: form.address,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification."); setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
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
            { label: "Téléphone", key: "phone", placeholder: "+237 6 xx xx xx" },
            { label: "Poste", key: "position", placeholder: "Ex: Développeur" },
          ].map((f) => (
            <div key={f.key} className={(f as any).col2 ? "col-span-2" : ""}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Salaire mensuel (FCFA)</label>
            <div className="relative">
              <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6366F1" }} />
              <input type="number" placeholder="Ex: 50000" value={form.salary} onChange={(e) => set("salary", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid #6366F1", color: "var(--hr-text)" }} />
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Département</label>
            <DeptSelect value={form.department} onChange={(v) => set("department", v)}
              departments={departments} onCreateDept={onCreateDept} />
          </div>
          {[
            { label: "Contrat", key: "contractType", options: ["CDI", "CDD", "Stage", "Freelance"] },
            { label: "Rôle", key: "role", options: ["Employee", "Manager", "Admin"] },
            { label: "Statut", key: "status", options: ["Actif", "Inactif", "En congé"] },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
              <select value={(form as any)[f.key]} onChange={(e) => set(f.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
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
              <select value={form.managerId} onChange={(e) => set("managerId", e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
                <option value="">— Aucun responsable —</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>)}
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
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer les modifications"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export function EmployeesPage() {
  const navigate = useNavigate();
  const { currentUser, employees, addEmployee, updateEmployee, deleteEmployee } = useAuth();

  const [departments, setDepartments] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmpToEdit, setSelectedEmpToEdit] = useState<Employee | null>(null);

  useEffect(() => {
    if (currentUser?.companyId) {
      departmentsApi.getAll(currentUser.companyId)
        .then((list) => setDepartments(list.map((d) => d.name)))
        .catch(() => {});
    }
  }, [currentUser?.companyId]);

  if (currentUser?.role !== "Admin") return <Navigate to="/dashboard" replace />;

  const createDept = async (name: string): Promise<void> => {
    if (!currentUser?.companyId) return;
    const created = await departmentsApi.create({ name, companyId: currentUser.companyId });
    setDepartments((prev) => [...prev, created.name].sort((a, b) => a.localeCompare(b, "fr")));
  };

  const filtered = employees.filter((e) => {
    const matchSearch = `${e.firstName} ${e.lastName} ${e.email} ${e.position}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "Tous" || e.department === filterDept;
    const matchStatus = filterStatus === "Tous" || e.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const exportCSV = () => {
    const rows = [
      ["Prénom", "Nom", "Email", "Téléphone", "Rôle", "Département", "Poste", "Contrat", "Statut", "Date d'entrée", "Salaire (FCFA)"],
      ...filtered.map((e) => [e.firstName, e.lastName, e.email, e.phone, e.role, e.department, e.position, e.contractType, e.status, e.startDate, String(e.salary)]),
    ];
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `employes_${new Date().toISOString().split("T")[0]}.csv`;
    a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const depts = ["Tous", ...departments];
  const statuses = ["Tous", "Actif", "Inactif", "En congé"];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 min-w-52"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)" }}>
          <Search size={15} style={{ color: "var(--hr-text-light)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un employé…"
            className="bg-transparent text-sm outline-none flex-1" style={{ color: "var(--hr-text)" }} />
          {search && <button onClick={() => setSearch("")}><X size={13} style={{ color: "var(--hr-text-light)" }} /></button>}
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--hr-card-border-hard)" }}>
          {(["table", "grid"] as const).map((v) => (
            <button key={v} onClick={() => setViewMode(v)} className="px-3 py-2 text-xs transition-all"
              style={{ background: viewMode === v ? "#6366F1" : "var(--hr-card)", color: viewMode === v ? "white" : "var(--hr-text-muted)", fontWeight: viewMode === v ? 700 : 400 }}>
              {v === "table" ? "Liste" : "Grille"}
            </button>
          ))}
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-sec)", fontWeight: 600 }}>
          <Download size={15} />CSV
        </button>
        <button onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: "var(--hr-card)", border: "1.5px solid #6366F1", color: "#6366F1", fontWeight: 600 }}>
          <Upload size={15} />Importer
        </button>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}>
          <Plus size={15} />Nouvel employé
        </button>
      </motion.div>

      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
        {filtered.length} employé{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Table view */}
      {viewMode === "table" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--hr-table-head)", borderBottom: "1px solid var(--hr-card-border)" }}>
                  {["Employé", "Département", "Poste", "Rôle", "Contrat", "Salaire", "Statut", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs" style={{ color: "var(--hr-text-light)", fontWeight: 700, letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="border-b transition-colors" style={{ borderColor: "var(--hr-card-border)" }}>
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
                      {emp.department
                        ? <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)" }}>{emp.department}</span>
                        : <span className="text-xs" style={{ color: "var(--hr-text-light)", fontStyle: "italic" }}>—</span>}
                    </td>
                    <td className="px-4 py-3"><p className="text-xs" style={{ color: "var(--hr-text-sec)" }}>{emp.position}</p></td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: roleColor[emp.role]?.bg, color: roleColor[emp.role]?.text, fontWeight: 600 }}>{emp.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: contractColor[emp.contractType]?.bg, color: contractColor[emp.contractType]?.text, fontWeight: 600 }}>{emp.contractType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ fontWeight: 700, color: "#6366F1" }}>{emp.salary != null ? emp.salary.toLocaleString("fr-FR") : "—"} FCFA</p>
                      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>~{emp.salary != null ? (emp.salary / 22).toFixed(0) : "—"} FCFA/j</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit"
                        style={{ background: statusColor[emp.status]?.bg, color: statusColor[emp.status]?.text, fontWeight: 600 }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[emp.status]?.text }} />{emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/employees/${emp.id}`)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition-colors" title="Voir profil">
                          <Eye size={13} style={{ color: "#6366F1" }} />
                        </button>
                        <button onClick={() => setSelectedEmpToEdit(emp)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors" title="Modifier">
                          <Edit2 size={13} style={{ color: "#F59E0B" }} />
                        </button>
                        <button onClick={() => { if (window.confirm(`Supprimer ${emp.firstName} ${emp.lastName} ?`)) deleteEmployee(emp.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors" title="Supprimer">
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
              onClick={() => navigate(`/employees/${emp.id}`)}>
              <div className="relative mb-3">
                <img src={emp.avatar} alt={emp.firstName} className="w-16 h-16 rounded-2xl object-cover" style={{ border: "3px solid #EDE9FE" }} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: statusColor[emp.status]?.text ?? "#ccc" }} />
              </div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
              <p className="text-xs mt-0.5 mb-1" style={{ color: "var(--hr-text-light)" }}>{emp.position}</p>
              <div className="flex gap-1 mb-2">
                {emp.department
                  ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EDE9FE", color: "#7C3AED", fontWeight: 600 }}>{emp.department}</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--hr-hover)", color: "var(--hr-text-light)", fontStyle: "italic" }}>—</span>}
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
            onAdd={async (emp) => { await addEmployee(emp); setFilterDept("Tous"); }}
            allEmployees={employees} departments={departments} onCreateDept={createDept}
            onSwitchToImport={() => { setShowAddModal(false); setShowImportModal(true); }}
          />
        )}
        {selectedEmpToEdit && (
          <EditEmployeeModal
            emp={selectedEmpToEdit} onClose={() => setSelectedEmpToEdit(null)}
            onSave={updateEmployee} allEmployees={employees} departments={departments} onCreateDept={createDept}
          />
        )}
        {showImportModal && (
          <ImportEmployeesModal
            onClose={() => setShowImportModal(false)}
            employees={employees} departments={departments}
            companyId={currentUser.companyId!}
            onCreateDept={createDept}
            onImportDone={() => setFilterDept("Tous")}
            addEmployee={addEmployee} updateEmployee={updateEmployee}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
