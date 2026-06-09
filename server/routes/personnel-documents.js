import express, { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();
const upload = multer({ dest: 'uploads/personnel-documents/' });

// ============================================================================
// PERSONNEL DOCUMENTS - Dossier numérique du personnel
// ============================================================================

/**
 * GET /api/personnel-documents
 * Récupérer les documents personnels
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { employeeId, documentType, page = '1', pageSize = '10' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      whereClause += ` AND pd.employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (documentType) {
      whereClause += ` AND pd.document_type = $${paramIndex}`;
      params.push(documentType);
      paramIndex++;
    }

    const result = await query(
      `SELECT 
        pd.id, pd.employee_id, pd.document_type, pd.document_title,
        pd.document_number, pd.issue_date, pd.expiry_date,
        pd.file_name, pd.is_verified, pd.verified_by, pd.verified_at,
        pd.created_at, e.first_name, e.last_name
      FROM personnel_documents pd
      LEFT JOIN employees e ON pd.employee_id = e.id
      ${whereClause}
      ORDER BY pd.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSizeNum, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM personnel_documents pd ${whereClause}`,
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
    console.error('Erreur GET personnel-documents:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/personnel-documents/expiring-soon
 * Récupérer les documents en cours d'expiration
 */
router.get('/expiring-soon', requireAuth, async (req: Request, res: Response) => {
  try {
    const { daysWindow = '30' } = req.query;
    const days = parseInt(daysWindow as string);

    const result = await query(
      `SELECT 
        pd.id, pd.employee_id, pd.document_type, pd.expiry_date,
        e.first_name, e.last_name, e.employee_number,
        CEIL((EXTRACT(EPOCH FROM pd.expiry_date - NOW()) / 86400)::int) as days_remaining,
        CASE
          WHEN pd.expiry_date < NOW() THEN 'Expired'
          WHEN pd.expiry_date < NOW() + INTERVAL '30 days' THEN 'Expiring soon (< 30 days)'
          WHEN pd.expiry_date < NOW() + INTERVAL '90 days' THEN 'Expiring soon (< 90 days)'
          ELSE 'Valid'
        END as expiry_status
      FROM personnel_documents pd
      JOIN employees e ON pd.employee_id = e.id
      WHERE pd.expiry_date IS NOT NULL 
        AND pd.expiry_date < NOW() + INTERVAL '${days} days'
      ORDER BY pd.expiry_date ASC`,
      []
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur GET expiring-soon:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/personnel-documents
 * Créer un document personnel
 */
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      documentType,
      documentTitle,
      documentNumber,
      issueDate,
      expiryDate,
      visibility = 'Admin_Only',
      companyId
    } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Fichier requis' });
    }

    const file = req.file;

    // Calculer checksum
    const fileContent = fs.readFileSync(file.path);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');

    // Créer répertoire
    const uploadsDir = `uploads/personnel-documents/${new Date().getFullYear()}`;
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Renommer fichier
    const newFilename = `${employeeId}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadsDir, newFilename);
    fs.renameSync(file.path, filePath);

    const result = await query(
      `INSERT INTO personnel_documents (
        employee_id, company_id, document_type, document_title,
        document_number, issue_date, expiry_date,
        file_name, file_path, file_checksum,
        visibility, created_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
      RETURNING *`,
      [
        employeeId, companyId, documentType, documentTitle,
        documentNumber, issueDate, expiryDate,
        file.originalname, filePath, checksum,
        visibility, req.user?.id
      ]
    );

    // Log audit
    await query(
      `INSERT INTO personnel_document_audit_log (
        document_id, employee_id, action, action_by, 
        ip_address, user_agent, action_timestamp
      ) VALUES ($1, $2, 'Upload', $3, $4, $5, NOW())`,
      [result.rows[0].id, employeeId, req.user?.id, req.ip, req.get('user-agent')]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Document créé avec succès'
    });
  } catch (error) {
    console.error('Erreur POST personnel-document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/personnel-documents/:id/verify
 * Vérifier un document
 */
router.put('/:id/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified, verificationNotes } = req.body;

    const result = await query(
      `UPDATE personnel_documents 
       SET is_verified = $1, verified_by = $2, verified_at = NOW(),
           verification_notes = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [isVerified, req.user?.id, verificationNotes, id]
    );

    // Log audit
    await query(
      `INSERT INTO personnel_document_audit_log (
        document_id, employee_id, action, action_by, action_reason,
        ip_address, user_agent, action_timestamp
      ) VALUES ($1, $2, 'Verify', $3, $4, $5, $6, NOW())`,
      [
        id, 
        result.rows[0].employee_id, 
        req.user?.id,
        verificationNotes,
        req.ip, 
        req.get('user-agent')
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur verify document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/personnel-documents/:id/download
 * Télécharger un document
 */
router.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT file_path, file_name, employee_id FROM personnel_documents WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].file_path) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    // Log audit download
    await query(
      `INSERT INTO personnel_document_audit_log (
        document_id, employee_id, action, action_by,
        ip_address, user_agent, action_timestamp
      ) VALUES ($1, $2, 'Download', $3, $4, $5, NOW())`,
      [id, result.rows[0].employee_id, req.user?.id, req.ip, req.get('user-agent')]
    );

    res.download(result.rows[0].file_path, result.rows[0].file_name);
  } catch (error) {
    console.error('Erreur download:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/personnel-documents/:id
 * Supprimer un document
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT file_path, employee_id FROM personnel_documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document non trouvé' });
    }

    // Supprimer le fichier
    const filePath = result.rows[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer le record
    await query('DELETE FROM personnel_documents WHERE id = $1', [id]);

    // Log audit
    await query(
      `INSERT INTO personnel_document_audit_log (
        document_id, employee_id, action, action_by,
        ip_address, user_agent, action_timestamp
      ) VALUES ($1, $2, 'Delete', $3, $4, $5, NOW())`,
      [id, result.rows[0].employee_id, req.user?.id, req.ip, req.get('user-agent')]
    );

    res.json({ success: true, message: 'Document supprimé' });
  } catch (error) {
    console.error('Erreur DELETE document:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
