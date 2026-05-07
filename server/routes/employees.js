const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function mapEmployee(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    role: row.role,
    department: row.department,
    position: row.position,
    contractType: row.contract_type,
    startDate: row.start_date || null,
    salary: row.salary !== null ? parseFloat(row.salary) : null,
    status: row.status,
    manager: row.manager_id || null,
    address: row.address,
    birthDate: row.birth_date || null,
    leaveBalance: row.leave_balance,
    leaveUsed: row.leave_used,
    pin: row.pin || null,
  };
}

router.get('/', async (req, res) => {
  try {
    const { companyId, role } = req.query;
    const conditions = [];
    const params = [];
    if (companyId) { conditions.push('company_id = ?'); params.push(companyId); }
    if (role) { conditions.push('role = ?'); params.push(role); }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(`SELECT * FROM employees${where} ORDER BY id`, params);
    res.json(rows.map(mapEmployee));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    res.json(mapEmployee(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const e = req.body;
    const passwordHash = e.password ? sha256(e.password) : null;
    await db.query(
      `INSERT INTO employees
        (id, company_id, first_name, last_name, email, phone, avatar, role, department, position,
         contract_type, start_date, salary, status, manager_id, address, birth_date,
         leave_balance, leave_used, password_hash, pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.id, e.companyId || 'COMP001',
        e.firstName, e.lastName, e.email, e.phone, e.avatar || '',
        e.role, e.department, e.position, e.contractType,
        e.startDate || null, e.salary || null, e.status, e.manager || null,
        e.address || '', e.birthDate || null, e.leaveBalance ?? 25, e.leaveUsed ?? 0,
        passwordHash, e.pin || '1234',
      ]
    );
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [e.id]);
    res.status(201).json(mapEmployee(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const e = req.body;
    // Build update parts conditionally (don't overwrite password unless explicitly provided)
    const params = [
      e.firstName, e.lastName, e.email, e.phone, e.avatar || '',
      e.role, e.department, e.position, e.contractType,
      e.startDate || null, e.salary || null, e.status, e.manager || null,
      e.address || '', e.birthDate || null, e.leaveBalance ?? 25, e.leaveUsed ?? 0,
      e.pin || null,
      req.params.id,
    ];

    await db.query(
      `UPDATE employees SET
        first_name=?, last_name=?, email=?, phone=?, avatar=?, role=?, department=?,
        position=?, contract_type=?, start_date=?, salary=?, status=?, manager_id=?,
        address=?, birth_date=?, leave_balance=?, leave_used=?, pin=?
       WHERE id=?`,
      params
    );

    // Update password separately if provided
    if (e.password) {
      await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [sha256(e.password), req.params.id]);
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    res.json(mapEmployee(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.mapEmployee = mapEmployee;
