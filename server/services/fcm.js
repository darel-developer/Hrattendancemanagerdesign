'use strict';

const admin = require('firebase-admin');
const db = require('../db');

let messaging = null;

function initFCM() {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require('../firebase-service-account.json');
    }
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    messaging = admin.messaging();
    console.log('[FCM] Firebase Admin initialisé');
  } catch (err) {
    console.warn('[FCM] Initialisation ignorée :', err.message);
  }
}

const TYPE_LINKS = {
  absence:  '/attendance',
  retard:   '/attendance',
  conge:    '/leaves',
  document: '/documents',
  system:   '/notifications',
};

function typeToLink(type) {
  return TYPE_LINKS[type] || '/notifications';
}

async function sendPush(employeeId, title, body, link = '/notifications') {
  if (!messaging || !employeeId) return;
  try {
    const [rows] = await db.query(
      'SELECT token, platform FROM push_tokens WHERE employee_id = ?',
      [employeeId]
    );
    if (!rows.length) {
      console.log(`[FCM] ⚠ Pas de token — destinataire: ${employeeId}`);
      return;
    }

    const tokenSummary = rows.map(r => `${r.platform}:...${r.token.slice(-8)}`).join(', ');
    console.log(`[FCM] ▶ Envoi — destinataire: ${employeeId} | appareils: [${tokenSummary}] | titre: "${title}"`);

    const sends = rows.map(({ token, platform }) => {
      const msg = {
        token,
        notification: { title, body },
        ...(platform === 'web' ? {
          webpush: {
            notification: { icon: '/icon-192.png', badge: '/icon-192.png', requireInteraction: false },
            data: { url: link },
            fcmOptions: { link },
          },
        } : {
          android: {
            notification: { icon: 'ic_notification', color: '#6366F1', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
            data: { url: link },
          },
        }),
      };
      return messaging.send(msg)
        .then((msgId) => {
          console.log(`[FCM] ✓ Livré — destinataire: ${employeeId} | platform: ${platform} | token: ...${token.slice(-8)} | msgId: ${msgId.split('/').pop()}`);
        })
        .catch(async (err) => {
          console.error(`[FCM] ✗ Échec — destinataire: ${employeeId} | platform: ${platform} | token: ...${token.slice(-8)} | erreur: ${err.code || err.message}`);
          if (err.code === 'messaging/registration-token-not-registered' ||
              err.code === 'messaging/invalid-registration-token') {
            console.log(`[FCM] 🗑 Token expiré supprimé — ${employeeId} (${platform}) ...${token.slice(-8)}`);
            await db.query('DELETE FROM push_tokens WHERE token = ?', [token]).catch(() => {});
          }
        });
    });

    await Promise.allSettled(sends);
  } catch (err) {
    console.error('[FCM] sendPush erreur inattendue :', err.message);
  }
}

module.exports = { initFCM, sendPush, typeToLink };
