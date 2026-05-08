const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { mapEmployee } = require('./employees');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email requis' });
    if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Mot de passe requis' });

    const [rows] = await db.query(
      'SELECT * FROM employees WHERE LOWER(email) = LOWER(?)',
      [email.trim().slice(0, 255)]
    );

    // Message identique quel que soit l'échec (évite l'énumération de comptes)
    const FAIL = { error: 'Identifiants incorrects' };

    if (rows.length === 0) return res.status(401).json(FAIL);
    const emp = rows[0];
    if (!emp.password_hash || sha256(password) !== emp.password_hash) {
      return res.status(401).json(FAIL);
    }

    res.json(mapEmployee(emp));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { employeeId, currentPassword, newPassword } = req.body;
    if (!employeeId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Données manquantes' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Nouveau mot de passe trop court (6 caractères min)' });
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });

    const emp = rows[0];
    if (!emp.password_hash || sha256(currentPassword) !== emp.password_hash) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [sha256(newPassword), employeeId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
