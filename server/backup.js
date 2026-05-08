'use strict';
/**
 * Script de sauvegarde automatique de la base de données MySQL.
 *
 * Usage :
 *   node backup.js              → backup immédiat
 *   node backup.js --schedule   → backup immédiat + planification auto (quotidien à 02h00)
 *
 * Les sauvegardes sont stockées dans le dossier "backups/" à côté de ce fichier.
 * Rétention : 30 derniers fichiers (env BACKUP_RETENTION).
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BACKUP_DIR = path.join(__dirname, 'backups');
const RETENTION = parseInt(process.env.BACKUP_RETENTION || '30', 10);

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'hr_attendance_db';

// Chemin mysqldump selon l'OS
function getMysqldumpPath() {
  if (os.platform() === 'win32') {
    // Cherche mysqldump dans les emplacements XAMPP courants
    const candidates = [
      'C:\\xampp\\mysql\\bin\\mysqldump.exe',
      'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe',
      'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'mysqldump'; // Dans le PATH sur Linux/Mac
}

function pad(n) { return String(n).padStart(2, '0'); }

function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function runBackup() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const filename = `backup_${DB_NAME}_${getTimestamp()}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const mysqldump = getMysqldumpPath();
    const args = [
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--user=${DB_USER}`,
      DB_PASS ? `--password=${DB_PASS}` : '--password=',
      '--single-transaction',
      '--routines',
      '--triggers',
      '--add-drop-table',
      '--complete-insert',
      DB_NAME,
    ];

    const child = execFile(mysqldump, args, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);

      fs.writeFileSync(filepath, stdout, 'utf8');
      const sizeMb = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
      console.log(`[Backup] ✓ ${filename} (${sizeMb} Mo)`);

      // Nettoyage des anciens backups (rétention)
      const files = fs.readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith('backup_') && f.endsWith('.sql'))
        .sort();

      if (files.length > RETENTION) {
        const toDelete = files.slice(0, files.length - RETENTION);
        for (const f of toDelete) {
          fs.unlinkSync(path.join(BACKUP_DIR, f));
          console.log(`[Backup] 🗑 Supprimé (rétention) : ${f}`);
        }
      }

      resolve(filepath);
    });

    // Capturer stderr séparément pour les avertissements mysqldump
    child.stderr.on('data', (data) => {
      const msg = String(data).trim();
      if (msg && !msg.includes('Using a password on the command line')) {
        console.warn('[Backup] Warning:', msg);
      }
    });
  });
}

function scheduleDaily() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();

  console.log(`[Backup] Prochain backup planifié : ${next.toLocaleString('fr-FR')}`);

  setTimeout(function tick() {
    runBackup().catch((err) => console.error('[Backup] Erreur :', err.message));
    // Replanifier pour le lendemain
    setTimeout(tick, 24 * 60 * 60 * 1000);
  }, delay);
}

// ─── Point d'entrée ──────────────────────────────────────────────────────────
if (require.main === module) {
  runBackup()
    .then(() => {
      if (process.argv.includes('--schedule')) {
        scheduleDaily();
        // Garder le processus vivant pour la planification
        process.stdin.resume();
      }
    })
    .catch((err) => {
      console.error('[Backup] Erreur :', err.message);
      process.exit(1);
    });
}

module.exports = { runBackup, scheduleDaily };
