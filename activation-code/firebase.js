import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpdFwqLRkXO-2GAlGvcwAgjrluLkJRry8",
    authDomain: "elmostshar-26ffb.firebaseapp.com",
    projectId: "elmostshar-26ffb",
    storageBucket: "elmostshar-26ffb.firebasestorage.app",
    messagingSenderId: "837671325154",
    appId: "1:837671325154:web:f9fd10adf2f63ac7a93dbb"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
