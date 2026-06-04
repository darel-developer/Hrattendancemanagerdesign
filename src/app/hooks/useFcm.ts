import { useEffect, useState, useCallback } from 'react';
import { messaging, getToken, onMessage, VAPID_KEY } from '../../firebase';
import { authApi } from '../services/api';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const FCM_TOKEN_KEY = 'hr_fcm_token';

async function registerToken() {
  // Réutiliser le SW existant s'il est déjà enregistré (évite le 2ème rechargement
  // que Edge déclenche lors de l'installation d'un nouveau service worker)
  let reg: ServiceWorkerRegistration | undefined;
  try {
    reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
       ?? await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service worker prêt :', reg.scope);
  } catch (e) {
    console.error('[FCM] ❌ Service worker échec :', e);
    throw e;
  }

  let token: string | null = null;
  try {
    // Passer le SW registration explicitement évite que Firebase en installe un autre
    token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    console.log('[FCM] Token obtenu :', token ? `...${token.slice(-10)}` : 'VIDE');
  } catch (e) {
    console.error('[FCM] ❌ getToken() échec :', e);
    throw e;
  }

  if (!token) {
    console.warn('[FCM] ⚠ Token vide — VAPID key incorrecte ou SW non prêt');
    return;
  }

  // Stocker en localStorage pour éviter un appel API redondant si Edge recharge
  const stored = localStorage.getItem(FCM_TOKEN_KEY);
  if (stored === token) {
    console.log('[FCM] ✓ Token inchangé — pas besoin de re-enregistrer');
    return;
  }

  try {
    await authApi.registerFcmToken(token);
    localStorage.setItem(FCM_TOKEN_KEY, token);
    console.log('[FCM] ✓ Token enregistré sur le serveur');
  } catch (e) {
    console.error('[FCM] ❌ Enregistrement serveur échoué :', e);
  }
}

export function useFcm(isAuthenticated: boolean) {
  const [permission, setPermission] = useState<PermissionState>('unsupported');

  // Déterminer l'état initial de permission
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPermission(Notification.permission as PermissionState);
  }, [isAuthenticated]);

  // Si déjà accordée → enregistrer le token silencieusement
  useEffect(() => {
    if (permission !== 'granted') return;

    let unsubscribe: (() => void) | null = null;

    registerToken().catch(() => {});

    unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'HR Manager';
      const body = payload.notification?.body ?? '';
      const url = (payload.data as Record<string, string> | undefined)?.url || '/notifications';
      const notif = new Notification(title, { body, icon: '/icon-192.png' });
      notif.onclick = () => { window.focus(); window.location.href = url; };
    });

    return () => { unsubscribe?.(); };
  }, [permission]);

  // Appelé quand l'utilisateur clique sur "Activer" dans la bannière
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
    } catch {
      setPermission('denied');
    }
  }, []);

  return { permission, requestPermission };
}
