import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8cf58n6T5WFLwCN0lZ0HDdhxSMgdIPsI",
  authDomain: "india-next.firebaseapp.com",
  projectId: "india-next",
  storageBucket: "india-next.firebasestorage.app",
  messagingSenderId: "518956783718",
  appId: "1:518956783718:web:8708d428632bdb388c75a7",
  measurementId: "G-1FMYD5XY3T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only if supported, i.e., in the browser)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { app, analytics, auth, db, googleProvider };
