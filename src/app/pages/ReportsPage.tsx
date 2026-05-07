import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download, FileText, TrendingUp, Users, Clock, CalendarDays,
  Send, X, CheckCircle2, Edit3, ChevronRight, Printer
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Employee, LeaveRequest, AttendanceRecord, Report } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { leavesApi, attendanceApi, notificationsApi, reportsApi } from "../services/api";

const LEAVE_TYPE_COLORS: Record<string, string> = {
  "Congé annuel": "#6366F1",
  "RTT": "#14B8A6",
  "Maladie": "#EF4444",
  "Exceptionnel": "#F59E0B",
  "Congé maternité": "#EC4899",
};

function computePeriodCharts(
  records: AttendanceRecord[],
  leaves: LeaveRequest[],
  empIds: string[],
  period: "semaine" | "mois" | "trimestre"
) {
  const now = new Date();
  const filtered = records.filter((r) => empIds.includes(r.employeeId));

  const buildPoints = () => {
    if (period === "semaine") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const day = filtered.filter((r) => r.date === dateStr);
        const total = day.length || 1;
        const presents = day.filter((r) => r.status === "Présent").length;
        const absences = day.filter((r) => r.status === "Absent").length;
        const retards = day.filter((r) => r.status === "Retard").length;
        const hours = day.reduce((s, r) => s + (r.hoursWorked ?? 0), 0);
        return {
          label: d.toLocaleDateString("fr-FR", { weekday: "short" }),
          taux: day.length === 0 ? 0 : Math.round((presents / total) * 100),
          absences,
          retards,
          heures: presents > 0 ? Math.round((hours / presents) * 10) / 10 : 0,
        };
      });
    }
    if (period === "mois") {
      return Array.from({ length: 4 }, (_, i) => {
        const wEnd = new Date(now);
        wEnd.setDate(now.getDate() - (3 - i) * 7);
        const wStart = new Date(wEnd);
        wStart.setDate(wEnd.getDate() - 6);
        const s = wStart.toISOString().split("T")[0];
        const e = wEnd.toISOString().split("T")[0];
        const week = filtered.filter((r) => r.date >= s && r.date <= e);
        const total = week.length || 1;
        const presents = week.filter((r) => r.status === "Présent").length;
        const hours = week.reduce((s2, r) => s2 + (r.hoursWorked ?? 0), 0);
        return {
          label: `S${i + 1}`,
          taux: week.length === 0 ? 0 : Math.round((presents / total) * 100),
          absences: week.filter((r) => r.status === "Absent").length,
          retards: week.filter((r) => r.status === "Retard").length,
          heures: presents > 0 ? Math.round((hours / presents) * 10) / 10 : 0,
        };
      });
    }
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(now.getMonth() - (2 - i));
      const month = d.toISOString().slice(0, 7);
      const mRecs = filtered.filter((r) => r.date.startsWith(month));
      const total = mRecs.length || 1;
      const presents = mRecs.filter((r) => r.status === "Présent").length;
      const hours = mRecs.reduce((s, r) => s + (r.hoursWorked ?? 0), 0);
      return {
        label: d.toLocaleDateString("fr-FR", { month: "short" }),
        taux: mRecs.length === 0 ? 0 : Math.round((presents / total) * 100),
        absences: mRecs.filter((r) => r.status === "Absent").length,
        retards: mRecs.filter((r) => r.status === "Retard").length,
        heures: presents > 0 ? Math.round((hours / presents) * 10) / 10 : 0,
      };
    });
  };

  const points = buildPoints();
  const days = period === "semaine" ? 7 : period === "mois" ? 30 : 90;
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - days);
  const fromStr = fromDate.toISOString().split("T")[0];
  const filteredLeaves = leaves.filter(
    (l) => empIds.includes(l.employeeId) && l.startDate >= fromStr
  );
  const totalLeaves = filteredLeaves.length || 1;
  const leaveTypeData = Object.entries(LEAVE_TYPE_COLORS).map(([name, color]) => ({
    name,
    value: Math.round((filteredLeaves.filter((l) => l.type === name).length / totalLeaves) * 100),
    color,
  })).filter((d) => d.value > 0);

  return { points, leaveTypeData };
}

// ─── PDF Generator ─────────────────────────────────────────────────────────
async function generatePDF(reportType: string, empList: Employee[], leaveList: LeaveRequest[]) {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const totalSalary = empList.reduce((s, e) => s + (e.salary ?? 0), 0);
  const activeCount = empList.filter((e) => e.status === "Actif").length;
  const pendingCount = leaveList.filter((l) => l.status === "En attente").length;

  const deptStats = ["Ingénierie", "RH", "Marketing", "Finance", "Direction", "Design"].map((dept) => {
    const emps = empList.filter((e) => e.department === dept);
    const avgSalary = emps.length > 0 ? Math.round(emps.reduce((s, e) => s + (e.salary ?? 0), 0) / emps.length) : 0;
    const tauxMap: Record<string, number> = { Direction: 98, RH: 96, Finance: 94, Design: 91, Ingénierie: 88, Marketing: 72 };
    return { dept, count: emps.length, avgSalary, taux: tauxMap[dept] ?? 90 };
  });

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) { alert("Activez les popups pour générer le PDF."); return; }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${reportType} — HR Manager</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111827; background: white; }
        .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px 40px; }
        .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
        .header p { font-size: 13px; opacity: 0.85; }
        .header .date { font-size: 11px; opacity: 0.7; margin-top: 4px; }
        .content { padding: 30px 40px; }
        .section-title { font-size: 14px; font-weight: 700; color: #4F46E5; border-bottom: 2px solid #EDE9FE; padding-bottom: 8px; margin-bottom: 16px; margin-top: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-box .value { font-size: 20px; font-weight: 800; color: #4F46E5; }
        .stat-box .label { font-size: 10px; color: #6B7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #F3F4F6; text-align: left; padding: 8px 12px; font-size: 10px; color: #6B7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 10px 12px; border-bottom: 1px solid #F9FAFB; }
        tr:last-child td { border-bottom: none; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
        .badge-green { background: #D1FAE5; color: #16A34A; }
        .badge-yellow { background: #FEF3C7; color: #D97706; }
        .badge-red { background: #FEE2E2; color: #DC2626; }
        .footer { margin-top: 40px; padding: 16px 40px; background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; display: flex; justify-content: space-between; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>HR Manager — ${reportType}</h1>
        <p>Rapport généré automatiquement par la plateforme RH</p>
        <p class="date">Généré le ${today}</p>
      </div>
      <div class="content">
        <div class="section-title">Résumé exécutif</div>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="value">${empList.length}</div>
            <div class="label">Total employés</div>
          </div>
          <div class="stat-box">
            <div class="value">${activeCount}</div>
            <div class="label">Employés actifs</div>
          </div>
          <div class="stat-box">
            <div class="value">87%</div>
            <div class="label">Taux de présence</div>
          </div>
          <div class="stat-box">
            <div class="value">${pendingCount}</div>
            <div class="label">Congés en attente</div>
          </div>
          <div class="stat-box">
            <div class="value">${totalSalary.toLocaleString("fr-FR")} FCFA</div>
            <div class="label">Masse salariale</div>
          </div>
          <div class="stat-box">
            <div class="value">${leaveList.filter(l => l.status === "Approuvé").length}</div>
            <div class="label">Congés approuvés</div>
          </div>
        </div>

        <div class="section-title">Effectifs par département</div>
        <table>
          <thead>
            <tr>
              <th>Département</th>
              <th>Effectif</th>
              <th>Salaire moyen</th>
              <th>Taux présence</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            ${deptStats.map((d) => `
              <tr>
                <td><strong>${d.dept}</strong></td>
                <td>${d.count} employé${d.count !== 1 ? "s" : ""}</td>
                <td>${d.avgSalary.toLocaleString("fr-FR")} FCFA</td>
                <td>${d.taux}%</td>
                <td><span class="badge ${d.taux >= 90 ? "badge-green" : d.taux >= 80 ? "badge-yellow" : "badge-red"}">${d.taux}/100</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="section-title">Liste des employés actifs</div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Poste</th>
              <th>Département</th>
              <th>Contrat</th>
              <th>Salaire brut</th>
            </tr>
          </thead>
          <tbody>
            ${empList.filter(e => e.status === "Actif").map((e) => `
              <tr>
                <td>${e.firstName} ${e.lastName}</td>
                <td>${e.position}</td>
                <td>${e.department}</td>
                <td>${e.contractType}</td>
                <td>${(e.salary ?? 0).toLocaleString("fr-FR")} FCFA</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="footer">
        <span>HR Manager — Plateforme RH · Document confidentiel</span>
        <span>${reportType} · ${today}</span>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// ─── Read Report Modal ──────────────────────────────────────────────────────
function ReadReportModal({ report, sender, onClose, onMarkRead }: {
  report: Report;
  sender?: { firstName: string; lastName: string };
  onClose: () => void;
  onMarkRead: () => void;
}) {
  useEffect(() => {
    if (!report.isRead) {
      reportsApi.markRead(report.id).catch(console.error);
      onMarkRead();
    }
  }, [report.id]);

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
        className="w-full max-w-2xl rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex-1 min-w-0 mr-3">
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--hr-text)" }}>{report.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)" }}>{report.type}</span>
              <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                De : {sender ? `${sender.firstName} ${sender.lastName}` : report.senderId}
              </span>
              <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                · {new Date(report.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        <div className="rounded-xl p-4"
          style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)", whiteSpace: "pre-wrap", color: "var(--hr-text)", fontSize: "0.875rem", lineHeight: "1.7", minHeight: 120 }}
        >
          {report.content}
        </div>

        <button onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl text-sm"
          style={{ background: "var(--hr-hover)", color: "var(--hr-text-muted)", fontWeight: 600, border: "1px solid var(--hr-card-border-hard)" }}
        >
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Write Report Modal ─────────────────────────────────────────────────────
interface WriteReportModalProps {
  onClose: () => void;
  fixedRecipientId?: string;
}

function WriteReportModal({ onClose, fixedRecipientId }: WriteReportModalProps) {
  const { currentUser, employees: allEmployees } = useAuth();
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState({
    title: "",
    type: "Rapport de performance",
    content: "",
    recipientId: fixedRecipientId ?? "",
    customEmail: "",
    includeData: true,
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    leavesApi.getAll().then(setAllLeaves).catch(console.error);
  }, []);

  const recipients = allEmployees.filter((e) => e.id !== currentUser?.id);

  const handleSend = async () => {
    if (!form.title || !form.content || (!form.recipientId && !form.customEmail)) return;
    setLoading(true);
    try {
      await reportsApi.create({
        senderId: currentUser!.id,
        recipientId: form.recipientId && form.recipientId !== "custom" ? form.recipientId : undefined,
        title: form.title,
        type: form.type,
        content: form.content,
      });
      if (form.recipientId && form.recipientId !== "custom") {
        await notificationsApi.create({
          type: "document",
          title: `Rapport reçu : ${form.title}`,
          message: `${currentUser?.firstName} ${currentUser?.lastName} vous a envoyé un rapport "${form.title}". ${form.content.slice(0, 120)}${form.content.length > 120 ? "…" : ""}`,
          employeeId: form.recipientId,
        });
      }
      setSent(true);
    } catch (err) {
      console.error("Erreur envoi rapport:", err);
    }
    setLoading(false);
  };

  const handleExportAndSend = async () => {
    await generatePDF(form.title || form.type, allEmployees, allLeaves);
    handleSend();
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      >
        <motion.div
          initial={{ scale: 0.8 }} animate={{ scale: 1 }}
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--hr-card)", maxWidth: 380 }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
            <CheckCircle2 size={32} style={{ color: "#10B981" }} />
          </div>
          <h2 style={{ fontWeight: 800, color: "var(--hr-text)", fontSize: "1.1rem" }}>Rapport envoyé !</h2>
          <p className="text-sm mt-2" style={{ color: "var(--hr-text-muted)" }}>
            Votre rapport "{form.title}" a été envoyé avec succès.
          </p>
          <button onClick={onClose}
            className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
          >
            Fermer
          </button>
        </motion.div>
      </motion.div>
    );
  }

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
        className="w-full max-w-2xl rounded-2xl p-6"
        style={{ background: "var(--hr-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--hr-text)" }}>Rédiger un rapport</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
              De: {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.role})
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Titre du rapport *</label>
              <input
                placeholder="Ex: Bilan de présence — Avril 2026"
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Type de rapport</label>
              <select
                value={form.type}
                onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
              >
                {["Rapport de performance", "Rapport de présence", "Rapport RH global", "Rapport des congés", "Rapport salarial", "Rapport personnalisé"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Destinataire *</label>
              {fixedRecipientId ? (
                <div className="w-full px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1.5px solid rgba(99,102,241,0.3)", color: "var(--hr-text)" }}>
                  {(() => { const r = allEmployees.find(e => e.id === fixedRecipientId); return r ? `${r.firstName} ${r.lastName} (${r.role})` : fixedRecipientId; })()}
                </div>
              ) : (
                <select
                  value={form.recipientId}
                  onChange={(e) => setForm(p => ({ ...p, recipientId: e.target.value, customEmail: "" }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                >
                  <option value="">— Sélectionner un destinataire —</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.firstName} {r.lastName} ({r.role} — {r.department})
                    </option>
                  ))}
                  <option value="custom">Adresse email personnalisée…</option>
                </select>
              )}
            </div>
            {form.recipientId === "custom" && (
              <div className="col-span-2">
                <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Email du destinataire *</label>
                <input
                  type="email"
                  placeholder="destinataire@example.com"
                  value={form.customEmail}
                  onChange={(e) => setForm(p => ({ ...p, customEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>Contenu du rapport *</label>
            <textarea
              placeholder="Rédigez ici le contenu de votre rapport…&#10;&#10;Vous pouvez inclure:&#10;- Résumé de la période&#10;- Points clés&#10;- Recommandations&#10;- Observations"
              rows={10}
              value={form.content}
              onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--hr-input-bg)", border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text)", fontFamily: "inherit" }}
            />
          </div>

          {/* Quick templates */}
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--hr-text-light)", fontWeight: 600 }}>MODÈLES RAPIDES</p>
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  label: "Bilan mensuel",
                  content: `Rapport de présence — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}\n\n` +
                    `Taux de présence global: 87%\n` +
                    `Employés actifs: ${allEmployees.filter(e => e.status === "Actif").length}/${allEmployees.length}\n` +
                    `Congés approuvés: ${allLeaves.filter(l => l.status === "Approuvé").length}\n\n` +
                    `Points d'attention:\n- Absences non justifiées à surveiller\n- Demandes de congés en attente de validation\n\nRecommandations:\n- [À compléter]`
                },
                {
                  label: "Performance",
                  content: `Rapport de performance — Q1 2026\n\nIndicateurs clés:\n- Taux de présence: 87% (objectif: 90%)\n- Retards: 3% (objectif: <2%)\n- Satisfaction équipe: N/A\n\nDépartements performants:\n1. Direction: 98%\n2. RH: 96%\n3. Finance: 94%\n\nPoints d'amélioration:\n[À compléter]`
                },
                {
                  label: "Absences",
                  content: `Rapport des absences — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}\n\nTotal absences: 2\nAbsences justifiées: 1\nAbsences non justifiées: 1\n\nImpact financier estimé:\n${allEmployees.filter(e => e.status === "Actif").length} employés × taux journalier moyen\n\nMesures prises:\n[À compléter]`
                },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={() => setForm(p => ({ ...p, content: t.content, title: p.title || t.label }))}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
                  style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)", border: "1px solid var(--hr-card-border-hard)" }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--hr-hover)", border: "1px solid var(--hr-card-border-hard)" }}>
            <input
              type="checkbox"
              id="includeData"
              checked={form.includeData}
              onChange={(e) => setForm(p => ({ ...p, includeData: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="includeData" className="text-xs" style={{ color: "var(--hr-text-sec)", fontWeight: 600 }}>
              Joindre les données statistiques (tableaux, graphiques)
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: "1.5px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}
          >
            Annuler
          </button>
          <button
            onClick={() => generatePDF(form.title || form.type, allEmployees, allLeaves)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ border: "1.5px solid #6366F1", color: "#6366F1", fontWeight: 700, background: "rgba(99,102,241,0.08)" }}
          >
            <Printer size={14} />
            Prévisualiser PDF
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !form.title || !form.content || (!form.recipientId && !form.customEmail)}
            className="flex items-center gap-2 flex-1 py-2.5 justify-center rounded-xl text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={14} />
                Envoyer le rapport
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function ReportsPage() {
  const { currentUser, employees: allEmployees } = useAuth();
  const role = currentUser?.role;
  const [period, setPeriod] = useState<"semaine" | "mois" | "trimestre">("mois");
  const [showWriteReport, setShowWriteReport] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [receivedReports, setReceivedReports] = useState<Report[]>([]);
  const [sentReports, setSentReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    leavesApi.getAll().then(setAllLeaves).catch(console.error);
    attendanceApi.getAll().then(setAttendanceRecords).catch(console.error);
    if (currentUser?.id) {
      reportsApi.getReceived(currentUser.id).then(setReceivedReports).catch(console.error);
      reportsApi.getSent(currentUser.id).then(setSentReports).catch(console.error);
    }
  }, [currentUser?.id]);

  const deptEmpIds = useMemo(() => {
    if (role === "Admin") return allEmployees.map((e) => e.id);
    return allEmployees
      .filter((e) => e.department === currentUser?.department)
      .map((e) => e.id);
  }, [allEmployees, role, currentUser?.department]);

  const { points: chartPoints, leaveTypeData } = useMemo(
    () => computePeriodCharts(attendanceRecords, allLeaves, deptEmpIds, period),
    [attendanceRecords, allLeaves, deptEmpIds, period]
  );

  const handleExport = async (title: string) => {
    setGenerating(title);
    await generatePDF(title, allEmployees, allLeaves);
    setGenerating(null);
  };

  const reportCards = role === "Admin"
    ? [
        { title: "Rapport de présence", subtitle: "Pointages complets", icon: Clock, color: "#6366F1", bg: "#EDE9FE" },
        { title: "Rapport des congés", subtitle: "Toutes demandes", icon: CalendarDays, color: "#10B981", bg: "#D1FAE5" },
        { title: "Rapport des absences", subtitle: "Absences & retards", icon: Users, color: "#EF4444", bg: "#FEE2E2" },
        { title: "Rapport RH global", subtitle: "Vue d'ensemble", icon: FileText, color: "#F59E0B", bg: "#FEF3C7" },
      ]
    : [
        { title: "Rapport de présence", subtitle: `Département ${currentUser?.department}`, icon: Clock, color: "#6366F1", bg: "#EDE9FE" },
        { title: "Rapport d'équipe", subtitle: "Votre département", icon: Users, color: "#10B981", bg: "#D1FAE5" },
      ];

  // ─── Employee view ────────────────────────────────────────────────────────
  if (role === "Employee") {
    const myManager = allEmployees.find((e) => e.id === currentUser?.manager);
    const refreshReports = () => {
      if (!currentUser?.id) return;
      reportsApi.getReceived(currentUser.id).then(setReceivedReports).catch(console.error);
      reportsApi.getSent(currentUser.id).then(setSentReports).catch(console.error);
    };
    const allMyReports = [
      ...receivedReports.map(r => ({ ...r, dir: "received" as const })),
      ...sentReports.map(r => ({ ...r, dir: "sent" as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="space-y-5 max-w-2xl">
        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, #0B1437, #1E1B4B)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 700 }}>Mes rapports</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                {myManager
                  ? `Manager : ${myManager.firstName} ${myManager.lastName} (${myManager.department})`
                  : "Aucun manager assigné"}
              </p>
            </div>
            {myManager && (
              <button
                onClick={() => setShowWriteReport(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
              >
                <Edit3 size={14} />
                Envoyer un rapport
              </button>
            )}
          </div>
        </motion.div>

        {/* Reports list */}
        {allMyReports.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-16 text-center rounded-2xl"
            style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
          >
            <FileText size={40} style={{ color: "var(--hr-text-light)" }} className="mx-auto mb-3" />
            <p style={{ color: "var(--hr-text-muted)" }}>Aucun rapport pour l'instant</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>
                Tous mes rapports ({allMyReports.length})
              </p>
            </div>
            <div className="p-4 space-y-2">
              {allMyReports.map((r, i) => {
                const other = allEmployees.find((e) => e.id === (r.dir === "sent" ? r.recipientId : r.senderId));
                return (
                  <motion.div key={r.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:opacity-90 transition-all"
                    style={{
                      background: !r.isRead && r.dir === "received" ? "rgba(99,102,241,0.08)" : "var(--hr-hover)",
                      border: `1px solid ${!r.isRead && r.dir === "received" ? "rgba(99,102,241,0.25)" : "var(--hr-card-border)"}`,
                    }}
                    onClick={() => r.dir === "received" && setSelectedReport(r)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {!r.isRead && r.dir === "received" && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#6366F1" }} />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs truncate" style={{ fontWeight: !r.isRead && r.dir === "received" ? 800 : 600, color: "var(--hr-text)" }}>
                          {r.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
                          {r.dir === "sent" ? `Envoyé à ${other ? `${other.firstName} ${other.lastName}` : "—"}` : `De ${other ? `${other.firstName} ${other.lastName}` : "—"}`}
                          {" · "}{new Date(r.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: r.dir === "sent" ? "#D1FAE5" : "#EDE9FE", color: r.dir === "sent" ? "#16A34A" : "#6366F1", fontWeight: 700 }}>
                        {r.dir === "sent" ? "Envoyé" : "Reçu"}
                      </span>
                      {r.dir === "received" && (
                        <button onClick={() => setSelectedReport(r)}
                          className="text-xs px-3 py-1.5 rounded-lg hover:opacity-80"
                          style={{ background: "#6366F1", color: "white", fontWeight: 700 }}>
                          Lire
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showWriteReport && myManager && (
            <WriteReportModal
              onClose={() => { setShowWriteReport(false); refreshReports(); }}
              fixedRecipientId={myManager.id}
            />
          )}
          {selectedReport && (
            <ReadReportModal
              key={selectedReport.id}
              report={selectedReport}
              sender={allEmployees.find((e) => e.id === selectedReport.senderId)}
              onClose={() => setSelectedReport(null)}
              onMarkRead={() => setReceivedReports((prev) => prev.map((r) => r.id === selectedReport.id ? { ...r, isRead: true } : r))}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Export shortcuts */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Rapports disponibles</h2>
        <button
          onClick={() => setShowWriteReport(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
        >
          <Edit3 size={15} />
          Rédiger un rapport
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {reportCards.map((r, i) => (
          <motion.div key={r.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(99,102,241,0.12)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(r.title)}
              className="text-left w-full rounded-2xl p-4 transition-all"
              style={{ background: "var(--hr-card)", border: "1.5px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: r.bg }}>
                  <r.icon size={18} style={{ color: r.color }} />
                </div>
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)" }}>
                  {generating === r.title ? (
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={11} />
                  )}
                  PDF
                </div>
              </div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{r.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{r.subtitle}</p>
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      {/* Received reports inbox */}
      {receivedReports.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Rapports reçus</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
                {receivedReports.length} rapport{receivedReports.length > 1 ? "s" : ""}
              </p>
            </div>
            {receivedReports.filter((r) => !r.isRead).length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#EDE9FE", color: "#6366F1", fontWeight: 700 }}>
                {receivedReports.filter((r) => !r.isRead).length} non lu{receivedReports.filter((r) => !r.isRead).length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="p-4 space-y-2">
            {receivedReports.map((r, i) => {
              const sender = allEmployees.find((e) => e.id === r.senderId);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:opacity-90"
                  style={{
                    background: r.isRead ? "var(--hr-hover)" : "rgba(99,102,241,0.08)",
                    border: `1px solid ${r.isRead ? "var(--hr-card-border)" : "rgba(99,102,241,0.25)"}`,
                  }}
                  onClick={() => setSelectedReport(r)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {!r.isRead && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#6366F1" }} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ fontWeight: r.isRead ? 600 : 800, color: "var(--hr-text)" }}>{r.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
                        {sender ? `${sender.firstName} ${sender.lastName}` : r.senderId}
                        {" · "}{new Date(r.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-xs px-2 py-0.5 rounded-full hidden sm:block" style={{ background: "var(--hr-badge-bg)", color: "var(--hr-badge-text)" }}>
                      {r.type}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(r); }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "#6366F1", color: "white", fontWeight: 700 }}
                    >
                      Lire
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Analyses statistiques</h2>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
          {(["semaine", "mois", "trimestre"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all capitalize"
              style={{
                background: period === p ? "#6366F1" : "transparent",
                color: period === p ? "white" : "var(--hr-text-muted)",
                fontWeight: period === p ? 700 : 400,
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Taux de présence</p>
              <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Évolution — {period === "semaine" ? "7 derniers jours" : period === "mois" ? "4 dernières semaines" : "3 derniers mois"}</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EDE9FE" }}>
              <TrendingUp size={15} style={{ color: "#6366F1" }} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartPoints}>
              <defs>
                <linearGradient id="taux2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hr-card-border)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)", color: "var(--hr-text)" }} formatter={(v: number) => [`${v}%`, "Taux"]} />
              <Area type="monotone" dataKey="taux" stroke="#6366F1" strokeWidth={2.5} fill="url(#taux2)" dot={{ fill: "#6366F1", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Absences & Retards</p>
              <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Par mois</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[{ color: "#EF4444", label: "Absences" }, { color: "#F59E0B", label: "Retards" }].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span style={{ color: "var(--hr-text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hr-card-border)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }} />
              <Line type="monotone" dataKey="absences" stroke="#EF4444" strokeWidth={2.5} dot={{ fill: "#EF4444", r: 4 }} name="Absences" />
              <Line type="monotone" dataKey="retards" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: "#F59E0B", r: 4 }} name="Retards" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Heures travaillées</p>
              <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>Moyenne par {period === "semaine" ? "jour" : period === "mois" ? "semaine" : "mois"}</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs" style={{ background: "#D1FAE5", color: "#16A34A", fontWeight: 700 }}>
              Moy. {chartPoints.length > 0 ? (chartPoints.reduce((s, p) => s + p.heures, 0) / chartPoints.filter(p => p.heures > 0).length || 0).toFixed(1) : "0"}h
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartPoints}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hr-card-border)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }} formatter={(v: number) => [`${v}h`, "Heures"]} />
              <Bar dataKey="heures" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Heures travaillées" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="mb-4">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Types de congés</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>Répartition — {period === "semaine" ? "7 derniers jours" : period === "mois" ? "30 derniers jours" : "90 derniers jours"}</p>
          </div>
          {leaveTypeData.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>Aucun congé pour cette période</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={leaveTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {leaveTypeData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {leaveTypeData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <p className="text-xs" style={{ color: "var(--hr-text-sec)" }}>{d.name}</p>
                    </div>
                    <p className="text-xs" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{d.value}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Salary calculation table (Admin only) */}
      {role === "Admin" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Calcul des salaires — Absences</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>Déductions automatiques basées sur les absences non justifiées</p>
            </div>
            <button
              onClick={() => handleExport("Rapport salarial")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text-sec)", fontWeight: 600, background: "var(--hr-hover)" }}
            >
              <Download size={12} />
              Exporter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--hr-table-head)", borderBottom: "1px solid var(--hr-card-border)" }}>
                  {["Employé", "Salaire brut", "Jours travaillés/22", "Absences inject.", "Déduction", "Salaire calculé"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs" style={{ color: "var(--hr-text-light)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allEmployees.filter(e => e.status === "Actif").map((emp, i) => {
                  const myRecords = attendanceRecords.filter(r => r.employeeId === emp.id);
                  const unjustifiedAbsences = myRecords.filter(r => r.status === "Absent" && (r.note ?? "").includes("Non justifié")).length;
                  const salary = emp.salary ?? 0;
                  const dailyRate = salary / 22;
                  const deduction = unjustifiedAbsences * dailyRate;
                  const calculated = salary - deduction;
                  return (
                    <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="border-b transition-colors"
                      style={{ borderColor: "var(--hr-card-border)" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={emp.avatar} alt={emp.firstName} className="w-7 h-7 rounded-lg object-cover" />
                          <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{salary.toLocaleString("fr-FR")} FCFA</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm" style={{ color: "var(--hr-text-sec)" }}>{22 - unjustifiedAbsences}/22</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          background: unjustifiedAbsences > 0 ? "#FEE2E2" : "#D1FAE5",
                          color: unjustifiedAbsences > 0 ? "#DC2626" : "#16A34A",
                          fontWeight: 700,
                        }}>
                          {unjustifiedAbsences} jour{unjustifiedAbsences !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm" style={{ color: deduction > 0 ? "#EF4444" : "var(--hr-text-muted)", fontWeight: 600 }}>
                          -{deduction.toFixed(0)} FCFA
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm" style={{ fontWeight: 800, color: calculated < salary ? "#EF4444" : "#10B981" }}>
                          {calculated.toLocaleString("fr-FR")} FCFA
                        </p>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showWriteReport && <WriteReportModal onClose={() => setShowWriteReport(false)} />}
        {selectedReport && (
          <ReadReportModal
            key={selectedReport.id}
            report={selectedReport}
            sender={allEmployees.find((e) => e.id === selectedReport.senderId)}
            onClose={() => setSelectedReport(null)}
            onMarkRead={() => setReceivedReports((prev) => prev.map((r) => r.id === selectedReport.id ? { ...r, isRead: true } : r))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}