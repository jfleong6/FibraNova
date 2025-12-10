// Referencias DOM
const calendarHeader = document.getElementById('calendar-header');
const calendarGrid = document.getElementById('calendar-grid');
const inputFechaRef = document.getElementById('cal-fecha-ref');
const filtroCuadrilla = document.getElementById('cal-filtro-cuadrilla');

let eventosActuales = []; // Copia local de los eventos traídos de ordenes.js
let fechaReferencia = new Date(); // Hoy por defecto

// 1. INICIALIZAR CALENDARIO
export function initCalendar() {
    // Seteamos fecha input a hoy
    inputFechaRef.valueAsDate = new Date();
    
    // Listeners de filtros
    inputFechaRef.addEventListener('change', () => {
        fechaReferencia = new Date(inputFechaRef.value + 'T00:00:00'); // Fix zona horaria
        renderizarGridBase();
        renderizarEventosEnCalendario(eventosActuales); // Repintar con nuevos días
    });

    filtroCuadrilla.addEventListener('change', () => {
        renderizarEventosEnCalendario(eventosActuales); // Repintar con filtro
    });

    renderizarGridBase();
}

// 2. DIBUJAR LA ESTRUCTURA (Header + Celdas vacías)
function renderizarGridBase() {
    calendarHeader.innerHTML = '<div>Hora</div>';
    calendarGrid.innerHTML = '';

    // A. Calcular Lunes de la semana seleccionada
    const diaSemana = fechaReferencia.getDay(); // 0 domingo, 1 lunes...
    const distanciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajuste para que empiece Lunes
    const lunes = new Date(fechaReferencia);
    lunes.setDate(fechaReferencia.getDate() + distanciaLunes);

    // B. Dibujar Columnas (Días)
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for(let i=0; i<7; i++) {
        const diaActual = new Date(lunes);
        diaActual.setDate(lunes.getDate() + i);
        
        // Header (Lun 10)
        const divHeader = document.createElement('div');
        divHeader.textContent = `${dias[i]} ${diaActual.getDate()}`;
        // Resaltar hoy
        if(diaActual.toDateString() === new Date().toDateString()) {
            divHeader.style.background = '#bfdbfe'; // Azulito claro
        }
        calendarHeader.appendChild(divHeader);
    }

    // C. Dibujar Filas (Horas)
    const horas = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    
    horas.forEach(hora => {
        // 1. Etiqueta Hora
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = hora;
        calendarGrid.appendChild(label);

        // 2. Siete celdas para esa hora
        for(let i=0; i<7; i++) {
            const celda = document.createElement('div');
            celda.className = 'day-slot';
            
            // Calculamos la fecha de esta celda específica para usarla como ID
            const diaCelda = new Date(lunes);
            diaCelda.setDate(lunes.getDate() + i);
            const fechaStr = diaCelda.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // DATA ATTRIBUTES: Clave para saber dónde pintar
            celda.dataset.fecha = fechaStr;
            celda.dataset.hora = hora;
            
            // Click en celda vacía -> Abrir formulario pre-llenado
            celda.addEventListener('click', (e) => {
                if(e.target === celda) { // Solo si clickea el fondo, no un evento
                    abrirFormularioEn(fechaStr, hora);
                }
            });

            calendarGrid.appendChild(celda);
        }
    });
}

// 3. PINTAR LOS DATOS (Exportada para que la use ordenes.js)
export function renderizarEventosEnCalendario(listaOrdenes) {
    eventosActuales = listaOrdenes; // Guardar referencia
    
    // Limpiar celdas (borrar eventos previos, mantener grid)
    document.querySelectorAll('.day-slot').forEach(slot => slot.innerHTML = '');

    const filtroId = filtroCuadrilla.value; // 'todos' o un ID específico

    listaOrdenes.forEach(orden => {
        // Filtrado
        if (filtroId !== 'todos' && orden.cuadrilla_id !== filtroId) return;

        // Buscar la celda correcta en el DOM
        const selector = `.day-slot[data-fecha="${orden.fecha_programada}"][data-hora="${orden.hora_inicio}"]`;
        const celda = document.querySelector(selector);

        if (celda) {
            // Lógica visual: Si filtro es TODOS -> mostrar bolitas. Si es UNO -> mostrar tarjeta
            if (filtroId === 'todos') {
                // VISTA COMPACTA (Bolita)
                const inicial = orden.cuadrilla_nombre.charAt(0).toUpperCase();
                const badge = document.createElement('div');
                badge.className = 'event-badge';
                badge.textContent = inicial; // Ej: "M" de Movil
                badge.title = `${orden.cuadrilla_nombre}: ${orden.cliente_nombre}`;
                badge.onclick = () => alert(`Detalles:\nCliente: ${orden.cliente_nombre}\nCuadrilla: ${orden.cuadrilla_nombre}\nDirección: ${orden.direccion_instalacion}`);
                celda.appendChild(badge);
            } else {
                // VISTA COMPLETA (Tarjeta)
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `<strong>${orden.cliente_nombre}</strong><br>${orden.direccion_instalacion}`;
                // Colores por estado
                if(orden.estado === 'finalizada') card.style.background = '#059669';
                celda.appendChild(card);
            }
        }
    });
}

// Función auxiliar para UX
function abrirFormularioEn(fecha, hora) {
    document.getElementById('os-fecha').value = fecha;
    document.getElementById('os-hora').value = hora;
    
    // Mostramos el form si estaba oculto
    const panel = document.getElementById('panel-formulario-orden');
    if(panel.style.display === 'none') panel.style.display = 'block';
    
    // Scroll suave hacia el formulario
    panel.scrollIntoView({behavior: "smooth"});
}