const express = require('express');
const router = express.Router();
const db = require('../db');

// Protection brute-force PIN en mémoire
// Clé : employeeId, valeur : { count, lockedUntil }
const pinFailures = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkPinLock(employeeId) {
  const rec = pinFailures.get(employeeId);
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true;
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
    pinFailures.delete(employeeId);
    return false;
  }
  return false;
}

function recordPinFailure(employeeId) {
  const rec = pinFailures.get(employeeId) || { count: 0, lockedUntil: null };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  pinFailures.set(employeeId, rec);
}

function clearPinFailures(employeeId) {
  pinFailures.delete(employeeId);
}

// Employés actifs d'une entreprise (affichage kiosque — pas de données sensibles)
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
      // PIN et password_hash intentionnellement exclus
    })));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Pointage kiosque (entrée / sortie automatique)
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, pin, companyId } = req.body;
    if (!employeeId || !pin || !companyId) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Vérifier le verrouillage brute-force
    if (checkPinLock(employeeId)) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
    }

    // Vérifier l'employé dans la bonne entreprise
    const [empRows] = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.pin, c.work_start, c.late_tolerance
       FROM employees e JOIN companies c ON e.company_id = c.id
       WHERE e.id = ? AND e.company_id = ?`,
      [employeeId, companyId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé dans cette entreprise' });
    }
    const emp = empRows[0];

    // Vérifier le PIN
    if (!emp.pin || emp.pin !== String(pin)) {
      recordPinFailure(employeeId);
      const rec = pinFailures.get(employeeId);
      const remaining = MAX_ATTEMPTS - (rec?.count ?? 0);
      if (remaining <= 0) {
        return res.status(429).json({ error: 'Compte kiosque verrouillé 15 minutes après trop de tentatives.' });
      }
      return res.status(401).json({ error: `PIN incorrect (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})` });
    }

    // PIN correct : réinitialiser le compteur
    clearPinFailures(employeeId);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

    // Calcul du retard
    const workStart = String(emp.work_start).slice(0, 5);
    const [wh, wm] = workStart.split(':').map(Number);
    const [nh, nm] = nowTime.split(':').map(Number);
    const workStartMinutes = wh * 60 + wm + (emp.late_tolerance || 5);
    const nowMinutes = nh * 60 + nm;
    const isLate = nowMinutes > workStartMinutes;

    const [records] = await db.query(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    if (records.length === 0) {
      const id = `ATT${Date.now()}`;
      const status = isLate ? 'Retard' : 'Présent';
      await db.query(
        `INSERT INTO attendance_records (id, employee_id, date, check_in, status, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, employeeId, today, nowTime, status, isLate ? `Retard de ${nowMinutes - (wh * 60 + wm)} min` : '']
      );
      return res.json({ success: true, action: 'check_in', time: nowTime, status, employee: `${emp.first_name} ${emp.last_name}` });
    }

    const rec = records[0];
    if (rec.check_in && !rec.check_out) {
      const checkIn = String(rec.check_in).slice(0, 5);
      const [h1, m1] = checkIn.split(':').map(Number);
      const hoursWorked = Math.round(((nh * 60 + nm) - (h1 * 60 + m1)) / 60 * 100) / 100;
      await db.query(
        'UPDATE attendance_records SET check_out = ?, hours_worked = ? WHERE employee_id = ? AND date = ?',
        [nowTime, hoursWorked, employeeId, today]
      );
      return res.json({ success: true, action: 'check_out', time: nowTime, hoursWorked, employee: `${emp.first_name} ${emp.last_name}` });
    }

    res.status(409).json({ error: "Pointage déjà complet pour aujourd'hui" });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
