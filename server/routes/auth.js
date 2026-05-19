'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { mapEmployee } = require('./employees');
const { requireAuth } = require('../middleware/auth');

// Chargement optionnel de bcrypt (dégradé vers SHA-256 si absent)
let bcrypt = null;
try { bcrypt = require('bcrypt'); } catch { /* bcrypt non disponible */ }

const BCRYPT_ROUNDS = 12;

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function isBcryptHash(hash) {
  return typeof hash === 'string' && (hash.startsWith('$2b$') || hash.startsWith('$2a$'));
}

async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (isBcryptHash(stored)) {
    return bcrypt ? bcrypt.compare(plain, stored) : false;
  }
  // Héritage SHA-256
  return sha256(plain) === stored;
}

async function hashPassword(plain) {
  if (bcrypt) return bcrypt.hash(plain, BCRYPT_ROUNDS);
  return sha256(plain); // fallback si bcrypt non installé
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

// Exporte les helpers pour réutilisation dans employees.js
module.exports = router;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
