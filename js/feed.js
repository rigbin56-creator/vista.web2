/**
 * js/feed.js
 * Lógica del Feed con protección de carga infinita
 */

// Exponer funciones necesarias
window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;

const feedContainer = document.getElementById('feedContainer');

function initFeedListeners() {
    if (!feedContainer) return; // No estamos en feed.html

    const user = window.getCurrentUser();
    if (!user) {
        // Si se llamó esta función pero no hay usuario cargado aún, esperamos
        console.warn("Intento de cargar feed sin usuario. Esperando Auth...");
        return;
    }

    console.log("📡 Cargando recuerdos...");
    feedContainer.innerHTML = '<div style="text-align:center; padding-top:50px;">🔄 Cargando recuerdos...</div>';

    const db = firebase.database();
    const postsRef = db.ref('posts');

    // Timeout de seguridad: Si en 5s no carga, mostrar error (evita loop infinito)
    const loadTimeout = setTimeout(() => {
        if(feedContainer.innerHTML.includes('🔄')) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:30px; opacity:0.6">La conexión está lenta o no hay datos.</div>';
        }
    }, 8000);

    postsRef.limitToLast(100).on('value', (snapshot) => {
        clearTimeout(loadTimeout); // Datos recibidos, cancelar timeout
        feedContainer.innerHTML = ''; // Limpiar loader

        const data = snapshot.val();

        if (!data) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-dim)">El baúl está vacío.</div>';
            return;
        }

        // Convertir objeto a array y ordenar (más nuevo primero)
        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);

        posts.forEach(renderPost);

        // Iniciar observador de videos (autoplay)
        if (typeof initVideoObserver === 'function') initVideoObserver();
    });
}

// ... (El resto de funciones: publishPost, renderPost, deletePost, etc. se mantienen igual que la versión anterior) ...
// Asegúrate de copiar el resto del contenido de js/feed.js que te pasé en la respuesta anterior para completar el archivo.
// Solo asegúrate de que renderPost use window.getCurrentUser()
