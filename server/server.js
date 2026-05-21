const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { securityHeaders, authLimiter, kioskLimiter, superadminLimiter, generalLimiter } = require('./security');
const { runBackup, scheduleDaily } = require('./backup');

const employeesRouter = require('./routes/employees');
const attendanceRouter = require('./routes/attendance');
const devicesRouter = require('./routes/devices');
const leavesRouter = require('./routes/leaves');
const notificationsRouter = require('./routes/notifications');
const authRouter = require('./routes/auth');
const { ensureGeoColumns } = require('./routes/companies');
const companiesRouter = require('./routes/companies');
const kioskRouter = require('./routes/kiosk');
const superadminRouter = require('./routes/superadmin');
const { router: reportsRouter, ensureTable: ensureReportsTable } = require('./routes/reports');
const { router: departmentsRouter, ensureTable: ensureDepartmentsTable } = require('./routes/departments');
const performanceRouter = require('./routes/performance');
const documentsRouter = require('./routes/documents');
const planningRouter = require('./routes/planning');
const db = require('./db');
const { initFCM, sendPush } = require('./services/fcm');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Logger centralisé ────────────────────────────────────────────────────────
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // 'debug' | 'info' | 'warn' | 'error'
function ts() { return new Date().toISOString(); }
const logger = {
  debug: (...a) => LOG_LEVEL === 'debug' && console.debug(`[${ts()}] [DEBUG]`, ...a),
  info:  (...a) => ['debug','info'].includes(LOG_LEVEL) && console.info(`[${ts()}] [INFO] `, ...a),
  warn:  (...a) => console.warn(`[${ts()}] [WARN] `, ...a),
  error: (...a) => console.error(`[${ts()}] [ERROR]`, ...a),
};
module.exports.logger = logger;

// ─── Middleware de logging des requêtes HTTP ──────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`;
    if (res.statusCode >= 500) logger.error(msg);
    else if (res.statusCode >= 400) logger.warn(msg);
    else logger.debug(msg);
  });
  next();
});

// ─── Headers de sécurité (toutes les réponses) ────────────────────────────────
app.use(securityHeaders);

// ─── CORS — origines autorisées uniquement ────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',').map((o) => o.trim());

const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origine non autorisée: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  optionsSuccessStatus: 200,
};

// Preflight pour toutes les routes (doit être avant app.use(cors))
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ─── Parsing JSON — limite augmentée pour les avatars base64 ─────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: false }));

// ─── Rate limiting global ─────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Routes avec rate limiters spécifiques ────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/kiosk', kioskLimiter, kioskRouter);
app.use('/api/superadmin', superadminLimiter, superadminRouter);

// ─── Routes standard ──────────────────────────────────────────────────────────
app.use('/api/devices', devicesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/planning', planningRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Gestionnaire d'erreurs global ────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);
  if (process.env.NODE_ENV !== 'production') logger.error(err.stack);
  res.status(status).json({ error: status >= 500 ? 'Erreur serveur' : err.message });
});

// ─── Auto Notification Scheduler ──────────────────────────────────────────────

function notifId() {
  return `NOT${Date.now().toString(36).slice(-7).toUpperCase()}`;
}

async function generateDailyAbsenceNotifications() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dayNameFull = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
    const todayDayName = dayNameFull.charAt(0).toUpperCase() + dayNameFull.slice(1);

    const [employees] = await db.query("SELECT * FROM employees WHERE status = 'Actif'");
    const [present] = await db.query(
      'SELECT DISTINCT employee_id FROM attendance_records WHERE date = ?', [today]
    );
    const presentIds = new Set(present.map(r => r.employee_id));

    let absenceCount = 0;
    for (const emp of employees) {
      if (presentIds.has(emp.id)) continue;

      // Skip if today is not one of the employee's scheduled work days
      if (emp.work_days) {
        const workDays = emp.work_days.split(',').map(d => d.trim()).filter(Boolean);
        if (workDays.length > 0 && !workDays.includes(todayDayName)) continue;
      }

      // Avoid duplicate notifications for today
      const [existing] = await db.query(
        `SELECT id FROM notifications WHERE employee_id = ? AND type = 'absence'
         AND DATE(date) = ? LIMIT 1`, [emp.id, today]
      );
      if (existing.length === 0) {
        const absTitle = `Absence non justifiée — ${emp.first_name} ${emp.last_name}`;
        const absMsg = `${emp.first_name} ${emp.last_name} n'a pas pointé son arrivée aujourd'hui (${today}).`;
        await db.query(
          `INSERT INTO notifications (id, type, title, message, date, is_read, employee_id)
           VALUES (?, 'absence', ?, ?, NOW(), FALSE, ?)`,
          [notifId(), absTitle, absMsg, emp.id]
        );
        sendPush(emp.id, absTitle, absMsg);
        absenceCount++;
      }
    }
    console.log(`[Auto] Vérification absences ${today} — ${absenceCount} absence(s) détectée(s) (sur ${employees.length} actifs)`);
  } catch (err) {
    console.error('[Auto] Erreur vérification absences :', err.message);
  }
}

async function generateMonthlyReport() {
  try {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthLabel = prevMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const monthStr = prevMonth.toISOString().slice(0, 7);

    const [companies] = await db.query('SELECT * FROM companies');

    for (const company of companies) {
      const [employees] = await db.query(
        "SELECT * FROM employees WHERE company_id = ? AND status = 'Actif'", [company.id]
      );
      if (employees.length === 0) continue;

      const empIds = employees.map(e => e.id);
      const placeholders = empIds.map(() => '?').join(',');
      const monthStart = `${monthStr}-01`;
      const nextMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
      const monthEnd = nextMonth.toISOString().slice(0, 10);
      const [records] = await db.query(
        `SELECT * FROM attendance_records WHERE employee_id IN (${placeholders}) AND date >= ? AND date < ?`,
        [...empIds, monthStart, monthEnd]
      );

      const presents = records.filter(r => r.status === 'Présent' || r.status === 'Télétravail').length;
      const absents = records.filter(r => r.status === 'Absent').length;
      const retards = records.filter(r => r.status === 'Retard').length;
      const taux = records.length > 0 ? Math.round((presents / records.length) * 100) : 0;

      // Find admins for this company
      const [admins] = await db.query(
        "SELECT id FROM employees WHERE company_id = ? AND role = 'Admin'", [company.id]
      );

      for (const admin of admins) {
        const repTitle = `Rapport mensuel — ${monthLabel}`;
        const repMsg = `${company.name} : ${employees.length} employé(s) actifs · Taux de présence : ${taux}% · Absences : ${absents} · Retards : ${retards}`;
        await db.query(
          `INSERT INTO notifications (id, type, title, message, date, is_read, employee_id)
           VALUES (?, 'system', ?, ?, NOW(), FALSE, ?)`,
          [notifId(), repTitle, repMsg, admin.id]
        );
        sendPush(admin.id, repTitle, repMsg);
      }
    }
    console.log(`[Auto] Rapport mensuel ${monthLabel} envoyé`);
  } catch (err) {
    console.error('[Auto] Erreur rapport mensuel :', err.message);
  }
}

// ─── Recalcul des statuts de pointage du jour ─────────────────────────────────
// Corrige les enregistrements "Présent" qui auraient dû être "Retard" en se basant
// sur l'heure de pointage réelle et les paramètres work_start / late_tolerance de l'entreprise.
async function recalculateTodayAttendanceStatuses() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [companies] = await db.query('SELECT id, work_start, late_tolerance FROM companies');
    let fixed = 0;
    for (const company of companies) {
      const workStart = String(company.work_start || '09:00').slice(0, 5);
      const lateTol = company.late_tolerance ?? 5;
      const [wh, wm] = workStart.split(':').map(Number);
      const limitMinutes = wh * 60 + wm + lateTol;

      const [empRows] = await db.query("SELECT id FROM employees WHERE company_id = ?", [company.id]);
      if (empRows.length === 0) continue;
      const empIds = empRows.map(e => e.id);
      const ph = empIds.map(() => '?').join(',');

      const [records] = await db.query(
        `SELECT id, check_in FROM attendance_records
         WHERE date = ? AND status = 'Présent' AND check_in IS NOT NULL AND employee_id IN (${ph})`,
        [today, ...empIds]
      );
      for (const rec of records) {
        const ci = String(rec.check_in).slice(0, 5);
        const [ch, cm] = ci.split(':').map(Number);
        if (ch * 60 + cm > limitMinutes) {
          await db.query("UPDATE attendance_records SET status = 'Retard' WHERE id = ?", [rec.id]);
          fixed++;
        }
      }
    }
    if (fixed > 0) console.log(`[Auto] ${fixed} statut(s) corrigé(s) → Retard`);
  } catch (err) {
    console.error('[Auto] Erreur recalcul statuts :', err.message);
  }
}

function scheduleAutoNotifications() {
  const now = new Date();

  // Daily absence check at 09:30
  const nextCheck = new Date(now);
  nextCheck.setHours(9, 30, 0, 0);
  if (nextCheck <= now) nextCheck.setDate(nextCheck.getDate() + 1);
  const msUntilCheck = nextCheck.getTime() - now.getTime();

  setTimeout(() => {
    generateDailyAbsenceNotifications();
    setInterval(generateDailyAbsenceNotifications, 24 * 60 * 60 * 1000);
  }, msUntilCheck);

  // Monthly report on the 1st of each month at 08:00
  const isFirstOfMonth = now.getDate() === 1 && now.getHours() < 8;
  if (isFirstOfMonth) {
    const sendTime = new Date(now);
    sendTime.setHours(8, 0, 0, 0);
    setTimeout(generateMonthlyReport, sendTime.getTime() - now.getTime());
  } else {
    const next1st = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0);
    setTimeout(function scheduleMonthly() {
      generateMonthlyReport();
      // Re-schedule for next month
      const n = new Date();
      const next = new Date(n.getFullYear(), n.getMonth() + 1, 1, 8, 0, 0, 0);
      setTimeout(scheduleMonthly, next.getTime() - Date.now());
    }, next1st.getTime() - now.getTime());
  }

  console.log(`[Auto] Prochaine vérification absences : ${nextCheck.toLocaleTimeString('fr-FR')}`);
}

// ─── Startup ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'CHANGE_ME_IN_PRODUCTION') {
    console.warn('[SECURITY] JWT_SECRET non défini — utilisez une valeur sécurisée en production !');
  }
  console.log(`Serveur HR démarré sur http://localhost:${PORT}`);
  try {
    await ensureReportsTable();
    console.log('[DB] Table reports prête');
  } catch (err) {
    console.error('[DB] Erreur création table reports :', err.message);
  }
  try {
    await ensureDepartmentsTable();
    console.log('[DB] Table departments prête');
  } catch (err) {
    console.error('[DB] Erreur création table departments :', err.message);
  }
  try {
    await ensureGeoColumns();
    console.log('[DB] Colonnes géolocalisation prêtes');
  } catch (err) {
    console.error('[DB] Erreur colonnes géo :', err.message);
  }
  // ── Liaison appareils employés ──────────────────────────────────────────────
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS employee_devices (
        id          SERIAL PRIMARY KEY,
        employee_id VARCHAR(50)  NOT NULL,
        device_id   VARCHAR(255) NOT NULL,
        device_name VARCHAR(255) DEFAULT 'Inconnu',
        registered_at TIMESTAMP  DEFAULT NOW(),
        last_seen_at  TIMESTAMP  DEFAULT NOW(),
        is_active   BOOLEAN      DEFAULT TRUE,
        UNIQUE (employee_id),
        UNIQUE (device_id)
      )
    `);
    console.log('[DB] Table employee_devices prête');
  } catch (err) {
    console.error('[DB] Erreur table employee_devices :', err.message);
  }
  // ── Tokens QR kiosque ───────────────────────────────────────────────────────
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS kiosk_tokens (
        token      VARCHAR(255) PRIMARY KEY,
        company_id VARCHAR(50)  NOT NULL,
        created_at TIMESTAMP    DEFAULT NOW(),
        expires_at TIMESTAMP    NOT NULL,
        used_by    VARCHAR(50)  DEFAULT NULL
      )
    `);
    console.log('[DB] Table kiosk_tokens prête');
  } catch (err) {
    console.error('[DB] Erreur table kiosk_tokens :', err.message);
  }
  // ── Tokens FCM push web ─────────────────────────────────────────────────────
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id          SERIAL PRIMARY KEY,
        employee_id VARCHAR(50)  NOT NULL,
        token       TEXT         NOT NULL,
        platform    VARCHAR(20)  DEFAULT 'web',
        updated_at  TIMESTAMP    DEFAULT NOW(),
        UNIQUE (employee_id, platform)
      )
    `);
    console.log('[DB] Table push_tokens prête');
  } catch (err) {
    console.error('[DB] Erreur table push_tokens :', err.message);
  }
  // ── Comptes kiosk (terminaux nommés par l'admin) ────────────────────────────
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS kiosk_accounts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        company_id VARCHAR(50) NOT NULL,
        label VARCHAR(255),
        device_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('[DB] Table kiosk_accounts prête');
  } catch (err) {
    console.error('[DB] Erreur table kiosk_accounts :', err.message);
  }
  // Convertir department de ENUM → VARCHAR pour accepter les départements personnalisés
  // (PostgreSQL ne supporte pas ENUM inline dans les migrations — on s'assure juste que la colonne existe en VARCHAR)
  try {
    const [cols] = await db.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_name = 'employees' AND column_name = 'department' AND table_schema = current_schema()`
    );
    if (cols.length > 0 && cols[0].data_type === 'USER-DEFINED') {
      await db.query("ALTER TABLE employees ALTER COLUMN department TYPE VARCHAR(100)");
      console.log('[DB] Colonne department convertie ENUM → VARCHAR');
    }
  } catch (err) {
    console.error('[DB] Erreur migration department :', err.message);
  }
  // Ajouter colonne work_days si absente
  try {
    const [wdCols] = await db.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'employees' AND column_name = 'work_days' AND table_schema = current_schema()`
    );
    if (wdCols.length === 0) {
      await db.query("ALTER TABLE employees ADD COLUMN work_days VARCHAR(255) DEFAULT NULL");
      console.log('[DB] Colonne work_days ajoutée');
    }
  } catch (err) {
    console.error('[DB] Erreur migration work_days :', err.message);
  }
  // ── Firebase Cloud Messaging ────────────────────────────────────────────────
  initFCM();

  // Corriger les statuts de pointage du jour mal enregistrés
  recalculateTodayAttendanceStatuses().catch((err) => console.error('[Auto] Recalcul statuts :', err.message));

  scheduleAutoNotifications();

  // ─── Backup automatique ──────────────────────────────────────────────────
  if (process.env.AUTO_BACKUP !== 'false') {
    // Backup immédiat au démarrage si le dernier date de plus de 24h
    const backupDir = require('path').join(__dirname, 'backups');
    const fs = require('fs');
    let doStartupBackup = true;
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.sql')).sort();
      if (files.length > 0) {
        const lastFile = files[files.length - 1];
        const lastMtime = fs.statSync(require('path').join(backupDir, lastFile)).mtimeMs;
        if (Date.now() - lastMtime < 24 * 60 * 60 * 1000) doStartupBackup = false;
      }
    }
    if (doStartupBackup) {
      runBackup().catch((err) => console.error('[Backup] Erreur démarrage :', err.message));
    }
    scheduleDaily();
  }
});
