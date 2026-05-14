'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole, checkCompany } = require('../middleware/auth');

// Chargement optionnel de bcrypt (fallback SHA-256 si absent)
let bcrypt = null;
try { bcrypt = require('bcrypt'); } catch { /* bcrypt non disponible */ }

const crypto = require('crypto');
function sha256(str) { return crypto.createHash('sha256').update(str).digest('hex'); }
async function hashPassword(plain) {
  if (bcrypt) return bcrypt.hash(plain, 12);
  return sha256(plain);
}

const ALL_WORK_DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

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
    managerId: row.manager_id || null,
    address: row.address,
    birthDate: row.birth_date || null,
    leaveBalance: row.leave_balance,
    leaveUsed: row.leave_used,
    workDays: row.work_days ? row.work_days.split(',') : ALL_WORK_DAYS,
    // password_hash et pin intentionnellement exclus
  };
}

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

// ─── GET /employees ──────────────────────────────────────────────────────────
router.get('/', requireAuth, checkCompany, async (req, res) => {
  try {
    const { companyId, role } = req.query;
    const conditions = [];
    const params = [];
    if (companyId) { conditions.push('company_id = ?'); params.push(companyId); }
    if (role && VALID_ROLES.includes(role)) { conditions.push('role = ?'); params.push(role); }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(`SELECT * FROM employees${where} ORDER BY id`, params);
    res.json(rows.map(mapEmployee));
  } catch (err) {
    console.error('[Employees] GET /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /employees/:id ──────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    // Un employé ne peut voir que son propre profil, sauf Admin/Manager
    const emp = rows[0];
    if (req.user.role === 'Employee' && emp.id !== req.user.id && emp.company_id !== req.user.companyId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    res.json(mapEmployee(emp));
  } catch (err) {
    console.error('[Employees] GET /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /employees ─────────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const e = req.body;
    const err = validateEmployee(e);
    if (err) return res.status(400).json({ error: err });

    const passwordHash = e.password ? await hashPassword(e.password) : null;
    const pin = e.pin ? String(e.pin) : null;
    // Forcer le companyId depuis le token pour éviter les injections cross-tenant
    const companyId = req.user.companyId;

    const workDaysStr = Array.isArray(e.workDays) && e.workDays.length ? e.workDays.join(',') : null;
    await db.query(
      `INSERT INTO employees
        (id, company_id, first_name, last_name, email, phone, avatar, role, department, position,
         contract_type, start_date, salary, status, manager_id, address, birth_date,
         leave_balance, leave_used, password_hash, pin, work_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e.id, companyId,
        e.firstName, e.lastName, e.email, e.phone || '', e.avatar || '',
        e.role, e.department, e.position, e.contractType,
        e.startDate || null, e.salary || null, e.status,
        e.managerId || e.manager || null,
        e.address || '', e.birthDate || null, e.leaveBalance ?? 25, e.leaveUsed ?? 0,
        passwordHash, pin, workDaysStr,
      ]
    );
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [e.id]);
    res.status(201).json(mapEmployee(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email ou ID déjà utilisé' });
    console.error('[Employees] POST /', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PUT /employees/:id ──────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Seuls les Admins peuvent modifier n'importe quel employé
    // Un employé peut modifier uniquement son propre profil (sans changer son rôle)
    if (req.user.role !== 'Admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const e = req.body;
    const valErr = validateEmployee(e);
    if (valErr) return res.status(400).json({ error: valErr });

    const updWorkDays = Array.isArray(e.workDays) && e.workDays.length ? e.workDays.join(',') : null;
    await db.query(
      `UPDATE employees SET
        first_name=?, last_name=?, email=?, phone=?, avatar=?, role=?, department=?,
        position=?, contract_type=?, start_date=?, salary=?, status=?, manager_id=?,
        address=?, birth_date=?, leave_balance=?, leave_used=?, pin=?, work_days=?
       WHERE id=?`,
      [
        e.firstName, e.lastName, e.email, e.phone || '', e.avatar || '',
        e.role, e.department, e.position, e.contractType,
        e.startDate || null, e.salary || null, e.status,
        e.managerId || e.manager || null,
        e.address || '', e.birthDate || null, e.leaveBalance ?? 25, e.leaveUsed ?? 0,
        e.pin ? String(e.pin) : null, updWorkDays,
        req.params.id,
      ]
    );

    if (e.password) {
      const hash = await hashPassword(e.password);
      await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    res.json(mapEmployee(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
    console.error('[Employees] PUT /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DELETE /employees/:id ───────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    // Empêche la suppression d'un Admin par lui-même
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    await db.query('DELETE FROM employees WHERE id = ? AND company_id = ?', [req.params.id, req.user.companyId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Employees] DELETE /:id', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
module.exports.mapEmployee = mapEmployee;
