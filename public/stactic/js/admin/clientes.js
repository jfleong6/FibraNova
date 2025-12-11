import { db, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from './firebase.js';

const formCliente = document.getElementById('form-cliente');
const tablaClientes = document.getElementById('tabla-clientes-body');

// Función de inicialización (se ejecuta al cargar)
export function initClientes() {
    if(!formCliente) return; // Protección por si no carga el HTML

    // AGREGAR
    formCliente.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevoCliente = {
            nombre: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            plan: document.getElementById('plan').value,
            coordenadas: document.getElementById('coordenadas').value,
            fecha_registro: serverTimestamp(),
            activo: true
        };

        try {
            await addDoc(collection(db, "clientes"), nuevoCliente);
            alert("Cliente registrado");
            formCliente.reset();
        } catch (error) {
            console.error("Error:", error);
            alert("Error al guardar");
        }
    });

    // LISTAR
    const q = query(collection(db, "clientes"), orderBy("fecha_registro", "desc"));
    onSnapshot(q, (snapshot) => {
        tablaClientes.innerHTML = "";
        snapshot.forEach((doc) => {
            const cliente = doc.data();
            const fila = `
                <tr>
                    <td><strong>${cliente.nombre}</strong><br><small>${cliente.telefono}</small></td>
                    <td>${cliente.direccion}</td>
                    <td><span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px;">${cliente.plan}</span></td>
                    <td>${cliente.activo ? '🟢' : '🔴'}</td>
                </tr>
            `;
            tablaClientes.innerHTML += fila;
        });
    });
}