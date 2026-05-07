import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { motion } from "motion/react";
import { Building2, Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Users, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const features = [
  { icon: Users, text: "Gestion complète des employés" },
  { icon: Shield, text: "Contrôle des rôles et permissions" },
  { icon: BarChart3, text: "Rapports et statistiques avancés" },
];

const demoAccounts = [
  { role: "Admin", email: "sophie.moreau@company.com", color: "#6366F1" },
  { role: "Manager", email: "thomas.dubois@company.com", color: "#8B5CF6" },
  { role: "Employé", email: "lucas.bernard@company.com", color: "#14B8A6" },
];

export function LoginPage() {
  const [email, setEmail] = useState("sophie.moreau@company.com");
  const [password, setPassword] = useState("admin1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/dashboard");
    else setError("Email ou mot de passe incorrect");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F0F2F8" }}>
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 60%, #312E81 100%)" }}>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }} />
        <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white text-lg" style={{ fontWeight: 800, letterSpacing: "-0.5px" }}>HR Manager</p>
              <p className="text-xs" style={{ color: "#8B7CF8" }}>Plateforme RH</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              <h2 className="text-white mb-4"
                style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px" }}>
                Gérez vos RH<br />
                <span style={{ color: "#A5B4FC" }}>intelligemment</span>
              </h2>
              <p className="mb-10" style={{ color: "#94A3B8", fontSize: "1rem" }}>
                Centralisez la gestion des présences, congés et ressources humaines sur une plateforme unifiée et intuitive.
              </p>
              <div className="space-y-4">
                {features.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)" }}>
                      <f.icon size={15} style={{ color: "#A5B4FC" }} />
                    </div>
                    <p className="text-sm" style={{ color: "#CBD5E1" }}>{f.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-4">
            {[
              { val: "94%", label: "Taux présence" },
              { val: "2", label: "Congés en attente" },
              { val: "100%", label: "Données réelles" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white text-xl" style={{ fontWeight: 800 }}>{s.val}</p>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              <Building2 size={16} className="text-white" />
            </div>
            <p style={{ fontWeight: 800, color: "#111827" }}>HR Manager</p>
          </div>

          <h1 className="text-slate-800 mb-2" style={{ fontWeight: 800, fontSize: "1.75rem" }}>Bienvenue 👋</h1>
          <p className="mb-8 text-sm" style={{ color: "#6B7280" }}>Connectez-vous à votre espace RH</p>

          {/* Demo selector */}
          <div className="mb-6">
            <p className="text-xs mb-2" style={{ color: "#6B7280", fontWeight: 600 }}>
              ACCÈS DÉMO — Cliquez pour sélectionner un rôle
            </p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button key={acc.role}
                  onClick={() => { setEmail(acc.email); setError(""); }}
                  className="py-2 px-3 rounded-xl text-xs text-center transition-all border"
                  style={{
                    borderColor: email === acc.email ? acc.color : "#E5E7EB",
                    background: email === acc.email ? `${acc.color}15` : "white",
                    color: email === acc.email ? acc.color : "#6B7280",
                    fontWeight: email === acc.email ? 700 : 400,
                  }}>
                  <div>{acc.role}</div>
                  <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "2px" }}>
                    {acc.role === "Admin" ? "Accès total" : acc.role === "Manager" ? "Gère son équipe" : "Vue personnelle"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#374151", fontWeight: 600 }}>Adresse email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@entreprise.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
              </div>
            </div>

            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#374151", fontWeight: 600 }}>Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366F1")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "#FEE2E2", color: "#DC2626", fontWeight: 600 }}>
                {error}
              </p>
            )}

            <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all mt-2"
              style={{
                background: loading ? "#9CA3AF" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                fontWeight: 700, fontSize: "0.9rem",
              }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <> Se connecter <ArrowRight size={16} /> </>}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-xs" style={{ color: "#9CA3AF" }}>
            Mot de passe démo :{" "}
            <span style={{ color: "#6366F1", fontWeight: 700 }}>admin1234</span>
          </p>

          <div className="mt-4 text-center">
            <a href="/kiosk" className="text-xs hover:underline" style={{ color: "#6366F1" }}>
              → Accès terminal de pointage (Kiosque)
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
