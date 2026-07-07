'use strict';
/**
 * Script de sauvegarde automatique de la base de données PostgreSQL.
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
const config = require('./config');

const BACKUP_DIR = path.join(__dirname, 'backups');
const RETENTION = config.backup.retention;

const DB_HOST = config.db.host;
const DB_PORT = String(config.db.port);
const DB_USER = config.db.user;
const DB_PASS = config.db.password;
const DB_NAME = config.db.name;

// Chemin pg_dump selon l'OS
function getPgDumpPath() {
  if (os.platform() === 'win32') {
    const candidates = [
      'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }
  return 'pg_dump'; // Dans le PATH sur Linux/Mac
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

    const pgDump = getPgDumpPath();
    const args = [
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--username=${DB_USER}`,
      '--no-password',
      '--format=plain',
      '--clean',
      '--if-exists',
      DB_NAME,
    ];

    const env = { ...process.env, PGPASSWORD: DB_PASS };

    const child = execFile(pgDump, args, { maxBuffer: 100 * 1024 * 1024, env }, (err, stdout) => {
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
          console.log(`[Backup] Supprimé (rétention) : ${f}`);
        }
      }

      resolve(filepath);
    });

    // Capturer stderr séparément pour les avertissements pg_dump
    child.stderr.on('data', (data) => {
      const msg = String(data).trim();
      if (msg) {
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
