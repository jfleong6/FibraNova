import { initNavigation } from '/stactic/js/admin/navigation.js';
import { initClientes } from '/stactic/js/admin/clientes.js';
import { initInventario } from '/stactic/js/admin/inventario.js';
import { initCuadrillas } from '/stactic/js/admin/cuadrillas.js';
// Importamos initOrdenes (para listeners) y cargarDatosOrdenes (para datos frescos)
import { initOrdenes, cargarDatosOrdenes } from '/stactic/js/admin/ordenes.js'; 
import { initCalendar } from '/stactic/js/admin/calendario.js';
import { initFacturacion } from '/stactic/js/admin/facturacion.js';

// 1. Configurar Vistas
const configuracion = {
    'clientes':    { titulo: "Gestión de Clientes", accion: null },
    'inventario':  { titulo: "Control de Inventario", accion: null },
    'tecnicos':    { titulo: "Gestión de Cuadrillas", accion: null },
    
    // CORRECCIÓN AQUÍ: Usamos () => { ... }
    'ordenes':     { 
        titulo: "Programación de Servicios", 
        accion: () => {
            cargarDatosOrdenes(); // Recarga los selects (clientes/cuadrillas)
            initCalendar();       // Dibuja el calendario y carga eventos
        }
    },
    
    'facturacion': { titulo: "Facturación y Cobros", accion: null }
};

// 2. Arrancar Módulos
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar Navegación
    initNavigation(configuracion);

    // Iniciar Lógica (Listeners de formularios, botones, etc.)
    initClientes();
    initInventario();
    initCuadrillas();
    initOrdenes();     // Se ejecuta una sola vez para activar el botón "Guardar"
    initFacturacion();
});