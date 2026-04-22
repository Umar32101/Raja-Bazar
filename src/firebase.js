import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBHZwiXF1sCqIQ7GXNXn5cU0cGkhXUZLgA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "raja-bazar-68887.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "raja-bazar-68887",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "raja-bazar-68887.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "438106129150",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:438106129150:web:1570f8e375cd1e88325baf"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP || "923104408000"
