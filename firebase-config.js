import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGd3IIHMRFqni1RrVC6Q1M6VPAoExn8xI",
  authDomain: "telollevoapp-3bc4f.firebaseapp.com",
  projectId: "telollevoapp-3bc4f",
  storageBucket: "telollevoapp-3bc4f.firebasestorage.app",
  messagingSenderId: "536999253857",
  appId: "1:536999253857:web:5b23e6a871d193238ad720",
  measurementId: "G-VXK00WKKZM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inicializarDatosPrueba() {
    try {
        const clientesRef = collection(db, "clientes");
        const snapshotClientes = await getDocs(clientesRef);
        
        if (snapshotClientes.empty) {
            console.log("Cargando datos semilla v2...");
            const clientesPrueba = [
                { id_auto: "CLI-001", nombre: "Juan Pérez", activo: true },
                { id_auto: "CLI-002", nombre: "María Rodríguez", activo: true },
                { id_auto: "CLI-003", nombre: "Carlos Gómez", activo: true },
                { id_auto: "CLI-004", nombre: "Ana Martínez", activo: true },
                { id_auto: "CLI-005", nombre: "Luis Veras", activo: true }
            ];
            for (let c of clientesPrueba) await addDoc(clientesRef, c);

            const empleadosRef = collection(db, "empleados");
            const empleadosPrueba = [
                { id_auto: "EMP-001", nombre: "Pedro", apellido: "Almonte", telefono: "809-555-0101", cedula: "001-0000000-1", activo: true },
                { id_auto: "EMP-002", nombre: "José", apellido: "Castillo", telefono: "809-555-0102", cedula: "001-0000000-2", activo: true },
                { id_auto: "EMP-003", nombre: "Manuel", apellido: "Ruiz", telefono: "809-555-0103", cedula: "001-0000000-3", activo: true },
                { id_auto: "EMP-004", nombre: "Yamilka", apellido: "Reyes", telefono: "829-555-0104", cedula: "001-0000000-4", activo: true },
                { id_auto: "EMP-005", nombre: "Cristian", apellido: "Soto", telefono: "849-555-0105", cedula: "001-0000000-5", activo: true }
            ];
            for (let e of empleadosPrueba) await addDoc(empleadosRef, e);
            console.log("¡Datos semilla cargados con éxito!");
        }
    } catch (e) {
        console.error(e);
    }
}
inicializarDatosPrueba();

export { db, collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp };
