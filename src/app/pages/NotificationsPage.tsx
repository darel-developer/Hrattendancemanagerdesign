import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, UserX, CalendarDays, FileWarning, Timer, Settings2,
  CheckCheck, Trash2, Filter, X
} from "lucide-react";
import { Notification } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../services/api";

const typeConfig: Record<string, {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
  label: string;
}> = {
  absence: { icon: UserX, color: "#DC2626", bg: "#FEE2E2", label: "Absence" },
  conge: { icon: CalendarDays, color: "#7C3AED", bg: "#EDE9FE", label: "Congé" },
  document: { icon: FileWarning, color: "#D97706", bg: "#FEF3C7", label: "Document" },
  retard: { icon: Timer, color: "#F59E0B", bg: "#FEF9C3", label: "Retard" },
  system: { icon: Settings2, color: "#2563EB", bg: "#DBEAFE", label: "Système" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

export function NotificationsPage() {
  const { employees, currentUser } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"Tous" | "Non lus" | "absence" | "conge" | "document" | "retard" | "system">("Tous");

  useEffect(() => {
    const fetchNotifs = () => {
      notificationsApi.getAll(currentUser?.companyId ?? undefined).then((raw) => {
        const filtered = currentUser?.role === "Employee"
          ? raw.filter((n) => n.employeeId === currentUser.id || n.employeeId === null)
          : raw;
        setNotifs(filtered);
      }).catch(console.error);
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, [currentUser?.companyId, currentUser?.id]);

  const filtered = notifs.filter((n) => {
    if (filter === "Tous") return true;
    if (filter === "Non lus") return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await notificationsApi.markAllRead(currentUser?.companyId ?? undefined).catch(console.error);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };
  const markRead = async (id: string) => {
    await notificationsApi.markRead(id).catch(console.error);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };
  const deleteNotif = async (id: string) => {
    await notificationsApi.deleteOne(id).catch(console.error);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };
  const clearAll = async () => {
    if (!currentUser?.companyId) return;
    await notificationsApi.deleteAll(currentUser.companyId).catch(console.error);
    setNotifs([]);
  };

  const categories = [
    { key: "Tous", label: "Tout" },
    { key: "Non lus", label: `Non lus (${unreadCount})` },
    { key: "absence", label: "Absences" },
    { key: "conge", label: "Congés" },
    { key: "document", label: "Documents" },
    { key: "retard", label: "Retards" },
    { key: "system", label: "Système" },
  ];

  return (
    <div className="space-y-4 md:space-y-5 max-w-3xl">
      {/* Summary banner */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3"
          style={{ background: "linear-gradient(135deg, #FEF3C7, #FEF9C3)", border: "1.5px solid #FDE68A" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FDE68A" }}>
              <Bell size={17} style={{ color: "#D97706" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ fontWeight: 700, color: "#92400E" }}>
                {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs hidden sm:block" style={{ color: "#B45309" }}>
                Certaines nécessitent votre attention
              </p>
            </div>
          </div>
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80 flex-shrink-0 min-h-[44px]"
            style={{ background: "#FDE68A", color: "#92400E", fontWeight: 700 }}
          >
            <CheckCheck size={13} />
            <span className="hidden sm:inline">Tout marquer lu</span>
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key as any)}
              className="px-3 py-1.5 rounded-xl text-xs transition-all flex-shrink-0"
              style={{
                background: filter === cat.key ? "#6366F1" : "white",
                color: filter === cat.key ? "white" : "#6B7280",
                border: "1.5px solid",
                borderColor: filter === cat.key ? "#6366F1" : "#E5E7EB",
                fontWeight: filter === cat.key ? 700 : 400,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {notifs.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors flex-shrink-0 min-h-[44px]"
            style={{ fontWeight: 600 }}
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Tout effacer</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center rounded-2xl"
              style={{ background: "white", border: "1px solid #F1F3F9" }}
            >
              <Bell size={40} style={{ color: "#D1D5DB" }} className="mx-auto mb-3" />
              <p style={{ color: "#6B7280" }}>Aucune notification</p>
            </motion.div>
          ) : (
            filtered.map((n, i) => {
              const cfg = typeConfig[n.type];
              const emp = n.employeeId ? employees.find((e) => e.id === n.employeeId) : null;

              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl cursor-pointer group"
                  style={{
                    background: n.isRead ? "white" : "rgba(99,102,241,0.03)",
                    border: "1.5px solid",
                    borderColor: n.isRead ? "#F1F3F9" : "rgba(99,102,241,0.15)",
                    boxShadow: n.isRead ? "0 1px 4px rgba(0,0,0,0.03)" : "0 2px 8px rgba(99,102,241,0.08)",
                  }}
                  onClick={() => markRead(n.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <cfg.icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm" style={{ fontWeight: n.isRead ? 500 : 700, color: "#111827" }}>
                            {n.title}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
                          >
                            {cfg.label}
                          </span>
                          {!n.isRead && (
                            <div className="w-2 h-2 rounded-full" style={{ background: "#6366F1" }} />
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                          {n.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 flex-shrink-0"
                      >
                        <X size={12} style={{ color: "#EF4444" }} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      {emp && (
                        <div className="flex items-center gap-1.5">
                          <img src={emp.avatar} alt={emp.firstName} className="w-4 h-4 rounded-full object-cover" />
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>
                            {emp.firstName} {emp.lastName}
                          </p>
                        </div>
                      )}
                      <p className="text-xs" style={{ color: "#D1D5DB" }}>
                        {timeAgo(n.date)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
