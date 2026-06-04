'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, checkCompany } = require('../middleware/auth');

const VALID_TYPES = ['weekly_team', 'objective_tracking', 'employee_evaluation', 'incident', 'meeting'];
const VALID_STATUSES = ['draft', 'submitted', 'reviewed', 'approved', 'archived'];

function rptId() {
  return `MGR${Date.now().toString(36).slice(-8).toUpperCase()}`;
}

function mapReport(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    department: row.department || null,
    managerId: row.manager_id,
    reportType: row.report_type,
    title: row.title,
    periodStart: row.period_start || null,
    periodEnd: row.period_end || null,
    content: typeof row.content_json === 'string' ? JSON.parse(row.content_json) : (row.content_json || {}),
    status: row.status,
    attachmentsCount: row.attachments_count || 0,
    submittedAt: row.submitted_at || null,
    reviewedAt: row.reviewed_at || null,
    approvedAt: row.approved_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── GET /api/manager-reports ─────────────────────────────────────────────────
router.get('/', requireAuth, checkCompany, async (req, res) => {
  try {
    const { companyId, managerId, reportType, status, department } = req.query;
    let q = 'SELECT * FROM manager_reports WHERE 1=1';
    const p = [];

    if (companyId) { q += ' AND company_id = ?'; p.push(companyId); }
    // Un manager ne voit que ses propres rapports ; Admin voit tout
    if (req.user.role === 'Manager') { q += ' AND manager_id = ?'; p.push(req.user.id); }
    else if (managerId) { q += ' AND manager_id = ?'; p.push(managerId); }
    if (reportType) { q += ' AND report_type = ?'; p.push(reportType); }
    if (status) { q += ' AND status = ?'; p.push(status); }
    if (department) { q += ' AND department = ?'; p.push(department); }
    q += ' ORDER BY updated_at DESC LIMIT 100';

    const [rows] = await db.query(q, p);
    res.json(rows.map(mapReport));
  } catch (err) {
    console.error('[ManagerReports] GET /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/manager-reports/:id ────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM manager_reports WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rapport introuvable' });
    const r = rows[0];
    if (!req.user.isSuperAdmin && r.company_id !== req.user.companyId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (req.user.role === 'Manager' && r.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    res.json(mapReport(r));
  } catch (err) {
    console.error('[ManagerReports] GET /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/manager-reports ────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!['Manager', 'Admin'].includes(req.user.role) && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Réservé aux managers et administrateurs' });
    }
    const { reportType, title, periodStart, periodEnd, department, content } = req.body;
    if (!reportType || !VALID_TYPES.includes(reportType)) {
      return res.status(400).json({ error: `Type invalide. Valeurs : ${VALID_TYPES.join(', ')}` });
    }
    if (!title) return res.status(400).json({ error: 'Titre requis' });

    const id = rptId();
    await db.query(
      `INSERT INTO manager_reports
         (id, company_id, department, manager_id, report_type, title, period_start, period_end, content_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [id, req.user.companyId, department || req.user.department || null, req.user.id,
       reportType, title, periodStart || null, periodEnd || null, JSON.stringify(content || {})]
    );
    const [rows] = await db.query('SELECT * FROM manager_reports WHERE id = ?', [id]);
    res.status(201).json(mapReport(rows[0]));
  } catch (err) {
    console.error('[ManagerReports] POST /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PUT /api/manager-reports/:id ─────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM manager_reports WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rapport introuvable' });
    const r = rows[0];
    if (r.company_id !== req.user.companyId && !req.user.isSuperAdmin) return res.status(403).json({ error: 'Accès refusé' });
    if (req.user.role === 'Manager' && r.manager_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (req.user.role === 'Manager' && r.status !== 'draft') return res.status(400).json({ error: 'Impossible de modifier un rapport soumis' });

    const { title, periodStart, periodEnd, department, content, status } = req.body;
    const newStatus = status && VALID_STATUSES.includes(status) ? status : r.status;

    const submittedAt = newStatus === 'submitted' && r.status !== 'submitted' ? new Date().toISOString() : r.submitted_at;
    const reviewedAt  = newStatus === 'reviewed'  && r.status !== 'reviewed'  ? new Date().toISOString() : r.reviewed_at;
    const approvedAt  = newStatus === 'approved'  && r.status !== 'approved'  ? new Date().toISOString() : r.approved_at;

    await db.query(
      `UPDATE manager_reports SET
         title=?, period_start=?, period_end=?, department=?,
         content_json=?, status=?, submitted_at=?, reviewed_at=?, approved_at=?,
         updated_at=NOW()
       WHERE id=?`,
      [title || r.title, periodStart ?? r.period_start, periodEnd ?? r.period_end,
       department ?? r.department, JSON.stringify(content || JSON.parse(r.content_json || '{}')),
       newStatus, submittedAt, reviewedAt, approvedAt, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM manager_reports WHERE id = ?', [req.params.id]);
    res.json(mapReport(updated[0]));
  } catch (err) {
    console.error('[ManagerReports] PUT /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DELETE /api/manager-reports/:id ─────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM manager_reports WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rapport introuvable' });
    const r = rows[0];
    if (r.company_id !== req.user.companyId && !req.user.isSuperAdmin) return res.status(403).json({ error: 'Accès refusé' });
    if (req.user.role === 'Manager' && (r.manager_id !== req.user.id || r.status !== 'draft')) {
      return res.status(403).json({ error: 'Seuls les brouillons peuvent être supprimés' });
    }
    await db.query('DELETE FROM manager_reports WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[ManagerReports] DELETE /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS manager_reports (
      id                VARCHAR(20)  PRIMARY KEY,
      company_id        VARCHAR(50)  NOT NULL,
      department        VARCHAR(100),
      manager_id        VARCHAR(50)  NOT NULL,
      report_type       VARCHAR(50)  NOT NULL,
      title             VARCHAR(255) NOT NULL,
      period_start      DATE,
      period_end        DATE,
      content_json      JSONB        NOT NULL DEFAULT '{}',
      status            VARCHAR(20)  DEFAULT 'draft',
      attachments_count INTEGER      DEFAULT 0,
      submitted_at      TIMESTAMP,
      reviewed_at       TIMESTAMP,
      approved_at       TIMESTAMP,
      created_at        TIMESTAMP    DEFAULT NOW(),
      updated_at        TIMESTAMP    DEFAULT NOW()
    )
  `);
}

module.exports = { router, ensureTable };
