import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CalendarCheck,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  FileText,
  LayoutGrid,
  Building2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLayout } from "../../context/LayoutContext";
import { notificationsApi, leavesApi } from "../../services/api";
import { TranslationKey } from "../../data/translations";
import { AppLogo } from "../AppLogo";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  roles: Array<"Admin" | "Manager" | "Employee">;
}

const allNavItems: NavItem[] = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "nav.dashboard",    roles: ["Admin", "Manager", "Employee"] },
  { to: "/employees",    icon: Users,            label: "nav.employees",    roles: ["Admin"] },
  { to: "/departments",  icon: Building2,        label: "nav.departments",  roles: ["Admin"] },
  { to: "/attendance",  icon: Clock,            label: "nav.attendance",   roles: ["Admin", "Manager", "Employee"] },
  { to: "/calendar",    icon: CalendarDays,     label: "nav.calendar",     roles: ["Admin", "Manager"] },
  { to: "/leaves",      icon: CalendarCheck,    label: "nav.leaves",       roles: ["Admin", "Manager", "Employee"] },
  { to: "/planning",    icon: LayoutGrid,       label: "nav.planning",     roles: ["Admin", "Manager"] },
  { to: "/performance", icon: Star,             label: "nav.performance",  roles: ["Admin", "Manager", "Employee"] },
  { to: "/documents",   icon: FileText,         label: "nav.documents",    roles: ["Admin", "Manager", "Employee"] },
  { to: "/reports",     icon: BarChart3,        label: "nav.reports",      roles: ["Admin", "Manager", "Employee"] },
  { to: "/notifications", icon: Bell,           label: "nav.notifications",roles: ["Admin", "Manager", "Employee"] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [dynamicBadges, setDynamicBadges] = useState<Record<string, number>>({});
  const { currentUser, logout, employees } = useAuth();
  const { t } = useTheme();
  const { setMobileOpen } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const fetchCounts = async () => {
      try {
        const [notifs, leaves] = await Promise.all([
          notificationsApi.getAll(currentUser.companyId ?? undefined),
          leavesApi.getAll({ companyId: currentUser.companyId ?? undefined }),
        ]);
        const userNotifs = notifs.filter((n) =>
          n.employeeId === currentUser.id || n.employeeId === null
        );
        const unread = userNotifs.filter((n) => !n.isRead).length;
        let pendingLeaves = 0;
        if (currentUser.role === "Admin") {
          pendingLeaves = leaves.filter((l) => l.status === "En attente").length;
        } else if (currentUser.role === "Manager") {
          const deptIds = employees.filter((e) => e.department === currentUser.department).map((e) => e.id);
          pendingLeaves = leaves.filter((l) => l.status === "En attente" && deptIds.includes(l.employeeId)).length;
        }
        setDynamicBadges({ "/notifications": unread, "/leaves": pendingLeaves });
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 20000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = currentUser?.role ?? "Employee";
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(role as any));

  const roleColor = role === "Admin" ? "#F59E0B" : role === "Manager" ? "#6366F1" : "#10B981";
  const roleBg = role === "Admin" ? "rgba(245,158,11,0.15)" : role === "Manager" ? "rgba(99,102,241,0.15)" : "rgba(16,185,129,0.15)";

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-screen overflow-hidden flex-shrink-0"
      style={{
        background: "linear-gradient(180deg, #0B1437 0%, #111827 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="flex-shrink-0">
          <AppLogo size={36} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap flex-1"
            >
              <p className="text-white text-sm" style={{ fontWeight: 700, letterSpacing: "-0.3px" }}>
                HR Manager
              </p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {t("brand.subtitle")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Close button - only on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-auto"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-label="Fermer le menu"
        >
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-50 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "#6366F1", border: "2px solid #0B1437" }}
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-white" />
        ) : (
          <ChevronLeft size={12} className="text-white" />
        )}
      </button>

      {/* Role badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 mb-1 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: roleBg, border: `1px solid ${roleColor}20` }}
          >
            <Shield size={12} style={{ color: roleColor }} />
            <p className="text-xs" style={{ color: roleColor, fontWeight: 700 }}>
              {role === "Admin" ? t("role.admin") : role === "Manager" ? t("role.manager") : t("role.employee")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 mb-3 uppercase text-xs tracking-widest"
              style={{ color: "#4B5563" }}
            >
              {t("nav.section")}
            </motion.p>
          )}
        </AnimatePresence>

        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background:
                      "linear-gradient(90deg, rgba(99,102,241,0.25), rgba(139,92,246,0.12))",
                    borderLeft: "3px solid #6366F1",
                  }
                : {}
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={`flex-shrink-0 transition-all ${
                    isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm whitespace-nowrap overflow-hidden"
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {t(item.label as TranslationKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
                {(dynamicBadges[item.to] ?? 0) > 0 && !collapsed && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#EF4444", minWidth: "18px", textAlign: "center" }}
                  >
                    {dynamicBadges[item.to]}
                  </motion.span>
                )}
                {(dynamicBadges[item.to] ?? 0) > 0 && collapsed && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{ background: "#EF4444" }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <Settings size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm whitespace-nowrap"
              >
                {t("nav.settings")}
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>

        {/* User card */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <img
            src={currentUser?.avatar}
            alt={currentUser?.firstName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid rgba(99,102,241,0.5)" }}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-xs truncate" style={{ fontWeight: 600 }}>
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: roleColor }} />
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {currentUser?.position}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                title="Déconnexion"
              >
                <LogOut size={15} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
