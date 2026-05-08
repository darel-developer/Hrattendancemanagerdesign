const express = require('express');
const router = express.Router();
const db = require('../db');

function mapDocument(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    title: row.title || '',
    type: row.type || '',
    fileUrl: row.file_url || '',
    expiryDate: row.expiry_date || null,
    createdAt: row.created_at || null,
  };
}

router.get('/', async (req, res) => {
  try {
    const { employeeId, companyId } = req.query;
    let query = companyId
      ? 'SELECT ed.* FROM employee_documents ed JOIN employees e ON ed.employee_id = e.id WHERE 1=1'
      : 'SELECT * FROM employee_documents WHERE 1=1';
    const params = [];
    if (companyId) { query += ' AND e.company_id = ?'; params.push(companyId); }
    if (employeeId) { query += companyId ? ' AND ed.employee_id = ?' : ' AND employee_id = ?'; params.push(employeeId); }
    query += companyId ? ' ORDER BY ed.created_at DESC' : ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapDocument));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || `DOC${Date.now().toString(36).slice(-7).toUpperCase()}`;
    await db.query(
      `INSERT INTO employee_documents
        (id, employee_id, title, type, file_url, expiry_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, d.employeeId, d.title || '', d.type || '',
        d.fileUrl || '', d.expiryDate || null,
      ]
    );
    const [rows] = await db.query('SELECT * FROM employee_documents WHERE id = ?', [id]);
    res.status(201).json(mapDocument(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const d = req.body;
    await db.query(
      `UPDATE employee_documents SET
        employee_id=?, title=?, type=?, file_url=?, expiry_date=?
       WHERE id=?`,
      [
        d.employeeId, d.title || '', d.type || '',
        d.fileUrl || '', d.expiryDate || null,
        req.params.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM employee_documents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' });
    res.json(mapDocument(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM employee_documents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
