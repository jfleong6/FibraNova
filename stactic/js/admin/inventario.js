import { db, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from './firebase.js';

const formInventario = document.getElementById('form-inventario');
const tablaInventario = document.getElementById('tabla-inventario-body');

export function initInventario() {
    if(!formInventario) return;

    // AGREGAR
    formInventario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const producto = {
            nombre: document.getElementById('inv-nombre').value,
            tipo: document.getElementById('inv-tipo').value,
            stock: parseInt(document.getElementById('inv-stock').value),
            minimo: parseInt(document.getElementById('inv-minimo').value) || 5,
            fecha_actualizacion: serverTimestamp()
        };
        try {
            await addDoc(collection(db, "inventario"), producto);
            alert("Producto guardado");
            formInventario.reset();
        } catch (error) {
            console.error("Error:", error);
        }
    });

    // LISTAR
    const q = query(collection(db, "inventario"), orderBy("nombre", "asc"));
    onSnapshot(q, (snapshot) => {
        tablaInventario.innerHTML = "";
        snapshot.forEach((doc) => {
            const item = doc.data();
            let estado = '<span style="color:green">En Stock</span>';
            if(item.stock <= item.minimo) estado = '<span style="color:red; font-weight:bold;">⚠️ Bajo Stock</span>';
            if(item.stock === 0) estado = '<span style="background:red; color:white;">AGOTADO</span>';

            tablaInventario.innerHTML += `
                <tr>
                    <td><strong>${item.nombre}</strong></td>
                    <td>${item.tipo.toUpperCase()}</td>
                    <td>${item.stock}</td>
                    <td>${estado}</td>
                </tr>`;
        });
    });
}