import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const getFirebase = () => {
const firebaseConfig = {
  apiKey: "AIzaSyBRFZYRzbEufzWwi9SPA3naeqcI_FrUA8A",
  authDomain: "electroactivity-333fb.firebaseapp.com",
  projectId: "electroactivity-333fb",
  storageBucket: "electroactivity-333fb.firebasestorage.app",
  messagingSenderId: "227902697216",
  appId: "1:227902697216:web:0dd6037271a98c61e64de5",
  measurementId: "G-Q7488DHT01"
};

  // Initialize Firebase safely
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  // Initialize Firestore
  const db = getFirestore(app);

  return { app, db };
};