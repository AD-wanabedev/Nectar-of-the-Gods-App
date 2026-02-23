import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAN0_o2RUWavYXiaVec6EF9O6e0ffw5nKI",
  authDomain: "mhp-internal-4297d.firebaseapp.com",
  projectId: "mhp-internal-4297d",
  storageBucket: "mhp-internal-4297d.firebasestorage.app",
  messagingSenderId: "811538355636",
  appId: "1:811538355636:web:80b670880738d0cd478ee1",
  measurementId: "G-4DGJNYS6VQ"
};

const app = initializeApp(firebaseConfig);

// Modern offline persistence API (replaces deprecated enableIndexedDbPersistence)
// persistentMultipleTabManager allows offline across tabs without errors
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
