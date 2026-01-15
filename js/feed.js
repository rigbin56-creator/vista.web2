/**
 * js/feed.js
 * v2.1 - Reparación de YouTube (Error 153), Autoplay y Perfiles
 */

// 1. Persistencia de Datos
let posts = [];
try {
    posts = JSON.parse(localStorage.getItem('rc_feed_posts')) || [];
} catch (e) {
    console.error("Error en base de datos local:", e);
    posts = [];
}

// 2. Elementos del DOM
const feedContainer = document.getElementById('feedList');
const authorSelect = document.getElementById('authorSelect');
const contentInput = document.getElementById('postContent');
const mediaInput = document.getElementById('mediaUrl');

// 3. Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    if (authorSelect) populateAuthors();
    if (feedContainer) renderFeed();
    initVideoObserver();
});

// --- FUNCIONES PRINCIPALES ---

/**
 * Llena el selector de autores basado en config.js
 */
function populateAuthors() {
    if (!authorSelect) return;
    authorSelect.innerHTML = '';
    Object.values(CONFIG.AUTHORS).forEach(author => {
        const option = document.createElement('option');
        option.value = author.id;
        option.textContent = author.name;
        authorSelect.appendChild(option);
    });
}

/**
 * Crea y guarda una nueva publicación
 */
function publishPost() {
    const content = contentInput.value.trim();
    const media = mediaInput.value.trim();
    const authorId = authorSelect.value;

    if (!content && !media) {
        alert("¡Escribe un mensaje o pega un link para recordar!");
        return;
    }

    const newPost = {
        id: Date.now(),
        authorId: authorId,
        content: content,
        media: media,
        type: getMediaType(media),
        timestamp: Date.now(),
        editedHistory: []
    };

    posts.unshift(newPost);
    saveAndRender();

    // Limpiar formulario
    contentInput.value = '';
    mediaInput.value = '';
}

/**
 * Dibuja todos los posts en el muro
 */
function renderFeed() {
    if (!feedContainer) return;
    feedContainer.innerHTML = '';

    if (posts.length === 0) {
        feedContainer.innerHTML = `
            <div style="text-align:center; padding: 50px 20px; color: var(--text-dim);">
                <p style="font-size: 1.2rem;">✨ El baúl está vacío.</p>
                <small>Publica el primer recuerdo arriba.</small>
            </div>`;
        return;
    }

    posts.forEach(post => {
        const authorData = CONFIG.AUTHORS[post.authorId] || {
            name: 'Usuario', avatar: 'assets/icons/default.png', color: '#fff', profileLink: '#'
        };

        // Procesar contenido (links clickeables)
        const contentHtml = linkify(post.content);

        // --- LÓGICA DE MEDIA (YouTube vs Local) ---
        let mediaHtml = '';
        // Prioridad 1: Buscar YouTube en campo media
        let youtubeEmbed = getYoutubeEmbed(post.media);

        // Prioridad 2: Si no hay, buscar YouTube en el texto
        if (!youtubeEmbed) {
            youtubeEmbed = getYoutubeEmbed(post.content);
        }

        if (youtubeEmbed) {
            mediaHtml = youtubeEmbed;
        } else if (post.media) {
            // Es una imagen o video directo (mp4, jpg, etc)
            if (post.type === 'video') {
                mediaHtml = `
                    <div class="media-container">
                        <video src="${post.media}" loop muted playsinline class="feed-video"></video>
                    </div>`;
            } else {
                mediaHtml = `
                    <div class="media-container">
                        <img src="${post.media}" loading="lazy" alt="Recuerdo">
                    </div>`;
            }
        }

        const article = document.createElement('article');
        article.className = 'post-card';
        article.innerHTML = `
            <div class="post-header">
                <a href="${authorData.profileLink}">
                    <img src="${authorData.avatar}" class="avatar">
                </a>
                <div style="flex:1;">
                    <a href="${authorData.profileLink}" style="text-decoration:none;">
                        <span style="color: ${authorData.color}" class="author-name">${authorData.name}</span>
                    </a>
                    ${post.editedHistory.length > 0 ? '<span class="edit-indicator">(editado)</span>' : ''}
                    <div class="post-meta">${formatDate(post.timestamp)}</div>
                </div>
            </div>

            <div class="post-content">${contentHtml}</div>
            ${mediaHtml}

            <div class="post-actions">
                <button class="btn btn-ghost" style="font-size: 0.7rem;" onclick="enableEdit(${post.id})">Editar</button>
                <button class="btn btn-ghost" style="font-size: 0.7rem; color: var(--danger);" onclick="deletePost(${post.id})">Eliminar</button>
            </div>
        `;
        feedContainer.appendChild(article);
    });

    refreshVideoObserver();
}

// --- UTILIDADES ---

/**
 * Corrección para YouTube Error 153
 */
function getYoutubeEmbed(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        const videoId = match[2];
        // Se añade origin y parámetros de seguridad para evitar errores de carga
        return `
            <div class="media-container youtube-container">
                <iframe
                    src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0"
                    title="YouTube video"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>`;
    }
    return null;
}

function saveAndRender() {
    localStorage.setItem('rc_feed_posts', JSON.stringify(posts));
    renderFeed();
}

function deletePost(id) {
    if(confirm("¿Quieres borrar este recuerdo permanentemente?")) {
        posts = posts.filter(p => p.id !== id);
        saveAndRender();
    }
}

function enableEdit(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const newText = prompt("Edita tu mensaje:", post.content);
    if (newText !== null && newText !== post.content) {
        post.content = newText;
        post.editedHistory.push({ time: Date.now() });
        saveAndRender();
    }
}

function getMediaType(url) {
    if (!url) return 'none';
    return url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
}

function linkify(text) {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
        // No crear link si es un video de YouTube (porque ya se pondrá el reproductor abajo)
        if (url.includes('youtube.com') || url.includes('youtu.be')) return url;
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

// --- LÓGICA DE VIDEOS TIPO TIKTOK ---

let videoObserver;
function initVideoObserver() {
    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.play().catch(() => {});
            } else {
                entry.target.pause();
            }
        });
    }, { threshold: 0.7 });
}

function refreshVideoObserver() {
    const videos = document.querySelectorAll('.feed-video');
    videos.forEach(v => {
        videoObserver.observe(v);
        v.onclick = function() { this.muted = !this.muted; };
    });
}
