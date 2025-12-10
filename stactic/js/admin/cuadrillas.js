import { db, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from './firebase.js';

// Referencias DOM
const formCuadrilla = document.getElementById('form-crear-cuadrilla');
const listaCuadrillasSimple = document.getElementById('lista-cuadrillas-simple'); // La lista pequeña
const formTecnico = document.getElementById('form-agregar-tecnico');
const selectCuadrilla = document.getElementById('tec-cuadrilla'); // El dropdown
const tablaTecnicos = document.getElementById('tabla-tecnicos-detallada');

export function initCuadrillas() {
    if(!formCuadrilla) return;

    // ===========================================
    // PARTE 1: GESTIÓN DE CUADRILLAS (MÓVILES)
    // ===========================================

    // 1.A Guardar Nueva Cuadrilla
    formCuadrilla.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevaCuadrilla = {
            nombre: document.getElementById('team-nombre').value,
            placa: document.getElementById('team-placa').value,
            fecha_creacion: serverTimestamp(),
            estado:"activo"
        };
        try {
            await addDoc(collection(db, "cuadrillas"), nuevaCuadrilla);
            alert("Cuadrilla creada. Ahora puedes asignarle técnicos.");
            formCuadrilla.reset();
        } catch (error) {
            console.error("Error cuadrilla:", error);
        }
    });

    // 1.B Listar Cuadrillas (Llena la lista pequeña y el Select del formulario de técnicos)
    const qCuadrillas = query(collection(db, "cuadrillas"), orderBy("nombre", "asc"));
    
    onSnapshot(qCuadrillas, (snapshot) => {
        // Limpiamos
        listaCuadrillasSimple.innerHTML = "";
        selectCuadrilla.innerHTML = '<option value="">Seleccione Cuadrilla...</option>';

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // 1. Llenar lista visual pequeña
            const li = document.createElement('li');
            li.textContent = `${data.nombre} (${data.placa || 'Sin placa'})`;
            listaCuadrillasSimple.appendChild(li);

            // 2. Llenar el Select para registrar técnicos
            const option = document.createElement('option');
            option.value = doc.id; // Guardamos el ID de Firebase de la cuadrilla
            option.textContent = data.nombre;
            // Guardamos el nombre en un atributo data para no consultarlo después
            option.dataset.nombreCuadrilla = data.nombre; 
            selectCuadrilla.appendChild(option);
        });
    });

    // ===========================================
    // PARTE 2: GESTIÓN DE TÉCNICOS (PERSONAL)
    // ===========================================

    // 2.A Guardar Técnico
    formTecnico.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener nombre de la cuadrilla seleccionada del select
        const idx = selectCuadrilla.selectedIndex;
        if(idx === 0) return alert("Debes seleccionar una cuadrilla");
        const nombreCuadrilla = selectCuadrilla.options[idx].dataset.nombreCuadrilla;

        const nuevoTecnico = {
            cuadrilla_id: selectCuadrilla.value, // ID de vinculación
            cuadrilla_nombre: nombreCuadrilla,   // Nombre para mostrar fácil
            rol: document.getElementById('tec-rol').value,
            nombre: document.getElementById('tec-nombre').value,
            documento: document.getElementById('tec-documento').value,
            telefono: document.getElementById('tec-telefono').value,
            email: document.getElementById('tec-email').value,
            contrato: document.getElementById('tec-contrato').value,
            fecha_ingreso: serverTimestamp()
        };

        try {
            // Guardamos en colección "tecnicos"
            await addDoc(collection(db, "tecnicos"), nuevoTecnico);
            alert("Técnico registrado correctamente");
            formTecnico.reset();
        } catch (error) {
            console.error("Error tecnico:", error);
            alert("Error al guardar técnico");
        }
    });

    // 2.B Listar Técnicos en la tabla grande
    const qTecnicos = query(collection(db, "tecnicos"), orderBy("nombre", "asc"));

    onSnapshot(qTecnicos, (snapshot) => {
        tablaTecnicos.innerHTML = "";
        
        snapshot.forEach((doc) => {
            const tec = doc.data();
            
            // Estilo para el rol
            let badgeRol = 'bg-gray-200';
            if(tec.rol === 'lider') badgeRol = 'background:#dbeafe; color:#1e40af; font-weight:bold; padding:2px 5px; border-radius:4px;';
            else badgeRol = 'background:#f3f4f6; color:#374151; padding:2px 5px; border-radius:4px;';

            const fila = `
                <tr>
                    <td><strong>${tec.nombre}</strong></td>
                    <td><span style="${badgeRol}">${tec.rol.toUpperCase()}</span></td>
                    <td>🚗 ${tec.cuadrilla_nombre}</td>
                    <td>
                        📞 ${tec.telefono}<br>
                        📧 <small>${tec.email}</small>
                    </td>
                    <td>
                        Doc: ${tec.documento}<br>
                        <small>Cto: ${tec.contrato}</small>
                    </td>
                    <td>
                        <button onclick="window.eliminarTecnico('${doc.id}')" style="color:red; border:none; background:none; cursor:pointer;" title="Eliminar">🗑️</button>
                    </td>
                </tr>
            `;
            tablaTecnicos.innerHTML += fila;
        });
    });
}

// Función Global para borrar técnico
window.eliminarTecnico = async function(id) {
    if(confirm("¿Estás seguro de eliminar a este técnico del sistema?")) {
        try {
            await deleteDoc(doc(db, "tecnicos", id));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    }
};