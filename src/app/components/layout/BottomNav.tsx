import React from "react";
import { NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  Menu,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../context/LayoutContext";
import { useTheme } from "../../context/ThemeContext";
import { TranslationKey } from "../../data/translations";

interface BottomNavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  roles: Array<"Admin" | "Manager" | "Employee">;
}

const bottomNavItems: BottomNavItem[] = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "nav.dashboard",  roles: ["Admin", "Manager", "Employee"] },
  { to: "/employees",   icon: Users,            label: "nav.employees",  roles: ["Admin"] },
  { to: "/attendance",  icon: Clock,            label: "nav.attendance", roles: ["Admin", "Manager", "Employee"] },
  { to: "/leaves",      icon: CalendarCheck,    label: "nav.leaves",     roles: ["Admin", "Manager", "Employee"] },
];

export function BottomNav() {
  const { currentUser } = useAuth();
  const { setMobileOpen } = useLayout();
  const { t } = useTheme();
  const location = useLocation();

  const role = (currentUser?.role ?? "Employee") as "Admin" | "Manager" | "Employee";
  const visibleItems = bottomNavItems.filter((item) => item.roles.includes(role));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl shadow-lg"
      style={{
        background: "var(--hr-card)",
        borderTop: "1px solid var(--hr-card-border-hard)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch h-16">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: "#6366F1" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                size={20}
                className={isActive ? "text-indigo-500" : ""}
                style={{ color: isActive ? "#6366F1" : "var(--hr-text-light)" }}
              />
              <span
                className="text-xs leading-none"
                style={{
                  color: isActive ? "#6366F1" : "var(--hr-text-light)",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "10px",
                }}
              >
                {t(item.label as TranslationKey)}
              </span>
            </NavLink>
          );
        })}

        {/* More / Menu button */}
        <button
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} style={{ color: "var(--hr-text-light)" }} />
          <span
            className="leading-none"
            style={{ color: "var(--hr-text-light)", fontSize: "10px" }}
          >
            Plus
          </span>
        </button>
      </div>
    </nav>
  );
}
