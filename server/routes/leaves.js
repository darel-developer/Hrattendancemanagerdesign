const express = require('express');
const router = express.Router();
const db = require('../db');

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

router.get('/', async (req, res) => {
  try {
    const { employeeId, companyId } = req.query;
    let query = companyId
      ? 'SELECT lr.* FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE 1=1'
      : 'SELECT * FROM leave_requests WHERE 1=1';
    const params = [];
    if (companyId) { query += ' AND e.company_id = ?'; params.push(companyId); }
    if (employeeId) { query += companyId ? ' AND lr.employee_id = ?' : ' AND employee_id = ?'; params.push(employeeId); }
    query += companyId ? ' ORDER BY lr.request_date DESC' : ' ORDER BY request_date DESC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapLeave));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const l = req.body;
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
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const l = req.body;
    await db.query(
      `UPDATE leave_requests SET
        status=?, reviewed_by=?, review_date=?, comment=?
       WHERE id=?`,
      [l.status, l.reviewedBy || null, l.reviewDate || null, l.comment || '', req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Congé non trouvé' });
    res.json(mapLeave(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
