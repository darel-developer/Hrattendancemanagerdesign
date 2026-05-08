import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Plus, Trash2, Eye, X, CheckCircle2, Clock, Award, User } from "lucide-react";
import { PerformanceReview } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { performanceApi } from "../services/api";

const PERIODS = [
  "T1 2025", "T2 2025", "T3 2025", "T4 2025",
  "T1 2026", "T2 2026", "T3 2026", "T4 2026",
  "Annuel 2024", "Annuel 2025",
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Brouillon: { bg: "rgba(107,114,128,0.15)", text: "#9CA3AF", icon: <Clock size={11} /> },
  Soumis:    { bg: "rgba(99,102,241,0.15)",  text: "#6366F1", icon: <Clock size={11} /> },
  Acquitté:  { bg: "rgba(16,185,129,0.15)",  text: "#10B981", icon: <CheckCircle2 size={11} /> },
};

function StarRating({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`transition-transform ${!readOnly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={22}
            fill={(hover || value) >= s ? "#F59E0B" : "none"}
            stroke={(hover || value) >= s ? "#F59E0B" : "#4B5563"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

interface ReviewModalProps {
  review?: PerformanceReview | null;
  reviewerId: string;
  employeeOptions: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Partial<PerformanceReview>) => void;
  readOnly?: boolean;
}

function ReviewModal({ review, reviewerId, employeeOptions, onClose, onSave, readOnly }: ReviewModalProps) {
  const [form, setForm] = useState({
    employeeId: review?.employeeId ?? (employeeOptions[0]?.id ?? ""),
    period: review?.period ?? PERIODS[0],
    rating: review?.rating ?? 3,
    strengths: review?.strengths ?? "",
    improvements: review?.improvements ?? "",
    goals: review?.goals ?? "",
    status: review?.status ?? "Brouillon" as const,
  });

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.employeeId || !form.period) return;
    onSave({ ...form, reviewerId, id: review?.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
          <h3 className="font-semibold text-base" style={{ color: "var(--hr-text)" }}>
            {readOnly ? "Détail de l'évaluation" : review ? "Modifier l'évaluation" : "Nouvelle évaluation"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!readOnly && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Employé</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => set("employeeId", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
                >
                  {employeeOptions.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Période</label>
                <select
                  value={form.period}
                  onChange={(e) => set("period", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
                >
                  {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {readOnly && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="block text-xs mb-1" style={{ color: "var(--hr-text-secondary)" }}>Période</span>
                <span style={{ color: "var(--hr-text)" }}>{review?.period}</span>
              </div>
              <div>
                <span className="block text-xs mb-1" style={{ color: "var(--hr-text-secondary)" }}>Statut</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: STATUS_CONFIG[review?.status ?? "Brouillon"].bg, color: STATUS_CONFIG[review?.status ?? "Brouillon"].text }}
                >
                  {STATUS_CONFIG[review?.status ?? "Brouillon"].icon}
                  {review?.status}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--hr-text-secondary)" }}>Note globale</label>
            <StarRating value={form.rating} onChange={readOnly ? undefined : (v) => set("rating", v)} readOnly={readOnly} />
          </div>

          {["strengths", "improvements", "goals"].map((field) => {
            const labels: Record<string, string> = { strengths: "Points forts", improvements: "Axes d'amélioration", goals: "Objectifs" };
            return (
              <div key={field}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>
                  {labels[field]}
                </label>
                {readOnly ? (
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--hr-text)" }}>
                    {(review as Record<string, string>)[field] || "—"}
                  </p>
                ) : (
                  <textarea
                    rows={3}
                    value={(form as Record<string, string>)[field]}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={`${labels[field]}...`}
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                    style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
                  />
                )}
              </div>
            );
          })}

          {!readOnly && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--hr-text-secondary)" }}>Statut</label>
              <div className="flex gap-2">
                {(["Brouillon", "Soumis", "Acquitté"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: form.status === s ? STATUS_CONFIG[s].bg : "var(--hr-input)",
                      color: form.status === s ? STATUS_CONFIG[s].text : "var(--hr-text-secondary)",
                      border: `1px solid ${form.status === s ? STATUS_CONFIG[s].text + "40" : "var(--hr-card-border)"}`,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-3 p-5 pt-0">
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
              {review ? "Enregistrer" : "Créer"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function PerformancePage() {
  const { currentUser, employees } = useAuth();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PerformanceReview | null>(null);
  const [viewing, setViewing] = useState<PerformanceReview | null>(null);
  const [filterPeriod, setFilterPeriod] = useState("all");

  const isManager = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const scopeEmployees = isManager
    ? employees.filter((e) =>
        currentUser?.role === "Admin"
          ? e.companyId === currentUser.companyId
          : e.department === currentUser?.department
      )
    : [];

  const employeeOptions = scopeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const load = async () => {
    if (!currentUser) return;
    try {
      const params = currentUser.role === "Employee"
        ? { employeeId: currentUser.id }
        : { companyId: currentUser.companyId ?? undefined };
      const data = await performanceApi.getAll(params);
      setReviews(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser?.id]);

  const getEmployee = (id: string) => employees.find((e) => e.id === id);

  const handleSave = async (data: Partial<PerformanceReview>) => {
    try {
      if (data.id) {
        await performanceApi.update(data.id, data);
      } else {
        await performanceApi.create(data);
      }
      setShowModal(false);
      setEditing(null);
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette évaluation ?")) return;
    try {
      await performanceApi.delete(id);
      load();
    } catch {}
  };

  const periods = ["all", ...Array.from(new Set(reviews.map((r) => r.period)))];
  const filtered = filterPeriod === "all" ? reviews : reviews.filter((r) => r.period === filterPeriod);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--hr-text)" }}>
            Évaluations de performance
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--hr-text-secondary)" }}>
            {isManager ? `${filtered.length} évaluation(s) au total` : `Mes évaluations`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }}
          >
            {periods.map((p) => <option key={p} value={p}>{p === "all" ? "Toutes les périodes" : p}</option>)}
          </select>
          {isManager && (
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }}
            >
              <Plus size={16} />
              Nouvelle évaluation
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {isManager && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Brouillon", count: reviews.filter((r) => r.status === "Brouillon").length, color: "#9CA3AF" },
            { label: "Soumis", count: reviews.filter((r) => r.status === "Soumis").length, color: "#6366F1" },
            { label: "Acquitté", count: reviews.filter((r) => r.status === "Acquitté").length, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs mt-1" style={{ color: "var(--hr-text-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Award size={40} className="text-gray-500" />
          <p className="text-sm" style={{ color: "var(--hr-text-secondary)" }}>
            {isManager ? "Aucune évaluation pour cette période." : "Vous n'avez pas encore d'évaluation."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => {
            const emp = getEmployee(review.employeeId);
            const reviewer = getEmployee(review.reviewerId);
            const cfg = STATUS_CONFIG[review.status];
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
              >
                {emp?.avatar ? (
                  <img src={emp.avatar} alt={emp.firstName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.15)" }}>
                    <User size={18} className="text-indigo-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "var(--hr-text)" }}>
                      {emp ? `${emp.firstName} ${emp.lastName}` : review.employeeId}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
                      {review.period}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: cfg.bg, color: cfg.text }}
                    >
                      {cfg.icon}
                      {review.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <StarRating value={review.rating ?? 0} readOnly />
                    {reviewer && (
                      <p className="text-xs" style={{ color: "var(--hr-text-secondary)" }}>
                        Par {reviewer.firstName} {reviewer.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewing(review)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
                    title="Voir"
                  >
                    <Eye size={15} />
                  </button>
                  {isManager && (
                    <>
                      <button
                        onClick={() => { setEditing(review); setShowModal(true); }}
                        className="p-2 rounded-lg transition-colors hover:bg-white/10"
                        style={{ color: "var(--hr-text-secondary)" }}
                        title="Modifier"
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: "#EF4444" }}
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {(showModal || viewing) && (
          <ReviewModal
            review={showModal ? editing : viewing}
            reviewerId={currentUser?.id ?? ""}
            employeeOptions={employeeOptions}
            onClose={() => { setShowModal(false); setEditing(null); setViewing(null); }}
            onSave={handleSave}
            readOnly={!!viewing && !showModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
