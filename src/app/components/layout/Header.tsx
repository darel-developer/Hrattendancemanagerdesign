import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell, Search, ChevronDown, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { notifications } from "../../data/mockData";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Tableau de bord", subtitle: "Vue d'ensemble de votre organisation" },
  "/employees": { title: "Employés", subtitle: "Gestion de vos collaborateurs" },
  "/attendance": { title: "Présences", subtitle: "Suivi des pointages quotidiens" },
  "/leaves": { title: "Congés", subtitle: "Gestion des demandes de congé" },
  "/reports": { title: "Rapports", subtitle: "Statistiques et analyses" },
  "/notifications": { title: "Notifications", subtitle: "Alertes et rappels" },
  "/settings": { title: "Paramètres", subtitle: "Configuration de la plateforme" },
};

const roleSubtitles: Record<string, Record<string, string>> = {
  "/dashboard": {
    Admin: "Vue globale de l'organisation",
    Manager: "Vue de votre département",
    Employee: "Votre espace personnel",
  },
  "/attendance": {
    Admin: "Tous les pointages",
    Manager: "Pointages de votre équipe",
    Employee: "Mon pointage du jour",
  },
  "/leaves": {
    Admin: "Toutes les demandes de congé",
    Manager: "Congés de votre équipe",
    Employee: "Mes demandes de congé",
  },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const role = currentUser?.role ?? "Employee";
  const pageInfo = pageTitles[location.pathname] ?? { title: "HR Manager", subtitle: "" };
  const roleSubtitle = roleSubtitles[location.pathname]?.[role] ?? pageInfo.subtitle;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{
        background: "var(--hr-card)",
        borderColor: "var(--hr-card-border-hard)",
      }}
    >
      {/* Left */}
      <div>
        <h1 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--hr-text)" }}>
          {pageInfo.title}
        </h1>
        <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
          {roleSubtitle} · {capitalizedDate}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}
        >
          <Search size={14} style={{ color: "var(--hr-text-light)" }} />
          <input
            type="text"
            placeholder="Rechercher…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="bg-transparent text-sm outline-none w-40"
            style={{ color: "var(--hr-text)" }}
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}
          title={isDark ? "Mode clair" : "Mode sombre"}
        >
          {isDark ? (
            <Sun size={16} style={{ color: "#F59E0B" }} />
          ) : (
            <Moon size={16} style={{ color: "#6366F1" }} />
          )}
        </button>

        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}
          >
            <Bell size={16} style={{ color: "var(--hr-text-muted)" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{ background: "#EF4444", fontSize: "9px", fontWeight: 700 }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
                style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border-hard)" }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
                  <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                    Notifications
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ background: "#EF4444" }}
                  >
                    {unreadCount} nouvelles
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors"
                      style={{
                        borderColor: "var(--hr-card-border)",
                        background: n.read ? "transparent" : "rgba(99,102,241,0.05)",
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: n.read ? "var(--hr-text-light)" : "#6366F1" }}
                      />
                      <div>
                        <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => { navigate("/notifications"); setShowNotifPanel(false); }}
                    className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Voir toutes les notifications →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
          style={{ border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }}
          onClick={() => navigate("/settings")}
        >
          <img
            src={currentUser?.avatar}
            alt={currentUser?.firstName}
            className="w-7 h-7 rounded-full object-cover"
          />
          <div className="hidden sm:block">
            <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>
              {currentUser?.firstName}
            </p>
            <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
              {currentUser?.role}
            </p>
          </div>
          <ChevronDown size={13} style={{ color: "var(--hr-text-light)" }} />
        </div>
      </div>
    </header>
  );
}
