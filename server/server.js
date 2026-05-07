const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const employeesRouter = require('./routes/employees');
const attendanceRouter = require('./routes/attendance');
const leavesRouter = require('./routes/leaves');
const notificationsRouter = require('./routes/notifications');
const authRouter = require('./routes/auth');
const companiesRouter = require('./routes/companies');
const kioskRouter = require('./routes/kiosk');
const superadminRouter = require('./routes/superadmin');
const { router: reportsRouter, ensureTable: ensureReportsTable } = require('./routes/reports');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/kiosk', kioskRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Auto Notification Scheduler ──────────────────────────────────────────────

function notifId() {
  return `NOT${Date.now().toString(36).slice(-7).toUpperCase()}`;
}

async function generateDailyAbsenceNotifications() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [employees] = await db.query("SELECT * FROM employees WHERE status = 'Actif'");
    const [present] = await db.query(
      'SELECT DISTINCT employee_id FROM attendance_records WHERE date = ?', [today]
    );
    const presentIds = new Set(present.map(r => r.employee_id));

    for (const emp of employees) {
      if (!presentIds.has(emp.id)) {
        // Avoid duplicate notifications for today
        const [existing] = await db.query(
          `SELECT id FROM notifications WHERE employee_id = ? AND type = 'absence'
           AND DATE(date) = ? LIMIT 1`, [emp.id, today]
        );
        if (existing.length === 0) {
          await db.query(
            `INSERT INTO notifications (id, type, title, message, date, is_read, employee_id)
             VALUES (?, 'absence', ?, ?, NOW(), FALSE, ?)`,
            [notifId(),
             `Absence non justifiée — ${emp.first_name} ${emp.last_name}`,
             `${emp.first_name} ${emp.last_name} n'a pas pointé son arrivée aujourd'hui (${today}).`,
             emp.id]
          );
        }
      }
    }
    console.log(`[Auto] Vérification absences ${today} — ${employees.length - presentIds.size} absence(s) détectée(s)`);
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
      const [records] = await db.query(
        `SELECT * FROM attendance_records WHERE employee_id IN (${placeholders}) AND date LIKE ?`,
        [...empIds, `${monthStr}%`]
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
        await db.query(
          `INSERT INTO notifications (id, type, title, message, date, is_read, employee_id)
           VALUES (?, 'system', ?, ?, NOW(), FALSE, ?)`,
          [notifId(),
           `Rapport mensuel — ${monthLabel}`,
           `${company.name} : ${employees.length} employé(s) actifs · Taux de présence : ${taux}% · Absences : ${absents} · Retards : ${retards}`,
           admin.id]
        );
      }
    }
    console.log(`[Auto] Rapport mensuel ${monthLabel} envoyé`);
  } catch (err) {
    console.error('[Auto] Erreur rapport mensuel :', err.message);
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
  console.log(`Serveur HR démarré sur http://localhost:${PORT}`);
  try {
    await ensureReportsTable();
    console.log('[DB] Table reports prête');
  } catch (err) {
    console.error('[DB] Erreur création table reports :', err.message);
  }
  scheduleAutoNotifications();
});
