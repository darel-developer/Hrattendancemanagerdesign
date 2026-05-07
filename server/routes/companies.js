const express = require('express');
const router = express.Router();
const db = require('../db');

function mapCompany(row) {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector,
    address: row.address,
    hrEmail: row.hr_email,
    workStart: row.work_start ? String(row.work_start).slice(0, 5) : '09:00',
    lateTolerance: row.late_tolerance,
    employeeCount: row.employee_count !== undefined ? parseInt(row.employee_count) : undefined,
    adminCount: row.admin_count !== undefined ? parseInt(row.admin_count) : undefined,
  };
}

router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
        COUNT(e.id) AS employee_count,
        COUNT(CASE WHEN e.role = 'Admin' THEN 1 END) AS admin_count
      FROM companies c
      LEFT JOIN employees e ON e.company_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json(rows.map(mapCompany));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Entreprise non trouvée' });
    res.json(mapCompany(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const c = req.body;
    if (!c.id || !c.name) return res.status(400).json({ error: 'ID et nom requis' });
    await db.query(
      `INSERT INTO companies (id, name, sector, address, hr_email, work_start, late_tolerance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.sector || '', c.address || '', c.hrEmail || '', c.workStart || '09:00:00', c.lateTolerance ?? 5]
    );
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [c.id]);
    res.status(201).json(mapCompany(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const c = req.body;
    await db.query(
      `UPDATE companies SET name=?, sector=?, address=?, hr_email=?, work_start=?, late_tolerance=? WHERE id=?`,
      [c.name, c.sector, c.address, c.hrEmail, c.workStart || '09:00:00', c.lateTolerance ?? 5, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    res.json(mapCompany(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM companies WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.mapCompany = mapCompany;
