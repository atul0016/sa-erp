/* eslint-disable no-restricted-globals */
// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            self.__FIREBASE_CONFIG__?.apiKey            || '',
  authDomain:        self.__FIREBASE_CONFIG__?.authDomain        || '',
  projectId:         self.__FIREBASE_CONFIG__?.projectId         || '',
  storageBucket:     self.__FIREBASE_CONFIG__?.storageBucket     || '',
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || '',
  appId:             self.__FIREBASE_CONFIG__?.appId             || '',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || 'SA ERP Notification';
  const notificationOptions = {
    body: body || 'You have a new update.',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.link || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
