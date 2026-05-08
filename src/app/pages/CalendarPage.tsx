import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Timer,
  MonitorSmartphone,
  Users,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { attendanceApi, leavesApi } from "../services/api";
import type { AttendanceRecord, LeaveRequest, Employee } from "../data/mockData";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const STATUS_CONFIG: Record<
  string,
  { dot: string; bg: string; text: string; label: string; icon: React.ReactNode }
> = {
  Présent:     { dot: "#10B981", bg: "#D1FAE5", text: "#16A34A", label: "Présent",     icon: <CheckCircle2 size={12} /> },
  Télétravail: { dot: "#10B981", bg: "#CCFBF1", text: "#0D9488", label: "Télétravail", icon: <MonitorSmartphone size={12} /> },
  Absent:      { dot: "#EF4444", bg: "#FEE2E2", text: "#DC2626", label: "Absent",      icon: <XCircle size={12} /> },
  Retard:      { dot: "#F59E0B", bg: "#FEF3C7", text: "#D97706", label: "Retard",      icon: <Timer size={12} /> },
  Congé:       { dot: "#8B5CF6", bg: "#EDE9FE", text: "#7C3AED", label: "Congé",       icon: <CalendarDays size={12} /> },
};

const EMPLOYEE_DAY_BG: Record<string, { bg: string; border: string; text: string }> = {
  Présent:     { bg: "rgba(16,185,129,0.15)",  border: "#10B981", text: "#10B981" },
  Télétravail: { bg: "rgba(13,148,136,0.15)",  border: "#0D9488", text: "#0D9488" },
  Absent:      { bg: "rgba(239,68,68,0.15)",   border: "#EF4444", text: "#EF4444" },
  Retard:      { bg: "rgba(245,158,11,0.15)",  border: "#F59E0B", text: "#D97706" },
  Congé:       { bg: "rgba(139,92,246,0.15)",  border: "#8B5CF6", text: "#8B5CF6" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

function buildCalendarDays(year: number, month: number): Date[] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // ISO weekday: Monday=1 … Sunday=7. Shift so Monday=0.
  const startOffset = (firstDay.getDay() + 6) % 7; // days from previous month
  const endOffset   = (7 - ((lastDay.getDay() + 6) % 7 + 1)) % 7; // days from next month

  const days: Date[] = [];

  for (let i = startOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push(d);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  for (let i = 1; i <= endOffset; i++) {
    days.push(new Date(year, month + 1, i));
  }

  // Ensure exactly 6 rows of 7 (42 cells)
  while (days.length < 42) {
    const last = days[days.length - 1];
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push(next);
  }

  return days;
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

// ─── Skeleton Cell ─────────────────────────────────────────────────────────────

function SkeletonCell() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--hr-card)",
        border: "1px solid var(--hr-card-border)",
        minHeight: 90,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div className="p-2 space-y-1.5">
        <div className="w-6 h-3 rounded" style={{ background: "var(--hr-hover)" }} />
        <div className="w-10 h-2 rounded" style={{ background: "var(--hr-hover)" }} />
        <div className="w-8 h-2 rounded" style={{ background: "var(--hr-hover)" }} />
      </div>
    </div>
  );
}

// ─── Status Dot Row ────────────────────────────────────────────────────────────

interface DotRowProps {
  statuses: string[];
}

function DotRow({ statuses }: DotRowProps) {
  const MAX_VISIBLE = 4;
  const visible = statuses.slice(0, MAX_VISIBLE);
  const overflow = statuses.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {visible.map((s, i) => {
        const color = STATUS_CONFIG[s]?.dot ?? "#94A3B8";
        return (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
              display: "inline-block",
              boxShadow: `0 0 4px ${color}80`,
            }}
          />
        );
      })}
      {overflow > 0 && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--hr-text-muted)",
            lineHeight: 1,
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── Day Cell ──────────────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  statusDots: string[];
  onClick: () => void;
  animIndex: number;
}

function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  statusDots,
  onClick,
  animIndex,
}: DayCellProps) {
  const dayNumber = date.getDate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: animIndex * 0.012 }}
      onClick={onClick}
      className="rounded-2xl cursor-pointer transition-all"
      style={{
        background: isSelected
          ? "rgba(99,102,241,0.18)"
          : "var(--hr-card)",
        border: isSelected
          ? "2px solid #6366F1"
          : isToday
          ? "2px solid #6366F1"
          : "1px solid var(--hr-card-border)",
        opacity: isCurrentMonth ? 1 : 0.35,
        minHeight: 90,
        padding: "8px 10px",
        boxShadow: isSelected ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
        position: "relative",
      }}
    >
      {/* Day number */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: isToday ? "#6366F1" : "transparent",
          color: isToday ? "white" : "var(--hr-text)",
          fontSize: 13,
          fontWeight: isToday ? 800 : 600,
          lineHeight: 1,
        }}
      >
        {dayNumber}
      </div>

      {/* Status dots */}
      {statusDots.length > 0 && <DotRow statuses={statusDots} />}
    </motion.div>
  );
}

// ─── Employee Avatar ──────────────────────────────────────────────────────────

function EmpAvatar({ emp }: { emp: Employee }) {
  const [imgError, setImgError] = React.useState(false);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        overflow: "hidden",
        flexShrink: 0,
        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "white",
      }}
    >
      {emp.avatar && !imgError ? (
        <img
          src={emp.avatar}
          alt={emp.firstName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(emp.firstName, emp.lastName)
      )}
    </div>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

interface DayDetailPanelProps {
  date: Date;
  records: AttendanceRecord[];
  leaveStatuses: Record<string, string>; // employeeId → "Congé"
  employees: Employee[];
  onClose: () => void;
  role: string;
  currentUser: Employee | null;
}

function DayDetailPanel({
  date,
  records,
  leaveStatuses,
  employees,
  onClose,
  role,
  currentUser,
}: DayDetailPanelProps) {
  const dateStr = toYMD(date);

  // Build a merged view: attendance record OR leave
  const rows = useMemo(() => {
    return employees.map((emp) => {
      const rec = records.find((r) => r.employeeId === emp.id && r.date === dateStr);
      const onLeave = leaveStatuses[emp.id];
      const status: string = rec?.status ?? onLeave ?? "—";
      return { emp, rec, status };
    });
  }, [employees, records, dateStr, leaveStatuses]);

  const dateLabel = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      key="panel"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: "var(--hr-card)",
        border: "1px solid var(--hr-card-border)",
        boxShadow: "var(--hr-shadow)",
        maxHeight: "80vh",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #0B1437, #1E1B4B)",
          borderBottom: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div>
          <p className="text-xs capitalize" style={{ color: "#6366F1", fontWeight: 700, letterSpacing: "1px" }}>
            DÉTAILS DU JOUR
          </p>
          <p className="text-sm capitalize" style={{ color: "white", fontWeight: 700, marginTop: 2 }}>
            {dateLabel}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <X size={14} style={{ color: "white" }} />
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 px-5 py-3 flex-wrap flex-shrink-0" style={{ borderBottom: "1px solid var(--hr-card-border)" }}>
        {Object.entries(
          rows.reduce<Record<string, number>>((acc, { status }) => {
            if (status !== "—") acc[status] = (acc[status] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([st, count]) => {
          const cfg = STATUS_CONFIG[st];
          if (!cfg) return null;
          return (
            <span
              key={st}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: cfg.bg, color: cfg.text, fontWeight: 700 }}
            >
              {cfg.icon}
              {count} {cfg.label}
            </span>
          );
        })}
        {rows.every(({ status }) => status === "—") && (
          <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>Aucune donnée pour ce jour</p>
        )}
      </div>

      {/* Employee list */}
      <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
        {rows.map(({ emp, status }, i) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--hr-hover)" }}
            >
              <EmpAvatar emp={emp} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs truncate"
                  style={{ fontWeight: 700, color: "var(--hr-text)" }}
                >
                  {emp.firstName} {emp.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--hr-text-muted)" }}>
                  {emp.department} · {emp.position}
                </p>
              </div>
              {cfg ? (
                <span
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs flex-shrink-0"
                  style={{ background: cfg.bg, color: cfg.text, fontWeight: 700 }}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              ) : (
                <span
                  className="px-2 py-1 rounded-full text-xs flex-shrink-0"
                  style={{ background: "var(--hr-badge-bg)", color: "var(--hr-text-muted)", fontWeight: 600 }}
                >
                  —
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Personal Employee Calendar ───────────────────────────────────────────────

interface PersonalCalendarProps {
  records: AttendanceRecord[];
  approvedLeaves: LeaveRequest[];
  employeeId: string;
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading: boolean;
}

function PersonalCalendar({
  records,
  approvedLeaves,
  employeeId,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  loading,
}: PersonalCalendarProps) {
  const days = buildCalendarDays(year, month);
  const todayStr = toYMD(new Date());

  function getStatusForDay(dateStr: string): string | null {
    const rec = records.find((r) => r.employeeId === employeeId && r.date === dateStr);
    if (rec) return rec.status;
    const onLeave = approvedLeaves.find(
      (l) => l.employeeId === employeeId && isDateInRange(dateStr, l.startDate, l.endDate)
    );
    if (onLeave) return "Congé";
    return null;
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--hr-card)",
        border: "1px solid var(--hr-card-border)",
        boxShadow: "var(--hr-shadow)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{
          background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.25)" }}
          >
            <User size={16} style={{ color: "#A5B4FC" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#94A3B8", letterSpacing: "1px" }}>
              MON CALENDRIER
            </p>
            <p className="text-lg" style={{ color: "white", fontWeight: 800 }}>
              {MONTHS_FR[month]} {year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <ChevronLeft size={16} style={{ color: "white" }} />
          </button>
          <button
            onClick={onNextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <ChevronRight size={16} style={{ color: "white" }} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-xs py-1"
              style={{ color: "var(--hr-text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {loading
            ? Array.from({ length: 42 }).map((_, i) => <SkeletonCell key={i} />)
            : days.map((date, i) => {
                const dateStr = toYMD(date);
                const isCurrentMonth = date.getMonth() === month;
                const isToday = dateStr === todayStr;
                const status = isCurrentMonth ? getStatusForDay(dateStr) : null;
                const style = status ? EMPLOYEE_DAY_BG[status] : null;

                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, delay: i * 0.01 }}
                    className="rounded-2xl"
                    style={{
                      background: style?.bg ?? "var(--hr-hover)",
                      border: isToday
                        ? "2px solid #6366F1"
                        : style
                        ? `1.5px solid ${style.border}40`
                        : "1px solid var(--hr-card-border)",
                      opacity: isCurrentMonth ? 1 : 0.3,
                      minHeight: 64,
                      padding: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isToday ? "#6366F1" : "transparent",
                        color: isToday ? "white" : style ? style.text : "var(--hr-text)",
                        fontSize: 12,
                        fontWeight: isToday ? 800 : 600,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {status && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: style?.text ?? "var(--hr-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {status}
                      </span>
                    )}
                  </motion.div>
                );
              })}
        </div>

        {/* Legend */}
        <div
          className="flex items-center justify-center gap-4 mt-4 pt-4 flex-wrap"
          style={{ borderTop: "1px solid var(--hr-card-border)" }}
        >
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: cfg.dot,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--hr-text-muted)", fontWeight: 500 }}>
                {cfg.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin / Manager Calendar ─────────────────────────────────────────────────

interface AdminCalendarProps {
  records: AttendanceRecord[];
  approvedLeaves: LeaveRequest[];
  visibleEmployees: Employee[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading: boolean;
  role: string;
  currentUser: Employee | null;
}

function AdminCalendar({
  records,
  approvedLeaves,
  visibleEmployees,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  loading,
  role,
  currentUser,
}: AdminCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const days = buildCalendarDays(year, month);
  const todayStr = toYMD(new Date());

  // Build a per-date status dot list
  const dotMap = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};

    records.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r.status);
    });

    // Add Congé dots from approved leaves
    approvedLeaves.forEach((l) => {
      if (l.status !== "Approuvé") return;
      const start = new Date(l.startDate);
      const end   = new Date(l.endDate);
      const cur   = new Date(start);
      while (cur <= end) {
        const ds = toYMD(cur);
        if (ds >= toYMD(new Date(year, month, 1)) && ds <= toYMD(new Date(year, month + 1, 0))) {
          if (!map[ds]) map[ds] = [];
          // Only add if no attendance record already marks this employee
          const alreadyHasRecord = records.some((r) => r.employeeId === l.employeeId && r.date === ds);
          if (!alreadyHasRecord) map[ds].push("Congé");
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    return map;
  }, [records, approvedLeaves, year, month]);

  // For the detail panel: leave-statuses per employee per day
  const leaveStatusesForDay = useMemo<Record<string, string>>(() => {
    if (!selectedDate) return {};
    const ds = toYMD(selectedDate);
    const map: Record<string, string> = {};
    approvedLeaves.forEach((l) => {
      if (l.status === "Approuvé" && isDateInRange(ds, l.startDate, l.endDate)) {
        map[l.employeeId] = "Congé";
      }
    });
    return map;
  }, [selectedDate, approvedLeaves]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDate) return [];
    const ds = toYMD(selectedDate);
    return records.filter((r) => r.date === ds);
  }, [selectedDate, records]);

  return (
    <div className="flex gap-5 items-start">
      {/* Calendar card */}
      <motion.div
        layout
        className="flex-1 min-w-0 rounded-2xl overflow-hidden"
        style={{
          background: "var(--hr-card)",
          border: "1px solid var(--hr-card-border)",
          boxShadow: "var(--hr-shadow)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)",
            borderBottom: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.25)" }}
            >
              <Users size={16} style={{ color: "#A5B4FC" }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "#94A3B8", letterSpacing: "1px" }}>
                {role === "Manager" ? `DÉPARTEMENT ${currentUser?.department?.toUpperCase()}` : "TOUS LES EMPLOYÉS"}
              </p>
              <p className="text-lg" style={{ color: "white", fontWeight: 800 }}>
                {MONTHS_FR[month]} {year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft size={16} style={{ color: "white" }} />
            </button>
            <button
              onClick={onNextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <ChevronRight size={16} style={{ color: "white" }} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-xs py-1"
                style={{ color: "var(--hr-text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {loading
              ? Array.from({ length: 42 }).map((_, i) => <SkeletonCell key={i} />)
              : days.map((date, i) => {
                  const dateStr = toYMD(date);
                  const isCurrentMonth = date.getMonth() === month;
                  const isToday = dateStr === todayStr;
                  const isSelected = selectedDate ? toYMD(selectedDate) === dateStr : false;
                  const dots = isCurrentMonth ? (dotMap[dateStr] ?? []) : [];

                  return (
                    <DayCell
                      key={dateStr}
                      date={date}
                      isCurrentMonth={isCurrentMonth}
                      isToday={isToday}
                      isSelected={isSelected}
                      statusDots={dots}
                      animIndex={i}
                      onClick={() => {
                        if (!isCurrentMonth) return;
                        setSelectedDate(isSelected ? null : date);
                      }}
                    />
                  );
                })}
          </div>

          {/* Legend */}
          <div
            className="flex items-center justify-center gap-4 mt-4 pt-4 flex-wrap"
            style={{ borderTop: "1px solid var(--hr-card-border)" }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: cfg.dot,
                    display: "inline-block",
                    flexShrink: 0,
                    boxShadow: `0 0 4px ${cfg.dot}60`,
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--hr-text-muted)", fontWeight: 500 }}>
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Side panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 340 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{ flexShrink: 0, overflow: "hidden" }}
          >
            <DayDetailPanel
              date={selectedDate}
              records={selectedDayRecords}
              leaveStatuses={leaveStatusesForDay}
              employees={visibleEmployees}
              onClose={() => setSelectedDate(null)}
              role={role}
              currentUser={currentUser}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const { currentUser, employees } = useAuth();
  const role = currentUser?.role ?? "Employee";

  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [loading, setLoading]             = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves]               = useState<LeaveRequest[]>([]);

  const approvedLeaves = useMemo(
    () => leaves.filter((l) => l.status === "Approuvé"),
    [leaves]
  );

  // Visible employees depending on role
  const visibleEmployees = useMemo(() => {
    if (role === "Employee") return employees.filter((e) => e.id === currentUser?.id);
    if (role === "Manager")  return employees.filter((e) => e.department === currentUser?.department);
    return employees;
  }, [role, employees, currentUser]);

  // Fetch attendance on month change
  const fetchAttendance = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const firstDay = toYMD(new Date(year, month, 1));
      const lastDay  = toYMD(new Date(year, month + 1, 0));
      const params: { startDate: string; endDate: string; employeeId?: string } = {
        startDate: firstDay,
        endDate: lastDay,
      };
      if (role === "Employee") params.employeeId = currentUser.id;
      const data = await attendanceApi.getAll(params);
      setAttendanceRecords(data);
    } catch (err) {
      console.error("Erreur chargement pointages calendrier", err);
    } finally {
      setLoading(false);
    }
  }, [year, month, role, currentUser]);

  // Fetch leaves once on mount (or when user changes)
  useEffect(() => {
    if (!currentUser) return;
    const params =
      role === "Employee"
        ? { employeeId: currentUser.id }
        : { companyId: currentUser.companyId };
    leavesApi.getAll(params).then(setLeaves).catch(console.error);
  }, [currentUser?.id, role]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePrevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // ── Page wrapper ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page title bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden flex items-center justify-between px-6 py-5"
        style={{
          background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
          boxShadow: "0 4px 24px rgba(99,102,241,0.12)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.3)" }}
          >
            <CalendarDays size={20} style={{ color: "#A5B4FC" }} />
          </div>
          <div>
            <h1 className="text-xl" style={{ color: "white", fontWeight: 800 }}>
              Calendrier de présence
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {role === "Employee"
                ? "Votre historique mensuel de présence"
                : role === "Manager"
                ? `Vue mensuelle — Département ${currentUser?.department}`
                : "Vue mensuelle de tous les employés"}
            </p>
          </div>
        </div>

        <div
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <span style={{ color: "#A5B4FC", fontSize: 13, fontWeight: 700 }}>
            {MONTHS_FR[month]} {year}
          </span>
        </div>
      </motion.div>

      {/* Calendar body */}
      {role === "Employee" ? (
        <PersonalCalendar
          records={attendanceRecords}
          approvedLeaves={approvedLeaves}
          employeeId={currentUser?.id ?? ""}
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          loading={loading}
        />
      ) : (
        <AdminCalendar
          records={attendanceRecords}
          approvedLeaves={approvedLeaves}
          visibleEmployees={visibleEmployees}
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          loading={loading}
          role={role}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
