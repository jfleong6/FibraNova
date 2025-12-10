import { db, collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp, getDocs } from './firebase.js';
import { renderizarEventosEnCalendario } from './calendario.js'; // Importamos la UI

// Referencias DOM
const formOrdenes = document.getElementById('form-ordenes');
const selectCliente = document.getElementById('os-cliente');
const inputDireccion = document.getElementById('os-direccion');
const selectCuadrilla = document.getElementById('os-cuadrilla');

let listaOrdenesCache = []; // Guardamos localmente para validar rápido

// ======================================================
// 1. INICIALIZAR Y EXPORTAR FUNCIONES
// ======================================================

export function initOrdenes() {
    cargarDatosOrdenes(); // Carga inicial de selects
    escucharOrdenesRealTime(); // Inicia el listener del calendario
    
    if(formOrdenes) {
        formOrdenes.addEventListener('submit', guardarOrden);
    }
}

// Esta es la función que faltaba exportar para main.js
export function cargarDatosOrdenes() {
    // 1. Cargar Clientes
    const qC = query(collection(db, "clientes"), orderBy("nombre"));
    onSnapshot(qC, (snap) => {
        selectCliente.innerHTML = '<option value="">Seleccione...</option>';
        snap.forEach(d => {
            const data = d.data();
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = data.nombre;
            // Datos ocultos para autocompletar
            opt.dataset.nombre = data.nombre;
            opt.dataset.direccion = data.direccion;
            selectCliente.appendChild(opt);
        });
    });
    
    // Evento para autocompletar dirección
    selectCliente.addEventListener('change', () => {
        if(selectCliente.selectedIndex > 0) {
            inputDireccion.value = selectCliente.options[selectCliente.selectedIndex].dataset.direccion || '';
        } else {
            inputDireccion.value = '';
        }
    });

    // 2. Cargar Cuadrillas (Llama a la función compleja)
    cargarCuadrillasSelect();
}

// ======================================================
// 2. ESCUCHAR CAMBIOS EN BD (Backend -> Frontend)
// ======================================================
function escucharOrdenesRealTime() {
    const q = query(collection(db, "ordenes_servicio"), orderBy("fecha_programada", "asc"));
    
    onSnapshot(q, (snapshot) => {
        listaOrdenesCache = [];
        snapshot.forEach(doc => {
            listaOrdenesCache.push({ id: doc.id, ...doc.data() });
        });
        
        // Cuando llegan datos, pintamos el calendario
        renderizarEventosEnCalendario(listaOrdenesCache);
    });
}

// ======================================================
// 3. LOGICA DE CARGA DE CUADRILLAS (COMPLEJA)
// ======================================================
function cargarCuadrillasSelect() {
    const q = query(collection(db, "cuadrillas"), orderBy("nombre"));
    const selectFiltro = document.getElementById('cal-filtro-cuadrilla'); // El filtro del calendario
    
    onSnapshot(q, (snap) => {
        // Limpiamos select del formulario
        selectCuadrilla.innerHTML = '<option value="">Seleccione...</option>';
        
        // Limpiamos y reiniciamos el filtro del calendario
        if(selectFiltro) {
            selectFiltro.innerHTML = '<option value="todos">Ver Todas las Cuadrillas</option>';
        }
        
        snap.forEach(async (d) => {
            const data = d.data();
            
            if(data.estado === 'activo') {
                // --- A. LLENAR SELECT DEL FORMULARIO (Con búsqueda de Líder) ---
                const optForm = document.createElement('option');
                optForm.value = d.id;
                optForm.dataset.nombre = data.nombre;
                optForm.textContent = `${data.nombre} (Cargando líder...)`;
                selectCuadrilla.appendChild(optForm);

                // Buscamos al líder en la colección 'tecnicos'
                const qLider = query(
                    collection(db, "tecnicos"), 
                    where("cuadrilla_id", "==", d.id),
                    where("rol", "==", "lider")
                );

                try {
                    const snapLider = await getDocs(qLider);
                    if(!snapLider.empty) {
                        const lider = snapLider.docs[0].data();
                        optForm.textContent = `${data.nombre} - (Líder: ${lider.nombre})`;
                    } else {
                        optForm.textContent = `${data.nombre} - (Sin Líder)`;
                    }
                } catch (e) {
                    console.error(e);
                    optForm.textContent = data.nombre;
                }
                
                // --- B. LLENAR SELECT DEL FILTRO (CALENDARIO) ---
                // Para el filtro no necesitamos el nombre del líder, solo el nombre del móvil
                if(selectFiltro) {
                    const optFiltro = document.createElement('option');
                    optFiltro.value = d.id;
                    optFiltro.textContent = data.nombre;
                    selectFiltro.appendChild(optFiltro);
                }
            }
        });
    });
}

// ======================================================
// 4. GUARDAR ORDEN CON VALIDACIÓN
// ======================================================
async function guardarOrden(e) {
    e.preventDefault();
    
    const fecha = document.getElementById('os-fecha').value;
    const hora = document.getElementById('os-hora').value;
    const cuadrillaId = selectCuadrilla.value;

    // VALIDACIÓN DE CRUCE DE HORARIOS
    const ocupado = listaOrdenesCache.find(o => 
        o.fecha_programada === fecha && 
        o.hora_inicio === hora && 
        o.cuadrilla_id === cuadrillaId &&
        o.estado !== 'finalizada'
    );

    if (ocupado) {
        alert("⚠️ CRUCE DETECTADO: Esta cuadrilla ya tiene una orden a esa hora.");
        return;
    }

    // Validación de selects vacíos
    if(selectCliente.selectedIndex === 0 || selectCuadrilla.selectedIndex === 0) {
        alert("Por favor selecciona Cliente y Cuadrilla");
        return;
    }

    // Objeto a guardar
    const nuevaOrden = {
        cliente_id: selectCliente.value,
        cliente_nombre: selectCliente.options[selectCliente.selectedIndex].dataset.nombre,
        direccion_instalacion: inputDireccion.value,
        
        cuadrilla_id: selectCuadrilla.value,
        cuadrilla_nombre: selectCuadrilla.options[selectCuadrilla.selectedIndex].dataset.nombre,
        
        tipo: document.getElementById('os-tipo').value,
        fecha_programada: fecha, 
        hora_inicio: hora,       
        duracion_estimada: 2,    
        
        estado: 'programada',
        fecha_creacion: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "ordenes_servicio"), nuevaOrden);
        alert("Orden programada correctamente.");
        window.toggleFormulario(); // Cerrar form usando la global
        formOrdenes.reset();
    } catch (error) {
        console.error("Error:", error);
        alert("Error al guardar");
    }
}

// Global para abrir/cerrar form (para que funcione desde el HTML onclick)
window.toggleFormulario = function() {
    const panel = document.getElementById('panel-formulario-orden');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};