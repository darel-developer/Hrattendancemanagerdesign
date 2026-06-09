import express, { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();
const upload = multer({ dest: 'uploads/contracts/' });

// ============================================================================
// CONTRACTS - Gestion des contrats de travail
// ============================================================================

/**
 * GET /api/contracts
 * Récupérer tous les contrats avec pagination et filtres
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { 
      employeeId, 
      status = 'Active', 
      page = '1', 
      pageSize = '10',
      companyId 
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * pageSizeNum;

    // Construire la requête avec filtres
    let whereClause = 'WHERE c.status = $1';
    const params: any[] = [status];
    let paramIndex = 2;

    if (employeeId) {
      whereClause += ` AND c.employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (companyId) {
      whereClause += ` AND c.company_id = $${paramIndex}`;
      params.push(companyId);
      paramIndex++;
    }

    // Récupérer les contrats
    const result = await query(
      `SELECT 
        c.id, c.employee_id, c.contract_type, c.contract_number,
        c.start_date, c.end_date, c.job_title, c.salary_base,
        c.work_schedule_hours, c.status, c.created_at,
        e.first_name, e.last_name, e.employee_number
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      ${whereClause}
      ORDER BY c.start_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSizeNum, offset]
    );

    // Récupérer le total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM contracts c ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Erreur GET contracts:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/contracts/:id
 * Récupérer un contrat spécifique
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM contracts WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contrat non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur GET contract:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/contracts
 * Créer un nouveau contrat
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      contractType,
      contractNumber,
      startDate,
      endDate,
      jobTitle,
      jobDescription,
      salaryBase,
      workScheduleHours,
      probationPeriodDays,
      notes,
      companyId
    } = req.body;

    // Validation
    if (!employeeId || !contractType || !startDate || !jobTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données manquantes (employeeId, contractType, startDate, jobTitle)' 
      });
    }

    const result = await query(
      `INSERT INTO contracts (
        employee_id, company_id, contract_type, contract_number,
        start_date, end_date, job_title, job_description,
        salary_base, work_schedule_hours, probation_period_days,
        notes, status, created_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active', NOW(), $13)
      RETURNING *`,
      [
        employeeId, companyId, contractType, contractNumber,
        startDate, endDate, jobTitle, jobDescription,
        salaryBase, workScheduleHours, probationPeriodDays,
        notes, req.user?.id
      ]
    );

    // Log audit
    await logAudit('contracts', result.rows[0].id, 'Create', {}, result.rows[0], req);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Contrat créé avec succès'
    });
  } catch (error) {
    console.error('Erreur POST contract:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/contracts/:id/document
 * Upload du fichier contrat
 */
router.post('/:id/document', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    // Calculer checksum SHA-256
    const fileContent = fs.readFileSync(file.path);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');

    // Créer le répertoire s'il n'existe pas
    const uploadsDir = `uploads/contracts/${new Date().getFullYear()}`;
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Renommer le fichier
    const newFilename = `${id}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadsDir, newFilename);
    fs.renameSync(file.path, filePath);

    // Mettre à jour le contrat
    const result = await query(
      `UPDATE contracts 
       SET document_file_path = $1, 
           document_file_name = $2,
           document_file_size = $3,
           document_file_checksum = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [filePath, file.originalname, file.size, checksum, id]
    );

    res.json({
      success: true,
      data: {
        documentFileName: file.originalname,
        documentFilePath: filePath,
        documentFileSize: file.size,
        fileChecksum: checksum
      }
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

/**
 * PUT /api/contracts/:id
 * Modifier un contrat
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Récupérer l'ancien contrat
    const oldResult = await query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contrat non trouvé' });
    }

    const oldData = oldResult.rows[0];

    // Construire la requête de mise à jour dynamiquement
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await query(
      `UPDATE contracts 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      values
    );

    // Log audit
    await logAudit('contracts', id, 'Update', oldData, result.rows[0], req);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur PUT contract:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/contracts/:id
 * Supprimer un contrat (soft delete)
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE contracts 
       SET status = 'Terminated', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contrat non trouvé' });
    }

    res.json({ success: true, message: 'Contrat supprimé' });
  } catch (error) {
    console.error('Erreur DELETE contract:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/contracts/:id/download
 * Télécharger le fichier contrat
 */
router.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT document_file_path, document_file_name FROM contracts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].document_file_path) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    const filePath = result.rows[0].document_file_path;
    const fileName = result.rows[0].document_file_name;

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Erreur download:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function logAudit(
  table: string,
  recordId: string,
  action: string,
  oldValues: any,
  newValues: any,
  req: any
) {
  try {
    if (table === 'contracts') {
      // Log dans personnel_document_audit_log si applicable
      // Pour contracts on pourrait créer une table similaire
    }
  } catch (error) {
    console.error('Erreur logging audit:', error);
  }
}

export default router;
