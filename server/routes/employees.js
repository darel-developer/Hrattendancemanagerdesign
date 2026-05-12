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
    // PIN intentionnellement exclu des réponses API
  };
}

// Valeurs acceptées pour les champs enum
const VALID_ROLES = ['Admin', 'Manager', 'Employee'];
const VALID_CONTRACTS = ['CDI', 'CDD', 'Stage', 'Freelance'];
const VALID_STATUSES = ['Actif', 'Inactif', 'En congé'];

function validateEmployee(e) {
  if (!e.firstName || typeof e.firstName !== 'string' || e.firstName.length > 100) return 'Prénom invalide';
  if (!e.lastName  || typeof e.lastName  !== 'string' || e.lastName.length  > 100) return 'Nom invalide';
  if (!e.email     || typeof e.email     !== 'string' || e.email.length > 255)      return 'Email invalide';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email))                                 return 'Format email invalide';
  if (e.role       && !VALID_ROLES.includes(e.role))       return 'Rôle invalide';
  if (e.department && (typeof e.department !== 'string' || e.department.length > 100)) return 'Département invalide';
  if (e.contractType && !VALID_CONTRACTS.includes(e.contractType)) return 'Type de contrat invalide';
  if (e.status     && !VALID_STATUSES.includes(e.status))  return 'Statut invalide';
  if (e.salary !== undefined && e.salary !== null && (isNaN(parseFloat(e.salary)) || parseFloat(e.salary) < 0)) return 'Salaire invalide';
  if (e.pin        && (!/^\d{4,8}$/.test(String(e.pin))))  return 'PIN invalide (4 à 8 chiffres)';
  if (e.password   && (typeof e.password !== 'string' || e.password.length < 6))   return 'Mot de passe trop court (6 caractères min)';
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { companyId, role } = req.query;
    const conditions = [];
    const params = [];
    if (companyId) { conditions.push('company_id = ?'); params.push(companyId); }
    if (role && VALID_ROLES.includes(role)) { conditions.push('role = ?'); params.push(role); }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(`SELECT * FROM employees${where} ORDER BY id`, params);
    res.json(rows.map(mapEmployee));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    res.json(mapEmployee(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const e = req.body;
    const err = validateEmployee(e);
    if (err) return res.status(400).json({ error: err });

    const passwordHash = e.password ? sha256(e.password) : null;
    // PIN requis pour le kiosque — pas de valeur par défaut
    const pin = e.pin ? String(e.pin) : null;

    await db.query(
      `INSERT INTO employees
        (id, company_id, first_name, last_name, email, phone, avatar, role, department, position,
         contract_type, start_date, salary, status, manager_id, address, birth_date,
         leave_balance, leave_used, password_hash, pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.id, e.companyId || 'COMP001',
        e.firstName, e.lastName, e.email, e.phone || '', e.avatar || '',
        e.role, e.department, e.position, e.contractType,
        e.startDate || null, e.salary || null, e.status, e.manager || null,
        e.address || '', e.birthDate || null, e.leaveBalance ?? 25, e.leaveUsed ?? 0,
        passwordHash, pin,
      ]
    );
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [e.id]);
    res.status(201).json(mapEmployee(rows[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email ou ID déjà utilisé' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const e = req.body;
    const valErr = validateEmployee(e);
    if (valErr) return res.status(400).json({ error: valErr });

    await db.query(
      `UPDATE employees SET
        first_name=?, last_name=?, email=?, phone=?, avatar=?, role=?, department=?,
        position=?, contract_type=?, start_date=?, salary=?, status=?, manager_id=?,
        address=?, birth_date=?, leave_balance=?, leave_used=?, pin=?
       WHERE id=?`,
      [
        e.firstName, e.lastName, e.email, e.phone || '', e.avatar || '',
        e.role, e.department, e.position, e.contractType,
        e.startDate || null, e.salary || null, e.status, e.manager || null,
        e.address || '', e.birthDate || null, e.leaveBalance ?? 25, e.leaveUsed ?? 0,
        e.pin ? String(e.pin) : null,
        req.params.id,
      ]
    );

    if (e.password) {
      await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [sha256(e.password), req.params.id]);
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    res.json(mapEmployee(rows[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
module.exports.mapEmployee = mapEmployee;
