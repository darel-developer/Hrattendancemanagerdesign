import { useEffect } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '../../firebase';
import { authApi } from '../services/api';

export function useFcm(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    let unsubscribe: (() => void) | null = null;

    async function register() {
      try {
        console.log('[FCM] Demande de permission notifications...');
        const permission = await Notification.requestPermission();
        console.log('[FCM] Permission :', permission);
        if (permission !== 'granted') {
          console.warn('[FCM] Permission refusée — notifications désactivées');
          return;
        }

        console.log('[FCM] Enregistrement du service worker...');
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Service worker actif :', reg.scope);

        console.log('[FCM] Récupération du token FCM...');
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          console.log('[FCM] Token obtenu (fin) : ...', token.slice(-12));
          await authApi.registerFcmToken(token);
          console.log('[FCM] ✓ Token enregistré sur le serveur');
        } else {
          console.warn('[FCM] Aucun token obtenu — vérifier la VAPID key et le service worker');
        }

        unsubscribe = onMessage(messaging, (payload) => {
          console.log('[FCM] Message reçu (foreground) :', payload);
          const title = payload.notification?.title ?? 'HR Manager';
          const body = payload.notification?.body ?? '';
          new Notification(title, { body, icon: '/icon-192.png' });
        });

        console.log('[FCM] ✓ Setup complet — notifications actives');
      } catch (err) {
        console.error('[FCM] Erreur setup :', err);
      }
    }

    register();

    return () => { unsubscribe?.(); };
  }, [isAuthenticated]);
}
