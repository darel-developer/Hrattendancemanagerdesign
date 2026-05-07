import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, CheckCircle2, XCircle, Clock, CalendarDays, X,
  MessageSquare, User, TrendingDown
} from "lucide-react";
import { leaveRequests, LeaveRequest } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

const leaveTypeColors: Record<string, { bg: string; text: string }> = {
  "Congé annuel": { bg: "#EDE9FE", text: "#7C3AED" },
  "Maladie": { bg: "#FEE2E2", text: "#DC2626" },
  "Congé maternité": { bg: "#FDE8FF", text: "#9333EA" },
  "RTT": { bg: "#DBEAFE", text: "#2563EB" },
  "Exceptionnel": { bg: "#FEF3C7", text: "#D97706" },
};

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  "En attente": { bg: "#FEF3C7", text: "#D97706", icon: <Clock size={12} /> },
  "Approuvé": { bg: "#D1FAE5", text: "#16A34A", icon: <CheckCircle2 size={12} /> },
  "Refusé": { bg: "#FEE2E2", text: "#DC2626", icon: <XCircle size={12} /> },
};

interface NewLeaveModalProps {
  onClose: () => void;
  onSubmit: (leave: Partial<LeaveRequest>) => void;
  currentUserId: string;
  currentUserName: string;
  leaveBalance: number;
}

function NewLeaveModal({ onClose, onSubmit, currentUserId, currentUserName, leaveBalance }: NewLeaveModalProps) {
  const [type, setType] = useState("Congé annuel");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 0);
  };

  const days = calculateDays();

  const handleSubmit = () => {
    if (!startDate || !endDate || !reason) return;
    onSubmit({
      employeeId: currentUserId,
      type: type as any,
      startDate,
      endDate,
      days,
      reason,
      status: "En attente",
      requestDate: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--hr-text)" }}>Nouvelle demande de congé</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>Demande en votre nom</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        {/* Demandeur (read-only) */}
        <div className="p-3 rounded-xl mb-4 flex items-center gap-3"
          style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)" }}
        >
          <User size={14} style={{ color: "#6366F1" }} />
          <div>
            <p className="text-xs" style={{ color: "var(--hr-text-muted)", fontWeight: 600 }}>Demandeur</p>
            <p className="text-sm" style={{ color: "var(--hr-text)", fontWeight: 700 }}>{currentUserName}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "#EDE9FE" }}>
            <CalendarDays size={11} style={{ color: "#7C3AED" }} />
            <span className="text-xs" style={{ color: "#7C3AED", fontWeight: 700 }}>{leaveBalance}j restants</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Type de congé</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            >
              {["Congé annuel", "Maladie", "RTT", "Exceptionnel", "Congé maternité"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              />
            </div>
          </div>

          {days > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: days > leaveBalance ? "#FEE2E2" : "#D1FAE5", border: `1.5px solid ${days > leaveBalance ? "#FCA5A5" : "#A7F3D0"}` }}
            >
              {days > leaveBalance ? <TrendingDown size={13} style={{ color: "#DC2626" }} /> : <CalendarDays size={13} style={{ color: "#10B981" }} />}
              <p className="text-xs" style={{ color: days > leaveBalance ? "#DC2626" : "#16A34A", fontWeight: 600 }}>
                {days} jour{days > 1 ? "s" : ""} demandé{days > 1 ? "s" : ""}
                {days > leaveBalance ? " — Solde insuffisant !" : ` · Solde restant: ${leaveBalance - days}j`}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Motif</label>
            <textarea
              placeholder="Décrivez le motif de votre demande…"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!startDate || !endDate || !reason || days === 0}
            className="flex-1 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
          >
            Soumettre
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ReviewModalProps {
  leave: LeaveRequest & { employee?: any };
  action: "approve" | "reject";
  onClose: () => void;
  onConfirm: (comment: string) => void;
}

function ReviewModal({ leave, action, onClose, onConfirm }: ReviewModalProps) {
  const [comment, setComment] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--hr-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: action === "approve" ? "#D1FAE5" : "#FEE2E2" }}
          >
            {action === "approve" ? <CheckCircle2 size={28} style={{ color: "#10B981" }} /> : <XCircle size={28} style={{ color: "#EF4444" }} />}
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--hr-text)" }}>
            {action === "approve" ? "Approuver le congé" : "Refuser le congé"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--hr-text-muted)" }}>
            {leave.employee?.firstName} {leave.employee?.lastName} · {leave.type} · {leave.days} jour{leave.days > 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Commentaire (optionnel)</label>
          <textarea
            placeholder={action === "approve" ? "Bien noté, profitez bien !" : "Raison du refus…"}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}
          >
            Annuler
          </button>
          <button onClick={() => onConfirm(comment)}
            className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
            style={{
              background: action === "approve" ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #EF4444, #DC2626)",
              fontWeight: 700,
            }}
          >
            {action === "approve" ? "Approuver" : "Refuser"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LeavesPage() {
  const { currentUser, employees } = useAuth();
  const role = currentUser?.role;
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [showNewModal, setShowNewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ leave: any; action: "approve" | "reject" } | null>(null);
  const [leaves, setLeaves] = useState(leaveRequests);

  // Role-based filtering
  const getVisibleLeaves = () => {
    if (role === "Admin") return leaves;
    if (role === "Manager") {
      const deptEmployees = employees.filter((e) => e.department === currentUser?.department).map((e) => e.id);
      return leaves.filter((l) => l.employeeId === currentUser?.id || deptEmployees.includes(l.employeeId));
    }
    // Employee: only their own
    return leaves.filter((l) => l.employeeId === currentUser?.id);
  };

  const visibleLeaves = getVisibleLeaves();
  const enriched = visibleLeaves.map((l) => ({
    ...l,
    employee: employees.find((e) => e.id === l.employeeId),
  }));

  const filtered = enriched.filter((l) =>
    filterStatus === "Tous" ? true : l.status === filterStatus
  );

  const pending = visibleLeaves.filter((l) => l.status === "En attente").length;
  const approved = visibleLeaves.filter((l) => l.status === "Approuvé").length;
  const refused = visibleLeaves.filter((l) => l.status === "Refusé").length;

  const handleNewLeave = (leave: Partial<LeaveRequest>) => {
    const newLeave: LeaveRequest = {
      id: `LVE${Date.now()}`,
      employeeId: currentUser?.id ?? "",
      type: leave.type as any,
      startDate: leave.startDate ?? "",
      endDate: leave.endDate ?? "",
      days: leave.days ?? 0,
      reason: leave.reason ?? "",
      status: "En attente",
      requestDate: new Date().toISOString().split("T")[0],
      reviewedBy: null,
      reviewDate: null,
      comment: "",
    };
    setLeaves((prev) => [newLeave, ...prev]);
  };

  const handleConfirmReview = (comment: string) => {
    if (!reviewTarget) return;
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === reviewTarget.leave.id
          ? {
              ...l,
              status: reviewTarget.action === "approve" ? "Approuvé" : "Refusé",
              comment,
              reviewedBy: currentUser?.id ?? null,
              reviewDate: new Date().toISOString().split("T")[0],
            }
          : l
      )
    );
    setReviewTarget(null);
  };

  const leaveBalance = (currentUser?.leaveBalance ?? 25) - (currentUser?.leaveUsed ?? 0);
  const canApprove = role === "Admin" || role === "Manager";

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "En attente", value: pending, color: "#D97706", bg: "#FEF3C7", icon: Clock },
          { label: "Approuvés", value: approved, color: "#16A34A", bg: "#D1FAE5", icon: CheckCircle2 },
          { label: "Refusés", value: refused, color: "#DC2626", bg: "#FEE2E2", icon: XCircle },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl" style={{ fontWeight: 800, color: "var(--hr-text)" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leave balance for employee */}
      {role === "Employee" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))", border: "1.5px solid rgba(99,102,241,0.2)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Mon solde de congés</p>
            <span style={{ color: "#6366F1", fontWeight: 800 }}>{leaveBalance}j restants</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(99,102,241,0.15)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(leaveBalance / (currentUser?.leaveBalance ?? 25)) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--hr-text-muted)" }}>
            {currentUser?.leaveUsed} jours utilisés sur {currentUser?.leaveBalance} jours annuels
          </p>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {["Tous", "En attente", "Approuvé", "Refusé"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{
                background: filterStatus === s ? "#6366F1" : "var(--hr-card)",
                color: filterStatus === s ? "white" : "var(--hr-text-muted)",
                border: "1.5px solid",
                borderColor: filterStatus === s ? "#6366F1" : "var(--hr-card-border-hard)",
                fontWeight: filterStatus === s ? 700 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
        >
          <Plus size={15} />
          Nouvelle demande
        </button>
      </div>

      {/* Leaves list */}
      <div className="space-y-3">
        {filtered.map((l, i) => {
          const cfg = statusConfig[l.status];
          const typeClr = leaveTypeColors[l.type];
          const isOwn = l.employeeId === currentUser?.id;
          const isMgr = role === "Manager" && employees.find((e) => e.id === l.employeeId)?.department === currentUser?.department;
          const canReview = (role === "Admin" || (role === "Manager" && !isOwn && isMgr)) && l.status === "En attente";

          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4"
              style={{ background: "var(--hr-card)", border: `1.5px solid ${isOwn ? "rgba(99,102,241,0.2)" : "var(--hr-card-border)"}`, boxShadow: "var(--hr-shadow)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <img src={l.employee?.avatar} alt={l.employee?.firstName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                        {l.employee?.firstName} {l.employee?.lastName}
                        {isOwn && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#EDE9FE", color: "#7C3AED", fontWeight: 600 }}>Moi</span>}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: typeClr?.bg, color: typeClr?.text, fontWeight: 600 }}>{l.type}</span>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: cfg?.bg, color: cfg?.text, fontWeight: 600 }}>
                        {cfg?.icon}{l.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays size={12} style={{ color: "var(--hr-text-light)" }} />
                        <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>
                          {new Date(l.startDate).toLocaleDateString("fr-FR")} → {new Date(l.endDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)", fontWeight: 600 }}>
                        {l.days} jour{l.days > 1 ? "s" : ""}
                      </span>
                    </div>
                    {l.reason && <p className="text-xs mt-1.5" style={{ color: "var(--hr-text-light)" }}>"{l.reason}"</p>}
                    {l.comment && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <MessageSquare size={11} style={{ color: "var(--hr-text-light)" }} className="mt-0.5 flex-shrink-0" />
                        <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{l.comment}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{new Date(l.requestDate).toLocaleDateString("fr-FR")}</p>
                  {canReview && (
                    <>
                      <button onClick={() => setReviewTarget({ leave: l, action: "approve" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
                        style={{ background: "#D1FAE5", color: "#16A34A", fontWeight: 700 }}
                      >
                        <CheckCircle2 size={13} />Approuver
                      </button>
                      <button onClick={() => setReviewTarget({ leave: l, action: "reject" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
                        style={{ background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}
                      >
                        <XCircle size={13} />Refuser
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center rounded-2xl" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
            <CalendarDays size={40} style={{ color: "var(--hr-text-light)" }} className="mx-auto mb-3" />
            <p style={{ color: "var(--hr-text-muted)" }}>Aucune demande de congé trouvée</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewModal && (
          <NewLeaveModal
            onClose={() => setShowNewModal(false)}
            onSubmit={handleNewLeave}
            currentUserId={currentUser?.id ?? ""}
            currentUserName={`${currentUser?.firstName} ${currentUser?.lastName}`}
            leaveBalance={leaveBalance}
          />
        )}
        {reviewTarget && (
          <ReviewModal
            leave={reviewTarget.leave}
            action={reviewTarget.action}
            onClose={() => setReviewTarget(null)}
            onConfirm={handleConfirmReview}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
