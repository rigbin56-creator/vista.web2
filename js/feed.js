/**
 * js/feed.js
 * Lógica del muro social, manejo de videos y edición.
 */

// Estado local
let posts = JSON.parse(localStorage.getItem('rc_feed_posts')) || [];

// Referencias DOM
const feedContainer = document.getElementById('feedList');
const authorSelect = document.getElementById('authorSelect');
const contentInput = document.getElementById('postContent');
const mediaInput = document.getElementById('mediaUrl');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    populateAuthors();
    renderFeed();
    initVideoObserver();
});

// 1. Llenar selector de autores
function populateAuthors() {
    Object.values(CONFIG.AUTHORS).forEach(author => {
        const option = document.createElement('option');
        option.value = author.id;
        option.textContent = author.name;
        authorSelect.appendChild(option);
    });
}

// 2. Publicar Post
function publishPost() {
    const content = contentInput.value.trim();
    const media = mediaInput.value.trim();
    const authorId = authorSelect.value;

    if (!content && !media) return;

    const newPost = {
        id: Date.now(),
        authorId: authorId,
        content: content,
        media: media,
        type: getMediaType(media),
        timestamp: Date.now(),
        editedHistory: [] // Para guardar quién editó
    };

    posts.unshift(newPost); // Agregar al inicio
    saveAndRender();

    // Limpiar inputs
    contentInput.value = '';
    mediaInput.value = '';
}

// 3. Renderizar Feed
// ... (código anterior de imports y variables igual)
function renderFeed() {
    feedContainer.innerHTML = '';

    posts.forEach(post => {
        const authorData = CONFIG.AUTHORS[post.authorId];
        // Enlace al perfil (aunque los archivos HTML se creen después, el link ya funciona)
        const profileUrl = authorData.profileLink;

        // 1. Detectar YouTube en el contenido
        let contentHtml = linkify(post.content);
        const youtubeEmbed = getYoutubeEmbed(post.content);

        // 2. Construir media (Video local / Imagen local / YouTube)
        let mediaHtml = '';
        if (post.media) {
            // ... (lógica anterior de imagen/video local) ...
             if (post.type === 'video') {
                mediaHtml = `<div class="media-container"><video src="${post.media}" loop muted playsinline class="feed-video"></video></div>`;
            } else {
                mediaHtml = `<div class="media-container"><img src="${post.media}" loading="lazy"></div>`;
            }
        } else if (youtubeEmbed) {
            // Si no hay media subida, pero hay link de YT, ponemos el iframe
            mediaHtml = `<div class="media-container youtube-container">${youtubeEmbed}</div>`;
        }

        const article = document.createElement('article');
        article.className = 'post-card';
        article.innerHTML = `
            <div class="post-header">
                <a href="${profileUrl}">
                    <img src="${authorData.avatar}" class="avatar" alt="${authorData.name}">
                </a>
                <div>
                    <a href="${profileUrl}" style="text-decoration:none;">
                        <div style="color: ${authorData.color}" class="author-name">
                            ${authorData.name}
                        </div>
                    </a>
                    <div class="post-meta">${formatDate(post.timestamp)}</div>
                </div>
            </div>
            <div class="post-content">${contentHtml}</div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="btn" style="font-size:0.7rem;" onclick="enableEdit(${post.id})">Editar</button>
            </div>
        `;
        feedContainer.appendChild(article);
    });
    refreshVideoObserver();
}

// NUEVA FUNCIÓN: Detectar YouTube
function getYoutubeEmbed(text) {
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = text.match(ytRegex);
    if (match && match[1]) {
        return `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${match[1]}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:12px;"></iframe>`;
    }
    return null;
}

        // Construir HTML del media (Video o Imagen)
        let mediaHtml = '';
        if (post.media) {
            if (post.type === 'video') {
                mediaHtml = `
                    <div class="media-container">
                        <video src="${post.media}" loop muted playsinline class="feed-video"></video>
                    </div>`;
            } else {
                mediaHtml = `
                    <div class="media-container">
                        <img src="${post.media}" loading="lazy" alt="Media">
                    </div>`;
            }
        }

        const article = document.createElement('article');
        article.className = 'post-card';
        article.innerHTML = `
            <div class="post-header">
                <img src="${authorData.avatar}" class="avatar" alt="${authorData.name}">
                <div>
                    <div style="color: ${authorData.color}" class="author-name">
                        ${authorData.name} ${editLabel}
                    </div>
                    <div class="post-meta">${formatDate(post.timestamp)}</div>
                </div>
            </div>
            <div class="post-content" id="content-${post.id}">${linkify(post.content)}</div>
            ${mediaHtml}

            <div class="post-actions">
                <button class="btn" style="font-size:0.7rem;" onclick="enableEdit(${post.id})">Editar</button>
            </div>
        `;
        feedContainer.appendChild(article);
    });

    // Re-conectar observador de videos después de renderizar
    refreshVideoObserver();
}

// 4. Edición de Post
function enableEdit(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const newContent = prompt("Editar texto:", post.content);
    if (newContent !== null && newContent !== post.content) {
        // Guardar historial
        const editorId = authorSelect.value; // El que está seleccionado actualmente edita

        post.content = newContent;
        post.editedHistory.push({
            editorId: editorId,
            timestamp: Date.now()
        });

        saveAndRender();
    }
}

// 5. Utilidades y Helpers
function saveAndRender() {
    localStorage.setItem('rc_feed_posts', JSON.stringify(posts));
    renderFeed();
}

function getMediaType(url) {
    if (!url) return 'none';
    if (url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    return 'image';
}

function linkify(text) {
    // Convierte URLs simples a links clickeables
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" style="color:var(--accent-2)">$1</a>');
}

/* --- VIDEO LOGIC (Twitter/TikTok Style) --- */
let videoObserver;

function initVideoObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.6 // 60% del video visible para reproducir
    };

    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => {}); // Autoplay silencioso
            } else {
                video.pause();
            }
        });
    }, options);
}

function refreshVideoObserver() {
    const videos = document.querySelectorAll('.feed-video');
    videos.forEach(video => {
        videoObserver.observe(video);

        // Click para Unmute / Ver completo (Simulación visual)
        video.onclick = function() {
            this.muted = !this.muted;
            if(!this.muted) this.currentTime = 0; // Reiniciar al activar sonido opcionalmente

            // Efecto visual de "Seleccionado"
            this.style.border = this.muted ? "none" : "2px solid var(--accent-1)";
        };
    });
}
