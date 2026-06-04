importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAYE_pVDHILy_gpGsjs-TAhz5ZNmGIp7XY',
  authDomain: 'hr-attendance-99ccb.firebaseapp.com',
  projectId: 'hr-attendance-99ccb',
  storageBucket: 'hr-attendance-99ccb.firebasestorage.app',
  messagingSenderId: '70651906124',
  appId: '1:70651906124:web:348541f10c3ad000c54ce9',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = 'HR Manager', body = '' } = payload.notification ?? {};
  const url = payload.data?.url || '/notifications';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
