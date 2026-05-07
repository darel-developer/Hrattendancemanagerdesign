const express = require('express');
const router = express.Router();

router.post('/verify', (req, res) => {
  const { password } = req.body;
  const expected = process.env.SUPER_ADMIN_PASSWORD || 'superadmin2024';
  if (password === expected) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Mot de passe incorrect' });
  }
});

module.exports = router;
