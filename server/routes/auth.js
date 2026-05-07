const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { mapEmployee } = require('./employees');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Login : recherche par email uniquement, toutes entreprises confondues
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const [rows] = await db.query(
      'SELECT * FROM employees WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const emp = rows[0];
    if (emp.password_hash && password) {
      if (sha256(password) !== emp.password_hash) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }
    }

    res.json(mapEmployee(emp));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { employeeId, currentPassword, newPassword } = req.body;
    if (!employeeId || !newPassword) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });

    const emp = rows[0];
    if (emp.password_hash && currentPassword) {
      if (sha256(currentPassword) !== emp.password_hash) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }
    }

    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [sha256(newPassword), employeeId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
