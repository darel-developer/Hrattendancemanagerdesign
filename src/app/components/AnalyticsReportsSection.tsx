import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  BarChart2, Calendar, Users, TrendingUp, AlertTriangle, ShieldCheck,
  User, Play, X, Trash2, ChevronRight, Download, RefreshCw, FileBarChart,
} from "lucide-react";
import { analyticsApi, AnalyticsReport } from "../services/api";
import { useAuth } from "../context/AuthContext";

const REPORT_TYPES = [
  { id: "attendance_daily",   label: "Présence journalière",  icon: BarChart2,    color: "#6366F1", desc: "Détail par jour et par employé" },
  { id: "attendance_monthly", label: "Présence mensuelle",    icon: BarChart2,    color: "#8B5CF6", desc: "Synthèse mensuelle consolidée" },
  { id: "leaves",             label: "Rapport des congés",    icon: Calendar,     color: "#10B981", desc: "Demandes, soldes, approbations" },
  { id: "performance",        label: "Performance",           icon: TrendingUp,   color: "#F59E0B", desc: "Évaluations et classements" },
  { id: "disciplinary",       label: "Rapport disciplinaire", icon: AlertTriangle, color: "#EF4444", desc: "Absences récurrentes, retards" },
  { id: "executive",          label: "Rapport exécutif",      icon: FileBarChart, color: "#0EA5E9", desc: "Vue consolidée pour la direction" },
  { id: "individual",         label: "Rapport individuel",    icon: User,         color: "#EC4899", desc: "Rapport complet par employé" },
  { id: "compliance",         label: "Conformité RH",         icon: ShieldCheck,  color: "#14B8A6", desc: "Documents, contrats, échéances" },
];

const STATUS_COLORS: Record<string, string> = {
  Présent: "#10B981", Retard: "#F59E0B", Absent: "#EF4444",
  Télétravail: "#6366F1", Congé: "#8B5CF6",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function KpiCard({ label, value, sub, color }: { label: string; value: any; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--hr-text-muted)", fontWeight: 600 }}>{label}</p>
      <p className="text-2xl" style={{ fontWeight: 900, color: color || "var(--hr-text)" }}>{value ?? "—"}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{sub}</p>}
    </div>
  );
}

// ─── Generator Modal ─────────────────────────────────────────────────────────
function GeneratorModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (r: AnalyticsReport) => void }) {
  const { currentUser, employees } = useAuth();
  const [type, setType] = useState(REPORT_TYPES[0].id);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const handleGenerate = async () => {
    setLoading(true); setError("");
    try {
      const r = await analyticsApi.generate({
        type, periodStart, periodEnd,
        department: department || undefined,
        employeeId: employeeId || undefined,
        companyId: currentUser?.companyId,
      });
      onGenerated(r);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const selected = REPORT_TYPES.find(t => t.id === type)!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border-hard)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Générer un rapport</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        {/* Type selection */}
        <p className="text-xs mb-2" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>TYPE DE RAPPORT</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {REPORT_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
              style={{
                background: type === t.id ? `${t.color}18` : "var(--hr-hover)",
                border: `1.5px solid ${type === t.id ? t.color : "transparent"}`,
              }}>
              <t.icon size={14} style={{ color: t.color, flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-xs truncate" style={{ fontWeight: 700, color: "var(--hr-text)" }}>{t.label}</p>
                <p className="text-xs truncate" style={{ color: "var(--hr-text-light)", fontSize: 10 }}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Period */}
        <p className="text-xs mb-2" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>PÉRIODE</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[["Du", periodStart, setPeriodStart], ["Au", periodEnd, setPeriodEnd]].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="text-xs mb-1 block" style={{ color: "var(--hr-text-light)" }}>{label as string}</label>
              <input type="date" value={val as string}
                onChange={e => (set as any)(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
            </div>
          ))}
        </div>

        {/* Department */}
        {type !== "individual" && (
          <>
            <p className="text-xs mb-2" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>DÉPARTEMENT (optionnel)</p>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-4"
              style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
              <option value="">Tous les départements</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </>
        )}

        {/* Employee (individual only) */}
        {type === "individual" && (
          <>
            <p className="text-xs mb-2" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>EMPLOYÉ *</p>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-4"
              style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
              <option value="">Sélectionner un employé</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.department}</option>)}
            </select>
          </>
        )}

        {error && <p className="text-xs mb-3 text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleGenerate} disabled={loading || (type === "individual" && !employeeId)}
            className="flex-1 py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)`, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play size={13} />Générer</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Report Viewer ────────────────────────────────────────────────────────────
function ReportViewer({ report, onClose }: { report: AnalyticsReport; onClose: () => void }) {
  const d = report.data;
  const typeMeta = REPORT_TYPES.find(t => t.id === report.type);
  const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899", "#14B8A6"];

  function exportPDF() {
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) { alert("Activez les popups"); return; }
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const kpis = d?.kpis ? Object.entries(d.kpis).filter(([, v]) => typeof v !== 'object').map(([k, v]) =>
      `<div class="stat-box"><div class="value">${v}</div><div class="label">${k.replace(/([A-Z])/g, ' $1')}</div></div>`
    ).join('') : '';

    const empTable = (d?.employees || []).slice(0, 50).map((e: any) =>
      `<tr>${Object.values(e).filter((_, i) => i < 8).map(v =>
        `<td>${v ?? '—'}</td>`).join('')}</tr>`
    ).join('');

    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>${report.title}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#111}
      .header{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;padding:28px 40px}
      .header h1{font-size:20px;font-weight:800}.header p{font-size:12px;opacity:.8;margin-top:4px}
      .content{padding:28px 40px}.section{margin:20px 0}.section-title{font-size:13px;font-weight:700;color:#4F46E5;border-bottom:2px solid #EDE9FE;padding-bottom:6px;margin-bottom:14px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
      .stat-box{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center}
      .stat-box .value{font-size:18px;font-weight:800;color:#4F46E5}.stat-box .label{font-size:9px;color:#6B7280;margin-top:2px;text-transform:capitalize}
      table{width:100%;border-collapse:collapse;font-size:11px}th{background:#F3F4F6;padding:8px;text-align:left;font-size:10px;color:#6B7280;font-weight:700;text-transform:uppercase}
      td{padding:8px;border-bottom:1px solid #F9FAFB}
      </style></head><body>
      <div class="header"><h1>${report.title}</h1>
      <p>${fmtDate(report.periodStart)} → ${fmtDate(report.periodEnd)}</p>
      <p style="opacity:.6;font-size:10px">Généré le ${today} · HR Manager</p></div>
      <div class="content">
      <div class="section"><div class="section-title">Indicateurs clés</div><div class="stats">${kpis}</div></div>
      ${empTable ? `<div class="section"><div class="section-title">Détail par employé</div><table><thead><tr>${Object.keys((d?.employees || [{}])[0] || {}).filter((_, i) => i < 8).map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>${empTable}</tbody></table></div>` : ''}
      </div></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        className="w-full max-w-4xl rounded-t-3xl sm:rounded-3xl"
        style={{ background: "var(--hr-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: "var(--hr-card)", borderColor: "var(--hr-card-border)" }}>
          <div className="flex items-center gap-3">
            {typeMeta && <typeMeta.icon size={18} style={{ color: typeMeta.color }} />}
            <div>
              <p className="text-sm" style={{ fontWeight: 800, color: "var(--hr-text)" }}>{report.title}</p>
              <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>
                {fmtDate(report.periodStart)} → {fmtDate(report.periodEnd)}
                {report.department ? ` · ${report.department}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
              <Download size={12} /> PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--hr-hover)" }}>
              <X size={16} style={{ color: "var(--hr-text-muted)" }} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPIs */}
          {d?.kpis && (
            <div>
              <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Indicateurs clés</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(d.kpis).filter(([, v]) => typeof v !== "object" && v !== null).map(([k, v], i) => (
                  <KpiCard key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={String(v)}
                    color={i === 0 ? "#6366F1" : undefined} />
                ))}
              </div>
            </div>
          )}

          {/* Attendance chart */}
          {d?.days && d.days.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "var(--hr-hover)" }}>
              <p className="text-xs mb-4 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Évolution de la présence</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={d.days.slice(-30)}>
                  <defs>
                    <linearGradient id="gPresence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(8)} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Taux présence"]} />
                  <Area type="monotone" dataKey="tauxPresence" stroke="#6366F1" fill="url(#gPresence)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Leaves charts */}
          {d?.byStatus && d.byStatus.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-4" style={{ background: "var(--hr-hover)" }}>
                <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Par statut</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={d.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} label={({ status, count }) => `${status}: ${count}`}>
                      {d.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {d.byType && (
                <div className="rounded-2xl p-4" style={{ background: "var(--hr-hover)" }}>
                  <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Par type</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={d.byType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="type" type="category" tick={{ fontSize: 9 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Performance chart */}
          {d?.byRating && d.byRating.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "var(--hr-hover)" }}>
              <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Distribution des notes</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={d.byRating}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Executive effectif */}
          {d?.effectif?.parDepartement && (
            <div className="rounded-2xl p-4" style={{ background: "var(--hr-hover)" }}>
              <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Effectif par département</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={d.effectif.parDepartement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="department" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Employee table */}
          {d?.employees && d.employees.length > 0 && (
            <div>
              <p className="text-xs mb-3 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Détail par employé</p>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--hr-card-border)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "var(--hr-hover)" }}>
                        <th className="px-4 py-2.5 text-left" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Employé</th>
                        <th className="px-4 py-2.5 text-left" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Dépt</th>
                        {d.employees[0]?.presents !== undefined && <>
                          <th className="px-4 py-2.5 text-center" style={{ color: "#10B981", fontWeight: 700 }}>Présents</th>
                          <th className="px-4 py-2.5 text-center" style={{ color: "#F59E0B", fontWeight: 700 }}>Retards</th>
                          <th className="px-4 py-2.5 text-center" style={{ color: "#EF4444", fontWeight: 700 }}>Absences</th>
                          <th className="px-4 py-2.5 text-center" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Taux %</th>
                        </>}
                        {d.employees[0]?.noteMoyenne !== undefined && <>
                          <th className="px-4 py-2.5 text-center" style={{ color: "#F59E0B", fontWeight: 700 }}>Note /5</th>
                          <th className="px-4 py-2.5 text-center" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Évals</th>
                        </>}
                        {d.employees[0]?.risque !== undefined && <th className="px-4 py-2.5 text-center" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Risque</th>}
                        {d.employees[0]?.soldeRestant !== undefined && <>
                          <th className="px-4 py-2.5 text-center" style={{ color: "#10B981", fontWeight: 700 }}>Solde restant</th>
                          <th className="px-4 py-2.5 text-center" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Demandes</th>
                        </>}
                      </tr>
                    </thead>
                    <tbody>
                      {d.employees.slice(0, 50).map((e: any, i: number) => (
                        <tr key={e.id || i} className="hover:opacity-80 transition-opacity"
                          style={{ borderBottom: "1px solid var(--hr-card-border)" }}>
                          <td className="px-4 py-2.5">
                            <p style={{ fontWeight: 700, color: "var(--hr-text)" }}>{e.firstName} {e.lastName}</p>
                          </td>
                          <td className="px-4 py-2.5" style={{ color: "var(--hr-text-muted)" }}>{e.department}</td>
                          {e.presents !== undefined && <>
                            <td className="px-4 py-2.5 text-center" style={{ color: "#10B981", fontWeight: 700 }}>{e.presents}</td>
                            <td className="px-4 py-2.5 text-center" style={{ color: "#F59E0B", fontWeight: 700 }}>{e.retards}</td>
                            <td className="px-4 py-2.5 text-center" style={{ color: "#EF4444", fontWeight: 700 }}>{e.absences}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: e.tauxPresence >= 90 ? "#D1FAE5" : e.tauxPresence >= 70 ? "#FEF3C7" : "#FEE2E2", color: e.tauxPresence >= 90 ? "#16A34A" : e.tauxPresence >= 70 ? "#D97706" : "#DC2626" }}>
                                {e.tauxPresence}%
                              </span>
                            </td>
                          </>}
                          {e.noteMoyenne !== undefined && <>
                            <td className="px-4 py-2.5 text-center">
                              {e.noteMoyenne ? <span style={{ color: "#F59E0B", fontWeight: 800 }}>{e.noteMoyenne}/5</span> : <span style={{ color: "var(--hr-text-light)" }}>—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center" style={{ color: "var(--hr-text-muted)" }}>{e.evaluations}</td>
                          </>}
                          {e.risque !== undefined && <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: e.risque === "élevé" ? "#FEE2E2" : e.risque === "moyen" ? "#FEF3C7" : "#D1FAE5", color: e.risque === "élevé" ? "#DC2626" : e.risque === "moyen" ? "#D97706" : "#16A34A" }}>
                              {e.risque}
                            </span>
                          </td>}
                          {e.soldeRestant !== undefined && <>
                            <td className="px-4 py-2.5 text-center" style={{ fontWeight: 700, color: e.soldeRestant < 5 ? "#EF4444" : "#10B981" }}>{e.soldeRestant}j</td>
                            <td className="px-4 py-2.5 text-center" style={{ color: "var(--hr-text-muted)" }}>{e.demandesTotal}</td>
                          </>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Individual report */}
          {d?.employee && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-4 col-span-2" style={{ background: "var(--hr-hover)" }}>
                <p className="text-xs mb-2 uppercase tracking-wider" style={{ color: "var(--hr-text-muted)", fontWeight: 700 }}>Profil</p>
                <div className="flex items-center gap-4">
                  {d.employee.avatar && <img src={d.employee.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                  <div>
                    <p className="text-base font-bold" style={{ color: "var(--hr-text)" }}>{d.employee.firstName} {d.employee.lastName}</p>
                    <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{d.employee.position} · {d.employee.department}</p>
                    <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{d.employee.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export function AnalyticsReportsSection() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null);
  const [activeType, setActiveType] = useState<string>("all");

  const loadReports = () => {
    if (!currentUser?.companyId) return;
    setLoading(true);
    analyticsApi.list({ companyId: currentUser.companyId })
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, [currentUser?.companyId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce rapport ?")) return;
    await analyticsApi.delete(id).catch(console.error);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const filtered = activeType === "all" ? reports : reports.filter(r => r.type === activeType);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm" style={{ fontWeight: 800, color: "var(--hr-text)" }}>Analyses RH</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>
            Rapports analytiques générés à partir de vos données
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadReports}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--hr-hover)", border: "1px solid var(--hr-card-border)" }}>
            <RefreshCw size={15} style={{ color: "var(--hr-text-muted)" }} />
          </button>
          <button onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontWeight: 700 }}>
            <BarChart2 size={14} /> Nouveau rapport
          </button>
        </div>
      </div>


      {/* Filter tabs */}
      {reports.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveType("all")}
            className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap"
            style={{ background: activeType === "all" ? "#6366F1" : "var(--hr-hover)", color: activeType === "all" ? "white" : "var(--hr-text-muted)", fontWeight: 700 }}>
            Tous ({reports.length})
          </button>
          {[...new Set(reports.map(r => r.type))].map(t => {
            const meta = REPORT_TYPES.find(rt => rt.id === t);
            return (
              <button key={t} onClick={() => setActiveType(t)}
                className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap"
                style={{ background: activeType === t ? (meta?.color || "#6366F1") : "var(--hr-hover)", color: activeType === t ? "white" : "var(--hr-text-muted)", fontWeight: 700 }}>
                {meta?.label || t} ({reports.filter(r => r.type === t).length})
              </button>
            );
          })}
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl"
          style={{ background: "var(--hr-card)", border: "1px dashed var(--hr-card-border)" }}>
          <BarChart2 size={36} style={{ color: "var(--hr-text-light)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--hr-text-muted)", fontWeight: 600 }}>Aucun rapport généré</p>
          <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>Cliquez sur "Nouveau rapport" pour générer votre premier rapport analytique</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r, i) => {
            const meta = REPORT_TYPES.find(t => t.id === r.type);
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md"
                style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
                onClick={() => setSelectedReport(r)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: meta ? `${meta.color}18` : "var(--hr-hover)" }}>
                  {meta ? <meta.icon size={18} style={{ color: meta.color }} /> : <FileBarChart size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--hr-text)" }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>
                    {fmtDate(r.periodStart)} → {fmtDate(r.periodEnd)}
                    {r.department ? ` · ${r.department}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <button onClick={e => handleDelete(r.id, e)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Trash2 size={12} style={{ color: "#EF4444" }} />
                  </button>
                  <ChevronRight size={14} style={{ color: "var(--hr-text-light)" }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showGenerator && <GeneratorModal onClose={() => setShowGenerator(false)} onGenerated={r => { setReports(p => [r, ...p]); setSelectedReport(r); }} />}
        {selectedReport && <ReportViewer report={selectedReport} onClose={() => setSelectedReport(null)} />}
      </AnimatePresence>
    </div>
  );
}
