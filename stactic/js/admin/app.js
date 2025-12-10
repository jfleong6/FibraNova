// 1. Importar las funciones necesarias desde el CDN de Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 2. Configuración de Firebase (¡REEMPLAZA ESTO CON TUS DATOS DE FIREBASE CONSOLE!)
const firebaseConfig = {
  apiKey: "AIzaSyAK_qCT6Gxyo8ynnJi_d45r1F83q6mrfEA",
  authDomain: "fibranova-16933.firebaseapp.com",
  projectId: "fibranova-16933",
  storageBucket: "fibranova-16933.firebasestorage.app",
  messagingSenderId: "169348759478",
  appId: "1:169348759478:web:52c6834f7f46bfa69e0b17",
  measurementId: "G-E3WWHSFJP4"
};

// 3. Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias al DOM
const formCliente = document.getElementById('form-cliente');
const tablaClientes = document.getElementById('tabla-clientes-body');

// ---------------------------------------------------------
// FUNCIONALIDAD: AGREGAR CLIENTE
// ---------------------------------------------------------
formCliente.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoCliente = {
        nombre: document.getElementById('nombre').value,
        direccion: document.getElementById('direccion').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        plan: document.getElementById('plan').value,
        coordenadas: document.getElementById('coordenadas').value,
        fecha_registro: serverTimestamp(), // Marca de tiempo del servidor
        activo: true // Por defecto activo
    };

    try {
        // Guardamos en la colección "clientes"
        await addDoc(collection(db, "clientes"), nuevoCliente);
        alert("Cliente registrado exitosamente");
        formCliente.reset(); // Limpiar formulario
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar el cliente");
    }
});

// ---------------------------------------------------------
// FUNCIONALIDAD: LEER CLIENTES (TIEMPO REAL)
// ---------------------------------------------------------
// Usamos onSnapshot para que si alguien agrega un cliente, aparezca solo sin recargar

const q = query(collection(db, "clientes"), orderBy("fecha_registro", "desc"));

onSnapshot(q, (snapshot) => {
    tablaClientes.innerHTML = ""; // Limpiamos la tabla antes de renderizar

    snapshot.forEach((doc) => {
        const cliente = doc.data();
        
        // Creamos la fila HTML
        const fila = `
            <tr>
                <td><strong>${cliente.nombre}</strong><br><small>${cliente.telefono}</small></td>
                <td>${cliente.direccion}</td>
                <td><span style="background:#e0f2fe; color:#0369a1; padding: 2px 6px; border-radius:4px;">${cliente.plan}</span></td>
                <td>${cliente.activo ? '🟢 Activo' : '🔴 Inactivo'}</td>
                <td>
                    <button onclick="console.log('Ver ID: ${doc.id}')" style="cursor:pointer">👁️</button>
                </td>
            </tr>
        `;
        
        tablaClientes.innerHTML += fila;
    });
});

// ==========================================
// MÓDULO DE INVENTARIO
// ==========================================

const formInventario = document.getElementById('form-inventario');
const tablaInventario = document.getElementById('tabla-inventario-body');

// 1. Guardar Producto
formInventario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const producto = {
        nombre: document.getElementById('inv-nombre').value,
        tipo: document.getElementById('inv-tipo').value,
        stock: parseInt(document.getElementById('inv-stock').value), // Importante: guardar como número
        minimo: parseInt(document.getElementById('inv-minimo').value) || 5,
        fecha_actualizacion: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "inventario"), producto);
        alert("Producto agregado al inventario");
        formInventario.reset();
    } catch (error) {
        console.error("Error inventario:", error);
        alert("Error al guardar producto");
    }
});

// 2. Leer Inventario en Tiempo Real
// Nota: 'inventario' es el nombre de la nueva colección en Firebase
const qInventario = query(collection(db, "inventario"), orderBy("nombre", "asc"));

onSnapshot(qInventario, (snapshot) => {
    tablaInventario.innerHTML = "";
    
    snapshot.forEach((doc) => {
        const item = doc.data();
        let estadoStock = '<span style="color:green">En Stock</span>';
        
        // Alerta visual si el stock es bajo
        if(item.stock <= item.minimo) {
            estadoStock = '<span style="color:red; font-weight:bold;">⚠️ Bajo Stock</span>';
        }
        if(item.stock === 0) {
            estadoStock = '<span style="background:red; color:white; padding:2px 5px; border-radius:4px;">AGOTADO</span>';
        }

        const fila = `
            <tr>
                <td><strong>${item.nombre}</strong></td>
                <td>${item.tipo.toUpperCase()}</td>
                <td style="font-size: 1.1em; font-weight: bold;">${item.stock}</td>
                <td>${estadoStock}</td>
            </tr>
        `;
        tablaInventario.innerHTML += fila;
    });
});

// ==========================================
// LOGICA DE NAVEGACIÓN (SPA)
// ==========================================

const btnClientes = document.getElementById('btn-view-clientes');
const btnInventario = document.getElementById('btn-view-inventario');
const viewClientes = document.getElementById('view-clientes');
const viewInventario = document.getElementById('view-inventario');
const pageTitle = document.getElementById('page-title');

// ==========================================
// LOGICA DE NAVEGACIÓN OPTIMIZADA (SCALABLE)
// ==========================================

// 1. Configuración: Aquí defines las vistas, sus títulos y si necesitan ejecutar algo al entrar
const configuracionVistas = {
    'clientes': {
        titulo: "Gestión de Clientes",
        accion: null // No necesita recargar nada especial al entrar
    },
    'inventario': {
        titulo: "Control de Inventario",
        accion: null
    },
    'tecnicos': {  // <--- NUEVO
        titulo: "Gestión de Cuadrillas Técnicas",
        accion: null
    },
    'ordenes': {
        titulo: "Programación de Servicios",
        accion: cargarSelectClientes // Ejecuta esta función al entrar para actualizar el select
    },
    'facturacion': { // Preparado para el futuro
        titulo: "Facturación y Cobros",
        accion: null
    }
};

function cambiarVista(vistaSeleccionada) {
    // Referencia al título de la página
    const pageTitle = document.getElementById('page-title');
    
    // Obtenemos todas las claves (nombres de las vistas) de nuestra configuración
    const vistas = Object.keys(configuracionVistas);

    // Iteramos sobre todas las vistas posibles
    vistas.forEach(vista => {
        // Asumimos que los IDs en HTML siguen el patrón: "view-nombre" y "btn-view-nombre"
        const divVista = document.getElementById(`view-${vista}`);
        const btnVista = document.getElementById(`btn-view-${vista}`);

        // Verificamos que los elementos existan (para evitar errores si aún no creamos el HTML de facturación)
        if (!divVista || !btnVista) return;

        if (vista === vistaSeleccionada) {
            // MOSTRAR: Si es la vista que queremos
            divVista.style.display = 'block';
            btnVista.classList.add('active');
            
            // Actualizar título usando la configuración
            pageTitle.innerText = configuracionVistas[vista].titulo;
            
            // Si la vista tiene una función específica (como cargar clientes), la ejecutamos
            if (configuracionVistas[vista].accion) {
                configuracionVistas[vista].accion();
            }
        } else {
            // OCULTAR: Todas las demás
            divVista.style.display = 'none';
            btnVista.classList.remove('active');
        }
    });
}

// 2. Event Listeners Automáticos
// Esto busca todos los botones que empiecen con "btn-view-" y les asigna el click
document.querySelectorAll('[id^="btn-view-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Extraemos el nombre de la vista del ID del botón (ej: "btn-view-clientes" -> "clientes")
        // "btn-view-".length es 9, así que cortamos desde el caracter 9
        const nombreVista = btn.id.substring(9); 
        cambiarVista(nombreVista);
    });
});

// Event Listeners
btnClientes.addEventListener('click', () => cambiarVista('clientes'));
btnInventario.addEventListener('click', () => cambiarVista('inventario'));

// ==========================================
// MÓDULO DE ÓRDENES DE SERVICIO (OS)
// ==========================================

const formOrdenes = document.getElementById('form-ordenes');
const selectClienteOS = document.getElementById('os-cliente');
const tablaOrdenes = document.getElementById('tabla-ordenes-body');

// 1. Función para llenar el Select de Clientes (Relación de datos)
// Esta función se llamará cada vez que mostremos la vista de Órdenes
async function cargarSelectClientes() {
    const q = query(collection(db, "clientes"), orderBy("nombre", "asc"));
    
    // Usamos getDocs en lugar de onSnapshot porque solo necesitamos cargar la lista una vez al abrir el formulario
    // (Nota: necesitas importar getDocs arriba si no lo has hecho, o usar onSnapshot si prefieres realtime aquí también)
    // Para simplificar y no cambiar tus imports, usaremos onSnapshot que ya tienes:
    
    onSnapshot(q, (snapshot) => {
        selectClienteOS.innerHTML = '<option value="">Seleccione un Cliente...</option>';
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Guardamos el ID del cliente en el value, y el nombre en el texto
            const option = document.createElement('option');
            option.value = doc.id; 
            option.textContent = data.nombre + " - " + data.direccion;
            // Guardamos datos extra en atributos data- para usarlos luego si queremos
            option.dataset.nombre = data.nombre; 
            selectClienteOS.appendChild(option);
        });
    });
}

// 2. Crear Orden de Servicio
formOrdenes.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener el nombre del cliente seleccionado para no tener que consultar la BD otra vez al mostrar la tabla
    const indiceSeleccionado = selectClienteOS.selectedIndex;
    const nombreCliente = selectClienteOS.options[indiceSeleccionado].dataset.nombre;

    const nuevaOrden = {
        cliente_id: selectClienteOS.value,
        cliente_nombre: nombreCliente, // Desnormalización: guardamos el nombre para leer rápido
        tipo: document.getElementById('os-tipo').value,
        fecha_programada: document.getElementById('os-fecha').value,
        tecnico: document.getElementById('os-tecnico').value,
        estado: document.getElementById('os-estado').value,
        materiales_usados: [], // Array vacío, lo llenaremos al finalizar
        fecha_creacion: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "ordenes_servicio"), nuevaOrden);
        alert("Orden creada correctamente");
        formOrdenes.reset();
    } catch (error) {
        console.error("Error OS:", error);
        alert("Error al crear la orden");
    }
});

// 3. Listar Órdenes (Dashboard de Actividades)
const qOrdenes = query(collection(db, "ordenes_servicio"), orderBy("fecha_programada", "asc"));

onSnapshot(qOrdenes, (snapshot) => {
    tablaOrdenes.innerHTML = "";

    snapshot.forEach((doc) => {
        const os = doc.data();
        
        // Colores para estados
        let colorEstado = "black";
        if(os.estado === 'pendiente') colorEstado = "#d97706"; // Naranja
        if(os.estado === 'en_progreso') colorEstado = "#2563eb"; // Azul
        if(os.estado === 'finalizada') colorEstado = "#059669"; // Verde

        const fila = `
            <tr>
                <td>${os.fecha_programada}</td>
                <td><strong>${os.cliente_nombre}</strong></td>
                <td>${os.tipo.toUpperCase()}</td>
                <td>${os.tecnico}</td>
                <td><span style="color:${colorEstado}; font-weight:bold; text-transform:capitalize;">${os.estado}</span></td>
                <td>
                    ${os.estado !== 'finalizada' ? 
                      `<button onclick="finalizarOrden('${doc.id}')" style="background:#059669; color:white; border:none; padding:5px; cursor:pointer;">✅ Finalizar</button>` 
                      : '🔒 Cerrada'}
                </td>
            </tr>
        `;
        tablaOrdenes.innerHTML += fila;
    });
});

// Función global para el botón finalizar (la definimos en window para que el HTML la vea)
window.finalizarOrden = function(id) {
    // Aquí es donde vincularemos el INVENTARIO en el siguiente paso
    alert("En el siguiente paso programaremos que al finalizar la orden ID: " + id + ", se descuenten los materiales.");
};

// ==========================================
// MÓDULO DE CUADRILLAS / TÉCNICOS
// ==========================================

const formTecnicos = document.getElementById('form-tecnicos');
const tablaTecnicos = document.getElementById('tabla-tecnicos-body');

// 1. Guardar Cuadrilla
formTecnicos.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevaCuadrilla = {
        nombre: document.getElementById('cuadrilla-nombre').value,
        lider: document.getElementById('cuadrilla-lider').value,
        auxiliares: document.getElementById('cuadrilla-auxiliares').value,
        placa: document.getElementById('cuadrilla-placa').value,
        estado: document.getElementById('cuadrilla-estado').value,
        fecha_registro: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "cuadrillas"), nuevaCuadrilla);
        alert("Cuadrilla registrada correctamente");
        formTecnicos.reset();
    } catch (error) {
        console.error("Error cuadrillas:", error);
        alert("Error al guardar cuadrilla");
    }
});

// 2. Listar Cuadrillas
const qCuadrillas = query(collection(db, "cuadrillas"), orderBy("nombre", "asc"));

onSnapshot(qCuadrillas, (snapshot) => {
    tablaTecnicos.innerHTML = "";
    
    snapshot.forEach((doc) => {
        const team = doc.data();
        const estadoIcon = team.estado === 'activo' ? '🟢' : '🔴';

        const fila = `
            <tr>
                <td><strong>${team.nombre}</strong></td>
                <td>${team.lider}</td>
                <td>${team.auxiliares || 'N/A'}</td>
                <td>${team.placa || '---'}</td>
                <td>${estadoIcon} ${team.estado.toUpperCase()}</td>
                <td>
                    <button onclick="eliminarCuadrilla('${doc.id}')" style="color:red; cursor:pointer; border:none; background:none;">🗑️</button>
                </td>
            </tr>
        `;
        tablaTecnicos.innerHTML += fila;
    });
});

// Función simple para eliminar (Opcional, pero útil si te equivocas)
// Importante: Para usar deleteDoc necesitas importarlo arriba en la primera línea del archivo
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"; 
// NOTA: Si no quieres cambiar los imports arriba, puedes ignorar esta función de borrar por ahora.

window.eliminarCuadrilla = async function(id) {
    if(confirm("¿Eliminar esta cuadrilla?")) {
        await deleteDoc(doc(db, "cuadrillas", id));
    }
};