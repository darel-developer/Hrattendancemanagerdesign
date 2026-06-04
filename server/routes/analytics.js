'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, checkCompany } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rptId() {
  return `ARP${Date.now().toString(36).slice(-8).toUpperCase()}`;
}

function mapRpt(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    type: row.type,
    title: row.title,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    department: row.department || null,
    generatedBy: row.generated_by,
    status: row.status,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    createdAt: row.created_at,
  };
}

// ─── GET /api/analytics — list reports ───────────────────────────────────────
router.get('/', requireAuth, checkCompany, async (req, res) => {
  try {
    const { companyId, type, limit = 50 } = req.query;
    let q = 'SELECT id, company_id, type, title, period_start, period_end, department, generated_by, status, created_at FROM analytics_reports WHERE 1=1';
    const p = [];
    if (companyId) { q += ' AND company_id = ?'; p.push(companyId); }
    if (type)       { q += ' AND type = ?';       p.push(type); }
    q += ' ORDER BY created_at DESC LIMIT ?';
    p.push(parseInt(limit));
    const [rows] = await db.query(q, p);
    res.json(rows.map(r => ({
      id: r.id, companyId: r.company_id, type: r.type, title: r.title,
      periodStart: r.period_start, periodEnd: r.period_end, department: r.department,
      generatedBy: r.generated_by, status: r.status, createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('[Analytics] GET /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/analytics/:id ───────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM analytics_reports WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rapport introuvable' });
    if (!req.user.isSuperAdmin && rows[0].company_id !== req.user.companyId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    res.json(mapRpt(rows[0]));
  } catch (err) {
    console.error('[Analytics] GET /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DELETE /api/analytics/:id ────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM analytics_reports WHERE id = ? AND (company_id = ? OR ?)', [
      req.params.id, req.user.companyId, !!req.user.isSuperAdmin,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Analytics] DELETE /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/analytics/generate ────────────────────────────────────────────
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { type, periodStart, periodEnd, department, employeeId, title } = req.body;
    const companyId = req.user.isSuperAdmin ? (req.body.companyId || req.user.companyId) : req.user.companyId;

    if (!type || !periodStart || !periodEnd) {
      return res.status(400).json({ error: 'type, periodStart et periodEnd requis' });
    }

    let data;
    switch (type) {
      case 'attendance_daily':    data = await genAttendanceDaily(companyId, periodStart, periodEnd, department); break;
      case 'attendance_monthly':  data = await genAttendanceMonthly(companyId, periodStart, periodEnd, department); break;
      case 'leaves':              data = await genLeaves(companyId, periodStart, periodEnd, department); break;
      case 'performance':         data = await genPerformance(companyId, periodStart, periodEnd, department); break;
      case 'disciplinary':        data = await genDisciplinary(companyId, periodStart, periodEnd, department); break;
      case 'executive':           data = await genExecutive(companyId, periodStart, periodEnd); break;
      case 'individual':          data = await genIndividual(companyId, employeeId, periodStart, periodEnd); break;
      case 'compliance':          data = await genCompliance(companyId); break;
      default: return res.status(400).json({ error: `Type de rapport inconnu : ${type}` });
    }

    const reportTitle = title || buildTitle(type, periodStart, periodEnd, department);
    const id = rptId();
    await db.query(
      `INSERT INTO analytics_reports (id, company_id, type, title, period_start, period_end, department, generated_by, status, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)`,
      [id, companyId, type, reportTitle, periodStart, periodEnd, department || null, req.user.id, JSON.stringify(data)]
    );

    const [rows] = await db.query('SELECT * FROM analytics_reports WHERE id = ?', [id]);
    res.status(201).json(mapRpt(rows[0]));
  } catch (err) {
    console.error('[Analytics] POST /generate', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

function buildTitle(type, start, end, dept) {
  const LABELS = {
    attendance_daily: 'Présence journalière',
    attendance_monthly: 'Présence mensuelle',
    leaves: 'Rapport des congés',
    performance: 'Rapport de performance',
    disciplinary: 'Rapport disciplinaire',
    executive: 'Rapport exécutif',
    individual: 'Rapport individuel',
    compliance: 'Rapport de conformité',
  };
  const s = new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const e = new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${LABELS[type] || type}${dept ? ` — ${dept}` : ''} (${s} → ${e})`;
}

// ─── Generators ───────────────────────────────────────────────────────────────

async function getEmployees(companyId, department) {
  let q = "SELECT * FROM employees WHERE company_id = ? AND status = 'Actif'";
  const p = [companyId];
  if (department) { q += ' AND department = ?'; p.push(department); }
  const [rows] = await db.query(q, p);
  return rows;
}

async function getAttendance(companyId, start, end, department) {
  let q = `SELECT ar.* FROM attendance_records ar
           JOIN employees e ON ar.employee_id = e.id
           WHERE e.company_id = ? AND ar.date >= ? AND ar.date <= ?`;
  const p = [companyId, start, end];
  if (department) { q += ' AND e.department = ?'; p.push(department); }
  const [rows] = await db.query(q, p);
  return rows;
}

// 1. Présence journalière (détail par jour)
async function genAttendanceDaily(companyId, start, end, department) {
  const [emps, records] = await Promise.all([
    getEmployees(companyId, department),
    getAttendance(companyId, start, end, department),
  ]);

  const days = [];
  const d = new Date(start);
  const endDate = new Date(end);
  while (d <= endDate) {
    const ds = d.toISOString().split('T')[0];
    const dayRecs = records.filter(r => r.date === ds);
    days.push({
      date: ds,
      presents: dayRecs.filter(r => r.status === 'Présent').length,
      absents: emps.length - dayRecs.length,
      retards: dayRecs.filter(r => r.status === 'Retard').length,
      teletravail: dayRecs.filter(r => r.status === 'Télétravail').length,
      conge: dayRecs.filter(r => r.status === 'Congé').length,
      tauxPresence: emps.length > 0 ? Math.round((dayRecs.filter(r => ['Présent','Retard','Télétravail'].includes(r.status)).length / emps.length) * 100) : 0,
    });
    d.setDate(d.getDate() + 1);
  }

  const employees = emps.map(emp => {
    const recs = records.filter(r => r.employee_id === emp.id);
    const presents = recs.filter(r => r.status === 'Présent').length;
    const retards = recs.filter(r => r.status === 'Retard').length;
    const tele = recs.filter(r => r.status === 'Télétravail').length;
    const absences = days.length - recs.length;
    const heures = recs.reduce((s, r) => s + (parseFloat(r.hours_worked) || 0), 0);
    return {
      id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
      department: emp.department, position: emp.position,
      presents, retards, teletravail: tele, absences,
      heuresTravaillees: Math.round(heures * 100) / 100,
      tauxPresence: days.length > 0 ? Math.round(((presents + retards + tele) / days.length) * 100) : 0,
    };
  });

  const totalRecs = records.filter(r => ['Présent','Retard','Télétravail'].includes(r.status)).length;
  const totalPossible = emps.length * days.length;
  return {
    kpis: {
      effectifTotal: emps.length,
      tauxPresenceMoyen: totalPossible > 0 ? Math.round((totalRecs / totalPossible) * 100) : 0,
      totalPresents: records.filter(r => r.status === 'Présent').length,
      totalAbsents: totalPossible - records.length,
      totalRetards: records.filter(r => r.status === 'Retard').length,
      totalTeletravail: records.filter(r => r.status === 'Télétravail').length,
      totalHeures: Math.round(records.reduce((s, r) => s + (parseFloat(r.hours_worked) || 0), 0) * 100) / 100,
    },
    days, employees,
  };
}

// 2. Présence mensuelle (résumé consolidé)
async function genAttendanceMonthly(companyId, start, end, department) {
  return genAttendanceDaily(companyId, start, end, department);
}

// 3. Rapport des congés
async function genLeaves(companyId, start, end, department) {
  const emps = await getEmployees(companyId, department);
  const empIds = emps.map(e => e.id);
  if (!empIds.length) return { kpis: {}, employees: [], byType: [], byStatus: [] };

  const ph = empIds.map(() => '?').join(',');
  const [leaves] = await db.query(
    `SELECT * FROM leave_requests WHERE employee_id IN (${ph}) AND (start_date <= ? AND end_date >= ?)`,
    [...empIds, end, start]
  );

  const byType = {};
  const byStatus = { 'En attente': 0, Approuvé: 0, Refusé: 0 };
  leaves.forEach(l => {
    byType[l.type] = (byType[l.type] || 0) + 1;
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
  });

  const employees = emps.map(emp => {
    const empLeaves = leaves.filter(l => l.employee_id === emp.id);
    return {
      id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
      department: emp.department,
      demandesTotal: empLeaves.length,
      approuvees: empLeaves.filter(l => l.status === 'Approuvé').length,
      refusees: empLeaves.filter(l => l.status === 'Refusé').length,
      enAttente: empLeaves.filter(l => l.status === 'En attente').length,
      joursConsommes: emp.leave_used || 0,
      soldeRestant: (emp.leave_balance || 0) - (emp.leave_used || 0),
    };
  });

  const totalApproved = leaves.filter(l => l.status === 'Approuvé').length;
  return {
    kpis: {
      demandesTotal: leaves.length,
      approuvees: totalApproved,
      refusees: leaves.filter(l => l.status === 'Refusé').length,
      enAttente: leaves.filter(l => l.status === 'En attente').length,
      tauxApprobation: leaves.length > 0 ? Math.round((totalApproved / leaves.length) * 100) : 0,
      soldeMoyen: emps.length > 0 ? Math.round(emps.reduce((s, e) => s + ((e.leave_balance || 0) - (e.leave_used || 0)), 0) / emps.length) : 0,
    },
    employees,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
  };
}

// 4. Performance
async function genPerformance(companyId, start, end, department) {
  const emps = await getEmployees(companyId, department);
  const empIds = emps.map(e => e.id);
  if (!empIds.length) return { kpis: {}, employees: [], byRating: [] };

  const ph = empIds.map(() => '?').join(',');
  const [reviews] = await db.query(
    `SELECT * FROM performance_reviews WHERE employee_id IN (${ph}) AND created_at >= ? AND created_at <= ?`,
    [...empIds, start, end + ' 23:59:59']
  );

  const empMap = Object.fromEntries(emps.map(e => [e.id, e]));
  const employees = emps.map(emp => {
    const empReviews = reviews.filter(r => r.employee_id === emp.id);
    const avgRating = empReviews.length > 0
      ? Math.round(empReviews.reduce((s, r) => s + (r.rating || 0), 0) / empReviews.length * 10) / 10
      : null;
    return {
      id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
      department: emp.department, position: emp.position,
      evaluations: empReviews.length,
      noteMoyenne: avgRating,
      statut: empReviews[0]?.status || null,
    };
  }).filter(e => e.evaluations > 0);

  employees.sort((a, b) => (b.noteMoyenne || 0) - (a.noteMoyenne || 0));

  const ratings = reviews.filter(r => r.rating).map(r => r.rating);
  const avgGlobal = ratings.length > 0 ? Math.round(ratings.reduce((s, r) => s + r, 0) / ratings.length * 10) / 10 : null;

  const byRating = [
    { label: 'Excellent (4-5)', count: ratings.filter(r => r >= 4).length },
    { label: 'Bien (3-4)', count: ratings.filter(r => r >= 3 && r < 4).length },
    { label: 'Moyen (2-3)', count: ratings.filter(r => r >= 2 && r < 3).length },
    { label: 'Insuffisant (<2)', count: ratings.filter(r => r < 2).length },
  ];

  return {
    kpis: {
      evaluationsTotal: reviews.length,
      employesEvalues: employees.length,
      noteMoyenne: avgGlobal,
      topPerformers: employees.slice(0, 5).map(e => `${e.firstName} ${e.lastName} (${e.noteMoyenne}/5)`),
      aAccompagner: employees.slice(-3).filter(e => (e.noteMoyenne || 5) < 3).map(e => `${e.firstName} ${e.lastName}`),
    },
    employees, byRating,
  };
}

// 5. Disciplinaire (absences récurrentes + retards)
async function genDisciplinary(companyId, start, end, department) {
  const [emps, records] = await Promise.all([
    getEmployees(companyId, department),
    getAttendance(companyId, start, end, department),
  ]);

  const ABSENCE_THRESHOLD = 3;
  const LATE_THRESHOLD = 3;

  const employees = emps.map(emp => {
    const recs = records.filter(r => r.employee_id === emp.id);
    const absences = recs.filter(r => r.status === 'Absent').length;
    const retards = recs.filter(r => r.status === 'Retard').length;
    const absencesNonJustifiees = recs.filter(r => r.status === 'Absent' && !r.note).length;
    return {
      id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
      department: emp.department, position: emp.position,
      absences, retards, absencesNonJustifiees,
      risque: absences >= ABSENCE_THRESHOLD || retards >= LATE_THRESHOLD ? 'élevé' : absences > 0 || retards > 0 ? 'moyen' : 'faible',
    };
  });

  const atRisk = employees.filter(e => e.risque === 'élevé');
  return {
    kpis: {
      totalAbsences: records.filter(r => r.status === 'Absent').length,
      totalRetards: records.filter(r => r.status === 'Retard').length,
      absencesNonJustifiees: records.filter(r => r.status === 'Absent' && !r.note).length,
      employesARisque: atRisk.length,
    },
    employees: employees.sort((a, b) => (b.absences + b.retards) - (a.absences + a.retards)),
    atRisk,
  };
}

// 6. Exécutif (vue consolidée)
async function genExecutive(companyId, start, end) {
  const [presence, leaves, perf] = await Promise.all([
    genAttendanceDaily(companyId, start, end, null),
    genLeaves(companyId, start, end, null),
    genPerformance(companyId, start, end, null),
  ]);

  const [emps] = await db.query(
    "SELECT department, COUNT(*) as cnt FROM employees WHERE company_id = ? AND status = 'Actif' GROUP BY department",
    [companyId]
  );

  return {
    effectif: {
      total: presence.kpis.effectifTotal,
      parDepartement: emps.map(r => ({ department: r.department, count: parseInt(r.cnt) })),
    },
    presence: {
      tauxMoyen: presence.kpis.tauxPresenceMoyen,
      totalAbsences: presence.kpis.totalAbsents,
      totalRetards: presence.kpis.totalRetards,
      totalHeures: presence.kpis.totalHeures,
    },
    conges: {
      demandes: leaves.kpis.demandesTotal,
      approuvees: leaves.kpis.approuvees,
      tauxApprobation: leaves.kpis.tauxApprobation,
      soldeMoyen: leaves.kpis.soldeMoyen,
    },
    performance: {
      evaluations: perf.kpis.evaluationsTotal,
      noteMoyenne: perf.kpis.noteMoyenne,
      topPerformers: perf.kpis.topPerformers,
    },
  };
}

// 7. Individuel
async function genIndividual(companyId, employeeId, start, end) {
  if (!employeeId) throw new Error('employeeId requis pour le rapport individuel');

  const [[emp], records, leaves, reviews] = await Promise.all([
    db.query('SELECT * FROM employees WHERE id = ? AND company_id = ?', [employeeId, companyId]),
    db.query('SELECT * FROM attendance_records WHERE employee_id = ? AND date >= ? AND date <= ? ORDER BY date DESC', [employeeId, start, end]),
    db.query("SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY request_date DESC LIMIT 20", [employeeId]),
    db.query("SELECT * FROM performance_reviews WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10", [employeeId]),
  ]);

  const e = emp[0];
  if (!e) throw new Error('Employé introuvable');

  const recs = records[0];
  const presents = recs.filter(r => r.status === 'Présent').length;
  const retards = recs.filter(r => r.status === 'Retard').length;
  const tele = recs.filter(r => r.status === 'Télétravail').length;
  const revs = reviews[0];
  const avgRating = revs.length > 0 ? Math.round(revs.reduce((s, r) => s + (r.rating || 0), 0) / revs.length * 10) / 10 : null;

  return {
    employee: {
      id: e.id, firstName: e.first_name, lastName: e.last_name,
      email: e.email, phone: e.phone, department: e.department,
      position: e.position, contractType: e.contract_type,
      startDate: e.start_date, status: e.status, avatar: e.avatar,
    },
    presence: {
      presents, retards, teletravail: tele,
      absences: recs.length - presents - retards - tele,
      tauxPresence: recs.length > 0 ? Math.round(((presents + retards + tele) / recs.length) * 100) : 0,
      heuresTravaillees: Math.round(recs.reduce((s, r) => s + (parseFloat(r.hours_worked) || 0), 0) * 100) / 100,
      dernierPointage: recs[0] || null,
    },
    conges: {
      balance: e.leave_balance || 0,
      used: e.leave_used || 0,
      remaining: (e.leave_balance || 0) - (e.leave_used || 0),
      historique: leaves[0].slice(0, 10).map(l => ({
        type: l.type, startDate: l.start_date, endDate: l.end_date,
        days: l.days, status: l.status,
      })),
    },
    performance: {
      noteMoyenne: avgRating,
      evaluations: revs.slice(0, 5).map(r => ({
        period: r.period, rating: r.rating, status: r.status,
        strengths: r.strengths, improvements: r.improvements,
      })),
    },
    attendance: recs.slice(0, 30).map(r => ({
      date: r.date, checkIn: r.check_in, checkOut: r.check_out,
      status: r.status, hoursWorked: r.hours_worked, note: r.note,
    })),
  };
}

// 8. Conformité
async function genCompliance(companyId) {
  const [emps] = await db.query("SELECT * FROM employees WHERE company_id = ? AND status = 'Actif'", [companyId]);
  const [docs] = await db.query(
    `SELECT ed.* FROM employee_documents ed JOIN employees e ON ed.employee_id = e.id WHERE e.company_id = ?`,
    [companyId]
  );

  const today = new Date().toISOString().split('T')[0];
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const expiringDocs = docs.filter(d => d.expiry_date && d.expiry_date <= in30days && d.expiry_date >= today);
  const expiredDocs = docs.filter(d => d.expiry_date && d.expiry_date < today);

  const employees = emps.map(emp => {
    const empDocs = docs.filter(d => d.employee_id === emp.id);
    const expiring = empDocs.filter(d => d.expiry_date && d.expiry_date <= in30days && d.expiry_date >= today);
    const expired = empDocs.filter(d => d.expiry_date && d.expiry_date < today);
    return {
      id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
      department: emp.department, documentsTotal: empDocs.length,
      documentsExpirant: expiring.length, documentsExpires: expired.length,
      conformite: expired.length === 0 && expiring.length === 0 ? 'conforme' : expired.length > 0 ? 'non-conforme' : 'alerte',
    };
  });

  return {
    kpis: {
      employesTotal: emps.length,
      documentsTotal: docs.length,
      documentsExpirant: expiringDocs.length,
      documentsExpires: expiredDocs.length,
      tauxConformite: emps.length > 0 ? Math.round((employees.filter(e => e.conformite === 'conforme').length / emps.length) * 100) : 100,
    },
    employees: employees.sort((a, b) => b.documentsExpires - a.documentsExpires),
    expiringDocs: expiringDocs.map(d => ({ employeeId: d.employee_id, title: d.title, type: d.type, expiryDate: d.expiry_date })),
  };
}

// ─── Ensure table ─────────────────────────────────────────────────────────────
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS analytics_reports (
      id           VARCHAR(20) PRIMARY KEY,
      company_id   VARCHAR(50) NOT NULL,
      type         VARCHAR(50) NOT NULL,
      title        VARCHAR(255) NOT NULL,
      period_start DATE NOT NULL,
      period_end   DATE NOT NULL,
      department   VARCHAR(100),
      generated_by VARCHAR(50) NOT NULL,
      status       VARCHAR(20) DEFAULT 'generated',
      data         JSONB NOT NULL,
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `);
}

module.exports = { router, ensureTable };
