import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Award,
  Clock, CalendarDays, TrendingUp, Edit2, Download, MoreVertical,
  Shield, CheckCircle2, XCircle, Timer
} from "lucide-react";
import { AttendanceRecord, LeaveRequest } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { attendanceApi, leavesApi, departmentsApi } from "../services/api";
import { EditEmployeeModal } from "./EmployeesPage";

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees, updateEmployee, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "leaves">("overview");
  const [empRecords, setEmpRecords] = useState<AttendanceRecord[]>([]);
  const [empLeaves, setEmpLeaves] = useState<LeaveRequest[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      attendanceApi.getAll({ employeeId: id }),
      leavesApi.getAll({ employeeId: id }),
    ])
      .then(([att, lvs]) => {
        setEmpRecords(att.slice(0, 10));
        setEmpLeaves(lvs);
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!currentUser?.companyId) return;
    departmentsApi.getAll(currentUser.companyId)
      .then((list) => setDepartments(list.map((d: any) => d.name)))
      .catch(() => {});
  }, [currentUser?.companyId]);

  const emp = employees.find((e) => e.id === id);
  if (!emp) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "#6B7280" }}>Employé introuvable.</p>
      </div>
    );
  }
  const leaveRemaining = emp.leaveBalance - emp.leaveUsed;

  const statusColors: Record<string, { bg: string; text: string }> = {
    "Présent": { bg: "#D1FAE5", text: "#16A34A" },
    "Absent": { bg: "#FEE2E2", text: "#DC2626" },
    "Retard": { bg: "#FEF3C7", text: "#D97706" },
    "Congé": { bg: "#EDE9FE", text: "#7C3AED" },
    "Télétravail": { bg: "#CCFBF1", text: "#0D9488" },
  };

  const leaveStatusColors: Record<string, { bg: string; text: string }> = {
    "Approuvé": { bg: "#D1FAE5", text: "#16A34A" },
    "En attente": { bg: "#FEF3C7", text: "#D97706" },
    "Refusé": { bg: "#FEE2E2", text: "#DC2626" },
  };

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "attendance", label: "Présences" },
    { id: "leaves", label: "Congés" },
  ];

  const infoItems = [
    { icon: Mail, label: "Email", value: emp.email || "—" },
    { icon: Phone, label: "Téléphone", value: emp.phone || "—" },
    { icon: MapPin, label: "Adresse", value: emp.address || "—" },
    { icon: Calendar, label: "Date de naissance", value: emp.birthDate ? new Date(emp.birthDate).toLocaleDateString("fr-FR") : "—" },
    { icon: Briefcase, label: "Contrat", value: emp.contractType },
    { icon: Calendar, label: "Date d'entrée", value: emp.startDate ? new Date(emp.startDate).toLocaleDateString("fr-FR") : "—" },
  ];

  return (
    <div className="space-y-5">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/employees")}
        className="flex items-center gap-2 text-sm hover:text-indigo-600 transition-colors"
        style={{ color: "#6B7280" }}
      >
        <ArrowLeft size={16} />
        Retour aux employés
      </motion.button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid #F1F3F9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        {/* Banner + avatar zone */}
        <div className="relative" style={{ paddingBottom: "3.5rem" }}>
          {/* Banner */}
          <div
            className="h-28"
            style={{ background: "linear-gradient(135deg, #0B1437 0%, #312E81 100%)" }}
          >
            <div className="absolute inset-x-0 top-0 h-28 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #6366F1, transparent)" }} />
          </div>

          {/* Avatar — positionné en absolu sur la ligne de séparation bannière/contenu */}
          <div className="absolute left-4 md:left-6" style={{ bottom: 0 }}>
            <img
              src={emp.avatar}
              alt={emp.firstName}
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
            />
          </div>

          {/* Boutons en haut à droite dans la zone bannière */}
          <div className="absolute right-4 md:right-6 bottom-2 flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:bg-slate-100"
              style={{ background: "white", border: "1.5px solid #E5E7EB", color: "#374151", fontWeight: 600 }}
            >
              <Download size={14} />
              Exporter
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
            >
              <Edit2 size={14} />
              Modifier
            </button>
          </div>
        </div>

        {/* Info texte — commence après l'avatar */}
        <div className="px-4 md:px-6 pt-3 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0F172A" }}>
                  {emp.firstName} {emp.lastName}
                </h1>
                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: emp.status === "Actif" ? "#D1FAE5" : emp.status === "Inactif" ? "#F3F4F6" : "#EDE9FE",
                    color: emp.status === "Actif" ? "#16A34A" : emp.status === "Inactif" ? "#6B7280" : "#7C3AED",
                    fontWeight: 700,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: emp.status === "Actif" ? "#16A34A" : emp.status === "Inactif" ? "#6B7280" : "#7C3AED" }} />
                  {emp.status}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                {emp.position} · {emp.department}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield size={12} style={{ color: "#8B5CF6" }} />
                <p className="text-xs" style={{ color: "#8B5CF6", fontWeight: 600 }}>{emp.role}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Ancienneté", value: emp.startDate ? `${new Date().getFullYear() - new Date(emp.startDate).getFullYear()} ans` : "—", color: "#6366F1", bg: "#EDE9FE" },
              { label: "Salaire", value: `${(emp.salary ?? 0).toLocaleString("fr-FR")} FCFA`, color: "#10B981", bg: "#D1FAE5" },
              { label: "Congés restants", value: `${leaveRemaining} jours`, color: "#F59E0B", bg: "#FEF3C7" },
              { label: "Congés utilisés", value: `${emp.leaveUsed} jours`, color: "#8B5CF6", bg: "#F5F3FF" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                <p className="text-lg" style={{ fontWeight: 800, color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "white", border: "1px solid #F1F3F9" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: activeTab === tab.id ? "#6366F1" : "transparent",
              color: activeTab === tab.id ? "white" : "#6B7280",
              fontWeight: activeTab === tab.id ? 700 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence>
        {showEditModal && emp && (
          <EditEmployeeModal
            emp={emp}
            onClose={() => setShowEditModal(false)}
            onSave={async (empId, updates) => {
              await updateEmployee(empId, updates);
              setShowEditModal(false);
            }}
            allEmployees={employees}
            departments={departments}
            onCreateDept={async (name) => {
              if (currentUser?.companyId) {
                await departmentsApi.create({ name, companyId: currentUser.companyId });
                setDepartments((prev) => [...prev, name].sort((a, b) => a.localeCompare(b, "fr")));
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatedTab key={activeTab}>
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Personal info */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid #F1F3F9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <p className="text-sm mb-4" style={{ fontWeight: 700, color: "#111827" }}>
                Informations personnelles
              </p>
              <div className="space-y-3">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F3F4F6" }}>
                      <item.icon size={14} style={{ color: "#6B7280" }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{item.label}</p>
                      <p className="text-sm" style={{ color: "#111827", fontWeight: 500 }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave balance */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid #F1F3F9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <p className="text-sm mb-4" style={{ fontWeight: 700, color: "#111827" }}>
                Solde de congés
              </p>
              <div className="space-y-4">
                {[
                  { label: "Congés annuels", used: emp.leaveUsed, total: emp.leaveBalance, color: "#6366F1" },
                  { label: "RTT", used: 2, total: 12, color: "#10B981" },
                  { label: "Récupération", used: 0, total: 3, color: "#F59E0B" },
                ].map((c) => (
                  <div key={c.label}>
                    <div className="flex justify-between mb-1.5">
                      <p className="text-xs" style={{ color: "#374151", fontWeight: 600 }}>{c.label}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>
                        {c.used}/{c.total} jours utilisés
                      </p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.used / c.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: c.color }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: c.color, fontWeight: 700 }}>
                      {c.total - c.used} jours restants
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div
            className="rounded-2xl overflow-hidden overflow-x-auto"
            style={{ background: "white", border: "1px solid #F1F3F9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "#F9FAFB" }}>
              <p className="text-sm" style={{ fontWeight: 700, color: "#111827" }}>
                Historique des présences
              </p>
            </div>
            {empRecords.length === 0 ? (
              <div className="py-12 text-center">
                <Clock size={36} style={{ color: "#D1D5DB" }} className="mx-auto mb-3" />
                <p style={{ color: "#6B7280" }}>Aucun enregistrement de présence</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {empRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>
                        {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      {r.note && (
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{r.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {r.checkIn && (
                        <div className="text-center">
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Entrée</p>
                          <p className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>{r.checkIn}</p>
                        </div>
                      )}
                      {r.checkOut && (
                        <div className="text-center">
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Sortie</p>
                          <p className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>{r.checkOut}</p>
                        </div>
                      )}
                      {r.hoursWorked !== null && r.hoursWorked > 0 && (
                        <div className="text-center">
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Durée</p>
                          <p className="text-sm" style={{ fontWeight: 600, color: "#6366F1" }}>{r.hoursWorked}h</p>
                        </div>
                      )}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          background: statusColors[r.status]?.bg,
                          color: statusColors[r.status]?.text,
                          fontWeight: 600,
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "leaves" && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: "1px solid #F1F3F9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "#F9FAFB" }}>
              <p className="text-sm" style={{ fontWeight: 700, color: "#111827" }}>
                Historique des congés
              </p>
            </div>
            {empLeaves.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays size={36} style={{ color: "#D1D5DB" }} className="mx-auto mb-3" />
                <p style={{ color: "#6B7280" }}>Aucune demande de congé</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {empLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>{l.type}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                        {new Date(l.startDate).toLocaleDateString("fr-FR")} →{" "}
                        {new Date(l.endDate).toLocaleDateString("fr-FR")} · {l.days} jour{l.days > 1 ? "s" : ""}
                      </p>
                      {l.reason && (
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                          "{l.reason}"
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: leaveStatusColors[l.status]?.bg,
                        color: leaveStatusColors[l.status]?.text,
                        fontWeight: 600,
                      }}
                    >
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatedTab>
    </div>
  );
}

function AnimatedTab({ children, key: k }: { children: React.ReactNode; key: string }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}