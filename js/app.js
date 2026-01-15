/**
 * js/app.js
 * Funciones generales y utilidades de la app.
 */

// Utilidad simple para formatear fechas
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

// Inicialización de elementos comunes
document.addEventListener('DOMContentLoaded', () => {
    console.log("App iniciada. Modo: " + CONFIG.START_PAGE);
});
