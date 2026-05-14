import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, XCircle, Timer, MonitorSmartphone, CalendarDays,
  Clock, ChevronLeft, ChevronRight, Download, Edit3, AlertCircle, X
} from "lucide-react";
import { AttendanceRecord } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { attendanceApi } from "../services/api";

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  "Présent": { bg: "#D1FAE5", text: "#16A34A", icon: <CheckCircle2 size={13} />, label: "Présent" },
  "Absent": { bg: "#FEE2E2", text: "#DC2626", icon: <XCircle size={13} />, label: "Absent" },
  "Retard": { bg: "#FEF3C7", text: "#D97706", icon: <Timer size={13} />, label: "Retard" },
  "Congé": { bg: "#EDE9FE", text: "#7C3AED", icon: <CalendarDays size={13} />, label: "Congé" },
  "Télétravail": { bg: "#CCFBF1", text: "#0D9488", icon: <MonitorSmartphone size={13} />, label: "Télétravail" },
};

function computeCheckInStatus(
  checkInTime: string,
  workStart: string,
  lateTolerance: number
): "Présent" | "Retard" {
  const [wh, wm] = workStart.split(":").map(Number);
  const [ch, cm] = checkInTime.split(":").map(Number);
  return ch * 60 + cm > wh * 60 + wm + lateTolerance ? "Retard" : "Présent";
}

// ─── Employee Personal Check-In Widget ──────────────────────────────────────
function PersonalCheckIn({ employeeId, todayRecord, onRefresh }: {
  employeeId: string;
  todayRecord?: AttendanceRecord;
  onRefresh?: () => void;
}) {
  const { currentCompany } = useAuth();
  const [time, setTime] = useState(new Date());
  const [checkInState, setCheckInState] = useState<"none" | "in" | "out">("none");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [note, setNote] = useState("");
  const [workMode, setWorkMode] = useState<"présentiel" | "télétravail">("présentiel");
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [recordedStatus, setRecordedStatus] = useState<string>("");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Restore state from DB record after re-login
  useEffect(() => {
    if (!todayRecord) return;
    setSavedRecordId(todayRecord.id);
    if (todayRecord.status) setRecordedStatus(todayRecord.status);
    if (todayRecord.checkOut) {
      setCheckInTime(todayRecord.checkIn ?? "");
      setCheckOutTime(todayRecord.checkOut);
      setCheckInState("out");
    } else if (todayRecord.checkIn) {
      setCheckInTime(todayRecord.checkIn);
      setCheckInState("in");
    }
  }, [todayRecord?.id, todayRecord?.checkOut]);

  const formatTime = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const formatTimeFull = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const handleCheckIn = async () => {
    // Guard against double check-in
    if (todayRecord?.checkIn) {
      setCheckInTime(todayRecord.checkIn);
      setSavedRecordId(todayRecord.id);
      setCheckInState("in");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const recordedTime = showManualEntry && manualTime ? manualTime : formatTime(time);
    const status = workMode === "télétravail"
      ? "Télétravail"
      : currentCompany
        ? computeCheckInStatus(recordedTime, currentCompany.workStart ?? "09:00", currentCompany.lateTolerance ?? 5)
        : "Présent";
    try {
      const created = await attendanceApi.create({
        employeeId,
        date: today,
        checkIn: recordedTime,
        status,
        note: note || "",
      });
      setSavedRecordId(created.id);
      setRecordedStatus(created.status ?? status);
      onRefresh?.();
    } catch (err) {
      console.error("Erreur pointage entrée", err);
    }
    setCheckInTime(recordedTime);
    setCheckInState("in");
    setShowManualEntry(false);
  };

  const handleCheckOut = async () => {
    const outTime = formatTime(time);
    const id = savedRecordId || todayRecord?.id;
    if (id) {
      const [ch, cm] = checkInTime.split(":").map(Number);
      const [oh, om] = outTime.split(":").map(Number);
      const diffMinutes = oh * 60 + om - (ch * 60 + cm);
      const hoursWorked = diffMinutes > 0 ? Math.round((diffMinutes / 60) * 100) / 100 : null;
      try {
        await attendanceApi.update(id, {
          checkOut: outTime,
          ...(hoursWorked !== null ? { hoursWorked } : {}),
        });
        onRefresh?.();
      } catch (err) {
        console.error("Erreur pointage sortie", err);
      }
    }
    setCheckOutTime(outTime);
    setCheckInState("out");
  };

  // todayRecord comes from parent via props

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)", border: "1px solid rgba(99,102,241,0.3)" }}
    >
      {/* Header with clock */}
      <div className="p-6 text-center border-b border-white/10">
        <p className="text-xs mb-2" style={{ color: "#94A3B8", letterSpacing: "2px" }}>HEURE ACTUELLE</p>
        <p className="text-5xl text-white mb-1" style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-2px" }}>
          {formatTimeFull(time)}
        </p>
        <p className="text-sm" style={{ color: "#6366F1" }}>
          {time.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Work mode toggle */}
        {checkInState === "none" && (
          <div className="flex gap-2">
            {(["présentiel", "télétravail"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setWorkMode(mode)}
                className="flex-1 py-2 rounded-xl text-xs transition-all capitalize"
                style={{
                  background: workMode === mode ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)",
                  border: workMode === mode ? "1.5px solid #6366F1" : "1.5px solid rgba(255,255,255,0.1)",
                  color: workMode === mode ? "#A5B4FC" : "#6B7280",
                  fontWeight: workMode === mode ? 700 : 400,
                }}
              >
                {mode === "présentiel" ? "🏢 Présentiel" : "🏠 Télétravail"}
              </button>
            ))}
          </div>
        )}

        {/* Status display */}
        {checkInState !== "none" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.15)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                <span className="text-xs text-white" style={{ fontWeight: 600 }}>Entrée pointée</span>
              </div>
              <span style={{ color: "#10B981", fontWeight: 800 }}>{checkInTime}</span>
            </div>
            {checkInState === "out" && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.15)" }}>
                <div className="flex items-center gap-2">
                  <XCircle size={14} style={{ color: "#EF4444" }} />
                  <span className="text-xs text-white" style={{ fontWeight: 600 }}>Sortie pointée</span>
                </div>
                <span style={{ color: "#EF4444", fontWeight: 800 }}>{checkOutTime}</span>
              </div>
            )}
            {recordedStatus && (() => {
              const cfg = statusConfig[recordedStatus];
              return cfg ? (
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <span className="text-xs" style={{ color: "#94A3B8" }}>Statut</span>
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.text, fontWeight: 700 }}>
                    {cfg.icon}{cfg.label}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Manual time entry */}
        <AnimatePresence>
          {showManualEntry && checkInState === "none" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={13} style={{ color: "#F59E0B" }} />
                  <p className="text-xs" style={{ color: "#F59E0B", fontWeight: 600 }}>Saisir l'heure d'arrivée réelle</p>
                </div>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
                />
                <input
                  placeholder="Note (facultatif)…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {checkInState === "none" && (
          <div className="space-y-2">
            <button
              onClick={handleCheckIn}
              className="w-full rounded-xl text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 min-h-[64px]"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 700, padding: "1rem" }}
            >
              <CheckCircle2 size={18} />
              ✓ Pointer mon arrivée — {formatTime(time)}
            </button>
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="w-full py-2 rounded-xl text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Edit3 size={11} className="inline mr-1" />
              {showManualEntry ? "Utiliser l'heure actuelle" : "Je suis arrivé plus tôt — saisir l'heure"}
            </button>
          </div>
        )}

        {checkInState === "in" && (
          <button
            onClick={() => void handleCheckOut()}
            className="w-full rounded-xl text-white transition-all hover:opacity-90 active:scale-95 min-h-[64px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", fontWeight: 700, padding: "1rem" }}
          >
            ✕ Pointer ma sortie — {formatTime(time)}
          </button>
        )}

        {checkInState === "out" && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl" style={{ background: "rgba(99,102,241,0.15)" }}>
            <CheckCircle2 size={16} style={{ color: "#A5B4FC" }} />
            <p className="text-sm" style={{ color: "#A5B4FC", fontWeight: 700 }}>Journée complétée ✓</p>
          </div>
        )}

        {/* Already checked in today */}
        {todayRecord && checkInState === "none" && (
          <div className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="text-xs text-center" style={{ color: "#A5B4FC" }}>
              Aujourd'hui : <strong>{todayRecord.checkIn}</strong> → {todayRecord.checkOut ?? "en cours"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Attendance Table (Admin/Manager view) ────────────────────────────────────
function AttendanceTable({ records, employees }: { records: AttendanceRecord[]; employees: any[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl py-16 text-center" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
        <Clock size={40} style={{ color: "var(--hr-text-light)" }} className="mx-auto mb-3" />
        <p style={{ color: "var(--hr-text-muted)" }}>Aucun enregistrement pour ce jour</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--hr-table-head)", borderBottom: "1px solid var(--hr-card-border)" }}>
                {["Employé", "Département", "Entrée", "Sortie", "Heures", "Statut", "Note"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs" style={{ color: "var(--hr-text-light)", fontWeight: 700, letterSpacing: "0.5px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                if (!emp) return null;
                const cfg = statusConfig[r.status];
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors"
                    style={{ borderColor: "var(--hr-card-border)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt={emp.firstName} className="w-8 h-8 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)" }}>{emp.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ fontWeight: 600, color: r.checkIn ? "#10B981" : "var(--hr-text-light)" }}>{r.checkIn ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ fontWeight: 600, color: r.checkOut ? "#EF4444" : "var(--hr-text-light)" }}>
                        {r.checkOut ?? (r.status === "Présent" ? "En cours…" : "—")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm" style={{ fontWeight: 700, color: "#6366F1" }}>
                        {r.hoursWorked !== null && r.hoursWorked > 0 ? `${r.hoursWorked}h` : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full w-fit"
                        style={{ background: cfg?.bg, color: cfg?.text, fontWeight: 600 }}
                      >
                        {cfg?.icon}{r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{r.note || "—"}</p>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {records.map((r, i) => {
          const emp = employees.find((e) => e.id === r.employeeId);
          if (!emp) return null;
          const cfg = statusConfig[r.status];
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-4"
              style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <img src={emp.avatar} alt={emp.firstName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{emp.department}</p>
                </div>
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: cfg?.bg, color: cfg?.text, fontWeight: 600 }}>
                  {cfg?.icon}{r.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-2 text-center" style={{ background: "var(--hr-hover)" }}>
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Entrée</p>
                  <p className="text-sm" style={{ fontWeight: 700, color: r.checkIn ? "#10B981" : "var(--hr-text-muted)" }}>{r.checkIn ?? "—"}</p>
                </div>
                <div className="rounded-xl p-2 text-center" style={{ background: "var(--hr-hover)" }}>
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Sortie</p>
                  <p className="text-sm" style={{ fontWeight: 700, color: r.checkOut ? "#EF4444" : "var(--hr-text-muted)" }}>{r.checkOut ?? "—"}</p>
                </div>
                <div className="rounded-xl p-2 text-center" style={{ background: "var(--hr-hover)" }}>
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Heures</p>
                  <p className="text-sm" style={{ fontWeight: 700, color: "#6366F1" }}>{r.hoursWorked ? `${r.hoursWorked}h` : "—"}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export function AttendancePage() {
  const { currentUser, employees } = useAuth();
  const role = currentUser?.role;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [myTodayRecord, setMyTodayRecord] = useState<AttendanceRecord | undefined>();

  useEffect(() => {
    if (!currentUser) return;
    const fetch = () => {
      if (role === "Employee") {
        attendanceApi.getAll({ employeeId: currentUser.id }).then(setAttendanceRecords).catch(console.error);
      } else {
        attendanceApi.getAll({ date: selectedDate }).then(setAttendanceRecords).catch(console.error);
        if (role === "Manager") {
          const today = new Date().toISOString().split("T")[0];
          attendanceApi.getAll({ employeeId: currentUser.id, date: today })
            .then((records) => setMyTodayRecord(records[0]))
            .catch(console.error);
        }
      }
    };
    fetch();
    // Polling 8s pour Admin/Manager (pointages kiosk en temps réel), 20s pour Employee
    const interval = role === "Employee" ? 20000 : 8000;
    const t = setInterval(fetch, interval);
    return () => clearInterval(t);
  }, [role, selectedDate, currentUser?.id]);

  const navigateDate = (dir: "prev" | "next") => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === "next" ? 1 : -1));
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const refreshRecords = () => {
    if (!currentUser) return;
    attendanceApi.getAll({ employeeId: currentUser.id }).then(setAttendanceRecords).catch(console.error);
  };

  const refreshMyRecord = () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split("T")[0];
    attendanceApi.getAll({ employeeId: currentUser.id, date: today })
      .then((records) => setMyTodayRecord(records[0]))
      .catch(console.error);
  };

  const statuses = ["Tous", "Présent", "Absent", "Retard", "Congé", "Télétravail"];

  // For employee: only their own records
  if (role === "Employee") {
    const myRecords = attendanceRecords.filter((r) => r.employeeId === currentUser?.id);
    const history = myRecords.slice(0, 10);

    return (
      <div className="space-y-4 md:space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <PersonalCheckIn
            employeeId={currentUser?.id ?? ""}
            todayRecord={attendanceRecords.find((r) => r.employeeId === currentUser?.id && r.date === new Date().toISOString().split("T")[0])}
            onRefresh={refreshRecords}
          />

          {/* Personal history */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
          >
            <p className="text-sm mb-4" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Mon historique de présence</p>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--hr-text-muted)" }}>Aucun historique disponible</p>
              ) : (
                history.map((r, i) => {
                  const cfg = statusConfig[r.status];
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "var(--hr-hover)" }}
                    >
                      <div>
                        <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>
                          {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>
                          {r.checkIn ?? "—"} → {r.checkOut ?? "—"}
                          {r.hoursWorked ? ` · ${r.hoursWorked}h` : ""}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: cfg?.bg, color: cfg?.text, fontWeight: 600 }}
                      >
                        {cfg?.icon}{r.status}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Admin / Manager view: table with filters (records already filtered by date from API)
  const visibleRecords = role === "Manager"
    ? attendanceRecords.filter((r) => employees.find((e) => e.id === r.employeeId && e.department === currentUser?.department))
    : attendanceRecords;

  const filtered = visibleRecords.filter((r) => filterStatus === "Tous" || r.status === filterStatus);

  const exportCSV = () => {
    const getEmpName = (id: string) => {
      const e = employees.find((emp) => emp.id === id);
      return e ? `${e.firstName} ${e.lastName}` : id;
    };
    const rows = [
      ["Employé", "Date", "Entrée", "Sortie", "Statut", "Heures travaillées", "Note"],
      ...filtered.map((r) => [
        getEmpName(r.employeeId),
        r.date,
        r.checkIn ?? "",
        r.checkOut ?? "",
        r.status,
        r.hoursWorked != null ? String(r.hoursWorked) : "",
        r.note ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presences_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    presents: visibleRecords.filter((r) => r.status === "Présent" || r.status === "Télétravail").length,
    absents: visibleRecords.filter((r) => r.status === "Absent").length,
    retards: visibleRecords.filter((r) => r.status === "Retard").length,
    conges: visibleRecords.filter((r) => r.status === "Congé").length,
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Manager personal check-in */}
      {role === "Manager" && (
        <PersonalCheckIn
          employeeId={currentUser?.id ?? ""}
          todayRecord={myTodayRecord}
          onRefresh={refreshMyRecord}
        />
      )}

      {/* Daily summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, #0B1437, #1E1B4B)", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          <p className="text-xs mb-4" style={{ color: "#94A3B8", letterSpacing: "1px" }}>RÉSUMÉ</p>
          <div className="space-y-3">
            {[
              { label: "Présents", value: stats.presents, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
              { label: "Absents", value: stats.absents, color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
              { label: "Retards", value: stats.retards, color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
              { label: "En congé", value: stats.conges, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: s.bg }}>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</p>
                <p style={{ color: s.color, fontWeight: 800 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
              Résumé du {role === "Manager" ? `département ${currentUser?.department}` : "jour"}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateDate("prev")} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--hr-card-border-hard)" }}>
                <ChevronLeft size={14} style={{ color: "var(--hr-text-muted)" }} />
              </button>
              <span className="text-xs" style={{ color: "var(--hr-text-sec)", fontWeight: 600, minWidth: "110px", textAlign: "center" }}>
                {new Date(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <button onClick={() => navigateDate("next")} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--hr-card-border-hard)" }}>
                <ChevronRight size={14} style={{ color: "var(--hr-text-muted)" }} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Présents", value: stats.presents, color: "#10B981", bg: "#D1FAE5", total: visibleRecords.length },
              { label: "Absents", value: stats.absents, color: "#EF4444", bg: "#FEE2E2", total: visibleRecords.length },
              { label: "Retards", value: stats.retards, color: "#F59E0B", bg: "#FEF3C7", total: visibleRecords.length },
              { label: "En congé", value: stats.conges, color: "#7C3AED", bg: "#EDE9FE", total: visibleRecords.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: s.bg }}>
                <p className="text-2xl" style={{ fontWeight: 800, color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.5)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.total > 0 ? (s.value / s.total) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--hr-input-bg)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${visibleRecords.length > 0 ? (stats.presents / visibleRecords.length) * 100 : 0}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6366F1, #10B981)" }}
              />
            </div>
            <p className="text-sm" style={{ fontWeight: 800, color: "#6366F1", minWidth: "40px" }}>
              {visibleRecords.length > 0 ? Math.round((stats.presents / visibleRecords.length) * 100) : 0}%
            </p>
            <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>taux de présence</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs transition-all flex-shrink-0"
              style={{
                background: filterStatus === s ? (s === "Tous" ? "#6366F1" : statusConfig[s]?.bg ?? "#6366F1") : "var(--hr-card)",
                color: filterStatus === s ? (s === "Tous" ? "white" : statusConfig[s]?.text ?? "white") : "var(--hr-text-muted)",
                border: "1.5px solid",
                borderColor: filterStatus === s ? (s === "Tous" ? "#6366F1" : statusConfig[s]?.text ?? "#6366F1") : "var(--hr-card-border-hard)",
                fontWeight: filterStatus === s ? 700 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all flex-shrink-0"
          style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-sec)", fontWeight: 600, background: "var(--hr-card)" }}
        >
          <Download size={14} />
          <span className="hidden sm:inline">Exporter CSV</span>
        </button>
      </div>

      <AttendanceTable records={filtered} employees={employees} />
    </div>
  );
}
