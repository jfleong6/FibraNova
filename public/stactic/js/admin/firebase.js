import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocs, where } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Tu Configuración
const firebaseConfig = {
  apiKey: "AIzaSyAK_qCT6Gxyo8ynnJi_d45r1F83q6mrfEA",
  authDomain: "fibranova-16933.firebaseapp.com",
  projectId: "fibranova-16933",
  storageBucket: "fibranova-16933.firebasestorage.app",
  messagingSenderId: "169348759478",
  appId: "1:169348759478:web:52c6834f7f46bfa69e0b17",
  measurementId: "G-E3WWHSFJP4"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportamos todo lo que usaran los otros archivos
// export { db, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocs };
export { db, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocs, where };