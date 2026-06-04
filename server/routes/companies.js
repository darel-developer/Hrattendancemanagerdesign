const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

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
    latitude: row.latitude !== null && row.latitude !== undefined ? parseFloat(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? parseFloat(row.longitude) : null,
    geoRadius: row.geo_radius !== null && row.geo_radius !== undefined ? parseInt(row.geo_radius) : 100,
    isBlocked: row.is_blocked === true || row.is_blocked === 1 || row.is_blocked === 't',
  };
}

async function ensureGeoColumns() {
  await db.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7) NULL`);
  await db.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7) NULL`);
  await db.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS geo_radius INTEGER NOT NULL DEFAULT 100`);
}

// Superadmin voit toutes les entreprises ; un admin ne voit que la sienne
router.get('/', requireAuth, async (req, res) => {
  try {
    let query = `
      SELECT c.*,
        COUNT(e.id) AS employee_count,
        COUNT(CASE WHEN e.role = 'Admin' THEN 1 END) AS admin_count
      FROM companies c
      LEFT JOIN employees e ON e.company_id = c.id`;
    const params = [];
    if (!req.user.isSuperAdmin) {
      query += ' WHERE c.id = ?';
      params.push(req.user.companyId);
    }
    query += ' GROUP BY c.id ORDER BY c.name';
    const [rows] = await db.query(query, params);
    res.json(rows.map(mapCompany));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Un utilisateur normal ne peut lire que sa propre entreprise
    if (!req.user.isSuperAdmin && req.params.id !== req.user.companyId) {
      return res.status(403).json({ error: 'Accès refusé à cette entreprise' });
    }
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Entreprise non trouvée' });
    res.json(mapCompany(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Création réservée au superadmin
router.post('/', requireAuth, async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Réservé au superadmin' });
  try {
    const c = req.body;
    if (!c.id || !c.name) return res.status(400).json({ error: 'ID et nom requis' });
    await db.query(
      `INSERT INTO companies (id, name, sector, address, hr_email, work_start, late_tolerance, latitude, longitude, geo_radius)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id, c.name, c.sector || '', c.address || '', c.hrEmail || '',
        c.workStart || '09:00:00', c.lateTolerance ?? 5,
        c.latitude ?? null, c.longitude ?? null, c.geoRadius ?? 100,
      ]
    );
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [c.id]);
    res.status(201).json(mapCompany(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modification : admin de l'entreprise ou superadmin
router.put('/:id', requireAuth, async (req, res) => {
  if (!req.user.isSuperAdmin && req.params.id !== req.user.companyId) {
    return res.status(403).json({ error: 'Accès refusé à cette entreprise' });
  }
  try {
    const c = req.body;
    await db.query(
      `UPDATE companies SET name=?, sector=?, address=?, hr_email=?, work_start=?, late_tolerance=?,
       latitude=?, longitude=?, geo_radius=? WHERE id=?`,
      [
        c.name, c.sector, c.address, c.hrEmail, c.workStart || '09:00:00',
        c.lateTolerance ?? 5,
        c.latitude ?? null, c.longitude ?? null, c.geoRadius ?? 100,
        req.params.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    res.json(mapCompany(rows[0]));
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suppression réservée au superadmin (le superadmin.js gère la cascade)
router.delete('/:id', requireAuth, async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Réservé au superadmin' });
  try {
    await db.query('DELETE FROM companies WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
module.exports.mapCompany = mapCompany;
module.exports.ensureGeoColumns = ensureGeoColumns;
