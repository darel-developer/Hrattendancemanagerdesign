'use strict';

const jwt = require('jsonwebtoken');
const db  = require('../db');

const KNOWN_WEAK = ['CHANGE_ME_IN_PRODUCTION', 'secret', 'jwt_secret', 'changeme'];
const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s || KNOWN_WEAK.some(w => s.toLowerCase().includes(w)) || s.length < 32) {
    console.error('[FATAL] JWT_SECRET absent ou trop faible — démarrage bloqué en production');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    return s || 'CHANGE_ME_IN_PRODUCTION'; // dev seulement
  }
  return s;
};

/**
 * Vérifie le Bearer token JWT et injecte req.user.
 * Le superadmin utilise un JWT dédié (role: Admin, isSuperAdmin: true)
 * émis par POST /api/superadmin/verify.
 */
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET());
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée', expired: true });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }

  // Vérifier en temps réel si l'entreprise est bloquée (sauf superadmin)
  if (req.user.companyId && !req.user.isSuperAdmin) {
    try {
      const [rows] = await db.query(
        'SELECT is_blocked FROM companies WHERE id = ?',
        [req.user.companyId]
      );
      if (rows[0]?.is_blocked) {
        return res.status(403).json({
          error: 'Accès suspendu. Votre abonnement a expiré — contactez votre administrateur.',
          blocked: true,
        });
      }
    } catch {
      // Erreur DB non bloquante — on laisse passer
    }
  }

  next();
}

/**
 * Vérifie que l'utilisateur possède l'un des rôles autorisés.
 * Doit être utilisé après requireAuth.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès insuffisant pour cette opération' });
    }
    next();
  };
}

/**
 * Vérifie que le companyId demandé correspond à celui du token.
 * Protège contre l'escalade de privilèges horizontale (cross-tenant).
 * Doit être utilisé après requireAuth.
 */
function checkCompany(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

  // Le superadmin a accès à toutes les entreprises
  if (req.user.isSuperAdmin) return next();

  // Cherche companyId dans query, body ou params
  const requested =
    req.query.companyId ||
    req.body?.companyId ||
    req.params.companyId ||
    null;

  if (requested && requested !== req.user.companyId) {
    return res.status(403).json({ error: 'Accès refusé à cette entreprise' });
  }

  // Injecte automatiquement companyId depuis le token si absent
  if (!req.query.companyId && !req.body?.companyId) {
    req.query.companyId = req.user.companyId;
  }

  next();
}

module.exports = { requireAuth, requireRole, checkCompany };
