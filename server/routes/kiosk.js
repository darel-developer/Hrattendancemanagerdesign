const express = require('express');
const router = express.Router();
const db = require('../db');

// Employés actifs d'une entreprise (pour affichage kiosque)
router.get('/employees/:companyId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, avatar, position, department
       FROM employees WHERE company_id = ? AND status != 'Inactif' ORDER BY first_name`,
      [req.params.companyId]
    );
    res.json(rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      avatar: r.avatar,
      position: r.position,
      department: r.department,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pointage kiosque (entrée / sortie automatique)
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, pin, companyId } = req.body;
    if (!employeeId || !pin || !companyId) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Vérifier l'employé dans la bonne entreprise
    const [empRows] = await db.query(
      'SELECT e.*, c.work_start, c.late_tolerance FROM employees e JOIN companies c ON e.company_id = c.id WHERE e.id = ? AND e.company_id = ?',
      [employeeId, companyId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé dans cette entreprise' });
    }
    const emp = empRows[0];

    // Vérifier le PIN
    if (emp.pin !== String(pin)) {
      return res.status(401).json({ error: 'PIN incorrect' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

    // Déterminer si l'arrivée est en retard
    const workStart = String(emp.work_start).slice(0, 5); // "HH:MM"
    const [wh, wm] = workStart.split(':').map(Number);
    const [nh, nm] = nowTime.split(':').map(Number);
    const workStartMinutes = wh * 60 + wm + (emp.late_tolerance || 5);
    const nowMinutes = nh * 60 + nm;
    const isLate = nowMinutes > workStartMinutes;

    // Vérifier l'enregistrement du jour
    const [records] = await db.query(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    if (records.length === 0) {
      // Pas encore pointé → check-in
      const id = `ATT${Date.now()}`;
      const status = isLate ? 'Retard' : 'Présent';
      await db.query(
        `INSERT INTO attendance_records (id, employee_id, date, check_in, status, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, employeeId, today, nowTime, status, isLate ? `Retard de ${nowMinutes - (wh * 60 + wm)} min` : '']
      );
      return res.json({
        success: true,
        action: 'check_in',
        time: nowTime,
        status,
        employee: `${emp.first_name} ${emp.last_name}`,
      });
    }

    const rec = records[0];
    if (rec.check_in && !rec.check_out) {
      // A pointé l'arrivée → check-out
      const checkIn = String(rec.check_in).slice(0, 5);
      const [h1, m1] = checkIn.split(':').map(Number);
      const hoursWorked = Math.round(((nh * 60 + nm) - (h1 * 60 + m1)) / 60 * 100) / 100;
      await db.query(
        'UPDATE attendance_records SET check_out = ?, hours_worked = ? WHERE employee_id = ? AND date = ?',
        [nowTime, hoursWorked, employeeId, today]
      );
      return res.json({
        success: true,
        action: 'check_out',
        time: nowTime,
        hoursWorked,
        employee: `${emp.first_name} ${emp.last_name}`,
      });
    }

    res.status(409).json({ error: 'Pointage déjà complet pour aujourd\'hui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
