const express = require('express');
const router = express.Router();
const db = require('../db');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id           VARCHAR(20) PRIMARY KEY,
      sender_id    VARCHAR(10) NOT NULL,
      recipient_id VARCHAR(10) NULL,
      title        VARCHAR(255) NOT NULL,
      type         VARCHAR(100) NOT NULL DEFAULT 'Rapport',
      content      TEXT NOT NULL,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_read      BOOLEAN DEFAULT FALSE,
      CONSTRAINT fk_rpt_sender    FOREIGN KEY (sender_id)    REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_rpt_recipient FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE SET NULL
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

function mapReport(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id || null,
    title: row.title,
    type: row.type,
    content: row.content,
    createdAt: row.created_at ? String(row.created_at).replace(' ', 'T') : null,
    isRead: row.is_read === 1 || row.is_read === true || row.is_read === '1',
  };
}

router.get('/', async (req, res) => {
  try {
    const { recipientId, senderId } = req.query;
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    if (recipientId) { query += ' AND recipient_id = ?'; params.push(recipientId); }
    if (senderId) { query += ' AND sender_id = ?'; params.push(senderId); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapReport));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const r = req.body;
    const id = `RPT${Date.now().toString(36).slice(-7).toUpperCase()}`;
    await db.query(
      `INSERT INTO reports (id, sender_id, recipient_id, title, type, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, r.senderId, r.recipientId || null, r.title, r.type || 'Rapport', r.content]
    );
    const [rows] = await db.query('SELECT * FROM reports WHERE id = ?', [id]);
    res.status(201).json(mapReport(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE reports SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = { router, ensureTable };
