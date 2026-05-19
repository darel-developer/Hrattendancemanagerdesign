'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('./auth');

const requireKioskAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Authentification kiosk requise' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION');
    if (payload.role !== 'Kiosk') return res.status(403).json({ error: 'Accès kiosk uniquement' });
    req.kiosk = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token kiosk invalide ou expiré' });
  }
};

// Distance GPS (Haversine) — retourne la distance en mètres
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

// GET /api/kiosk/token/:companyId — génère un QR token valide 30 secondes
// Requiert un JWT kiosk valide et vérifie que le companyId correspond au compte
router.get('/token/:companyId', requireKioskAuth, async (req, res) => {
  try {
    const { companyId } = req.params;

    if (req.kiosk.companyId !== companyId) {
      return res.status(403).json({ error: 'Ce compte kiosk n\'est pas autorisé pour cette entreprise' });
    }

    // Vérifier que l'entreprise existe
    const [comp] = await db.query('SELECT id FROM companies WHERE id = ?', [companyId]);
    if (comp.length === 0) return res.status(404).json({ error: 'Entreprise introuvable' });

    // Nettoyer les anciens tokens expirés pour cette entreprise
    await db.query(
      'DELETE FROM kiosk_tokens WHERE company_id = ? AND expires_at < NOW()',
      [companyId]
    );

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 secondes

    await db.query(
      `INSERT INTO kiosk_tokens (token, company_id, created_at, expires_at)
       VALUES (?, ?, NOW(), ?)`,
      [token, companyId, expiresAt.toISOString()]
    );

    res.json({ token, companyId, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('[Kiosk] GET /token', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/kiosk/scan — l'employé soumet le token scanné depuis son téléphone
// Requiert que l'employé soit authentifié (JWT) et que son appareil soit lié
router.post('/scan', requireAuth, async (req, res) => {
  try {
    const { token, companyId, deviceId, latitude, longitude } = req.body;
    const employeeId = req.user.id;

    if (!token || !companyId || !deviceId) {
      return res.status(400).json({ error: 'Données manquantes (token, companyId, deviceId)' });
    }

    // 1. Vérifier que le token existe, appartient à la bonne entreprise et n'est pas expiré
    const [tokenRows] = await db.query(
      `SELECT token, company_id, expires_at, used_by
       FROM kiosk_tokens WHERE token = ?`,
      [token]
    );
    if (tokenRows.length === 0) {
      return res.status(403).json({ error: 'QR code invalide ou expiré. Scannez à nouveau.' });
    }
    const tok = tokenRows[0];

    if (tok.company_id !== companyId) {
      return res.status(403).json({ error: 'QR code invalide pour cette entreprise.' });
    }
    if (new Date(tok.expires_at) < new Date()) {
      return res.status(403).json({ error: 'QR code expiré. Revenez vers le kiosque pour en scanner un nouveau.', expired: true });
    }
    if (tok.used_by) {
      return res.status(409).json({ error: 'Ce QR code a déjà été utilisé.' });
    }

    // 2. Vérifier que l'appareil est autorisé pour cet employé
    const [deviceRows] = await db.query(
      `SELECT employee_id FROM employee_devices
       WHERE device_id = ? AND employee_id = ? AND is_active = TRUE`,
      [deviceId, employeeId]
    );
    if (deviceRows.length === 0) {
      return res.status(403).json({
        error: 'Appareil non reconnu pour ce compte. Reconnectez-vous depuis cette application pour enregistrer cet appareil.',
        deviceNotRegistered: true,
      });
    }

    // 3. Charger les données entreprise (géo + horaires)
    const [empRows] = await db.query(
      `SELECT e.id, e.first_name, e.last_name,
              c.work_start, c.late_tolerance,
              c.latitude AS co_lat, c.longitude AS co_lon, c.geo_radius
       FROM employees e JOIN companies c ON e.company_id = c.id
       WHERE e.id = ? AND e.company_id = ?`,
      [employeeId, companyId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Employé introuvable dans cette entreprise' });
    }
    const emp = empRows[0];

    // 4. Vérification géolocalisation si configurée
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

    // 5. Enregistrer le pointage
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const workStart = String(emp.work_start).slice(0, 5);
    const [wh, wm] = workStart.split(':').map(Number);
    const [nh, nm] = nowTime.split(':').map(Number);
    const isLate = (nh * 60 + nm) > (wh * 60 + wm + (emp.late_tolerance || 5));

    const [records] = await db.query(
      'SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    let action, hoursWorked = null, status;

    if (records.length === 0) {
      // Check-in
      status = isLate ? 'Retard' : 'Présent';
      const id = `ATT${Date.now()}`;
      await db.query(
        `INSERT INTO attendance_records (id, employee_id, date, check_in, status, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, employeeId, today, nowTime, status,
         isLate ? `Retard de ${(nh * 60 + nm) - (wh * 60 + wm)} min` : '']
      );
      action = 'check_in';
    } else {
      const rec = records[0];
      if (rec.check_in && !rec.check_out) {
        // Check-out
        const [h1, m1] = String(rec.check_in).slice(0, 5).split(':').map(Number);
        hoursWorked = Math.round(((nh * 60 + nm) - (h1 * 60 + m1)) / 60 * 100) / 100;
        await db.query(
          'UPDATE attendance_records SET check_out = ?, hours_worked = ? WHERE employee_id = ? AND date = ?',
          [nowTime, hoursWorked, employeeId, today]
        );
        action = 'check_out';
        status = rec.status;
      } else {
        return res.status(409).json({ error: "Pointage déjà complet pour aujourd'hui" });
      }
    }

    // 6. Marquer le token comme utilisé
    await db.query(
      'UPDATE kiosk_tokens SET used_by = ? WHERE token = ?',
      [employeeId, token]
    );

    // 7. Mettre à jour last_seen sur l'appareil
    await db.query(
      'UPDATE employee_devices SET last_seen_at = NOW() WHERE employee_id = ?',
      [employeeId]
    );

    console.info(`[Kiosk QR] ${action} — ${emp.first_name} ${emp.last_name} à ${nowTime}`);
    res.json({
      success: true,
      action,
      time: nowTime,
      status,
      hoursWorked,
      employee: `${emp.first_name} ${emp.last_name}`,
    });
  } catch (err) {
    console.error('[Kiosk] POST /scan', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/kiosk/auth/login ────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const [rows] = await db.query(
      'SELECT * FROM kiosk_accounts WHERE LOWER(email) = LOWER(?) AND is_active = TRUE',
      [email.trim().slice(0, 255)]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Identifiants incorrects' });

    const account = rows[0];
    const valid = await verifyPassword(password, account.password_hash);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    // Bind or update device_id on every login (allows re-binding on new device)
    if (deviceId) {
      await db.query('UPDATE kiosk_accounts SET device_id = ? WHERE id = ?', [deviceId, account.id]);
    }

    const [compRows] = await db.query('SELECT name FROM companies WHERE id = ?', [account.company_id]);
    const companyName = compRows[0]?.name || 'Entreprise';

    const token = jwt.sign(
      { kioskId: account.id, companyId: account.company_id, role: 'Kiosk', email: account.email },
      process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
      { expiresIn: '30d' }
    );

    res.json({ token, kioskId: account.id, companyId: account.company_id, companyName, label: account.label });
  } catch (err) {
    console.error('[Kiosk] auth/login:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /api/kiosk/accounts  (Admin) ─────────────────────────────────────────
router.get('/accounts', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });
    const [rows] = await db.query(
      'SELECT id, email, label, device_id, created_at, is_active FROM kiosk_accounts WHERE company_id = ? ORDER BY created_at DESC',
      [req.user.companyId]
    );
    res.json(rows.map((r) => ({
      id: r.id,
      email: r.email,
      label: r.label || null,
      deviceBound: !!r.device_id,
      createdAt: r.created_at,
      isActive: r.is_active,
    })));
  } catch (err) {
    console.error('[Kiosk] GET /accounts:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /api/kiosk/accounts  (Admin) ────────────────────────────────────────
router.post('/accounts', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });
    const { email, password, label } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
    }
    const hash = await hashPassword(password);
    const [rows] = await db.query(
      'INSERT INTO kiosk_accounts (email, password_hash, company_id, label) VALUES (?, ?, ?, ?) RETURNING id',
      [email.trim().toLowerCase(), hash, req.user.companyId, label || null]
    );
    const newId = rows[0]?.id ?? null;
    res.status(201).json({ id: newId, email: email.trim().toLowerCase(), label: label || null, deviceBound: false, isActive: true });
  } catch (err) {
    if (err.message && (err.message.includes('unique') || err.message.includes('duplicate'))) {
      return res.status(409).json({ error: 'Un compte kiosk avec cet email existe déjà' });
    }
    console.error('[Kiosk] POST /accounts:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DELETE /api/kiosk/accounts/:id  (Admin) ─────────────────────────────────
router.delete('/accounts/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });
    const [rows] = await db.query(
      'SELECT id FROM kiosk_accounts WHERE id = ? AND company_id = ?',
      [req.params.id, req.user.companyId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Compte introuvable' });
    await db.query('DELETE FROM kiosk_accounts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Kiosk] DELETE /accounts/:id:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PATCH /api/kiosk/accounts/:id/reset-device  (Admin) ─────────────────────
router.patch('/accounts/:id/reset-device', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });
    const [rows] = await db.query(
      'SELECT id FROM kiosk_accounts WHERE id = ? AND company_id = ?',
      [req.params.id, req.user.companyId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Compte introuvable' });
    await db.query('UPDATE kiosk_accounts SET device_id = NULL WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Kiosk] PATCH /accounts/:id/reset-device:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
