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

async function sendPush(employeeId, title, body) {
  if (!messaging || !employeeId) return;
  try {
    const [rows] = await db.query(
      'SELECT token, platform FROM push_tokens WHERE employee_id = ?',
      [employeeId]
    );
    if (!rows.length) {
      console.log(`[FCM] sendPush → aucun token enregistré pour employé ${employeeId}`);
      return;
    }

    console.log(`[FCM] sendPush → ${rows.length} appareil(s) pour ${employeeId} | "${title}"`);

    const sends = rows.map(({ token, platform }) => {
      const msg = {
        token,
        notification: { title, body },
        ...(platform === 'web' ? {
          webpush: {
            notification: { icon: '/icon-192.png', badge: '/icon-192.png', requireInteraction: false },
            fcmOptions: { link: '/' },
          },
        } : {
          android: { notification: { icon: 'ic_notification', color: '#6366F1' } },
        }),
      };
      return messaging.send(msg)
        .then((msgId) => {
          console.log(`[FCM] ✓ Push envoyé (${platform}) → messageId: ${msgId}`);
        })
        .catch(async (err) => {
          console.error(`[FCM] ✗ Échec push (${platform}) pour ${employeeId} :`, err.code || err.message);
          if (err.code === 'messaging/registration-token-not-registered' ||
              err.code === 'messaging/invalid-registration-token') {
            console.log(`[FCM] Token invalide supprimé pour ${employeeId} (${platform})`);
            await db.query('DELETE FROM push_tokens WHERE token = ?', [token]).catch(() => {});
          }
        });
    });

    await Promise.allSettled(sends);
  } catch (err) {
    console.error('[FCM] sendPush erreur inattendue :', err.message);
  }
}

module.exports = { initFCM, sendPush };
