/**
 * SA ERP - Firebase Push Notifications Service
 * Handles FCM token registration & in-app notification display
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

/**
 * Initialize Firebase app + messaging (call once at startup)
 */
export function initFirebase(): boolean {
  if (!isFirebaseConfigured()) return false;
  try {
    app = initializeApp(FIREBASE_CONFIG);
    // Messaging requires service worker — only available in secure contexts
    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
    return true;
  } catch (err) {
    console.warn('[Firebase] Init failed:', err);
    return false;
  }
}

/**
 * Request notification permission & get FCM token
 * Returns token string or null if denied/failed
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging || !VAPID_KEY) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (err) {
    console.warn('[Firebase] Token request failed:', err);
    return null;
  }
}

/**
 * Listen for foreground push messages
 * Returns an unsubscribe function
 */
export function onForegroundMessage(
  callback: (payload: { title: string; body: string; data?: Record<string, string> }) => void
): (() => void) | null {
  if (!messaging) return null;
  const unsub = onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title || 'SA ERP',
      body: payload.notification?.body || '',
      data: payload.data,
    });
  });
  return unsub;
}
