import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// PASTE YOUR CONFIG HERE (from Step 4)
const firebaseConfig = {
  apiKey: "AIzaSyAN0_o2RUWavYXiaVec6EF9O6e0ffw5nKI",
  authDomain: "mhp-internal-4297d.firebaseapp.com",
  projectId: "mhp-internal-4297d",
  storageBucket: "mhp-internal-4297d.firebasestorage.app",
  messagingSenderId: "811538355636",
  appId: "1:811538355636:web:80b670880738d0cd478ee1",
  measurementId: "G-4DGJNYS6VQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
// Ensure persistence is set to local
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Persistence error:", error);
});

export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
