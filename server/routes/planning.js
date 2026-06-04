const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, checkCompany } = require('../middleware/auth');

function mapShift(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date || null,
    startTime: row.start_time ? String(row.start_time).slice(0, 5) : null,
    endTime: row.end_time ? String(row.end_time).slice(0, 5) : null,
    shiftType: row.shift_type,
    note: row.note || '',
    createdAt: row.created_at || null,
  };
}

router.get('/', requireAuth, checkCompany, async (req, res) => {
  try {
    const { employeeId, companyId, startDate, endDate } = req.query;
    let query = companyId
      ? 'SELECT ts.* FROM team_shifts ts JOIN employees e ON ts.employee_id = e.id WHERE 1=1'
      : 'SELECT * FROM team_shifts WHERE 1=1';
    const params = [];
    if (companyId) { query += ' AND e.company_id = ?'; params.push(companyId); }
    if (employeeId) { query += companyId ? ' AND ts.employee_id = ?' : ' AND employee_id = ?'; params.push(employeeId); }
    if (startDate && endDate) {
      query += companyId ? ' AND ts.date BETWEEN ? AND ?' : ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += companyId ? ' AND ts.date >= ?' : ' AND date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += companyId ? ' AND ts.date <= ?' : ' AND date <= ?';
      params.push(endDate);
    }
    query += companyId ? ' ORDER BY ts.date ASC, ts.start_time ASC' : ' ORDER BY date ASC, start_time ASC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapShift));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const s = req.body;
    const id = s.id || `SHF${Date.now().toString(36).slice(-7).toUpperCase()}`;
    await db.query(
      `INSERT INTO team_shifts
        (id, employee_id, date, start_time, end_time, shift_type, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON CONFLICT (id) DO UPDATE SET
        start_time=EXCLUDED.start_time, end_time=EXCLUDED.end_time,
        shift_type=EXCLUDED.shift_type, note=EXCLUDED.note`,
      [
        id, s.employeeId, s.date, s.startTime || null,
        s.endTime || null, s.shiftType || 'Matin', s.note || '',
      ]
    );
    const [rows] = await db.query('SELECT * FROM team_shifts WHERE id = ?', [id]);
    res.status(201).json(mapShift(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const s = req.body;
    await db.query(
      `UPDATE team_shifts SET
        employee_id=?, date=?, start_time=?, end_time=?, shift_type=?, note=?
       WHERE id=?`,
      [
        s.employeeId, s.date, s.startTime || null,
        s.endTime || null, s.shiftType, s.note || '',
        req.params.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM team_shifts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Planning non trouvé' });
    res.json(mapShift(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM team_shifts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
