const express = require('express');
const router = express.Router();
const db = require('../db');

function mapRecord(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date || null,
    checkIn: row.check_in ? String(row.check_in).slice(0, 5) : null,
    checkOut: row.check_out ? String(row.check_out).slice(0, 5) : null,
    status: row.status,
    hoursWorked: row.hours_worked !== null ? parseFloat(row.hours_worked) : null,
    note: row.note || '',
  };
}

router.get('/', async (req, res) => {
  try {
    const { date, employeeId, startDate, endDate } = req.query;
    let query = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    if (date) { query += ' AND date = ?'; params.push(date); }
    if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND date <= ?'; params.push(endDate); }
    if (employeeId) { query += ' AND employee_id = ?'; params.push(employeeId); }
    query += ' ORDER BY date DESC, id';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapRecord));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const r = req.body;
    const id = r.id || `ATT${Date.now()}`;
    await db.query(
      `INSERT INTO attendance_records
        (id, employee_id, date, check_in, check_out, status, hours_worked, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        check_in=VALUES(check_in), check_out=VALUES(check_out),
        status=VALUES(status), hours_worked=VALUES(hours_worked), note=VALUES(note)`,
      [id, r.employeeId, r.date, r.checkIn || null, r.checkOut || null,
       r.status, r.hoursWorked ?? null, r.note || '']
    );
    const [rows] = await db.query('SELECT * FROM attendance_records WHERE id = ?', [id]);
    res.status(201).json(mapRecord(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const r = req.body;
    await db.query(
      `UPDATE attendance_records SET
        check_in=?, check_out=?, status=?, hours_worked=?, note=?
       WHERE id=?`,
      [r.checkIn || null, r.checkOut || null, r.status,
       r.hoursWorked ?? null, r.note || '', req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM attendance_records WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Enregistrement non trouvé' });
    res.json(mapRecord(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
