import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyB1-OPN7md7pwM4q2YBCxM9hHVEvr3NUWg",
  authDomain: "movie-reporter.firebaseapp.com",
  projectId: "movie-reporter",
  storageBucket: "movie-reporter.firebasestorage.app",
  messagingSenderId: "531723763328",
  appId: "1:531723763328:web:75b34bb4e4c9411778f065",
  measurementId: "G-Z2JF0SXPG7",
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
