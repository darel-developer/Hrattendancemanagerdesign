'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';

/**
 * Vérifie le Bearer token JWT et injecte req.user.
 * Retourne 401 si absent ou invalide, 401 {expired:true} si expiré.
 */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET());
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée', expired: true });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
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
