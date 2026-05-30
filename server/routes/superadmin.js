'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

const SUPER_PWD = () => process.env.SUPER_ADMIN_PASSWORD || 'superadmin2024';

// ─── Middleware superadmin ────────────────────────────────────────────────────
function requireSuperAdmin(req, res, next) {
  const pwd = req.headers['x-superadmin-password'];
  if (!pwd || pwd !== SUPER_PWD()) {
    return res.status(401).json({ error: 'Authentification superadmin requise' });
  }
  next();
}

// ─── Email helper (nodemailer optionnel) ──────────────────────────────────────
let transporter = null;
try {
  const nodemailer = require('nodemailer');
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('[Mail] Transporteur SMTP initialisé');
  }
} catch {
  // nodemailer non installé — emails désactivés
}

async function sendEmail(to, subject, html) {
  if (!to) return;
  if (!transporter) {
    console.log(`[Mail] (SMTP non configuré) Sujet: "${subject}" → ${to}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"HR Manager" <noreply@hrmanager.app>',
      to,
      subject,
      html,
    });
    console.log(`[Mail] Email envoyé → ${to}`);
  } catch (err) {
    console.error('[Mail] Échec envoi :', err.message);
  }
}

// ─── POST /superadmin/verify ──────────────────────────────────────────────────
router.post('/verify', (req, res) => {
  const { password } = req.body;
  if (password === SUPER_PWD()) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Mot de passe incorrect' });
  }
});

// ─── PATCH /superadmin/companies/:id/block ────────────────────────────────────
router.patch('/companies/:id/block', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Entreprise introuvable' });

    const company = rows[0];
    await db.query('UPDATE companies SET is_blocked = TRUE WHERE id = ?', [id]);

    // Email aux admins de l'entreprise
    const [admins] = await db.query(
      "SELECT email, first_name, last_name FROM employees WHERE company_id = ? AND role = 'Admin'",
      [id]
    );

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #EF4444; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Accès suspendu</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #E2E8F0;">
          <p>Bonjour,</p>
          <p>L'accès de l'entreprise <strong>${company.name}</strong> à la plateforme <strong>HR Manager</strong> a été <strong style="color:#EF4444">suspendu</strong>.</p>
          <p>Motif : <em>Abonnement non renouvelé.</em></p>
          <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #DC2626;"><strong>Conséquences :</strong> Tous les comptes de votre organisation ne peuvent plus se connecter à la plateforme.</p>
          </div>
          <p>Pour rétablir l'accès, veuillez renouveler votre abonnement en contactant :</p>
          <p style="text-align: center;">
            <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@hrmanager.app'}"
               style="background: #6366F1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Contacter le support
            </a>
          </p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">HR Manager — Plateforme de gestion des présences</p>
        </div>
      </div>
    `;

    for (const admin of admins) {
      await sendEmail(admin.email, `[HR Manager] Accès de ${company.name} suspendu`, emailHtml);
    }

    console.log(`[SuperAdmin] Entreprise ${id} (${company.name}) bloquée — ${admins.length} email(s) envoyé(s)`);
    res.json({ success: true, emailsSent: admins.length });
  } catch (err) {
    console.error('[SuperAdmin] Block :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PATCH /superadmin/companies/:id/unblock ──────────────────────────────────
router.patch('/companies/:id/unblock', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Entreprise introuvable' });

    const company = rows[0];
    await db.query('UPDATE companies SET is_blocked = FALSE WHERE id = ?', [id]);

    // Email de réactivation aux admins
    const [admins] = await db.query(
      "SELECT email FROM employees WHERE company_id = ? AND role = 'Admin'",
      [id]
    );

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10B981; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">✅ Accès rétabli</h1>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #E2E8F0;">
          <p>Bonjour,</p>
          <p>L'accès de l'entreprise <strong>${company.name}</strong> à la plateforme <strong>HR Manager</strong> a été <strong style="color:#10B981">rétabli</strong>.</p>
          <p>Votre équipe peut de nouveau se connecter normalement.</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">HR Manager — Plateforme de gestion des présences</p>
        </div>
      </div>
    `;

    for (const admin of admins) {
      await sendEmail(admin.email, `[HR Manager] Accès de ${company.name} rétabli`, emailHtml);
    }

    console.log(`[SuperAdmin] Entreprise ${id} (${company.name}) débloquée`);
    res.json({ success: true });
  } catch (err) {
    console.error('[SuperAdmin] Unblock :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DELETE /superadmin/companies/:id ────────────────────────────────────────
// Supprime l'entreprise et TOUTES les données associées
router.delete('/companies/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT name FROM companies WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Entreprise introuvable' });

    const name = rows[0].name;

    // Obtenir les IDs des employés pour les cascades
    const [emps] = await db.query('SELECT id FROM employees WHERE company_id = ?', [id]);
    const empIds = emps.map((e) => e.id);

    if (empIds.length > 0) {
      const ph = empIds.map(() => '?').join(',');
      await db.query(`DELETE FROM push_tokens WHERE employee_id IN (${ph})`, empIds);
      await db.query(`DELETE FROM employee_devices WHERE employee_id IN (${ph})`, empIds);
      await db.query(`DELETE FROM attendance_records WHERE employee_id IN (${ph})`, empIds);
      await db.query(`DELETE FROM leave_requests WHERE employee_id IN (${ph})`, empIds);
      await db.query(`DELETE FROM notifications WHERE employee_id IN (${ph})`, empIds);
      // Tables optionnelles (si elles existent)
      await db.query(`DELETE FROM performance_reviews WHERE employee_id IN (${ph})`, empIds).catch(() => {});
      await db.query(`DELETE FROM employee_documents WHERE employee_id IN (${ph})`, empIds).catch(() => {});
    }

    await db.query('DELETE FROM planning_shifts WHERE company_id = ?', [id]).catch(() => {});
    await db.query('DELETE FROM kiosk_tokens WHERE company_id = ?', [id]).catch(() => {});
    await db.query('DELETE FROM kiosk_accounts WHERE company_id = ?', [id]).catch(() => {});
    await db.query('DELETE FROM departments WHERE company_id = ?', [id]).catch(() => {});
    await db.query('DELETE FROM employees WHERE company_id = ?', [id]);
    await db.query('DELETE FROM companies WHERE id = ?', [id]);

    console.log(`[SuperAdmin] Entreprise ${id} (${name}) supprimée — ${empIds.length} employé(s) effacé(s)`);
    res.json({ success: true, deletedEmployees: empIds.length });
  } catch (err) {
    console.error('[SuperAdmin] Delete company :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
