'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/devices/register — register or confirm device for logged-in employee
router.post('/register', requireAuth, async (req, res) => {
  const { deviceId, deviceName } = req.body;
  const employeeId = req.user.id;

  if (!deviceId) return res.status(400).json({ error: 'device_id manquant' });

  try {
    // Is this device already bound to a DIFFERENT employee?
    const [conflict] = await db.query(
      `SELECT employee_id FROM employee_devices
       WHERE device_id = ? AND employee_id != ? AND is_active = TRUE`,
      [deviceId, employeeId]
    );
    if (conflict.length > 0) {
      return res.status(409).json({
        error: 'Cet appareil est déjà associé à un autre compte employé.',
        conflict: true,
      });
    }

    // Does this employee already have a DIFFERENT device registered?
    const [existing] = await db.query(
      `SELECT device_id FROM employee_devices
       WHERE employee_id = ? AND device_id != ? AND is_active = TRUE`,
      [employeeId, deviceId]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Vous avez déjà un appareil enregistré. Contactez l\'administration pour changer d\'appareil.',
        newDevice: true,
      });
    }

    // Upsert — same employee + same device → just refresh last_seen
    await db.query(
      `INSERT INTO employee_devices (employee_id, device_id, device_name, registered_at, last_seen_at, is_active)
       VALUES (?, ?, ?, NOW(), NOW(), TRUE)
       ON CONFLICT (employee_id) DO UPDATE SET
         device_id    = EXCLUDED.device_id,
         device_name  = EXCLUDED.device_name,
         last_seen_at = NOW(),
         is_active    = TRUE`,
      [employeeId, deviceId, deviceName || 'Inconnu']
    );

    console.info(`[Devices] Appareil enregistré — employé ${employeeId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Devices] POST /register', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/devices/me — status of current user's device
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT device_id, device_name, registered_at, last_seen_at
       FROM employee_devices WHERE employee_id = ? AND is_active = TRUE`,
      [req.user.id]
    );
    if (rows.length === 0) return res.json({ registered: false });
    res.json({ registered: true, deviceName: rows[0].device_name, registeredAt: rows[0].registered_at });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/devices — admin: list all devices for company
router.get('/', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ed.employee_id, ed.device_id, ed.device_name,
              ed.registered_at, ed.last_seen_at, ed.is_active,
              e.first_name, e.last_name, e.department
       FROM employee_devices ed
       JOIN employees e ON ed.employee_id = e.id
       WHERE e.company_id = ?
       ORDER BY e.first_name, e.last_name`,
      [req.user.companyId]
    );
    res.json(rows.map((r) => ({
      employeeId:   r.employee_id,
      firstName:    r.first_name,
      lastName:     r.last_name,
      department:   r.department,
      deviceName:   r.device_name,
      registeredAt: r.registered_at,
      lastSeenAt:   r.last_seen_at,
      isActive:     r.is_active,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/devices/:employeeId — admin: reset device binding for an employee
router.delete('/:employeeId', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    await db.query(
      'UPDATE employee_devices SET is_active = FALSE WHERE employee_id = ?',
      [req.params.employeeId]
    );
    console.info(`[Devices] Appareil réinitialisé — employé ${req.params.employeeId} par admin ${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
