import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD54vODX9mp_ic2Ou3HSqoyyorNK6md_VY",
  authDomain: "asrama-1cf5b.firebaseapp.com",
  projectId: "asrama-1cf5b",
  storageBucket: "asrama-1cf5b.firebasestorage.app",
  messagingSenderId: "104789374104",
  appId: "1:104789374104:web:06fdff5d37cbdf81864ced",
  measurementId: "G-L4FQKE2YCD",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Prioritaskan IndexedDB untuk persistensi session (lebih reliable lintas browser).
// Fallback ke localStorage kalau IndexedDB tidak tersedia (mis. mode privat).
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Auth persistence setup failed:", err);
    });
  });
}

export const analytics =
  typeof window !== "undefined" ? isSupported().then((yes) => (yes ? getAnalytics(app) : null)) : Promise.resolve(null);

export default app;
