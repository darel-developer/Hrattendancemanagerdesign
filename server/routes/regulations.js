import express, { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();
const upload = multer({ dest: 'uploads/regulations/' });

// ============================================================================
// REGULATIONS - Règlement intérieur
// ============================================================================

/**
 * GET /api/regulations
 * Récupérer les règlements actifs
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status = 'Active', companyId } = req.query;

    let whereClause = 'WHERE cr.status = $1';
    const params: any[] = [status];
    let paramIndex = 2;

    if (companyId) {
      whereClause += ` AND cr.company_id = $${paramIndex}`;
      params.push(companyId);
      paramIndex++;
    }

    const result = await query(
      `SELECT 
        cr.id, cr.regulation_title, cr.regulation_version,
        cr.effective_date, cr.end_date, cr.is_mandatory_acknowledgment,
        cr.status, cr.created_at,
        COUNT(DISTINCT ra.id) as acknowledgment_count
      FROM company_regulations cr
      LEFT JOIN regulation_acknowledgments ra ON cr.id = ra.regulation_id
      ${whereClause}
      GROUP BY cr.id
      ORDER BY cr.effective_date DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur GET regulations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/regulations/:id
 * Récupérer le contenu d'un règlement
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM company_regulations WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Règlement non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur GET regulation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/regulations
 * Créer un règlement intérieur
 */
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const {
      regulationTitle,
      regulationVersion,
      regulationContent,
      workingHours,
      leavePolicy,
      codeOfConduct,
      healthSafety,
      disciplinaryMeasures,
      remoteWorkPolicy,
      overtimePolicy,
      effectiveDate,
      endDate,
      isMandatoryAcknowledgment = true,
      companyId
    } = req.body;

    if (!regulationTitle || !regulationVersion) {
      return res.status(400).json({
        success: false,
        message: 'regulationTitle et regulationVersion requis'
      });
    }

    let filePath = null;
    let fileChecksum = null;

    // Upload fichier si fourni
    if (req.file) {
      const file = req.file;
      const fileContent = fs.readFileSync(file.path);
      fileChecksum = crypto.createHash('sha256').update(fileContent).digest('hex');

      const uploadsDir = `uploads/regulations/${new Date().getFullYear()}`;
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const newFilename = `${companyId}-${Date.now()}${path.extname(file.originalname)}`;
      filePath = path.join(uploadsDir, newFilename);
      fs.renameSync(file.path, filePath);
    }

    const result = await query(
      `INSERT INTO company_regulations (
        company_id, regulation_title, regulation_version, regulation_content,
        working_hours, leave_policy, code_of_conduct, health_safety,
        disciplinary_measures, remote_work_policy, overtime_policy,
        file_path, file_checksum, effective_date, end_date,
        is_mandatory_acknowledgment, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Active', $17, NOW())
      RETURNING *`,
      [
        companyId, regulationTitle, regulationVersion, regulationContent,
        workingHours, leavePolicy, codeOfConduct, healthSafety,
        disciplinaryMeasures, remoteWorkPolicy, overtimePolicy,
        filePath, fileChecksum, effectiveDate, endDate,
        isMandatoryAcknowledgment, req.user?.id
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Règlement créé avec succès'
    });
  } catch (error) {
    console.error('Erreur POST regulation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/regulations/:id/acknowledge
 * Reconnaître un règlement
 */
router.post('/:id/acknowledge', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acknowledgmentType = 'Acknowledged', notes } = req.body;
    const employeeId = req.user?.id;

    // Vérifier s'il n'y a pas déjà une reconnaissance
    const existing = await query(
      `SELECT id FROM regulation_acknowledgments 
       WHERE regulation_id = $1 AND employee_id = $2`,
      [id, employeeId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà reconnu ce règlement'
      });
    }

    const result = await query(
      `INSERT INTO regulation_acknowledgments (
        regulation_id, employee_id, acknowledgment_type,
        acknowledged_at, ip_address, user_agent, device_id
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6)
      RETURNING *`,
      [id, employeeId, acknowledgmentType, req.ip, req.get('user-agent'), req.body.deviceId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Règlement reconnu'
    });
  } catch (error) {
    console.error('Erreur acknowledge regulation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/regulations/:id/acknowledgment-status
 * Statut de reconnaissance par entreprise
 */
router.get('/:id/acknowledgment-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        cr.id as regulation_id,
        cr.regulation_title,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT ra.id) as acknowledged_count,
        (COUNT(DISTINCT e.id) - COUNT(DISTINCT ra.id)) as not_acknowledged_count,
        ROUND((COUNT(DISTINCT ra.id)::NUMERIC / NULLIF(COUNT(DISTINCT e.id), 0)) * 100, 2) as acknowledgment_percentage
      FROM company_regulations cr
      LEFT JOIN employees e ON e.company_id = cr.company_id
      LEFT JOIN regulation_acknowledgments ra ON ra.regulation_id = cr.id AND ra.employee_id = e.id
      WHERE cr.id = $1
      GROUP BY cr.id, cr.regulation_title`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Règlement non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur acknowledgment-status:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/regulations/:id/acknowledgments
 * Liste des employés et leur statut
 */
router.get('/:id/acknowledgments', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    const result = await query(
      `SELECT 
        e.id, e.first_name, e.last_name, e.employee_number, e.email,
        ra.acknowledgment_type, ra.acknowledged_at,
        CASE WHEN ra.id IS NULL THEN false ELSE true END as is_acknowledged
      FROM employees e
      LEFT JOIN regulation_acknowledgments ra ON ra.employee_id = e.id AND ra.regulation_id = $1
      ORDER BY is_acknowledged ASC, e.first_name
      LIMIT $2 OFFSET $3`,
      [id, pageSizeNum, offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur GET acknowledgments:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/regulations/:id/download
 * Télécharger le fichier PDF
 */
router.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT file_path, regulation_title FROM company_regulations WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].file_path) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }

    const filePath = result.rows[0].file_path;
    const fileName = `${result.rows[0].regulation_title}.pdf`;

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Erreur download regulation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
