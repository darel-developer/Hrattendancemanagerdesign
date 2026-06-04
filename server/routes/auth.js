'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // dépendance obligatoire — pas de fallback SHA-256
const jwt = require('jsonwebtoken');
const db = require('../db');
const { mapEmployee } = require('./employees');
const { requireAuth } = require('../middleware/auth');

const BCRYPT_ROUNDS = 12;

function isBcryptHash(hash) {
  return typeof hash === 'string' && (hash.startsWith('$2b$') || hash.startsWith('$2a$'));
}

async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compare(plain, stored);
  // Comptes migrés depuis l'ancien SHA-256 : bloquer et demander un reset
  return false;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function signToken(emp) {
  const payload = {
    sub: emp.id,
    id: emp.id,
    companyId: emp.company_id || emp.companyId,
    role: emp.role,
    email: emp.email,
  };
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email requis' });
    if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Mot de passe requis' });

    const [rows] = await db.query(
      'SELECT * FROM employees WHERE LOWER(email) = LOWER(?)',
      [email.trim().slice(0, 255)]
    );

    const FAIL = { error: 'Identifiants incorrects' };
    if (rows.length === 0) return res.status(401).json(FAIL);

    const emp = rows[0];
    const valid = await verifyPassword(password, emp.password_hash);
    if (!valid) return res.status(401).json(FAIL);

    // Vérifier si l'entreprise est bloquée
    if (emp.company_id) {
      const [compRows] = await db.query('SELECT is_blocked FROM companies WHERE id = ?', [emp.company_id]);
      if (compRows[0]?.is_blocked) {
        return res.status(403).json({
          error: 'Accès suspendu',
          blocked: true,
          message: "L'accès de votre organisation a été suspendu pour défaut de paiement. Contactez support@hrmanager.app.",
        });
      }
    }

    // Auto-upgrade silencieux SHA-256 → bcrypt
    if (bcrypt && !isBcryptHash(emp.password_hash)) {
      try {
        const upgraded = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [upgraded, emp.id]);
      } catch { /* non bloquant */ }
    }

    const token = signToken(emp);
    res.json({ token, user: mapEmployee(emp) });
  } catch (err) {
    console.error('[Auth] Login:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /auth/change-password ───────────────────────────────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { employeeId, currentPassword, newPassword } = req.body;
    if (!employeeId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Données manquantes' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Nouveau mot de passe trop court (6 caractères min)' });
    }
    // Un employé ne peut changer que son propre mot de passe (sauf Admin)
    if (req.user.id !== employeeId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });

    const emp = rows[0];
    const valid = await verifyPassword(currentPassword, emp.password_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const newHash = await hashPassword(newPassword);
    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [newHash, employeeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Change-password:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PUT /auth/fcm-token — enregistre le token FCM web push de l'utilisateur ──
router.put('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requis' });
    const validPlatforms = ['web', 'android', 'ios'];
    const p = validPlatforms.includes(platform) ? platform : 'web';
    await db.query(
      `INSERT INTO push_tokens (employee_id, token, platform, updated_at)
       VALUES (?, ?, ?, NOW())
       ON CONFLICT (employee_id, platform) DO UPDATE SET token = EXCLUDED.token, updated_at = NOW()`,
      [req.user.id, token, p]
    );
    console.log(`[FCM] Token enregistré — employé: ${req.user.id} | platform: ${p} | token: ...${token.slice(-12)}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[FCM] Enregistrement token :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Exporte les helpers pour réutilisation dans employees.js
module.exports = router;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
