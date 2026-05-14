import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Users, Clock, CalendarDays, TrendingUp, CheckCircle2,
  XCircle, Timer, ArrowUpRight, UserCheck, UserX, Zap,
  Award, Target, Coffee
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { AttendanceRecord, LeaveRequest } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { attendanceApi, leavesApi } from "../services/api";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
  delay?: number;
}

function StatCard({ title, value, change, changeType, icon: Icon, color, bg, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--hr-text-muted)" }}>{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-3xl" style={{ fontWeight: 800, color: "var(--hr-text)" }}>{value}</p>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {changeType === "up" && <ArrowUpRight size={12} style={{ color: "#10B981" }} />}
            <p className="text-xs" style={{ color: changeType === "up" ? "#10B981" : changeType === "down" ? "#EF4444" : "var(--hr-text-muted)" }}>
              {change}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
function getWeekDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { employees, currentUser } = useAuth();
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [weekRecords, setWeekRecords] = useState<AttendanceRecord[]>([]);
  const today = new Date().toISOString().split("T")[0];
  const weekDates = getWeekDates();

  useEffect(() => {
    const companyId = currentUser?.companyId;
    const fetch = () => {
      Promise.all([
        attendanceApi.getAll({ date: today }),
        leavesApi.getAll(companyId ? { companyId } : {}),
        attendanceApi.getAll({ startDate: weekDates[0], endDate: weekDates[6] }),
      ])
        .then(([att, lvs, week]) => { setTodayRecords(att); setAllLeaves(lvs); setWeekRecords(week); })
        .catch(console.error);
    };
    fetch();
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, [today, currentUser?.companyId]);

  const weeklyChartData = weekDates.map((date) => {
    const day = weekRecords.filter((r) => r.date === date);
    return {
      day: new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" }),
      presents: day.filter((r) => r.status === "Présent" || r.status === "Télétravail").length,
      absents: day.filter((r) => r.status === "Absent").length,
      retards: day.filter((r) => r.status === "Retard").length,
    };
  });
  const weekLabel = `${new Date(weekDates[0] + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} – ${new Date(weekDates[6] + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  const activeEmployees = employees.filter((e) => e.status === "Actif");
  const onLeaveTodayIds = new Set(
    allLeaves.filter((l) => l.status === "Approuvé" && l.startDate <= today && l.endDate >= today).map((l) => l.employeeId)
  );
  const todayDayFR = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
  const todayDayName = todayDayFR.charAt(0).toUpperCase() + todayDayFR.slice(1);
  const presentCount = todayRecords.filter((r) => r.status === "Présent" || r.status === "Télétravail").length;
  const lateCount = todayRecords.filter((r) => r.status === "Retard").length;
  const leaveCount = activeEmployees.filter((e) => onLeaveTodayIds.has(e.id)).length;
  const absentCount = activeEmployees.filter((e) => {
    const worksToday = !e.workDays || e.workDays.length === 0 || e.workDays.includes(todayDayName);
    return worksToday && !todayRecords.some((r) => r.employeeId === e.id) && !onLeaveTodayIds.has(e.id);
  }).length;
  const pendingLeaves = allLeaves.filter((l) => l.status === "En attente").length;

  const pendingLeavesList = allLeaves
    .filter((l) => l.status === "En attente")
    .map((l) => ({ ...l, employee: employees.find((e) => e.id === l.employeeId) }))
    .filter((l) => l.employee != null);

  const deptColors: Record<string, string> = {
    "Ingénierie": "#6366F1", "RH": "#8B5CF6", "Marketing": "#EC4899",
    "Finance": "#14B8A6", "Direction": "#F59E0B", "Design": "#10B981",
  };
  const deptCounts: Record<string, number> = {};
  employees.forEach((e) => { deptCounts[e.department] = (deptCounts[e.department] || 0) + 1; });
  const departmentData = Object.entries(deptCounts).map(([name, value]) => ({
    name, value, color: deptColors[name] || "#6366F1",
  }));

  const statusColors: Record<string, string> = {
    "Présent": "#DCFCE7", "Absent": "#FEE2E2", "Retard": "#FEF3C7",
    "Congé": "#EDE9FE", "Télétravail": "#CCFBF1",
  };
  const statusTextColors: Record<string, string> = {
    "Présent": "#16A34A", "Absent": "#DC2626", "Retard": "#D97706",
    "Congé": "#7C3AED", "Télétravail": "#0D9488",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Employés actifs" value={activeEmployees.length} change="+1 ce mois" changeType="up" icon={Users} color="#6366F1" bg="#EDE9FE" delay={0.05} />
        <StatCard title="Présents aujourd'hui" value={presentCount} change={`${Math.round((presentCount / Math.max(activeEmployees.length, 1)) * 100)}% du total`} changeType="up" icon={UserCheck} color="#10B981" bg="#D1FAE5" delay={0.1} />
        <StatCard title="Absences / Retards" value={absentCount + lateCount} change={`${absentCount} absents, ${lateCount} retards`} changeType={absentCount + lateCount > 2 ? "down" : "neutral"} icon={UserX} color="#EF4444" bg="#FEE2E2" delay={0.15} />
        <StatCard title="Congés en attente" value={pendingLeaves} change="À valider" changeType="neutral" icon={CalendarDays} color="#F59E0B" bg="#FEF3C7" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="xl:col-span-2 rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Présences cette semaine</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>{weekLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[{ color: "#6366F1", label: "Présents" }, { color: "#EF4444", label: "Absents" }, { color: "#F59E0B", label: "Retards" }].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span style={{ color: "var(--hr-text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hr-card-border)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--hr-text-light)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--hr-text-light)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }} />
              <Bar dataKey="presents" fill="#6366F1" radius={[6, 6, 0, 0]} name="Présents" />
              <Bar dataKey="absents" fill="#FCA5A5" radius={[6, 6, 0, 0]} name="Absents" />
              <Bar dataKey="retards" fill="#FCD34D" radius={[6, 6, 0, 0]} name="Retards" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <p className="text-sm mb-1" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Par département</p>
          <p className="text-xs mb-3" style={{ color: "var(--hr-text-light)" }}>Répartition des employés</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={departmentData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {departmentData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--hr-card-border-hard)", background: "var(--hr-card)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {departmentData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span style={{ fontSize: "10px", color: "var(--hr-text-muted)" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Pointage du jour</p>
            <button onClick={() => navigate("/attendance")} className="text-xs text-indigo-500 hover:text-indigo-400" style={{ fontWeight: 600 }}>
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {todayRecords.slice(0, 5).map((r) => {
              const emp = employees.find((e) => e.id === r.employeeId);
              if (!emp) return null;
              return (
                <div key={r.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                  <div className="flex items-center gap-3">
                    <img src={emp.avatar} alt={emp.firstName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{emp.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.checkIn && <span className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{r.checkIn}</span>}
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                      style={{ background: statusColors[r.status] ?? "#F3F4F6", color: statusTextColors[r.status] ?? "#6B7280", fontWeight: 600 }}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Congés en attente</p>
            <button onClick={() => navigate("/leaves")} className="text-xs text-indigo-500 hover:text-indigo-400" style={{ fontWeight: 600 }}>
              Gérer →
            </button>
          </div>
          {pendingLeavesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={32} style={{ color: "#10B981" }} className="mb-2" />
              <p className="text-sm" style={{ color: "var(--hr-text-muted)" }}>Aucun congé en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeavesList.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "var(--hr-input-bg)", border: "1px solid var(--hr-card-border-hard)" }}
                >
                  <div className="flex items-center gap-3">
                    <img src={l.employee?.avatar} alt={l.employee?.firstName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>
                        {l.employee?.firstName} {l.employee?.lastName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-light)" }}>
                        {l.type} · {l.days} jour{l.days > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#D1FAE5" }} title="Approuver">
                      <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                    </button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }} title="Refuser">
                      <XCircle size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
function ManagerDashboard() {
  const navigate = useNavigate();
  const { currentUser, employees } = useAuth();
  const [todayAllRecords, setTodayAllRecords] = useState<AttendanceRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetch = () => {
      Promise.all([attendanceApi.getAll({ date: today }), leavesApi.getAll()])
        .then(([att, lvs]) => { setTodayAllRecords(att); setAllLeaves(lvs); })
        .catch(console.error);
    };
    fetch();
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, [today]);

  const myDept = currentUser?.department;
  const deptEmployees = employees.filter((e) => e.department === myDept && e.status === "Actif");
  const todayRecords = todayAllRecords.filter((r) => deptEmployees.some((e) => e.id === r.employeeId));
  const onLeaveTodayDept = new Set(
    allLeaves.filter((l) => l.status === "Approuvé" && l.startDate <= today && l.endDate >= today && deptEmployees.some((e) => e.id === l.employeeId)).map((l) => l.employeeId)
  );
  const mgrTodayDayFR = new Date().toLocaleDateString("fr-FR", { weekday: "long" });
  const mgrTodayDayName = mgrTodayDayFR.charAt(0).toUpperCase() + mgrTodayDayFR.slice(1);
  const presentCount = todayRecords.filter((r) => r.status === "Présent" || r.status === "Télétravail").length;
  const lateCount = todayRecords.filter((r) => r.status === "Retard").length;
  const absentCount = deptEmployees.filter((e) => {
    const worksToday = !e.workDays || e.workDays.length === 0 || e.workDays.includes(mgrTodayDayName);
    return worksToday && !todayRecords.some((r) => r.employeeId === e.id) && !onLeaveTodayDept.has(e.id);
  }).length;
  const deptLeavesPending = allLeaves.filter((l) => l.status === "En attente" && deptEmployees.some((e) => e.id === l.employeeId)).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <div>
          <p className="text-white text-sm mb-0.5" style={{ fontWeight: 700 }}>
            Bonjour, {currentUser?.firstName} 👋
          </p>
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            Département {myDept} · {deptEmployees.length} membres
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(99,102,241,0.2)" }}>
          <Target size={14} style={{ color: "#A5B4FC" }} />
          <span className="text-xs text-white" style={{ fontWeight: 600 }}>Manager</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Membres" value={deptEmployees.length} change={`Dept. ${myDept}`} changeType="neutral" icon={Users} color="#6366F1" bg="#EDE9FE" delay={0.05} />
        <StatCard title="Présents" value={presentCount} change={`${Math.round((presentCount / Math.max(deptEmployees.length, 1)) * 100)}%`} changeType="up" icon={UserCheck} color="#10B981" bg="#D1FAE5" delay={0.1} />
        <StatCard title="Abs. / Retards" value={absentCount + lateCount} change={`${absentCount} absents · ${lateCount} retards`} changeType={absentCount + lateCount > 0 ? "down" : "neutral"} icon={UserX} color="#EF4444" bg="#FEE2E2" delay={0.15} />
        <StatCard title="Congés en attente" value={deptLeavesPending} change="Votre équipe" changeType="neutral" icon={CalendarDays} color="#F59E0B" bg="#FEF3C7" delay={0.2} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl p-5"
        style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>État de mon équipe aujourd'hui</p>
          <button onClick={() => navigate("/attendance")} className="text-xs text-indigo-500" style={{ fontWeight: 600 }}>Voir les présences →</button>
        </div>
        <div className="space-y-2">
          {deptEmployees.map((emp) => {
            const rec = todayRecords.find((r) => r.employeeId === emp.id);
            const statusColors: Record<string, { bg: string; text: string }> = {
              "Présent": { bg: "#D1FAE5", text: "#16A34A" },
              "Absent": { bg: "#FEE2E2", text: "#DC2626" },
              "Retard": { bg: "#FEF3C7", text: "#D97706" },
              "Congé": { bg: "#EDE9FE", text: "#7C3AED" },
              "Télétravail": { bg: "#CCFBF1", text: "#0D9488" },
            };
            const cfg = statusColors[rec?.status ?? ""] ?? { bg: "var(--hr-badge-bg)", text: "var(--hr-badge-text)" };
            return (
              <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                <div className="flex items-center gap-3">
                  <img src={emp.avatar} alt={emp.firstName} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>{emp.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rec?.checkIn && <span className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{rec.checkIn}</span>}
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.text, fontWeight: 600 }}>
                    {rec?.status ?? "Non enregistré"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Employee Dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetch = () => {
      Promise.all([
        attendanceApi.getAll({ employeeId: currentUser.id }),
        leavesApi.getAll({ employeeId: currentUser.id }),
      ])
        .then(([att, lvs]) => { setMyRecords(att); setMyLeaves(lvs); })
        .catch(console.error);
    };
    fetch();
    const t = setInterval(fetch, 20000);
    return () => clearInterval(t);
  }, [currentUser?.id]);

  const todayRecord = myRecords.find((r) => r.date === today);
  const pendingLeaves = myLeaves.filter((l) => l.status === "En attente");
  const leaveBalance = (currentUser?.leaveBalance ?? 25) - (currentUser?.leaveUsed ?? 0);

  const thisWeekRecords = myRecords.slice(0, 5);
  const avgHours = thisWeekRecords.reduce((acc, r) => acc + (r.hoursWorked ?? 0), 0) / Math.max(thisWeekRecords.length, 1);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #0B1437 0%, #1E1B4B 100%)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <div>
          <p className="text-white mb-0.5" style={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Bonjour, {currentUser?.firstName} 👋
          </p>
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            {currentUser?.position} · {currentUser?.department}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white" style={{ fontWeight: 800, fontSize: "1.5rem", fontVariantNumeric: "tabular-nums" }}>
            {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#6366F1" }}>
            {currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Présences ce mois" value={myRecords.filter(r => r.status === "Présent").length} change="Journées" changeType="up" icon={CheckCircle2} color="#10B981" bg="#D1FAE5" delay={0.05} />
        <StatCard title="Congés restants" value={`${leaveBalance}j`} change={`${currentUser?.leaveUsed} utilisés`} changeType="neutral" icon={CalendarDays} color="#6366F1" bg="#EDE9FE" delay={0.1} />
        <StatCard title="Moy. heures/jour" value={`${avgHours.toFixed(1)}h`} change="Cette semaine" changeType="neutral" icon={Clock} color="#F59E0B" bg="#FEF3C7" delay={0.15} />
        <StatCard title="Demandes en cours" value={pendingLeaves.length} change="En attente" changeType="neutral" icon={Timer} color="#8B5CF6" bg="#EDE9FE" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Today status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Mon statut aujourd'hui</p>
            <button onClick={() => navigate("/attendance")} className="text-xs text-indigo-500" style={{ fontWeight: 600 }}>
              Pointer →
            </button>
          </div>
          {todayRecord ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#D1FAE520" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: "#10B981" }} />
                  <span className="text-sm" style={{ color: "var(--hr-text)", fontWeight: 600 }}>Entrée</span>
                </div>
                <span style={{ color: "#10B981", fontWeight: 700 }}>{todayRecord.checkIn ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#FEE2E220" }}>
                <div className="flex items-center gap-2">
                  <XCircle size={16} style={{ color: "#EF4444" }} />
                  <span className="text-sm" style={{ color: "var(--hr-text)", fontWeight: 600 }}>Sortie</span>
                </div>
                <span style={{ color: todayRecord.checkOut ? "#EF4444" : "var(--hr-text-light)", fontWeight: 700 }}>
                  {todayRecord.checkOut ?? "En cours…"}
                </span>
              </div>
              {(() => {
                const sBg: Record<string, string> = { "Présent": "#D1FAE5", "Retard": "#FEF3C7", "Absent": "#FEE2E2", "Congé": "#EDE9FE", "Télétravail": "#CCFBF1" };
                const sTxt: Record<string, string> = { "Présent": "#16A34A", "Retard": "#D97706", "Absent": "#DC2626", "Congé": "#7C3AED", "Télétravail": "#0D9488" };
                return (
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                    <span className="text-sm" style={{ color: "var(--hr-text-muted)" }}>Statut</span>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{
                      background: sBg[todayRecord.status] ?? "#F3F4F6",
                      color: sTxt[todayRecord.status] ?? "#6B7280",
                      fontWeight: 700,
                    }}>
                      {todayRecord.status}
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-6">
              <Coffee size={32} style={{ color: "var(--hr-text-light)" }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: "var(--hr-text-muted)" }}>Pas encore pointé aujourd'hui</p>
              <button
                onClick={() => navigate("/attendance")}
                className="mt-3 px-4 py-2 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 700 }}
              >
                Pointer maintenant
              </button>
            </div>
          )}
        </motion.div>

        {/* My leaves */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", boxShadow: "var(--hr-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--hr-text)" }}>Mes dernières demandes</p>
            <button onClick={() => navigate("/leaves")} className="text-xs text-indigo-500" style={{ fontWeight: 600 }}>Voir tout →</button>
          </div>

          {/* Leave balance */}
          <div className="p-3 rounded-xl mb-3" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: "var(--hr-text-muted)", fontWeight: 600 }}>Solde de congés</span>
              <span style={{ color: "#6366F1", fontWeight: 800 }}>{leaveBalance}j restants</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(99,102,241,0.15)" }}>
              <div className="h-full rounded-full" style={{ width: `${(leaveBalance / (currentUser?.leaveBalance ?? 25)) * 100}%`, background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }} />
            </div>
          </div>

          <div className="space-y-2">
            {myLeaves.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                <div>
                  <p className="text-xs" style={{ fontWeight: 600, color: "var(--hr-text)" }}>{l.type}</p>
                  <p className="text-xs" style={{ color: "var(--hr-text-light)" }}>
                    {new Date(l.startDate).toLocaleDateString("fr-FR")} · {l.days}j
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: l.status === "Approuvé" ? "#D1FAE5" : l.status === "Refusé" ? "#FEE2E2" : "#FEF3C7",
                  color: l.status === "Approuvé" ? "#16A34A" : l.status === "Refusé" ? "#DC2626" : "#D97706",
                  fontWeight: 600,
                }}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  if (role === "Admin") return <AdminDashboard />;
  if (role === "Manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}
