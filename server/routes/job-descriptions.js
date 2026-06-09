import express, { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ============================================================================
// JOB DESCRIPTIONS - Fiches de poste
// ============================================================================

/**
 * GET /api/job-descriptions
 * Récupérer les fiches de poste
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status = 'Active', isPublic, page = '1', pageSize = '10' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = 'WHERE jd.status = $1';
    const params: any[] = [status];
    let paramIndex = 2;

    if (isPublic !== undefined) {
      whereClause += ` AND jd.is_public = $${paramIndex}`;
      params.push(isPublic === 'true');
      paramIndex++;
    }

    const result = await query(
      `SELECT 
        jd.id, jd.job_title, jd.job_reference, jd.job_level,
        jd.job_family, jd.work_location, jd.is_public,
        jd.status, jd.version, jd.created_at, jd.approved_by,
        u.first_name, u.last_name
      FROM job_descriptions jd
      LEFT JOIN employees u ON jd.approved_by = u.id
      ${whereClause}
      ORDER BY jd.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSizeNum, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM job_descriptions jd ${whereClause}`,
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
    console.error('Erreur GET job-descriptions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/job-descriptions/:id
 * Récupérer une fiche de poste
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM job_descriptions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fiche non trouvée' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur GET job-description:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/job-descriptions
 * Créer une fiche de poste
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      jobTitle,
      jobReference,
      jobLevel,
      jobFamily,
      jobResponsibilities,
      jobSkillsRequired,
      reportingTo,
      subordinatesCount,
      workLocation,
      travelRequired = false,
      travelPercentage,
      isPublic = false,
      companyId
    } = req.body;

    if (!jobTitle || !jobLevel || !jobFamily) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (jobTitle, jobLevel, jobFamily)'
      });
    }

    // Générer job_reference auto
    const refResult = await query(
      `SELECT COUNT(*) as count FROM job_descriptions WHERE company_id = $1`,
      [companyId]
    );
    const jobRef = jobReference || `JD-${new Date().getFullYear()}-${String(refResult.rows[0].count + 1).padStart(4, '0')}`;

    const result = await query(
      `INSERT INTO job_descriptions (
        company_id, job_title, job_reference, job_level, job_family,
        job_responsibilities, job_skills_required, reporting_to,
        subordinates_count, work_location, travel_required,
        travel_percentage, is_public, status, version, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Draft', 1, $14)
      RETURNING *`,
      [
        companyId, jobTitle, jobRef, jobLevel, jobFamily,
        jobResponsibilities, jobSkillsRequired, reportingTo,
        subordinatesCount, workLocation, travelRequired,
        travelPercentage, isPublic, req.user?.id
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Fiche de poste créée'
    });
  } catch (error) {
    console.error('Erreur POST job-description:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/job-descriptions/:id
 * Modifier une fiche de poste
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Increment version
    updates.version = new query(
      `SELECT version FROM job_descriptions WHERE id = $1`,
      [id]
    ).then(r => r.rows[0].version + 1);

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await query(
      `UPDATE job_descriptions 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      values
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur PUT job-description:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/job-descriptions/:id
 * Archiver une fiche de poste
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query(
      `UPDATE job_descriptions SET status = 'Archived' WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Fiche archivée' });
  } catch (error) {
    console.error('Erreur DELETE job-description:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
