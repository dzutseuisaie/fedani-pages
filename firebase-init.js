import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdFXbo8ItPRToHiQYlpLRrs7P5YVHPkWE",
  authDomain: "fedani-66710.firebaseapp.com",
  projectId: "fedani-66710",
  storageBucket: "fedani-66710.firebasestorage.app",
  messagingSenderId: "840040844289",
  appId: "1:840040844289:web:79e46d2592a5df65e74400"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const CLOUDINARY = {
  cloudName: "pduc9l0x",
  uploadPreset: "fedani_services"
};
