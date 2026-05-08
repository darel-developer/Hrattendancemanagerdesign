const express = require('express');
const router = express.Router();
const db = require('../db');

function mapNotif(row) {
  const dateStr = row.date ? String(row.date).replace(' ', 'T') : null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    date: dateStr,
    read: row.is_read === 1 || row.is_read === true || row.is_read === '1',
    employeeId: row.employee_id || null,
  };
}

const VALID_TYPES = ['absence', 'conge', 'document', 'retard', 'system'];

router.post('/', async (req, res) => {
  try {
    const n = req.body;
    if (!n.title || !n.message) return res.status(400).json({ error: 'title et message requis' });
    const type = VALID_TYPES.includes(n.type) ? n.type : 'system';
    const id = `NOT${Date.now().toString(36).slice(-7).toUpperCase()}`;
    await db.query(
      `INSERT INTO notifications (id, type, title, message, date, is_read, employee_id)
       VALUES (?, ?, ?, ?, NOW(), FALSE, ?)`,
      [id, type, String(n.title).slice(0, 255), String(n.message).slice(0, 1000), n.employeeId || null]
    );
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    res.status(201).json(mapNotif(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { companyId } = req.query;
    let query, params = [];
    if (companyId) {
      query = `SELECT n.* FROM notifications n
               WHERE n.employee_id IS NULL
                  OR n.employee_id IN (SELECT id FROM employees WHERE company_id = ?)
               ORDER BY n.date DESC LIMIT 500`;
      params = [companyId];
    } else {
      query = 'SELECT * FROM notifications ORDER BY date DESC LIMIT 500';
    }
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapNotif));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer tout comme lu — scopé par companyId si fourni
router.put('/read-all', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (companyId) {
      await db.query(
        `UPDATE notifications SET is_read = TRUE
         WHERE employee_id IS NULL
            OR employee_id IN (SELECT id FROM employees WHERE company_id = ?)`,
        [companyId]
      );
    } else {
      await db.query('UPDATE notifications SET is_read = TRUE');
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer toutes les notifications — companyId requis pour éviter la suppression globale accidentelle
router.delete('/', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });
    await db.query(
      `DELETE FROM notifications
       WHERE employee_id IS NULL
          OR employee_id IN (SELECT id FROM employees WHERE company_id = ?)`,
      [companyId]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
