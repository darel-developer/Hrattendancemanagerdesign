const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, checkCompany } = require('../middleware/auth');

function mapReview(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    reviewerId: row.reviewer_id,
    period: row.period || '',
    rating: row.rating !== null ? parseInt(row.rating) : null,
    strengths: row.strengths || '',
    improvements: row.improvements || '',
    goals: row.goals || '',
    status: row.status,
    createdAt: row.created_at || null,
  };
}

router.get('/', requireAuth, checkCompany, async (req, res) => {
  try {
    const { employeeId, reviewerId, companyId } = req.query;
    let query = companyId
      ? 'SELECT pr.* FROM performance_reviews pr JOIN employees e ON pr.employee_id = e.id WHERE 1=1'
      : 'SELECT * FROM performance_reviews WHERE 1=1';
    const params = [];
    if (companyId) { query += ' AND e.company_id = ?'; params.push(companyId); }
    if (employeeId) { query += companyId ? ' AND pr.employee_id = ?' : ' AND employee_id = ?'; params.push(employeeId); }
    if (reviewerId) { query += companyId ? ' AND pr.reviewer_id = ?' : ' AND reviewer_id = ?'; params.push(reviewerId); }
    query += companyId ? ' ORDER BY pr.created_at DESC' : ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapReview));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const r = req.body;
    const id = r.id || `PRF${Date.now().toString(36).slice(-7).toUpperCase()}`;
    await db.query(
      `INSERT INTO performance_reviews
        (id, employee_id, reviewer_id, period, rating, strengths, improvements, goals, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, r.employeeId, r.reviewerId || null, r.period || '',
        r.rating || null, r.strengths || '', r.improvements || '',
        r.goals || '', r.status || 'Brouillon',
      ]
    );
    const [rows] = await db.query('SELECT * FROM performance_reviews WHERE id = ?', [id]);
    res.status(201).json(mapReview(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const r = req.body;
    await db.query(
      `UPDATE performance_reviews SET
        employee_id=?, reviewer_id=?, period=?, rating=?, strengths=?,
        improvements=?, goals=?, status=?
       WHERE id=?`,
      [
        r.employeeId, r.reviewerId || null, r.period || '',
        r.rating || null, r.strengths || '', r.improvements || '',
        r.goals || '', r.status,
        req.params.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM performance_reviews WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Évaluation non trouvée' });
    res.json(mapReview(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM performance_reviews WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
