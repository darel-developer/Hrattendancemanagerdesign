import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell, Search, ChevronDown, Moon, Sun, Menu, X } from "lucide-react";
import { useLayout } from "../../context/LayoutContext";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { notificationsApi } from "../../services/api";
import { Notification } from "../../data/mockData";
import { translations } from "../../data/translations";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, employees } = useAuth();
  const { toggleTheme, isDark, language } = useTheme();
  const { setMobileOpen } = useLayout();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = () => {
      notificationsApi.getAll(currentUser?.companyId ?? undefined).then(setNotifications).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const role = currentUser?.role ?? "Employee";

  const tr = translations[language] as Record<string, string>;
  const pathBase = "/" + (location.pathname.split("/")[1] ?? "");
  const pageKeyMap: Record<string, string> = {
    "/dashboard": "dashboard", "/employees": "employees", "/attendance": "attendance",
    "/calendar": "calendar", "/leaves": "leaves", "/reports": "reports",
    "/notifications": "notifications", "/settings": "settings", "/performance": "performance",
    "/documents": "documents", "/planning": "planning", "/departments": "departments",
  };
  const pageKey = pageKeyMap[pathBase];
  const pageTitle = (pageKey && tr[`page.${pageKey}.title`]) || "HR Manager";
  const roleSuffix = role === "Admin" ? "admin" : role === "Manager" ? "manager" : "employee";
  const finalSubtitle = (pageKey && (tr[`page.${pageKey}.subtitle.${roleSuffix}`] || tr[`page.${pageKey}.subtitle`])) || "";

  // Filter notifications for current user
  const userNotifs = notifications.filter((n) =>
    role === "Admin" || role === "Manager" || n.employeeId === currentUser?.id || n.employeeId === null
  );
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  // Search results
  const searchResults = searchVal.trim().length >= 2
    ? employees.filter((e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchVal.toLowerCase()) ||
        e.email.toLowerCase().includes(searchVal.toLowerCase()) ||
        e.department.toLowerCase().includes(searchVal.toLowerCase())
      ).slice(0, 5)
    : [];

  const today = new Date();
  const dateLocale = language === "en" ? "en-US" : "fr-FR";
  const dateStr = today.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <header className="h-16 flex items-center justify-between px-3 md:px-6 border-b flex-shrink-0"
      style={{ background: "var(--hr-card)", borderColor: "var(--hr-card-border-hard)" }}>
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}
        >
          <Menu size={16} style={{ color: "var(--hr-text-muted)" }} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate" style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--hr-text)" }}>
            {pageTitle}
          </h1>
          <p className="text-xs hidden sm:block truncate" style={{ color: "var(--hr-text-light)" }}>
            {finalSubtitle} · {capitalizedDate}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Search — hidden on mobile */}
        <div ref={searchRef} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl relative"
          style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}>
          <Search size={14} style={{ color: "var(--hr-text-light)" }} />
          <input type="text" placeholder="Rechercher un employé…" value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            className="bg-transparent text-sm outline-none w-44"
            style={{ color: "var(--hr-text)" }} />
          {searchVal && (
            <button onClick={() => { setSearchVal(""); setShowSearch(false); }}>
              <X size={12} style={{ color: "var(--hr-text-light)" }} />
            </button>
          )}
          <AnimatePresence>
            {showSearch && searchVal.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full mt-2 left-0 w-72 rounded-xl shadow-2xl overflow-hidden z-50"
                style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border-hard)" }}
              >
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-xs" style={{ color: "var(--hr-text-muted)" }}>
                    Aucun résultat pour « {searchVal} »
                  </p>
                ) : (
                  searchResults.map((emp) => (
                    <div key={emp.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                      style={{ borderBottom: "1px solid var(--hr-card-border)" }}
                      onMouseDown={() => { navigate(`/employees/${emp.id}`); setSearchVal(""); setShowSearch(false); }}
                    >
                      <img src={emp.avatar} alt={emp.firstName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      <div>
                        <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
                          {emp.department} · {emp.position}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}
          title={isDark ? "Mode clair" : "Mode sombre"}>
          {isDark ? <Sun size={16} style={{ color: "#F59E0B" }} /> : <Moon size={16} style={{ color: "#6366F1" }} />}
        </button>

        {/* Notifications bell */}
        <div className="relative">
          <button onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}>
            <Bell size={16} style={{ color: "var(--hr-text-muted)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{ background: "#EF4444", fontSize: "9px", fontWeight: 700 }}>
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
                style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border-hard)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
                  <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#EF4444" }}>
                      {unreadCount} nouvelles
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {userNotifs.length === 0 ? (
                    <p className="px-4 py-6 text-xs text-center" style={{ color: "var(--hr-text-muted)" }}>Aucune notification</p>
                  ) : (
                    userNotifs.slice(0, 5).map((n) => (
                      <div key={n.id}
                        className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors"
                        style={{
                          borderColor: "var(--hr-card-border)",
                          background: n.isRead ? "transparent" : "rgba(99,102,241,0.05)",
                        }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: n.isRead ? "var(--hr-text-light)" : "#6366F1" }} />
                        <div>
                          <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{n.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 text-center">
                  <button onClick={() => { navigate("/notifications"); setShowNotifPanel(false); }}
                    className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                    Voir toutes les notifications →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
          style={{ border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }}
          onClick={() => navigate("/settings")}>
          <img src={currentUser?.avatar} alt={currentUser?.firstName} className="w-7 h-7 rounded-full object-cover" />
          <div className="hidden sm:block">
            <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{currentUser?.firstName}</p>
            <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{currentUser?.role}</p>
          </div>
          <ChevronDown size={13} style={{ color: "var(--hr-text-light)" }} />
        </div>
      </div>
    </header>
  );
}
