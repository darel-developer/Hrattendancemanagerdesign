'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

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

router.get('/', requireAuth, async (req, res) => {
  try {
    const { date, employeeId, startDate, endDate } = req.query;
    let query = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    if (date)       { query += ' AND date = ?';        params.push(date); }
    if (startDate)  { query += ' AND date >= ?';       params.push(startDate); }
    if (endDate)    { query += ' AND date <= ?';       params.push(endDate); }
    if (employeeId) { query += ' AND employee_id = ?'; params.push(employeeId); }
    query += ' ORDER BY date DESC, id';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapRecord));
  } catch (err) {
    console.error('[Attendance] GET /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const r = req.body;
    const id = r.id || `ATT${Date.now()}`;

    // Auto-compute status at check-in time using company work_start + late_tolerance
    let status = r.status;
    if (r.checkIn && !r.checkOut && r.status !== 'Télétravail' && r.status !== 'Congé') {
      try {
        const [empRows] = await db.query('SELECT company_id FROM employees WHERE id = ?', [r.employeeId]);
        if (empRows.length > 0) {
          const [compRows] = await db.query('SELECT work_start, late_tolerance FROM companies WHERE id = ?', [empRows[0].company_id]);
          if (compRows.length > 0) {
            const workStart = String(compRows[0].work_start || '09:00').slice(0, 5);
            const lateTol = compRows[0].late_tolerance ?? 5;
            const [wh, wm] = workStart.split(':').map(Number);
            const [ch, cm] = r.checkIn.split(':').map(Number);
            status = (ch * 60 + cm) > (wh * 60 + wm + lateTol) ? 'Retard' : 'Présent';
          }
        }
      } catch (_) { /* keep client-submitted status as fallback */ }
    }

    await db.query(
      `INSERT INTO attendance_records
        (id, employee_id, date, check_in, check_out, status, hours_worked, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (employee_id, date) DO UPDATE SET
        check_in=EXCLUDED.check_in, check_out=EXCLUDED.check_out,
        status=EXCLUDED.status, hours_worked=EXCLUDED.hours_worked, note=EXCLUDED.note`,
      [id, r.employeeId, r.date, r.checkIn || null, r.checkOut || null,
       status, r.hoursWorked ?? null, r.note || '']
    );
    const [rows] = await db.query('SELECT * FROM attendance_records WHERE id = ?', [id]);
    const action = r.checkIn && !r.checkOut ? 'check-in' : r.checkOut ? 'check-out' : 'enregistrement';
    console.info(`[Attendance] ${action} — employé ${r.employeeId} le ${r.date} (${status})`);
    res.status(201).json(mapRecord(rows[0]));
  } catch (err) {
    console.error('[Attendance] POST /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const r = req.body;
    const sets = [];
    const params = [];
    if (r.checkIn     !== undefined) { sets.push('check_in=?');     params.push(r.checkIn || null); }
    if (r.checkOut    !== undefined) { sets.push('check_out=?');    params.push(r.checkOut || null); }
    if (r.status      !== undefined) { sets.push('status=?');       params.push(r.status); }
    if (r.hoursWorked !== undefined) { sets.push('hours_worked=?'); params.push(r.hoursWorked ?? null); }
    if (r.note        !== undefined) { sets.push('note=?');         params.push(r.note || ''); }
    if (sets.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    params.push(req.params.id);
    await db.query(`UPDATE attendance_records SET ${sets.join(', ')} WHERE id=?`, params);
    const [rows] = await db.query('SELECT * FROM attendance_records WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Enregistrement non trouvé' });
    if (r.checkOut) console.info(`[Attendance] check-out — record ${req.params.id} à ${r.checkOut}`);
    res.json(mapRecord(rows[0]));
  } catch (err) {
    console.error('[Attendance] PUT /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
