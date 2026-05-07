const express = require('express');
const router = express.Router();
const db = require('../db');

function mapNotif(row) {
  const dateStr = row.date
    ? String(row.date).replace(' ', 'T')
    : null;
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

router.post('/', async (req, res) => {
  try {
    const n = req.body;
    const id = `NOT${Date.now().toString(36).slice(-7).toUpperCase()}`;
    await db.query(
      `INSERT INTO notifications (id, type, title, message, date, is_read, employee_id)
       VALUES (?, ?, ?, ?, NOW(), FALSE, ?)`,
      [id, n.type, n.title, n.message, n.employeeId || null]
    );
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    res.status(201).json(mapNotif(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
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
               ORDER BY n.date DESC`;
      params = [companyId];
    } else {
      query = 'SELECT * FROM notifications ORDER BY date DESC';
    }
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapNotif));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read — must be before /:id to avoid routing conflict
router.put('/read-all', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all notifications
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM notifications');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
