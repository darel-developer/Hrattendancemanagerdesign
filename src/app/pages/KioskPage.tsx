import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, CheckCircle, XCircle, X, LogIn, LogOut } from "lucide-react";
import { kioskApi, companiesApi } from "../services/api";
import { Company } from "../data/mockData";

type KioskEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  position: string;
  department: string;
};

type CheckResult = {
  success: boolean;
  action: "check_in" | "check_out";
  time: string;
  hoursWorked?: number;
  employee: string;
  status?: string;
} | null;

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function KioskPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<KioskEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<CheckResult>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const now = useClock();

  useEffect(() => {
    companiesApi.getAll().then((list) => {
      setCompanies(list);
      if (list.length === 1) setSelectedCompanyId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    kioskApi.getEmployees(selectedCompanyId).then(setEmployees).catch(console.error);
  }, [selectedCompanyId]);

  // Auto-reset result after 5s
  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => { setResult(null); setSelectedEmployee(null); setPin(""); }, 5000);
    return () => clearTimeout(id);
  }, [result]);

  const handlePinKey = useCallback((key: string) => {
    if (key === "DEL") { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    setPin((p) => p + key);
  }, [pin]);

  const handleConfirm = async () => {
    if (!selectedEmployee || pin.length < 4 || !selectedCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await kioskApi.checkin(selectedEmployee.id, pin, selectedCompanyId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Erreur lors du pointage");
      setTimeout(() => { setError(""); setPin(""); }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  // Company selector screen
  if (!selectedCompanyId && companies.length > 1) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-white text-2xl mb-2" style={{ fontWeight: 800 }}>Terminal de Pointage</h1>
          <p className="text-slate-400 mb-8">Sélectionnez votre entreprise</p>
          <div className="flex flex-col gap-3 w-80">
            {companies.map((c) => (
              <button key={c.id} onClick={() => setSelectedCompanyId(c.id)}
                className="px-6 py-4 rounded-2xl text-white text-left transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <p style={{ fontWeight: 700 }}>{c.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{c.sector}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-base" style={{ fontWeight: 800 }}>
              {selectedCompany?.name || "Terminal Pointage"}
            </p>
            <p className="text-xs" style={{ color: "#8B7CF8" }}>Terminal de pointage</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-3xl" style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: result.action === "check_in" ? "rgba(16,185,129,0.95)" : "rgba(99,102,241,0.95)" }}>
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}
              className="text-center text-white p-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                {result.action === "check_in"
                  ? <LogIn size={40} className="text-white" />
                  : <LogOut size={40} className="text-white" />}
              </motion.div>
              <p className="text-4xl mb-2" style={{ fontWeight: 900 }}>
                {result.action === "check_in" ? "Arrivée enregistrée !" : "Départ enregistré !"}
              </p>
              <p className="text-xl opacity-90 mb-1">{result.employee}</p>
              <p className="text-3xl mt-4" style={{ fontWeight: 800 }}>{result.time}</p>
              {result.hoursWorked && (
                <p className="text-lg mt-2 opacity-80">
                  {result.hoursWorked}h travaillées aujourd'hui
                </p>
              )}
              {result.status === "Retard" && (
                <p className="mt-3 px-4 py-1 rounded-full text-sm inline-block"
                  style={{ background: "rgba(0,0,0,0.2)", fontWeight: 600 }}>
                  Arrivée en retard
                </p>
              )}
              <p className="text-sm mt-6 opacity-60">Fermeture automatique dans 5s…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error flash */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl flex items-center gap-2"
            style={{ background: "#EF4444" }}>
            <XCircle size={16} className="text-white" />
            <p className="text-white text-sm" style={{ fontWeight: 700 }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex gap-6 px-8 pb-8">
        {/* Employee list */}
        <div className="flex-1">
          <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: "#94A3B8", fontWeight: 700 }}>
            Sélectionnez votre nom
          </p>
          <div className="grid grid-cols-3 gap-3">
            {employees.map((emp) => (
              <motion.button
                key={emp.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedEmployee(emp); setPin(""); setError(""); }}
                className="flex flex-col items-center p-4 rounded-2xl transition-all"
                style={{
                  background: selectedEmployee?.id === emp.id
                    ? "rgba(99,102,241,0.3)"
                    : "rgba(255,255,255,0.06)",
                  border: "1.5px solid",
                  borderColor: selectedEmployee?.id === emp.id
                    ? "rgba(99,102,241,0.8)"
                    : "rgba(255,255,255,0.08)",
                }}>
                <img src={emp.avatar} alt={emp.firstName}
                  className="w-14 h-14 rounded-2xl object-cover mb-3"
                  style={{ border: selectedEmployee?.id === emp.id ? "2px solid #6366F1" : "2px solid transparent" }} />
                <p className="text-white text-sm text-center" style={{ fontWeight: 700 }}>
                  {emp.firstName}<br />{emp.lastName}
                </p>
                <p className="text-xs mt-0.5 text-center" style={{ color: "#94A3B8" }}>{emp.position}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* PIN panel */}
        <AnimatePresence>
          {selectedEmployee && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="w-72 flex-shrink-0 flex flex-col"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "1.5rem" }}>

              {/* Selected employee */}
              <div className="flex items-center gap-3 mb-6">
                <img src={selectedEmployee.avatar} alt={selectedEmployee.firstName}
                  className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{selectedEmployee.department}</p>
                </div>
              </div>

              {/* PIN display */}
              <div className="mb-6">
                <p className="text-xs mb-3 text-center" style={{ color: "#94A3B8", fontWeight: 600 }}>
                  ENTREZ VOTRE CODE PIN (4 chiffres)
                </p>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: i < pin.length ? "#6366F1" : "rgba(255,255,255,0.1)",
                        border: "2px solid",
                        borderColor: i < pin.length ? "#6366F1" : "rgba(255,255,255,0.15)",
                      }}>
                      {i < pin.length && <div className="w-3 h-3 rounded-full bg-white" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"].map((k) => {
                  if (k === "") return <div key="empty" />;
                  return (
                    <motion.button
                      key={k}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePinKey(k)}
                      className="h-12 rounded-xl flex items-center justify-center text-white text-lg transition-all"
                      style={{
                        background: k === "DEL" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontWeight: 700,
                      }}>
                      {k === "DEL" ? <X size={14} /> : k}
                    </motion.button>
                  );
                })}
              </div>

              {/* Confirm button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={pin.length < 4 || loading}
                className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: pin.length === 4 && !loading
                    ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                    : "rgba(255,255,255,0.1)",
                  fontWeight: 700,
                  opacity: pin.length < 4 ? 0.5 : 1,
                }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><CheckCircle size={16} /> Valider le pointage</>
                }
              </motion.button>

              <button onClick={() => { setSelectedEmployee(null); setPin(""); }}
                className="mt-3 text-xs text-center transition-colors hover:opacity-80"
                style={{ color: "#94A3B8" }}>
                Annuler
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-8 pb-4 flex items-center justify-between">
        <a href="/login" className="text-xs hover:underline" style={{ color: "#6366F1" }}>
          → Connexion administrateur
        </a>
        <p className="text-xs" style={{ color: "#475569" }}>
          Terminal HR Manager · Pointage sécurisé par PIN
        </p>
      </div>
    </div>
  );
}
