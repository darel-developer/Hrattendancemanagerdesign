const express = require('express');
const router = express.Router();
const db = require('../db');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(50) PRIMARY KEY,
      company_id VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_dept_per_company (company_id, name)
    )
  `);
  await db.query(`
    INSERT IGNORE INTO departments (id, company_id, name)
    SELECT CONCAT('DEPT', UPPER(SUBSTR(MD5(CONCAT(company_id, department)), 1, 10))),
           company_id, department
    FROM (
      SELECT DISTINCT company_id, department
      FROM employees
      WHERE department IS NOT NULL AND department != ''
    ) AS t
  `);
}

router.get('/', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });
    const [rows] = await db.query(
      `SELECT d.id, d.company_id, d.name,
        (SELECT COUNT(*) FROM employees e WHERE e.company_id = d.company_id AND e.department = d.name) AS employee_count
       FROM departments d WHERE d.company_id = ? ORDER BY d.name`,
      [companyId]
    );
    res.json(rows.map(r => ({ id: r.id, companyId: r.company_id, name: r.name, employeeCount: parseInt(r.employee_count) })));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, companyId } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed || trimmed.length > 100) return res.status(400).json({ error: 'Nom de département invalide' });
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });
    const id = `DEPT${Date.now().toString(36).toUpperCase()}`;
    await db.query(
      'INSERT INTO departments (id, company_id, name) VALUES (?, ?, ?)',
      [id, companyId, trimmed]
    );
    res.status(201).json({ id, companyId, name: trimmed, employeeCount: 0 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce département existe déjà' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, companyId } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed || trimmed.length > 100) return res.status(400).json({ error: 'Nom invalide' });
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });

    const [existing] = await db.query(
      'SELECT id FROM departments WHERE company_id = ? AND name = ? AND id != ?',
      [companyId, trimmed, req.params.id]
    );
    if (existing.length > 0) return res.status(409).json({ error: 'Ce département existe déjà' });

    // Get old name to update employees
    const [oldRows] = await db.query(
      'SELECT name FROM departments WHERE id = ? AND company_id = ?',
      [req.params.id, companyId]
    );
    if (oldRows.length === 0) return res.status(404).json({ error: 'Département non trouvé' });
    const oldName = oldRows[0].name;

    await db.query(
      'UPDATE departments SET name = ? WHERE id = ? AND company_id = ?',
      [trimmed, req.params.id, companyId]
    );

    // Cascade rename to employees
    if (oldName !== trimmed) {
      await db.query(
        'UPDATE employees SET department = ? WHERE company_id = ? AND department = ?',
        [trimmed, companyId, oldName]
      );
    }

    const [countRow] = await db.query(
      'SELECT COUNT(*) AS cnt FROM employees WHERE company_id = ? AND department = ?',
      [companyId, trimmed]
    );
    res.json({ id: req.params.id, companyId, name: trimmed, employeeCount: parseInt(countRow[0].cnt) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce département existe déjà' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });

    const [deptRows] = await db.query(
      'SELECT name FROM departments WHERE id = ? AND company_id = ?',
      [req.params.id, companyId]
    );
    if (deptRows.length === 0) return res.status(404).json({ error: 'Département non trouvé' });

    const [empRows] = await db.query(
      'SELECT COUNT(*) AS cnt FROM employees WHERE company_id = ? AND department = ?',
      [companyId, deptRows[0].name]
    );
    if (parseInt(empRows[0].cnt) > 0) {
      return res.status(409).json({
        error: `Impossible de supprimer : ${empRows[0].cnt} employé(s) sont rattachés à ce département.`,
      });
    }

    await db.query('DELETE FROM departments WHERE id = ? AND company_id = ?', [req.params.id, companyId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = { router, ensureTable };
