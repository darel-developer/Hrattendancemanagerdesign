import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAYE_pVDHILy_gpGsjs-TAhz5ZNmGIp7XY',
  authDomain: 'hr-attendance-99ccb.firebaseapp.com',
  projectId: 'hr-attendance-99ccb',
  storageBucket: 'hr-attendance-99ccb.firebasestorage.app',
  messagingSenderId: '70651906124',
  appId: '1:70651906124:web:348541f10c3ad000c54ce9',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const messaging = getMessaging(firebaseApp);
export { getToken, onMessage };
export const VAPID_KEY = 'KRfzYamSffAgK58a_ULeoJrs9jlixHb721dpHmY7sXs';
