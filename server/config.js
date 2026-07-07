'use strict';
/**
 * ─── Configuration centralisée multi-environnements ──────────────────────────
 *
 * Ce module charge automatiquement le fichier .env correspondant à NODE_ENV :
 *   - .env.development  (par défaut)
 *   - .env.staging
 *   - .env.production
 *
 * Un fichier .env local (non commité) est toujours chargé en priorité
 * pour permettre les surcharges individuelles.
 *
 * Usage :
 *   const config = require('./config');
 *   console.log(config.db.host);     // → 'localhost' en dev
 *   console.log(config.env);         // → 'development'
 */

const path = require('path');
const fs = require('fs');

// ─── Détermination de l'environnement ─────────────────────────────────────────
const NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const VALID_ENVS = ['development', 'staging', 'production'];

if (!VALID_ENVS.includes(NODE_ENV)) {
  console.error(`[Config] ✗ NODE_ENV="${NODE_ENV}" invalide. Valeurs acceptées : ${VALID_ENVS.join(', ')}`);
  process.exit(1);
}

// ─── Chargement des fichiers .env ─────────────────────────────────────────────
// Ordre de priorité (le premier chargé gagne) :
//   1. .env           (surcharges locales, gitignored)
//   2. .env.{NODE_ENV} (valeurs par défaut de l'environnement, commité)

const dotenv = require('dotenv');

const envFile = path.join(__dirname, `.env.${NODE_ENV}`);
const localEnvFile = path.join(__dirname, '.env');

// Charger le fichier d'environnement spécifique d'abord
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

// Le .env local surcharge tout (chargé après car dotenv ne remplace pas les vars déjà définies)
// On force override pour que .env local ait la priorité
if (fs.existsSync(localEnvFile)) {
  dotenv.config({ path: localEnvFile, override: true });
}

// ─── Construction de l'objet config ───────────────────────────────────────────

const config = {
  // Environnement actif
  env: NODE_ENV,
  isDev: NODE_ENV === 'development',
  isStaging: NODE_ENV === 'staging',
  isProd: NODE_ENV === 'production',

  // ─── Base de données ──────────────────────────────────────────────────────
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'hr_attendance_db',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  },

  // ─── Serveur ──────────────────────────────────────────────────────────────
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    logLevel: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'warn' : NODE_ENV === 'staging' ? 'info' : 'debug'),
  },

  // ─── Sécurité ─────────────────────────────────────────────────────────────
  security: {
    jwtSecret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || '',
  },

  // ─── CORS ─────────────────────────────────────────────────────────────────
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  // ─── Backup ───────────────────────────────────────────────────────────────
  backup: {
    enabled: process.env.AUTO_BACKUP !== 'false',
    retention: parseInt(process.env.BACKUP_RETENTION || '30', 10),
  },

  // ─── Firebase ─────────────────────────────────────────────────────────────
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || null,
  },
};

// ─── Validations critiques ────────────────────────────────────────────────────

const errors = [];

if (config.isProd || config.isStaging) {
  // En staging/prod, les secrets doivent être définis
  if (!config.security.jwtSecret || config.security.jwtSecret === 'CHANGE_ME_IN_PRODUCTION') {
    errors.push('JWT_SECRET doit être défini avec une valeur forte en staging/production');
  }
  if (config.security.jwtSecret && config.security.jwtSecret.length < 32) {
    errors.push('JWT_SECRET trop court (min 32 caractères en staging/production)');
  }
  if (!config.security.superAdminPassword) {
    errors.push('SUPER_ADMIN_PASSWORD doit être défini en staging/production');
  }
  if (!config.db.password) {
    errors.push('DB_PASSWORD doit être défini en staging/production');
  }
  if (config.cors.allowedOrigins.includes('*')) {
    errors.push('ALLOWED_ORIGINS ne peut pas être "*" en staging/production');
  }
}

if (errors.length > 0) {
  console.error(`\n[Config] ✗ ERREURS DE CONFIGURATION (${NODE_ENV}) :`);
  errors.forEach((e) => console.error(`  → ${e}`));
  if (config.isProd) {
    console.error('[Config] ✗ Démarrage bloqué en production.\n');
    process.exit(1);
  } else {
    console.warn('[Config] ⚠ Démarrage autorisé en staging malgré les avertissements.\n');
  }
}

// ─── Log de démarrage ─────────────────────────────────────────────────────────

const envLabels = {
  development: '🟢 DEVELOPMENT',
  staging: '🟡 STAGING',
  production: '🔴 PRODUCTION',
};

console.log(`\n${'═'.repeat(60)}`);
console.log(`  Environnement : ${envLabels[NODE_ENV]}`);
console.log(`  Base de données : ${config.db.host}:${config.db.port}/${config.db.name}`);
console.log(`  SSL : ${config.db.ssl ? 'Activé' : 'Désactivé'}`);
console.log(`  Port serveur : ${config.server.port}`);
console.log(`  Log level : ${config.server.logLevel}`);
console.log(`  CORS : ${config.cors.allowedOrigins.join(', ')}`);
console.log(`  Backup auto : ${config.backup.enabled ? 'Activé' : 'Désactivé'}`);
console.log(`${'═'.repeat(60)}\n`);

module.exports = config;
