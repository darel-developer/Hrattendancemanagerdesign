import React, { useState } from "react";
import { motion } from "motion/react";
import {
  User, Building2, Bell, Shield, Palette, Globe, ChevronRight,
  Camera, Save, Lock, Mail, Phone, MapPin, Sun, Moon, Monitor,
  Check, Languages
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const sections = [
  { id: "profile", icon: User, label: "Profil personnel" },
  { id: "company", icon: Building2, label: "Entreprise" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "security", icon: Shield, label: "Sécurité" },
  { id: "appearance", icon: Palette, label: "Apparence" },
  { id: "language", icon: Globe, label: "Langue & Région" },
];

export function SettingsPage() {
  const { currentUser } = useAuth();
  const { theme, setTheme, language, setLanguage, isDark } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    absences: true,
    retards: true,
    conges: true,
    documents: true,
    email: false,
    system: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themeOptions = [
    { id: "light", label: "Clair", description: "Interface lumineuse", icon: Sun, preview: "#F0F2F8" },
    { id: "dark", label: "Sombre", description: "Interface sombre, reposante", icon: Moon, preview: "#0F172A" },
  ] as const;

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷", region: "France" },
    { code: "en", label: "English", flag: "🇬🇧", region: "United Kingdom" },
  ] as const;

  return (
    <div className="flex gap-5 max-w-5xl">
      {/* Sidebar nav */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-52 flex-shrink-0"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center justify-between px-4 py-3 transition-all text-left"
              style={{
                background: activeSection === s.id ? "rgba(99,102,241,0.08)" : "transparent",
                borderLeft: activeSection === s.id ? "3px solid #6366F1" : "3px solid transparent",
              }}
            >
              <div className="flex items-center gap-2.5">
                <s.icon size={15} style={{ color: activeSection === s.id ? "#6366F1" : "var(--hr-text-light)" }} />
                <p className="text-xs" style={{
                  color: activeSection === s.id ? "#6366F1" : "var(--hr-text-sec)",
                  fontWeight: activeSection === s.id ? 700 : 400,
                }}>
                  {s.label}
                </p>
              </div>
              <ChevronRight size={13} style={{ color: "var(--hr-text-light)" }} />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        {/* Profile */}
        {activeSection === "profile" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Profil personnel</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.firstName}
                  className="w-20 h-20 rounded-2xl object-cover"
                  style={{ border: "3px solid #EDE9FE" }}
                />
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#6366F1" }}>
                  <Camera size={13} className="text-white" />
                </button>
              </div>
              <div>
                <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{currentUser?.role} · {currentUser?.department}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6366F1", fontWeight: 600 }}>{currentUser?.position}</p>
                <button className="text-xs mt-2 text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                  Changer la photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Prénom", val: currentUser?.firstName, icon: User },
                { label: "Nom", val: currentUser?.lastName, icon: User },
                { label: "Email", val: currentUser?.email, icon: Mail, col: 2 },
                { label: "Téléphone", val: currentUser?.phone, icon: Phone },
                { label: "Adresse", val: currentUser?.address, icon: MapPin, col: 2 },
              ].map((f) => (
                <div key={f.label} className={(f as any).col === 2 ? "col-span-2" : ""}>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
                  <div className="relative">
                    <f.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
                    <input
                      defaultValue={f.val ?? ""}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Info RH */}
            <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--hr-hover)", border: "1px solid var(--hr-card-border-hard)" }}>
              <p className="text-xs mb-3" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Informations RH</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Salaire brut", value: `${currentUser?.salary?.toLocaleString("fr-FR")} €/mois` },
                  { label: "Contrat", value: currentUser?.contractType },
                  { label: "Congés restants", value: `${(currentUser?.leaveBalance ?? 0) - (currentUser?.leaveUsed ?? 0)} jours` },
                ].map((item) => (
                  <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: "var(--hr-card)" }}>
                    <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{item.label}</p>
                    <p className="text-sm mt-0.5" style={{ fontWeight: 700, color: "#6366F1" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 justify-end">
              {saved && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-xs" style={{ color: "#10B981", fontWeight: 600 }}
                >
                  <Check size={13} /> Enregistré !
                </motion.div>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
              >
                <Save size={14} />
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Préférences de notifications</h2>
            <div className="space-y-4">
              {[
                { key: "absences", label: "Absences non justifiées", desc: "Recevoir une alerte en cas d'absence" },
                { key: "retards", label: "Retards signalés", desc: "Alerte quand un employé arrive en retard" },
                { key: "conges", label: "Demandes de congés", desc: "Nouvelles demandes de congé à valider" },
                { key: "documents", label: "Documents expirants", desc: "Contrats et documents arrivant à expiration" },
                { key: "email", label: "Notifications par email", desc: "Recevoir les alertes par email" },
                { key: "system", label: "Notifications système", desc: "Mises à jour et maintenance" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifSettings((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{ background: notifSettings[item.key as keyof typeof notifSettings] ? "#6366F1" : "var(--hr-card-border-hard)" }}
                  >
                    <motion.div
                      animate={{ x: notifSettings[item.key as keyof typeof notifSettings] ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security */}
        {activeSection === "security" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Sécurité du compte</h2>
            <div className="space-y-4">
              {[
                { label: "Mot de passe actuel", placeholder: "••••••••" },
                { label: "Nouveau mot de passe", placeholder: "••••••••" },
                { label: "Confirmer le mot de passe", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-text-light)" }} />
                    <input
                      type="password"
                      placeholder={f.placeholder}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                    />
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
              >
                <Save size={14} />
                Mettre à jour le mot de passe
              </button>
            </div>
          </div>
        )}

        {/* Appearance */}
        {activeSection === "appearance" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-2" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Apparence</h2>
            <p className="text-xs mb-6" style={{ color: "var(--hr-text-light)" }}>Choisissez le thème qui vous convient le mieux</p>

            {/* Theme selector */}
            <div className="space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>THÈME</p>
              <div className="grid grid-cols-2 gap-3">
                {themeOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="rounded-2xl p-4 text-left transition-all"
                    style={{
                      background: theme === t.id ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: theme === t.id ? "2px solid #6366F1" : "2px solid var(--hr-card-border-hard)",
                    }}
                  >
                    {/* Preview mini */}
                    <div className="w-full h-16 rounded-xl mb-3 overflow-hidden flex" style={{ background: t.preview, border: "1px solid rgba(0,0,0,0.1)" }}>
                      <div className="w-8 h-full" style={{ background: t.id === "dark" ? "#0B1437" : "#1E1B4B" }} />
                      <div className="flex-1 p-2 space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="rounded h-2" style={{ background: t.id === "dark" ? "#1E293B" : "white", width: i === 1 ? "80%" : i === 2 ? "60%" : "70%" }} />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <t.icon size={14} style={{ color: theme === t.id ? "#6366F1" : "var(--hr-text-muted)" }} />
                          <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{t.label}</p>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{t.description}</p>
                      </div>
                      {theme === t.id && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#6366F1" }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="mt-6 space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>DENSITÉ D'AFFICHAGE</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "compact", label: "Compact" },
                  { id: "normal", label: "Normal", default: true },
                  { id: "comfortable", label: "Confortable" },
                ].map((d) => (
                  <button key={d.id}
                    className="py-3 rounded-xl text-xs transition-all"
                    style={{
                      background: d.default ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: d.default ? "2px solid #6366F1" : "2px solid var(--hr-card-border-hard)",
                      color: d.default ? "#6366F1" : "var(--hr-text-muted)",
                      fontWeight: d.default ? 700 : 400,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div className="mt-6 space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>COULEUR D'ACCENTUATION</p>
              <div className="flex gap-3">
                {[
                  { color: "#6366F1", label: "Indigo (défaut)" },
                  { color: "#10B981", label: "Émeraude" },
                  { color: "#F59E0B", label: "Ambre" },
                  { color: "#EC4899", label: "Rose" },
                  { color: "#14B8A6", label: "Teal" },
                ].map((c) => (
                  <button key={c.color} title={c.label}
                    className="w-8 h-8 rounded-full transition-all hover:scale-110"
                    style={{ background: c.color, border: c.color === "#6366F1" ? "3px solid var(--hr-text)" : "3px solid transparent" }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl" style={{ background: "var(--hr-hover)" }}>
              <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>
                Le thème <strong style={{ color: "var(--hr-text)" }}>{isDark ? "Sombre" : "Clair"}</strong> est actuellement actif.
                Vous pouvez également basculer rapidement via l'icône en haut à droite.
              </p>
            </div>
          </div>
        )}

        {/* Language */}
        {activeSection === "language" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-2" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Langue & Région</h2>
            <p className="text-xs mb-6" style={{ color: "var(--hr-text-light)" }}>Choisissez la langue d'affichage de l'interface</p>

            <div className="space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>LANGUE DE L'INTERFACE</p>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
                    style={{
                      background: language === lang.code ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: language === lang.code ? "2px solid #6366F1" : "2px solid var(--hr-card-border-hard)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{lang.label}</p>
                        <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{lang.region}</p>
                      </div>
                    </div>
                    {language === lang.code && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#6366F1" }}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date format */}
            <div className="mt-6 space-y-3">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>FORMAT DE DATE</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { format: "DD/MM/YYYY", example: "15/04/2026", default: true },
                  { format: "MM/DD/YYYY", example: "04/15/2026", default: false },
                  { format: "YYYY-MM-DD", example: "2026-04-15", default: false },
                ].map((f) => (
                  <button key={f.format}
                    className="py-3 px-3 rounded-xl text-left transition-all"
                    style={{
                      background: f.default ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: f.default ? "2px solid #6366F1" : "2px solid var(--hr-card-border-hard)",
                    }}
                  >
                    <p className="text-xs" style={{ fontWeight: 700, color: f.default ? "#6366F1" : "var(--hr-text)" }}>{f.format}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{f.example}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div className="mt-6 space-y-2">
              <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text-sec)", letterSpacing: "0.5px" }}>FUSEAU HORAIRE</p>
              <select
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              >
                {[
                  "Europe/Paris (UTC+2)",
                  "Europe/London (UTC+1)",
                  "Africa/Casablanca (UTC+1)",
                  "Africa/Abidjan (UTC+0)",
                  "America/New_York (UTC-4)",
                  "America/Los_Angeles (UTC-7)",
                ].map((tz) => <option key={tz}>{tz}</option>)}
              </select>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
              >
                {saved ? <><Check size={14} />Enregistré !</> : <><Save size={14} />Enregistrer</>}
              </button>
            </div>
          </div>
        )}

        {/* Company */}
        {activeSection === "company" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
            <h2 className="text-sm mb-5" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Paramètres entreprise</h2>
            <div className="space-y-4">
              {[
                { label: "Nom de l'entreprise", value: "HR Manager Corp" },
                { label: "Secteur d'activité", value: "Technologie" },
                { label: "Effectif total", value: "8 employés" },
                { label: "Email RH", value: "rh@hrmanager.com" },
                { label: "Adresse du siège", value: "Paris, France" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>{f.label}</label>
                  <input
                    defaultValue={f.value}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Heure de début de journée</label>
                <input type="time" defaultValue="09:00" className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Tolérance de retard (minutes)</label>
                <input type="number" defaultValue="5" className="px-3 py-2.5 rounded-xl text-sm outline-none w-28"
                  style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>Délai avant qu'une arrivée soit considérée en retard</p>
              </div>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
              >
                <Save size={14} />
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
