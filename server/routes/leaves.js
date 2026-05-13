'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, checkCompany } = require('../middleware/auth');

function mapLeave(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    type: row.type,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    days: row.days,
    reason: row.reason || '',
    status: row.status,
    requestDate: row.request_date || null,
    reviewedBy: row.reviewed_by || null,
    reviewDate: row.review_date || null,
    comment: row.comment || '',
  };
}

// ─── GET /leaves ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, checkCompany, async (req, res) => {
  try {
    const { employeeId, companyId } = req.query;

    // Un employé standard ne voit que ses propres congés
    const effectiveEmployeeId =
      req.user.role === 'Employee' ? req.user.id : (employeeId || null);

    let query = companyId
      ? 'SELECT lr.* FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE 1=1'
      : 'SELECT * FROM leave_requests WHERE 1=1';
    const params = [];
    if (companyId) { query += ' AND e.company_id = ?'; params.push(companyId); }
    if (effectiveEmployeeId) {
      query += companyId ? ' AND lr.employee_id = ?' : ' AND employee_id = ?';
      params.push(effectiveEmployeeId);
    }
    query += companyId ? ' ORDER BY lr.request_date DESC' : ' ORDER BY request_date DESC';

    const [rows] = await db.query(query, params);
    res.json(rows.map(mapLeave));
  } catch (err) {
    console.error('[Leaves] GET /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /leaves ─────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const l = req.body;
    // Un employé ne peut créer qu'une demande pour lui-même
    if (req.user.role === 'Employee' && l.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez soumettre une demande que pour vous-même' });
    }
    const id = l.id || `LVE${Date.now()}`;
    await db.query(
      `INSERT INTO leave_requests
        (id, employee_id, type, start_date, end_date, days, reason, status,
         request_date, reviewed_by, review_date, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, l.employeeId, l.type, l.startDate, l.endDate, l.days,
        l.reason || '', l.status || 'En attente',
        l.requestDate || new Date().toISOString().split('T')[0],
        l.reviewedBy || null, l.reviewDate || null, l.comment || '',
      ]
    );
    const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
    res.status(201).json(mapLeave(rows[0]));
  } catch (err) {
    console.error('[Leaves] POST /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PUT /leaves/:id ──────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Seuls Admin et Manager peuvent approuver/refuser
    if (!['Admin', 'Manager'].includes(req.user.role) && req.body.status && req.body.status !== 'En attente') {
      return res.status(403).json({ error: 'Seul un Admin ou Manager peut approuver/refuser une demande' });
    }

    const l = req.body;

    // Validation du solde avant approbation
    if (l.status === 'Approuvé') {
      const [leaveRows] = await db.query(
        'SELECT * FROM leave_requests WHERE id = ?', [req.params.id]
      );
      if (leaveRows.length === 0) return res.status(404).json({ error: 'Congé non trouvé' });

      const leave = leaveRows[0];
      const [empRows] = await db.query(
        'SELECT leave_balance, leave_used FROM employees WHERE id = ?', [leave.employee_id]
      );
      if (empRows.length > 0) {
        const emp = empRows[0];
        const remaining = (emp.leave_balance || 0) - (emp.leave_used || 0);
        if (leave.days > remaining) {
          return res.status(422).json({
            error: `Solde insuffisant : ${remaining} jour(s) disponible(s), ${leave.days} demandé(s)`,
          });
        }
        // Incrémenter leave_used atomiquement
        await db.query(
          'UPDATE employees SET leave_used = leave_used + ? WHERE id = ?',
          [leave.days, leave.employee_id]
        );
      }
    }

    await db.query(
      `UPDATE leave_requests SET status=?, reviewed_by=?, review_date=?, comment=? WHERE id=?`,
      [l.status, l.reviewedBy || null, l.reviewDate || null, l.comment || '', req.params.id]
    );

    const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Congé non trouvé' });
    res.json(mapLeave(rows[0]));
  } catch (err) {
    console.error('[Leaves] PUT /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
