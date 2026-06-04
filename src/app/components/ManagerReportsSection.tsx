import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Target, Star, AlertTriangle, MessageSquare,
  Plus, X, Send, Edit3, Trash2, ChevronRight, Clock,
  CheckCircle2, FileText, Download, Eye, Save,
} from "lucide-react";
import { managerReportsApi, ManagerReport } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { id: "weekly_team",           label: "Rapport hebdomadaire",    icon: Users,          color: "#6366F1", desc: "État de l'équipe — présence, activités, KPIs" },
  { id: "objective_tracking",    label: "Suivi des objectifs",     icon: Target,         color: "#10B981", desc: "Objectifs assignés, résultats, progression" },
  { id: "employee_evaluation",   label: "Évaluation collaborateur", icon: Star,          color: "#F59E0B", desc: "Compétences, productivité, note globale" },
  { id: "incident",              label: "Rapport d'incident",      icon: AlertTriangle,  color: "#EF4444", desc: "Événements, actions immédiates, décision RH" },
  { id: "meeting",               label: "Compte-rendu de réunion", icon: MessageSquare,  color: "#8B5CF6", desc: "Participants, décisions, actions" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: "Brouillon",  bg: "#F1F5F9", color: "#64748B" },
  submitted: { label: "Soumis",     bg: "#DBEAFE", color: "#1D4ED8" },
  reviewed:  { label: "Examiné",    bg: "#FEF3C7", color: "#D97706" },
  approved:  { label: "Approuvé",   bg: "#D1FAE5", color: "#16A34A" },
  archived:  { label: "Archivé",    bg: "#F1F5F9", color: "#94A3B8" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Form helpers ─────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = "text", placeholder = "", required = false }: any) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: "var(--hr-text-muted)" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder = "" }: any) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: "var(--hr-text-muted)" }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
        style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }} />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }: any) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: "var(--hr-text-muted)" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--hr-card-border)" }}>
      <span className="text-sm" style={{ color: "var(--hr-text)" }}>{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
            style={{ background: n <= value ? "#6366F1" : "var(--hr-hover)", color: n <= value ? "white" : "var(--hr-text-muted)" }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function DynamicList({ label, items, onChange, columns }: { label: string; items: any[]; onChange: (v: any[]) => void; columns: { key: string; label: string; type?: string }[] }) {
  const add = () => onChange([...items, Object.fromEntries(columns.map(c => [c.key, ""]))]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, key: string, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold" style={{ color: "var(--hr-text-muted)" }}>{label}</label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", fontWeight: 700 }}>
          <Plus size={11} /> Ajouter
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-center py-3 rounded-xl" style={{ background: "var(--hr-hover)", color: "var(--hr-text-light)" }}>
          Aucun élément — cliquez Ajouter
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 p-3 rounded-xl items-start"
              style={{ background: "var(--hr-hover)", gridTemplateColumns: `repeat(${columns.length}, 1fr) auto` }}>
              {columns.map(col => (
                <input key={col.key} type={col.type || "text"} value={item[col.key] || ""} placeholder={col.label}
                  onChange={e => update(i, col.key, e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)", color: "var(--hr-text)" }} />
              ))}
              <button type="button" onClick={() => remove(i)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.1)" }}>
                <X size={12} style={{ color: "#EF4444" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Form sections by type ────────────────────────────────────────────────────
function WeeklyTeamForm({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const s = (key: string, val: any) => onChange({ ...content, [key]: val });
  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Effectif de l'équipe</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { key: "effectifTotal", label: "Effectif total" },
          { key: "presents", label: "Présents" },
          { key: "teletravail", label: "Télétravail" },
          { key: "conges", label: "Congés" },
          { key: "absents", label: "Absents" },
          { key: "nouveauxArrivants", label: "Nouveaux arrivants" },
        ].map(f => (
          <Input key={f.key} label={f.label} type="number" value={content[f.key] || ""} onChange={(v: string) => s(f.key, v)} />
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Activités réalisées</p>
      <DynamicList label="" items={content.activites || []} onChange={v => s("activites", v)}
        columns={[{ key: "activite", label: "Activité" }, { key: "responsable", label: "Responsable" }, { key: "progression", label: "Progression (%)", type: "number" }]} />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Performance KPIs</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "tauxPresence", label: "Taux de présence (%)" },
          { key: "respectDelais", label: "Respect des délais (%)" },
          { key: "objectifsAtteints", label: "Objectifs atteints (%)" },
          { key: "tachesTerminees", label: "Tâches terminées" },
          { key: "tachesEnRetard", label: "Tâches en retard" },
        ].map(f => (
          <Input key={f.key} label={f.label} type="number" value={content[f.key] || ""} onChange={(v: string) => s(f.key, v)} />
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Difficultés rencontrées</p>
      <Select label="Catégorie" value={content.difficultesCategorie || ""}
        onChange={(v: string) => s("difficultesCategorie", v)}
        options={[{ value: "", label: "Sélectionner" }, ...["Ressources humaines", "Technique", "Budget", "Organisation"].map(v => ({ value: v, label: v }))]} />
      <Textarea label="Description" value={content.difficultesDescription || ""} onChange={(v: string) => s("difficultesDescription", v)} placeholder="Décrivez les difficultés rencontrées..." />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Risques identifiés</p>
      <DynamicList label="" items={content.risques || []} onChange={v => s("risques", v)}
        columns={[{ key: "description", label: "Description du risque" }, { key: "niveau", label: "Niveau (Faible/Moyen/Élevé)" }]} />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>Plan d'action</p>
      <DynamicList label="" items={content.planAction || []} onChange={v => s("planAction", v)}
        columns={[{ key: "action", label: "Action" }, { key: "responsable", label: "Responsable" }, { key: "echeance", label: "Échéance", type: "date" }]} />
    </div>
  );
}

function ObjectiveTrackingForm({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const s = (key: string, val: any) => onChange({ ...content, [key]: val });
  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10B981" }}>Objectifs assignés</p>
      <DynamicList label="" items={content.objectifs || []} onChange={v => s("objectifs", v)}
        columns={[{ key: "objectif", label: "Objectif" }, { key: "dateDebut", label: "Début", type: "date" }, { key: "dateFin", label: "Fin", type: "date" }, { key: "progression", label: "% Progression", type: "number" }]} />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10B981" }}>État d'avancement</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {["Non commencé", "En cours", "Terminé", "Bloqué"].map(s2 => (
          <label key={s2} className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs"
            style={{ background: content.etatAvancement === s2 ? "rgba(16,185,129,0.12)" : "var(--hr-hover)", border: `1.5px solid ${content.etatAvancement === s2 ? "#10B981" : "transparent"}`, fontWeight: content.etatAvancement === s2 ? 700 : 400, color: "var(--hr-text)" }}>
            <input type="radio" value={s2} checked={content.etatAvancement === s2} onChange={() => s("etatAvancement", s2)} className="sr-only" />
            {s2}
          </label>
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10B981" }}>Obstacles rencontrés</p>
      <Textarea label="" value={content.obstacles || ""} onChange={(v: string) => s("obstacles", v)} placeholder="Manque de ressources, dépendances externes, difficultés techniques..." />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10B981" }}>Recommandations</p>
      <Select label="Type de recommandation" value={content.recommandationType || ""}
        onChange={(v: string) => s("recommandationType", v)}
        options={[{ value: "", label: "Sélectionner" }, ...["Formation", "Accompagnement", "Réorganisation"].map(v => ({ value: v, label: v }))]} />
      <Textarea label="Détails" value={content.recommandationDetails || ""} onChange={(v: string) => s("recommandationDetails", v)} placeholder="Précisez votre recommandation..." />
    </div>
  );
}

function EmployeeEvaluationForm({ content, onChange, employees }: { content: any; onChange: (c: any) => void; employees: any[] }) {
  const s = (key: string, val: any) => onChange({ ...content, [key]: val });
  const rating = (key: string, val: number) => s(key, val);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--hr-text-muted)" }}>Employé évalué *</label>
          <select value={content.employeeId || ""} onChange={e => s("employeeId", e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--hr-input)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)" }}>
            <option value="">Sélectionner un employé</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.department}</option>)}
          </select>
        </div>
        <Input label="Poste évalué" value={content.poste || ""} onChange={(v: string) => s("poste", v)} placeholder="Ex: Développeur Senior" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>Compétences techniques <span style={{ fontWeight: 400, fontSize: 10, color: "var(--hr-text-light)" }}>(note /5)</span></p>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hr-card-border)" }}>
        {[
          { key: "noteExpertise", label: "Expertise métier" },
          { key: "noteQualite", label: "Qualité du travail" },
          { key: "noteProcessus", label: "Respect des procédures" },
          { key: "noteResolution", label: "Résolution de problèmes" },
        ].map(f => <RatingRow key={f.key} label={f.label} value={content[f.key] || 0} onChange={v => rating(f.key, v)} />)}
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>Compétences comportementales <span style={{ fontWeight: 400, fontSize: 10, color: "var(--hr-text-light)" }}>(note /5)</span></p>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hr-card-border)" }}>
        {[
          { key: "noteCommunication", label: "Communication" },
          { key: "noteEquipe", label: "Travail d'équipe" },
          { key: "noteLeadership", label: "Leadership" },
          { key: "noteAutonomie", label: "Autonomie" },
          { key: "notePonctualite", label: "Ponctualité" },
        ].map(f => <RatingRow key={f.key} label={f.label} value={content[f.key] || 0} onChange={v => rating(f.key, v)} />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Tâches réalisées" type="number" value={content.tachesRealisees || ""} onChange={(v: string) => s("tachesRealisees", v)} />
        <Input label="Objectifs atteints (%)" type="number" value={content.objectifsAtteints || ""} onChange={(v: string) => s("objectifsAtteints", v)} />
        <Input label="Respect des délais (%)" type="number" value={content.respectDelais || ""} onChange={(v: string) => s("respectDelais", v)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Textarea label="Forces identifiées" value={content.forces || ""} onChange={(v: string) => s("forces", v)} placeholder="Points forts de l'employé..." rows={3} />
        <Textarea label="Axes d'amélioration" value={content.axes || ""} onChange={(v: string) => s("axes", v)} placeholder="Points à travailler..." rows={3} />
      </div>

      <Textarea label="Besoins de formation" value={content.formationBesoins || ""} onChange={(v: string) => s("formationBesoins", v)} placeholder="Formation technique, métier, leadership..." />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>Recommandation du manager</p>
      <div className="flex flex-wrap gap-2">
        {["Promotion", "Prime", "Formation", "Coaching", "Maintien"].map(r => (
          <button key={r} type="button" onClick={() => s("recommandation", r)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: content.recommandation === r ? "#F59E0B22" : "var(--hr-hover)", border: `1.5px solid ${content.recommandation === r ? "#F59E0B" : "transparent"}`, color: content.recommandation === r ? "#D97706" : "var(--hr-text-muted)" }}>
            {r}
          </button>
        ))}
      </div>

      {(() => {
        const techKeys = ["noteExpertise", "noteQualite", "noteProcessus", "noteResolution"];
        const behavKeys = ["noteCommunication", "noteEquipe", "noteLeadership", "noteAutonomie", "notePonctualite"];
        const techAvg = techKeys.reduce((s, k) => s + (content[k] || 0), 0) / techKeys.length;
        const behavAvg = behavKeys.reduce((s, k) => s + (content[k] || 0), 0) / behavKeys.length;
        const total = ((techAvg + behavAvg) / 2).toFixed(1);
        return techAvg + behavAvg > 0 ? (
          <div className="rounded-2xl p-4 grid grid-cols-3 gap-4 text-center" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            {[["Technique", techAvg.toFixed(1)], ["Comportement", behavAvg.toFixed(1)], ["Total", total]].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{l}</p>
                <p className="text-xl font-black" style={{ color: "#D97706" }}>{v}/5</p>
              </div>
            ))}
          </div>
        ) : null;
      })()}
    </div>
  );
}

function IncidentForm({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const s = (key: string, val: any) => onChange({ ...content, [key]: val });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" type="date" value={content.dateIncident || ""} onChange={(v: string) => s("dateIncident", v)} required />
        <Input label="Heure" type="time" value={content.heureIncident || ""} onChange={(v: string) => s("heureIncident", v)} />
        <Input label="Lieu" value={content.lieu || ""} onChange={(v: string) => s("lieu", v)} placeholder="Ex: Salle B3" />
        <Input label="Service concerné" value={content.service || ""} onChange={(v: string) => s("service", v)} placeholder="Ex: IT" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#EF4444" }}>Type d'incident</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {["Retard récurrent", "Absence injustifiée", "Non-respect procédure", "Conflit", "Accident", "Comportement inapproprié", "Incident sécurité"].map(t => (
          <label key={t} className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs"
            style={{ background: content.typeIncident === t ? "rgba(239,68,68,0.1)" : "var(--hr-hover)", border: `1.5px solid ${content.typeIncident === t ? "#EF4444" : "transparent"}`, fontWeight: content.typeIncident === t ? 700 : 400, color: "var(--hr-text)" }}>
            <input type="radio" value={t} checked={content.typeIncident === t} onChange={() => s("typeIncident", t)} className="sr-only" />
            {t}
          </label>
        ))}
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#EF4444" }}>Personnes impliquées</p>
      <DynamicList label="" items={content.personnes || []} onChange={v => s("personnes", v)}
        columns={[{ key: "nom", label: "Nom" }, { key: "fonction", label: "Fonction" }, { key: "role", label: "Rôle (victime/auteur/témoin)" }]} />

      <Textarea label="Description détaillée *" value={content.description || ""} onChange={(v: string) => s("description", v)} rows={4} placeholder="Décrivez l'incident en détail..." />

      <Select label="Impact" value={content.impact || ""} onChange={(v: string) => s("impact", v)}
        options={[{ value: "", label: "Sélectionner" }, ...["Faible", "Moyen", "Important", "Critique"].map(v => ({ value: v, label: v }))]} />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#EF4444" }}>Actions immédiates prises</p>
      <div className="flex flex-wrap gap-2">
        {["Avertissement", "Suspension", "Entretien", "Escalade RH"].map(a => (
          <button key={a} type="button"
            onClick={() => {
              const current = content.actionsImmédiates || [];
              s("actionsImmédiates", current.includes(a) ? current.filter((x: string) => x !== a) : [...current, a]);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: (content.actionsImmédiates || []).includes(a) ? "rgba(239,68,68,0.12)" : "var(--hr-hover)", border: `1.5px solid ${(content.actionsImmédiates || []).includes(a) ? "#EF4444" : "transparent"}`, color: (content.actionsImmédiates || []).includes(a) ? "#DC2626" : "var(--hr-text-muted)" }}>
            {a}
          </button>
        ))}
      </div>

      <Select label="Décision RH" value={content.decisionRH || ""} onChange={(v: string) => s("decisionRH", v)}
        options={[{ value: "", label: "En attente" }, ...["En attente", "Clôturé", "Sanction", "Médiation"].map(v => ({ value: v, label: v }))]} />
    </div>
  );
}

function MeetingForm({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const s = (key: string, val: any) => onChange({ ...content, [key]: val });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" type="date" value={content.dateMeeting || ""} onChange={(v: string) => s("dateMeeting", v)} required />
        <Input label="Heure début" type="time" value={content.heureDebut || ""} onChange={(v: string) => s("heureDebut", v)} />
        <Input label="Heure fin" type="time" value={content.heureFin || ""} onChange={(v: string) => s("heureFin", v)} />
        <Input label="Organisateur" value={content.organisateur || ""} onChange={(v: string) => s("organisateur", v)} placeholder="Nom de l'organisateur" />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8B5CF6" }}>Participants</p>
      <DynamicList label="" items={content.participants || []} onChange={v => s("participants", v)}
        columns={[{ key: "nom", label: "Nom" }, { key: "fonction", label: "Fonction" }, { key: "present", label: "Présent (Oui/Non)" }]} />

      <Textarea label="Ordre du jour" value={content.ordreJour || ""} onChange={(v: string) => s("ordreJour", v)} rows={3} placeholder="1. Sujet A\n2. Sujet B\n3. Questions diverses" />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8B5CF6" }}>Points discutés</p>
      <DynamicList label="" items={content.points || []} onChange={v => s("points", v)}
        columns={[{ key: "sujet", label: "Sujet" }, { key: "description", label: "Description" }, { key: "decision", label: "Décision prise" }]} />

      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#8B5CF6" }}>Actions décidées</p>
      <DynamicList label="" items={content.actions || []} onChange={v => s("actions", v)}
        columns={[{ key: "action", label: "Action" }, { key: "responsable", label: "Responsable" }, { key: "dateLimite", label: "Date limite", type: "date" }]} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Prochaine réunion (date)" type="date" value={content.prochaineMeeting || ""} onChange={(v: string) => s("prochaineMeeting", v)} />
        <Input label="Objectif prochaine réunion" value={content.prochainObjectif || ""} onChange={(v: string) => s("prochainObjectif", v)} />
      </div>
    </div>
  );
}

// ─── Report Form Modal ────────────────────────────────────────────────────────
function ReportFormModal({
  report, onClose, onSaved,
}: {
  report: ManagerReport | null;
  onClose: () => void;
  onSaved: (r: ManagerReport) => void;
}) {
  const { currentUser, employees } = useAuth();
  const isNew = !report;
  const [reportType, setReportType] = useState(report?.reportType || "weekly_team");
  const [title, setTitle] = useState(report?.title || "");
  const [periodStart, setPeriodStart] = useState(report?.periodStart || "");
  const [periodEnd, setPeriodEnd] = useState(report?.periodEnd || "");
  const [content, setContent] = useState<Record<string, any>>(report?.content || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeMeta = REPORT_TYPES.find(t => t.id === reportType)!;

  const handleSave = async (submit = false) => {
    if (!title) { setError("Le titre est requis"); return; }
    setSaving(true); setError("");
    try {
      let r: ManagerReport;
      if (isNew) {
        r = await managerReportsApi.create({ reportType, title, periodStart, periodEnd, content });
      } else {
        r = await managerReportsApi.update(report!.id, { title, periodStart, periodEnd, content });
      }
      if (submit) r = await managerReportsApi.submit(r.id);
      onSaved(r);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl"
        style={{ background: "var(--hr-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ background: "var(--hr-card)", borderColor: "var(--hr-card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${typeMeta.color}18` }}>
              <typeMeta.icon size={16} style={{ color: typeMeta.color }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--hr-text)" }}>{isNew ? "Nouveau rapport" : "Modifier"}</p>
              <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{typeMeta.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type selection (only on new) */}
          {isNew && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--hr-text-muted)" }}>Type de rapport</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REPORT_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setReportType(t.id)}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all"
                    style={{ background: reportType === t.id ? `${t.color}18` : "var(--hr-hover)", border: `1.5px solid ${reportType === t.id ? t.color : "transparent"}` }}>
                    <t.icon size={13} style={{ color: t.color, flexShrink: 0 }} />
                    <span className="text-xs font-bold" style={{ color: "var(--hr-text)" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* General info */}
          <div className="space-y-3">
            <Input label="Titre du rapport" value={title} onChange={setTitle} required placeholder={`Ex: ${typeMeta.label} — Semaine du 02/06/2026`} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Période du" type="date" value={periodStart} onChange={setPeriodStart} />
              <Input label="Au" type="date" value={periodEnd} onChange={setPeriodEnd} />
            </div>
          </div>

          {/* Type-specific form */}
          <div className="pt-2" style={{ borderTop: "1px solid var(--hr-card-border)" }}>
            {reportType === "weekly_team"         && <WeeklyTeamForm content={content} onChange={setContent} />}
            {reportType === "objective_tracking"  && <ObjectiveTrackingForm content={content} onChange={setContent} />}
            {reportType === "employee_evaluation" && <EmployeeEvaluationForm content={content} onChange={setContent} employees={employees.filter(e => e.role === "Employee" || e.role === "Manager")} />}
            {reportType === "incident"            && <IncidentForm content={content} onChange={setContent} />}
            {reportType === "meeting"             && <MeetingForm content={content} onChange={setContent} />}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm"
              style={{ border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text-muted)", fontWeight: 600 }}>
              Annuler
            </button>
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm"
              style={{ background: "var(--hr-hover)", border: "1px solid var(--hr-card-border-hard)", color: "var(--hr-text)", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              <Save size={13} /> Brouillon
            </button>
            <button onClick={() => handleSave(true)} disabled={saving || !title}
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-white text-sm"
              style={{ background: `linear-gradient(135deg,${typeMeta.color},${typeMeta.color}cc)`, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={13} /> Soumettre</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Report Viewer ────────────────────────────────────────────────────────────
function ReportViewerModal({ report, onClose, onStatusChange, isAdmin }: { report: ManagerReport; onClose: () => void; onStatusChange: (r: ManagerReport) => void; isAdmin: boolean }) {
  const c = report.content;
  const typeMeta = REPORT_TYPES.find(t => t.id === report.reportType);
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (status: string) => {
    setUpdating(true);
    try {
      const r = await managerReportsApi.update(report.id, { status });
      onStatusChange(r);
    } finally { setUpdating(false); }
  };

  const Section = ({ title, color = "#6366F1", children }: any) => (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>{title}</p>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: any }) =>
    value ? <div className="flex gap-3 py-1.5 border-b text-sm" style={{ borderColor: "var(--hr-card-border)" }}>
      <span className="w-40 flex-shrink-0 font-semibold" style={{ color: "var(--hr-text-muted)" }}>{label}</span>
      <span style={{ color: "var(--hr-text)" }}>{value}</span>
    </div> : null;

  const Table = ({ rows, columns }: { rows: any[]; columns: { key: string; label: string }[] }) =>
    rows?.length > 0 ? (
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hr-card-border)" }}>
        <table className="w-full text-xs">
          <thead><tr style={{ background: "var(--hr-hover)" }}>
            {columns.map(c => <th key={c.key} className="px-3 py-2 text-left font-bold" style={{ color: "var(--hr-text-muted)" }}>{c.label}</th>)}
          </tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} style={{ borderTop: "1px solid var(--hr-card-border)" }}>
            {columns.map(col => <td key={col.key} className="px-3 py-2" style={{ color: "var(--hr-text)" }}>{r[col.key] || "—"}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    ) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl"
        style={{ background: "var(--hr-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between" style={{ background: "var(--hr-card)", borderColor: "var(--hr-card-border)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--hr-text)" }}>{report.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={report.status} />
              <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>{typeMeta?.label}</span>
              {report.periodStart && <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>· {fmtDate(report.periodStart)} → {fmtDate(report.periodEnd)}</span>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--hr-hover)" }}>
            <X size={16} style={{ color: "var(--hr-text-muted)" }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Admin actions */}
          {isAdmin && report.status === "submitted" && (
            <div className="flex gap-2 p-3 rounded-2xl" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p className="flex-1 text-xs font-semibold" style={{ color: "var(--hr-text)" }}>Action RH :</p>
              {["reviewed", "approved", "archived"].map(s => (
                <button key={s} onClick={() => changeStatus(s)} disabled={updating}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: STATUS_CONFIG[s]?.bg, color: STATUS_CONFIG[s]?.color }}>
                  {STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>
          )}

          {/* Weekly team */}
          {report.reportType === "weekly_team" && <>
            <Section title="Effectif de l'équipe" color="#6366F1">
              <div className="grid grid-cols-3 gap-3">
                {[["Effectif total", c.effectifTotal], ["Présents", c.presents], ["Télétravail", c.teletravail], ["Congés", c.conges], ["Absents", c.absents], ["Nouveaux", c.nouveauxArrivants]].map(([l, v]) =>
                  v != null ? <div key={l} className="text-center p-3 rounded-xl" style={{ background: "var(--hr-hover)" }}>
                    <p className="text-xl font-black" style={{ color: "#6366F1" }}>{v}</p>
                    <p className="text-xs" style={{ color: "var(--hr-text-muted)" }}>{l}</p>
                  </div> : null)}
              </div>
            </Section>
            {c.activites?.length > 0 && <Section title="Activités" color="#6366F1"><Table rows={c.activites} columns={[{ key: "activite", label: "Activité" }, { key: "responsable", label: "Responsable" }, { key: "progression", label: "Progression %" }]} /></Section>}
            {c.planAction?.length > 0 && <Section title="Plan d'action" color="#6366F1"><Table rows={c.planAction} columns={[{ key: "action", label: "Action" }, { key: "responsable", label: "Responsable" }, { key: "echeance", label: "Échéance" }]} /></Section>}
            <Field label="Difficultés" value={c.difficultesDescription} />
          </>}

          {/* Objectives */}
          {report.reportType === "objective_tracking" && <>
            {c.objectifs?.length > 0 && <Section title="Objectifs" color="#10B981"><Table rows={c.objectifs} columns={[{ key: "objectif", label: "Objectif" }, { key: "dateDebut", label: "Début" }, { key: "dateFin", label: "Fin" }, { key: "progression", label: "%" }]} /></Section>}
            <Field label="État d'avancement" value={c.etatAvancement} />
            <Field label="Obstacles" value={c.obstacles} />
            <Field label="Recommandation" value={c.recommandationType ? `${c.recommandationType} — ${c.recommandationDetails || ""}` : null} />
          </>}

          {/* Evaluation */}
          {report.reportType === "employee_evaluation" && <>
            <Field label="Employé" value={c.employeeId} />
            <Section title="Notes compétences techniques" color="#F59E0B">
              {[["Expertise métier", c.noteExpertise], ["Qualité du travail", c.noteQualite], ["Respect procédures", c.noteProcessus], ["Résolution problèmes", c.noteResolution]].filter(([, v]) => v).map(([l, v]) =>
                <div key={l} className="flex items-center justify-between py-1.5">
                  <span className="text-sm" style={{ color: "var(--hr-text)" }}>{l}</span>
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => <div key={n} className="w-5 h-5 rounded" style={{ background: n <= (v as number) ? "#F59E0B" : "var(--hr-hover)" }} />)}</div>
                </div>
              )}
            </Section>
            <Field label="Forces" value={c.forces} />
            <Field label="Axes d'amélioration" value={c.axes} />
            <Field label="Recommandation" value={c.recommandation} />
          </>}

          {/* Incident */}
          {report.reportType === "incident" && <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" value={c.dateIncident} />
              <Field label="Heure" value={c.heureIncident} />
              <Field label="Lieu" value={c.lieu} />
              <Field label="Service" value={c.service} />
            </div>
            <Field label="Type d'incident" value={c.typeIncident} />
            <Field label="Impact" value={c.impact} />
            {c.personnes?.length > 0 && <Section title="Personnes impliquées" color="#EF4444"><Table rows={c.personnes} columns={[{ key: "nom", label: "Nom" }, { key: "fonction", label: "Fonction" }, { key: "role", label: "Rôle" }]} /></Section>}
            <Field label="Description" value={c.description} />
            <Field label="Actions immédiates" value={(c.actionsImmédiates || []).join(", ")} />
            <Field label="Décision RH" value={c.decisionRH} />
          </>}

          {/* Meeting */}
          {report.reportType === "meeting" && <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" value={c.dateMeeting} />
              <Field label="Horaire" value={c.heureDebut ? `${c.heureDebut} → ${c.heureFin || ""}` : null} />
              <Field label="Organisateur" value={c.organisateur} />
            </div>
            {c.participants?.length > 0 && <Section title="Participants" color="#8B5CF6"><Table rows={c.participants} columns={[{ key: "nom", label: "Nom" }, { key: "fonction", label: "Fonction" }, { key: "present", label: "Présent" }]} /></Section>}
            <Field label="Ordre du jour" value={c.ordreJour} />
            {c.actions?.length > 0 && <Section title="Actions décidées" color="#8B5CF6"><Table rows={c.actions} columns={[{ key: "action", label: "Action" }, { key: "responsable", label: "Responsable" }, { key: "dateLimite", label: "Date limite" }]} /></Section>}
            <Field label="Prochaine réunion" value={c.prochaineMeeting ? `${c.prochaineMeeting} — ${c.prochainObjectif || ""}` : null} />
          </>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function ManagerReportsSection() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";
  const [reports, setReports] = useState<ManagerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState<ManagerReport | null>(null);
  const [viewReport, setViewReport] = useState<ManagerReport | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");

  const load = () => {
    if (!currentUser?.companyId) return;
    setLoading(true);
    managerReportsApi.list({ companyId: currentUser.companyId })
      .then(setReports).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [currentUser?.companyId]);

  const upsert = (r: ManagerReport) => setReports(prev => {
    const idx = prev.findIndex(x => x.id === r.id);
    if (idx === -1) return [r, ...prev];
    return prev.map(x => x.id === r.id ? r : x);
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce rapport ?")) return;
    await managerReportsApi.delete(id).catch(console.error);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const filtered = reports
    .filter(r => activeType === "all" || r.reportType === activeType)
    .filter(r => activeStatus === "all" || r.status === activeStatus);

  const statuses = ["all", ...Object.keys(STATUS_CONFIG)] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: "var(--hr-text)" }}>Rapports Manager</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--hr-text-muted)" }}>
            {isAdmin ? "Tous les rapports soumis par les managers" : "Vos rapports d'équipe et de suivi"}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={() => { setEditReport(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontWeight: 700 }}>
            <Plus size={14} /> Nouveau rapport
          </button>
        )}
      </div>

      {/* Quick cards for managers */}
      {!isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {REPORT_TYPES.map(t => (
            <motion.button key={t.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setEditReport(null); setShowForm(true); }}
              className="p-3 rounded-2xl text-left" style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${t.color}18` }}>
                <t.icon size={14} style={{ color: t.color }} />
              </div>
              <p className="text-xs font-bold leading-tight" style={{ color: "var(--hr-text)" }}>{t.label}</p>
            </motion.button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map(t => (
          <button key={t.id} onClick={() => setActiveType(activeType === t.id ? "all" : t.id)}
            className="px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all"
            style={{ background: activeType === t.id ? `${t.color}18` : "var(--hr-hover)", color: activeType === t.id ? t.color : "var(--hr-text-muted)", fontWeight: activeType === t.id ? 700 : 400, border: `1px solid ${activeType === t.id ? t.color : "transparent"}` }}>
            {t.label}
          </button>
        ))}
        <div className="h-6 w-px mx-1 self-center" style={{ background: "var(--hr-card-border)" }} />
        {statuses.map(s => s !== "all" ? (
          <button key={s} onClick={() => setActiveStatus(activeStatus === s ? "all" : s)}
            className="px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all"
            style={{ background: activeStatus === s ? STATUS_CONFIG[s].bg : "var(--hr-hover)", color: activeStatus === s ? STATUS_CONFIG[s].color : "var(--hr-text-muted)", fontWeight: activeStatus === s ? 700 : 400 }}>
            {STATUS_CONFIG[s].label}
          </button>
        ) : null)}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center rounded-2xl" style={{ background: "var(--hr-card)", border: "1px dashed var(--hr-card-border)" }}>
          <FileText size={34} style={{ color: "var(--hr-text-light)" }} className="mx-auto mb-3" />
          <p className="text-sm font-semibold" style={{ color: "var(--hr-text-muted)" }}>
            {reports.length === 0 ? "Aucun rapport créé" : "Aucun résultat pour ces filtres"}
          </p>
          {!isAdmin && <p className="text-xs mt-1" style={{ color: "var(--hr-text-light)" }}>Cliquez sur "Nouveau rapport" pour commencer</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => {
            const meta = REPORT_TYPES.find(t => t.id === r.reportType);
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all"
                style={{ background: "var(--hr-card)", border: "1px solid var(--hr-card-border)" }}
                onClick={() => setViewReport(r)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: meta ? `${meta.color}18` : "var(--hr-hover)" }}>
                  {meta && <meta.icon size={17} style={{ color: meta.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--hr-text)" }}>{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <StatusBadge status={r.status} />
                    <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>{meta?.label}</span>
                    {r.periodStart && <span className="text-xs" style={{ color: "var(--hr-text-light)" }}>· {fmtDate(r.periodStart)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.status === "draft" && !isAdmin && (
                    <button onClick={e => { e.stopPropagation(); setEditReport(r); setShowForm(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80"
                      style={{ background: "rgba(99,102,241,0.1)" }}>
                      <Edit3 size={12} style={{ color: "#6366F1" }} />
                    </button>
                  )}
                  {(r.status === "draft" && !isAdmin) && (
                    <button onClick={e => handleDelete(r.id, e)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.1)" }}>
                      <Trash2 size={12} style={{ color: "#EF4444" }} />
                    </button>
                  )}
                  <ChevronRight size={14} style={{ color: "var(--hr-text-light)" }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <ReportFormModal
            report={editReport}
            onClose={() => { setShowForm(false); setEditReport(null); }}
            onSaved={upsert}
          />
        )}
        {viewReport && (
          <ReportViewerModal
            report={viewReport}
            onClose={() => setViewReport(null)}
            onStatusChange={r => { upsert(r); setViewReport(r); }}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
