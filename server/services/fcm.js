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
    if (!rows.length) return;

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
      return messaging.send(msg).catch(async (err) => {
        if (err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token') {
          await db.query(
            'DELETE FROM push_tokens WHERE token = ?', [token]
          ).catch(() => {});
        }
      });
    });

    await Promise.allSettled(sends);
  } catch {
    // Non-blocking — push est best-effort
  }
}

module.exports = { initFCM, sendPush };
