import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import { TeamShift, ShiftType } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { planningApi } from "../services/api";

const SHIFT_TYPES: ShiftType[] = ["Matin", "Après-midi", "Nuit", "Repos"];

const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string; border: string }> = {
  "Matin":       { bg: "rgba(99,102,241,0.2)",  text: "#818CF8", border: "rgba(99,102,241,0.4)" },
  "Après-midi":  { bg: "rgba(245,158,11,0.2)",  text: "#FCD34D", border: "rgba(245,158,11,0.4)" },
  "Nuit":        { bg: "rgba(139,92,246,0.2)",  text: "#C4B5FD", border: "rgba(139,92,246,0.4)" },
  "Repos":       { bg: "rgba(107,114,128,0.15)", text: "#9CA3AF", border: "rgba(107,114,128,0.3)" },
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DEFAULT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  "Matin":      { start: "07:00", end: "15:00" },
  "Après-midi": { start: "13:00", end: "21:00" },
  "Nuit":       { start: "21:00", end: "06:00" },
  "Repos":      { start: "00:00", end: "00:00" },
};

interface ShiftModalProps {
  shift?: TeamShift | null;
  date: string;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSave: (data: Partial<TeamShift>) => void;
  onDelete?: () => void;
}

function ShiftModal({ shift, date, employeeId, employeeName, onClose, onSave, onDelete }: ShiftModalProps) {
  const [shiftType, setShiftType] = useState<ShiftType>(shift?.shiftType ?? "Matin");
  const [startTime, setStartTime] = useState(shift?.startTime ?? DEFAULT_TIMES["Matin"].start);
  const [endTime, setEndTime] = useState(shift?.endTime ?? DEFAULT_TIMES["Matin"].end);
  const [note, setNote] = useState(shift?.note ?? "");

  const handleTypeChange = (t: ShiftType) => {
    setShiftType(t);
    if (!shift) {
      setStartTime(DEFAULT_TIMES[t].start);
      setEndTime(DEFAULT_TIMES[t].end);
    }
  };

  const handleSubmit = () => {
    onSave({ id: shift?.id, employeeId, date, shiftType, startTime, endTime, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl w-full max-w-sm"
        style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--hr-text)" }}>
              {shift ? "Modifier le quart" : "Ajouter un quart"}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-secondary)" }}>
              {employeeName} · {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--hr-text-secondary)" }}>Type de quart</label>
            <div className="grid grid-cols-2 gap-2">
              {SHIFT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className="py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: shiftType === t ? SHIFT_COLORS[t].bg : "var(--hr-input)",
                    color: shiftType === t ? SHIFT_COLORS[t].text : "var(--hr-text-secondary)",
                    border: `1px solid ${shiftType === t ? SHIFT_COLORS[t].border : "var(--hr-card-border)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {shiftType !== "Repos" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Début</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Fin</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Note (optionnel)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Remarque..."
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
            />
          </div>
        </div>

        <div className="flex gap-2 p-5 pt-0">
          {shift && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-xl transition-colors hover:bg-red-500/10"
              style={{ color: "#EF4444" }}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--hr-input)", color: "var(--hr-text-secondary)" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }}
          >
            {shift ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function PlanningPage() {
  const { currentUser, employees } = useAuth();
  const [shifts, setShifts] = useState<TeamShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [modal, setModal] = useState<{ date: string; employeeId: string; shift?: TeamShift } | null>(null);

  const isManager = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const scopeEmployees = employees.filter((e) =>
    currentUser?.role === "Admin"
      ? e.companyId === currentUser.companyId && e.status === "Actif"
      : e.department === currentUser?.department && e.status === "Actif"
  );

  const weekDates = getWeekDates(monday);
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const load = async () => {
    if (!currentUser) return;
    try {
      const data = await planningApi.getAll({
        companyId: currentUser.companyId ?? undefined,
        startDate,
        endDate,
      });
      setShifts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [monday.toISOString()]);

  const getShift = (empId: string, date: string) =>
    shifts.find((s) => s.employeeId === empId && s.date === date);

  const handleSave = async (data: Partial<TeamShift>) => {
    try {
      if (data.id) {
        await planningApi.update(data.id, data);
      } else {
        await planningApi.create(data);
      }
      setModal(null);
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await planningApi.delete(id);
      setModal(null);
      load();
    } catch {}
  };

  const prevWeek = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    setMonday(d);
    setLoading(true);
  };

  const nextWeek = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    setMonday(d);
    setLoading(true);
  };

  const isCurrentWeek = getMonday(new Date()).toISOString() === monday.toISOString();
  const weekLabel = `${new Date(startDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${new Date(endDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  if (!isManager) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm" style={{ color: "var(--hr-text-secondary)" }}>Accès réservé aux managers et administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--hr-text)" }}>Planning des équipes</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hr-text-secondary)" }}>{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-2 rounded-xl transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--hr-card-border)", color: "var(--hr-text-secondary)" }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => { setMonday(getMonday(new Date())); setLoading(true); }}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: isCurrentWeek ? "rgba(99,102,241,0.15)" : "var(--hr-card)",
              color: isCurrentWeek ? "#6366F1" : "var(--hr-text-secondary)",
              border: `1px solid ${isCurrentWeek ? "rgba(99,102,241,0.3)" : "var(--hr-card-border)"}`,
            }}
          >
            Cette semaine
          </button>
          <button
            onClick={nextWeek}
            className="p-2 rounded-xl transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--hr-card-border)", color: "var(--hr-text-secondary)" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {SHIFT_TYPES.map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: SHIFT_COLORS[t].text }} />
            <span className="text-xs" style={{ color: "var(--hr-text-secondary)" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
        {/* Header row */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `200px repeat(7, 1fr)`,
            borderBottom: "1px solid var(--hr-card-border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="px-4 py-3">
            <span className="text-xs font-medium" style={{ color: "var(--hr-text-secondary)" }}>Employé</span>
          </div>
          {weekDates.map((date, i) => {
            const d = new Date(date + "T00:00:00");
            const isToday = date === new Date().toISOString().split("T")[0];
            return (
              <div
                key={date}
                className="px-2 py-3 text-center"
                style={{ borderLeft: "1px solid var(--hr-card-border)" }}
              >
                <p className="text-xs font-medium" style={{ color: isToday ? "#6366F1" : "var(--hr-text-secondary)" }}>
                  {DAYS_FR[i]}
                </p>
                <p
                  className="text-sm font-bold mt-0.5"
                  style={{
                    color: isToday ? "#6366F1" : "var(--hr-text)",
                    background: isToday ? "rgba(99,102,241,0.15)" : "transparent",
                    borderRadius: "6px",
                    padding: "1px 4px",
                    display: "inline-block",
                  }}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Employee rows */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scopeEmployees.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm" style={{ color: "var(--hr-text-secondary)" }}>Aucun employé actif.</p>
          </div>
        ) : (
          scopeEmployees.map((emp, empIdx) => (
            <div
              key={emp.id}
              className="grid"
              style={{
                gridTemplateColumns: `200px repeat(7, 1fr)`,
                borderTop: empIdx > 0 ? "1px solid var(--hr-card-border)" : undefined,
              }}
            >
              {/* Employee name */}
              <div className="flex items-center gap-2 px-4 py-3">
                {emp.avatar ? (
                  <img src={emp.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt={emp.firstName} />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.15)" }}>
                    <span className="text-xs font-bold text-indigo-400">{emp.firstName[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--hr-text)" }}>
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--hr-text-secondary)" }}>{emp.department}</p>
                </div>
              </div>

              {/* Day cells */}
              {weekDates.map((date) => {
                const shift = getShift(emp.id, date);
                const isToday = date === new Date().toISOString().split("T")[0];
                const colors = shift ? (SHIFT_COLORS[shift.shiftType] ?? SHIFT_COLORS["Matin"]) : null;

                return (
                  <div
                    key={date}
                    className="px-1.5 py-2 flex items-center justify-center cursor-pointer transition-all hover:bg-white/5"
                    style={{ borderLeft: "1px solid var(--hr-card-border)", background: isToday ? "rgba(99,102,241,0.03)" : undefined }}
                    onClick={() => setModal({ date, employeeId: emp.id, shift: shift ?? undefined })}
                    title={shift ? `${shift.shiftType} ${shift.startTime ? shift.startTime + "–" + shift.endTime : ""}` : "Ajouter un quart"}
                  >
                    {shift ? (
                      <div
                        className="w-full rounded-lg px-1.5 py-1 text-center"
                        style={{ background: colors!.bg, border: `1px solid ${colors!.border}` }}
                      >
                        <p className="text-xs font-semibold truncate" style={{ color: colors!.text }}>
                          {shift.shiftType === "Repos" ? "Repos" : `${shift.startTime}–${shift.endTime}`}
                        </p>
                        {shift.shiftType !== "Repos" && (
                          <p className="text-xs" style={{ color: colors!.text, opacity: 0.8 }}>{shift.shiftType}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <ShiftModal
            shift={modal.shift}
            date={modal.date}
            employeeId={modal.employeeId}
            employeeName={(() => {
              const emp = scopeEmployees.find((e) => e.id === modal.employeeId);
              return emp ? `${emp.firstName} ${emp.lastName}` : modal.employeeId;
            })()}
            onClose={() => setModal(null)}
            onSave={handleSave}
            onDelete={modal.shift ? () => handleDelete(modal.shift!.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
