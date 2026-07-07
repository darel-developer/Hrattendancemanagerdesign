'use strict';

const config = require('./config');

// ─── Headers de sécurité HTTP ─────────────────────────────────────────────────
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  // Pas de HSTS ici car l'app tourne en HTTP local — à activer en production HTTPS
  if (config.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Empêcher la mise en cache des réponses API sensibles
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
}

// ─── Rate limiter en mémoire (sans dépendance externe) ───────────────────────
//
// Utilise un Map { ip → { count, resetAt } }
// Nettoyage automatique des entrées expirées toutes les 5 minutes
class RateLimiter {
  constructor({ windowMs, max, message }) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message || 'Trop de requêtes, réessayez plus tard.';
    this.store = new Map();

    // Nettoyage périodique pour éviter les fuites mémoire
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of this.store) {
        if (now > val.resetAt) this.store.delete(key);
      }
    }, 5 * 60 * 1000).unref();
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const entry = this.store.get(key);

      if (!entry || now > entry.resetAt) {
        this.store.set(key, { count: 1, resetAt: now + this.windowMs });
        return next();
      }

      entry.count += 1;
      if (entry.count > this.max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({ error: this.message });
      }
      next();
    };
  }
}

// ─── Multiplicateur de limites selon l'environnement ──────────────────────────
// Dev : x5 (très permissif pour tester sans être bloqué)
// Staging : x2 (modéré, proche de la prod)
// Prod : x1 (strict, valeurs de base)
const rateLimitMultiplier = config.isDev ? 5 : config.isStaging ? 2 : 1;

// ─── Limiteurs préconfigurés ──────────────────────────────────────────────────

// Login : 10 tentatives / 15 min par IP (x multiplicateur)
const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10 * rateLimitMultiplier,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
}).middleware();

// Kiosque : 30 req / 10 min par IP (les tentatives PIN sont déjà limitées par employé)
const kioskLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30 * rateLimitMultiplier,
  message: 'Trop de requêtes kiosque. Réessayez dans quelques minutes.',
}).middleware();

// Super admin : 5 tentatives / 30 min par IP
const superadminLimiter = new RateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5 * rateLimitMultiplier,
  message: 'Trop de tentatives super-admin. Réessayez dans 30 minutes.',
}).middleware();

// API générale : 200 req / min par IP (contre les abus de scraping)
const generalLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 200 * rateLimitMultiplier,
  message: 'Trop de requêtes. Réessayez dans une minute.',
}).middleware();

module.exports = { securityHeaders, authLimiter, kioskLimiter, superadminLimiter, generalLimiter };

