export function initNavigation(config) {
    const pageTitle = document.getElementById('page-title');

    function cambiarVista(vistaSeleccionada) {
        Object.keys(config).forEach(vista => {
            const div = document.getElementById(`view-${vista}`);
            const btn = document.getElementById(`btn-view-${vista}`);

            if (div && btn) {
                if (vista === vistaSeleccionada) {
                    div.style.display = 'block';
                    btn.classList.add('active');
                    pageTitle.innerText = config[vista].titulo;
                    
                    // Ejecutar acción especial si existe (ej: cargar selects)
                    if (config[vista].accion) config[vista].accion();
                } else {
                    div.style.display = 'none';
                    btn.classList.remove('active');
                }
            }
        });
    }

    // Auto-asignar eventos a botones
    document.querySelectorAll('[id^="btn-view-"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const nombreVista = btn.id.substring(9); // quita "btn-view-"
            cambiarVista(nombreVista);
        });
    });
}