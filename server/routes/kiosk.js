const express = require('express');
const router = express.Router();
const db = require('../db');

// Protection brute-force PIN en mémoire
const pinFailures = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

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
  if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOCKOUT_MS;
  pinFailures.set(employeeId, rec);
}

function clearPinFailures(employeeId) {
  pinFailures.delete(employeeId);
}

// Calcul de distance GPS (formule Haversine) — retourne la distance en mètres
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    })));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Pointage kiosque (entrée / sortie automatique)
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, pin, companyId, latitude, longitude } = req.body;
    if (!employeeId || !pin || !companyId) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    if (checkPinLock(employeeId)) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
    }

    const [empRows] = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.pin,
              c.work_start, c.late_tolerance, c.latitude AS co_lat, c.longitude AS co_lon, c.geo_radius
       FROM employees e JOIN companies c ON e.company_id = c.id
       WHERE e.id = ? AND e.company_id = ?`,
      [employeeId, companyId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé dans cette entreprise' });
    }
    const emp = empRows[0];

    // Vérification géolocalisation — uniquement si l'entreprise a des coordonnées configurées
    if (emp.co_lat !== null && emp.co_lon !== null) {
      if (latitude == null || longitude == null) {
        return res.status(403).json({
          error: 'Localisation GPS requise pour pointer dans cette entreprise.',
          geoRequired: true,
        });
      }
      const dist = haversineDistance(
        parseFloat(latitude), parseFloat(longitude),
        parseFloat(emp.co_lat), parseFloat(emp.co_lon)
      );
      const radius = emp.geo_radius || 100;
      if (dist > radius) {
        return res.status(403).json({
          error: `Vous devez être à proximité de l'entreprise pour pointer. (Distance : ${Math.round(dist)} m, rayon : ${radius} m)`,
          geoRequired: true,
          distance: Math.round(dist),
          radius,
        });
      }
    }

    if (!emp.pin || emp.pin !== String(pin)) {
      recordPinFailure(employeeId);
      const rec = pinFailures.get(employeeId);
      const remaining = MAX_ATTEMPTS - (rec?.count ?? 0);
      if (remaining <= 0) {
        return res.status(429).json({ error: 'Compte kiosque verrouillé 15 minutes après trop de tentatives.' });
      }
      return res.status(401).json({
        error: `PIN incorrect (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`,
      });
    }

    clearPinFailures(employeeId);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

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
