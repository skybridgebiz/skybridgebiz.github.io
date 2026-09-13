// Firebase project: aiservice-cb4a7
// This file is loaded directly by the browser (GitHub Pages has no server), so only the public
// web config goes here — never a service-account key or admin secret.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjvcXz7bBsQIou4Y8Du7mg8MGecVZgSdA",
  authDomain: "aiservice-cb4a7.firebaseapp.com",
  projectId: "aiservice-cb4a7",
  storageBucket: "aiservice-cb4a7.firebasestorage.app",
  messagingSenderId: "636018433520",
  appId: "1:636018433520:web:34ba25521a6e1d9b8b1135",
  measurementId: "G-GL700QQGK3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
