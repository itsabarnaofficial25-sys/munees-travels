// ==========================================
// FIREBASE CONFIG — Munees Travels
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyC6upLbHjqCYKx_zDxt8qHr7PTa0lnIT6w",
  authDomain: "munees-travels.firebaseapp.com",
  projectId: "munees-travels",
  storageBucket: "munees-travels.firebasestorage.app",
  messagingSenderId: "438676531024",
  appId: "1:438676531024:web:7b17f5b769091378d22e55",
  measurementId: "G-EX2YWYWZJ0"
};

// Initialize
firebase.initializeApp(firebaseConfig);

// Global services
const db = firebase.firestore();
const auth = firebase.auth();

console.log("✅ Firebase initialized — Project:", firebaseConfig.projectId);