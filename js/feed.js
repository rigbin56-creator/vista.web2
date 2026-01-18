/**
 * js/feed.js
 * Versión Limpia: Sin loaders, sin esperas, directo al contenido.
 */

// Exponer funciones globalmente
window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;

const feedContainer = document.getElementById('feedContainer');
let isListenerAttached = false; // Evita duplicar listeners si se llama dos veces

function initFeedListeners() {
    // Validación básica de existencia del contenedor
    if (!feedContainer) return;

    // Si ya estamos escuchando, no hacemos nada (evita duplicados)
    if (isListenerAttached) return;

    // NO hay chequeo de usuario aquí. Confiamos en que auth.js nos llamó cuando debía.
    // NO hay loaders (feedContainer.innerHTML = 'Cargando...').

    isListenerAttached = true;
    const db = firebase.database();

    // Conexión directa a la base de datos
    db.ref('posts').limitToLast(100).on('value', (snapshot) => {
        const data = snapshot.val();

        // Limpiamos el contenedor solo cuando YA tenemos respuesta
        feedContainer.innerHTML = '';

        if (!data) {
            // Estado vacío sutil (sin spinner)
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-dim)">El baúl está vacío.</div>';
            return;
        }

        // Convertir a array y ordenar (más nuevo primero)
        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);

        // Renderizar inmediatamente
        posts.forEach(renderPost);

        // Activar autoplay de videos si existen
        if (typeof initVideoObserver === 'function') initVideoObserver();
    });
}

/* =========================
   PUBLICAR POST (Funcionalidad Restaurada)
   ========================= */
function publishPost() {
    const user = window.getCurrentUser();
    if (!user) return alert("Error: No hay sesión iniciada.");

    // 1. Capturar inputs reales del DOM
    const textInput = document.getElementById('postTextInput');
    const mediaInput = document.getElementById('postMediaInput');

    // 2. Validar contenido
    const content = textInput ? textInput.value.trim() : '';
    const media = mediaInput ? mediaInput.value.trim() : '';

    if (!content && !media) return alert("El mensaje está vacío.");

    const db = firebase.database();
    const newKey = db.ref().child('posts').push().key;

    // 3. Estructura de datos compatible con visualización
    const postData = {
        id: newKey,
        authorId: user.id, // ID clave para buscar avatar/color en CONFIG
        author: user.name, // Fallback de nombre
        content: content,
        media: media,
        type: detectMediaType(media),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // 4. Guardar en Firebase
    db.ref('posts/' + newKey).set(postData, (err) => {
        if (!err) {
            // Cerrar panel y limpiar inputs
            if(typeof window.closePublishPanel === 'function') window.closePublishPanel();
            if(textInput) textInput.value = '';
            if(mediaInput) mediaInput.value = '';
        } else {
            alert("Error al publicar: " + err.message);
        }
    });
}

/* =========================
   RENDER POST (Estética Original Restaurada)
   ========================= */
function renderPost(post) {
    // Recuperar estilos del perfil (Avatar, Color) desde CONFIG
    const profile = (typeof CONFIG !== 'undefined' && CONFIG.PROFILES && CONFIG.PROFILES[post.authorId])
                    ? CONFIG.PROFILES[post.authorId]
                    : { name: post.author || 'Anónimo', avatar: 'assets/avatars/default.png', color: '#ccc' };

    const user = window.getCurrentUser();
    // Verificar propiedad para botón de borrar
    const isOwner = user && (user.id === post.authorId || user.email === post.email);

    // Procesar texto y fecha
    const contentHtml = linkify(post.content);
    const dateStr = new Date(post.timestamp).toLocaleDateString() + ' ' + new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Procesar Media (Video vs Imagen vs Youtube)
    let mediaHtml = '';
    const safeText = (post.content || '').replace(/"/g, '&quot;').replace(/'/g, "\\'");
    const youtube = getYoutubeEmbed(post.media || post.content);

    if (youtube) {
        mediaHtml = `<div class="media-wrapper youtube-container">${youtube}</div>`;
    } else if (post.media) {
        // Evento onclick para abrir Lightbox
        const clickAction = `onclick="if(window.lightbox) window.lightbox.open('${post.type}', '${post.media}', '${safeText}', '${profile.name}', '${dateStr}')"`;

        if (post.type === 'video') {
            mediaHtml = `
                <div class="media-wrapper" ${clickAction}>
                    <video src="${post.media}" class="feed-video" loop muted playsinline preload="metadata"></video>
                    <div class="mute-indicator">🔇</div>
                </div>`;
        } else {
            mediaHtml = `
                <div class="media-wrapper" ${clickAction}>
                    <img src="${post.media}" loading="lazy" alt="media">
                </div>`;
        }
    }

    // HTML ESTRUCTURAL (post-card) para recuperar CSS
    const html = `
        <article class="post-card">
            <div class="post-header">
                <div class="author-info">
                    <img src="${profile.avatar}" class="post-avatar" style="border: 2px solid ${profile.color}" onerror="this.src='assets/avatars/default.png'">
                    <div class="author-text">
                        <span class="author-name" style="color:${profile.color}">${profile.name}</span>
                        <span class="post-date">${dateStr}</span>
                    </div>
                </div>
                ${isOwner ? `<button onclick="deletePost('${post.id}')" class="delete-btn" title="Borrar">🗑</button>` : ''}
            </div>
            <div class="post-content">${contentHtml}</div>
            ${mediaHtml}
        </article>
    `;

    // Inserción segura en el DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    feedContainer.appendChild(tempDiv.firstElementChild);
}

/* =========================
   BORRAR POST
   ========================= */
function deletePost(id) {
    if(!id) return;
    if(confirm("¿Borrar recuerdo?")) {
        firebase.database().ref('posts/'+id).remove()
            .catch(err => alert(err.message));
    }
}

/* =========================
   HELPERS VISUALES
   ========================= */
function detectMediaType(url) {
    if (!url) return 'none';
    if (url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    return 'image';
}

function getYoutubeEmbed(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
        return `<iframe src="https://www.youtube.com/embed/${match[2]}?enablejsapi=1&origin=${window.location.origin}&rel=0" frameborder="0" allowfullscreen></iframe>`;
    }
    return null;
}

function linkify(text) {
    if(!text) return '';
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--accent)">$1</a>');
}

function initVideoObserver() {
    const videos = document.querySelectorAll('video.feed-video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.play().catch(()=>{});
            else entry.target.pause();
        });
    }, { threshold: 0.6 });
    videos.forEach(v => observer.observe(v));
}
