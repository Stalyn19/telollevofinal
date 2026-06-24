import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// 1. AGREGA ESTA IMPORTACIÓN PARA EL MENSAJE DE ERROR
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyDGd3IIHMRFqni1RrVC6Q1M6VPAoExn8xI",
  authDomain: "telollevoapp-3bc4f.firebaseapp.com",
  projectId: "telollevoapp-3bc4f",
  storageBucket: "telollevoapp-3bc4f.firebasestorage.app",
  messagingSenderId: "536999253857",
  appId: "1:536999253857:web:5b23e6a871d193238ad720",
  measurementId: "G-VXK00WKKZM"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. INICIALIZA EL SERVICIO DE AUTENTICACIÓN
const auth = getAuth(app);

// 3. ASEGÚRATE DE INCLUIR 'auth' Y 'onAuthStateChanged' EN EL EXPORT GENERAL
export { db, auth, onAuthStateChanged, collection, addDoc, getDocs, updateDoc, doc, query, where };