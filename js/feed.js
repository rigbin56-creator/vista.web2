/**
 * js/feed.js
 * Fase 2: Embeds, Scroll Memory, Nuevos Posts y Notificaciones.
 */

window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;
window.showPendingPosts = showPendingPosts; // Función para el botón flotante

const feedContainer = document.getElementById('feedContainer');
let isListenerAttached = false;
let latestPostId = null; // Para detectar nuevos posts
let pendingSnapshot = null; // Guarda los posts nuevos mientras el usuario scrollea

// Configuración de Scroll
const SCROLL_KEY = 'baul_scroll_pos';

function initFeedListeners() {
    if (!feedContainer || isListenerAttached) return;

    isListenerAttached = true;
    const db = firebase.database();

    // Restaurar posición de scroll guardada si existe
    const savedScroll = localStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
        setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }

    // Listener para guardar scroll (debounce básico)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            localStorage.setItem(SCROLL_KEY, window.scrollY);

            // Ocultar botón de nuevos posts si volvemos arriba
            if (window.scrollY < 100 && pendingSnapshot) {
                showPendingPosts();
            }
        }, 100);
    });

    db.ref('posts').limitToLast(100).on('value', (snapshot) => {
        const data = snapshot.val();

        if (!data) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-dim)">El baúl está vacío.</div>';
            return;
        }

        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        const newestPost = posts[0];

        // Lógica: ¿Renderizar directo o mostrar botón "Nuevos Posts"?
        const isFirstLoad = latestPostId === null;
        const isScrolledDown = window.scrollY > 300;
        const hasNewContent = newestPost.id !== latestPostId;

        if (!isFirstLoad && isScrolledDown && hasNewContent) {
            // Usuario leyendo abajo + post nuevo -> Guardar y mostrar botón
            pendingSnapshot = posts;
            showNewPostsButton(true, posts.length);
        } else {
            // Carga inicial o usuario arriba -> Renderizar directo
            renderFeed(posts);
        }
    });
}

function renderFeed(posts) {
    feedContainer.innerHTML = '';
    posts.forEach(renderPost);

    // Actualizar ID de referencia
    if (posts.length > 0) latestPostId = posts[0].id;

    // Ocultar botón y limpiar pendiente
    showNewPostsButton(false);
    pendingSnapshot = null;

    // Reiniciar observadores de video/scripts
    if (typeof initVideoObserver === 'function') initVideoObserver();
    injectExternalScripts(); // Para TikTok/Twitter
}

function showPendingPosts() {
    if (pendingSnapshot) {
        renderFeed(pendingSnapshot);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showNewPostsButton(show, count = 0) {
    let btn = document.getElementById('newPostsBtn');

    // Crear botón si no existe
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'newPostsBtn';
        btn.onclick = showPendingPosts;
        btn.style.cssText = `
            position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: var(--accent); color: white; border: none;
            padding: 8px 16px; border-radius: 20px; font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 99;
            cursor: pointer; display: none; transition: all 0.3s ease;
        `;
        document.body.appendChild(btn);
    }

    if (show) {
        const diff = pendingSnapshot ? Math.abs(pendingSnapshot.length - document.querySelectorAll('.post-card').length) : 1;
        btn.textContent = diff > 1 ? `↑ Nuevos posts` : `↑ Nuevo post`;
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

/* =========================
   PUBLICAR Y NOTIFICACIONES
   ========================= */
function publishPost() {
    const user = window.getCurrentUser();
    if (!user) return alert("Error: No hay sesión iniciada.");

    const textInput = document.getElementById('postTextInput');
    const mediaInput = document.getElementById('postMediaInput');

    const content = textInput ? textInput.value.trim() : '';
    const media = mediaInput ? mediaInput.value.trim() : '';

    if (!content && !media) return alert("El mensaje está vacío.");

    const db = firebase.database();
    const newKey = db.ref().child('posts').push().key;

    // Detectar tipo avanzado (incluyendo shorts/tiktok/etc)
    const mediaType = detectMediaType(media);

    const postData = {
        id: newKey,
        authorId: user.id || 'unknown',
        author: CONFIG.PROFILES[user.id]?.name || user.email,
        content: content,
        media: media,
        type: mediaType,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('posts/' + newKey).set(postData, (err) => {
        if (!err) {
            if(typeof window.closePublishPanel === 'function') window.closePublishPanel();
            if(textInput) textInput.value = '';
            if(mediaInput) mediaInput.value = '';

            // 🔔 Crear Notificación (Backend Logic)
            createNotification({
                type: 'new_post',
                fromUserId: user.id,
                postId: newKey
            });

        } else {
            alert("Error al publicar: " + err.message);
        }
    });
}

// Sistema base de notificaciones
function createNotification(data) {
    // Aquí iría la lógica de 'toUserId' si fuera mensaje privado.
    // Al ser post público, se podría notificar a seguidores (futuro).
    // Por ahora registramos el evento en Firebase.
    const notifRef = firebase.database().ref('notifications').push();
    notifRef.set({
        ...data,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
}

/* =========================
   RENDER POST (Actualizado Fase 2)
   ========================= */
function renderPost(post) {
    const profile = (typeof CONFIG !== 'undefined' && CONFIG.PROFILES && CONFIG.PROFILES[post.authorId])
                    ? CONFIG.PROFILES[post.authorId]
                    : { name: post.author || 'Anónimo', avatar: './assets/avatars/default.png', color: '#ccc', link: '#' };

    // Fallback de link si no viene en CONFIG
    const profileLink = profile.link || `${post.authorId}.html`;

    const user = window.getCurrentUser();
    const isOwner = user && (user.id === post.authorId || user.email === post.email);
    const avatarSrc = profile.avatar || './assets/avatars/default.png';

    const contentHtml = linkify(post.content);
    const dateStr = new Date(post.timestamp).toLocaleDateString() + ' ' + new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Obtener HTML del embed (Youtube normal, Shorts, TikTok, etc)
    const mediaHtmlWrapper = getEmbedHtml(post.media, post.type, post);

    const html = `
        <article class="post-card">
            <div class="post-header">
                <div class="author-info">
                    <a href="${profileLink}" class="profile-link-wrapper">
                        <img src="${avatarSrc}" class="post-avatar" style="border: 2px solid ${profile.color}">
                    </a>
                    <div class="author-text">
                        <a href="${profileLink}" class="author-name" style="color:${profile.color}; text-decoration:none;">
                            ${profile.name}
                        </a>
                        <span class="post-date">${dateStr}</span>
                    </div>
                </div>
                ${isOwner ? `<button onclick="deletePost('${post.id}')" class="delete-btn" title="Borrar">🗑</button>` : ''}
            </div>
            <div class="post-content">${contentHtml}</div>
            ${mediaHtmlWrapper}
        </article>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    feedContainer.appendChild(tempDiv.firstElementChild);
}

function deletePost(id) {
    if(!id) return;
    if(confirm("¿Borrar recuerdo?")) {
        firebase.database().ref('posts/'+id).remove().catch(err => alert(err.message));
    }
}

/* =========================
   HELPERS & DETECCIÓN DE LINKS (Fase 2)
   ========================= */

function detectMediaType(url) {
    if (!url) return 'none';
    if (url.includes('youtube.com/shorts/')) return 'shorts';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    return 'image';
}

// Genera el HTML visual según la plataforma
function getEmbedHtml(url, type, post) {
    if (!url || type === 'none') return '';

    const safeText = (post.content || '').replace(/"/g, '&quot;').replace(/'/g, "\\'");
    const profile = CONFIG.PROFILES[post.authorId] || { name: 'Anónimo' };
    const dateStr = new Date(post.timestamp).toLocaleDateString();

    // Datos para el Lightbox (Zoom)
    // Pasamos 'type' para activar el scroll vertical si es necesario
    const clickAction = `onclick="if(window.lightbox) window.lightbox.open('${type}', '${url}', '${safeText}', '${profile.name}', '${dateStr}', '${profile.avatar}', '${profile.link || '#'}')"`;

    switch (type) {
        case 'youtube':
            const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            if (ytMatch && ytMatch[2].length === 11) {
                return `<div class="media-wrapper youtube-container">
                            <iframe src="https://www.youtube.com/embed/${ytMatch[2]}?enablejsapi=1&origin=${window.location.origin}" frameborder="0" allowfullscreen></iframe>
                        </div>`;
            }
            return '';

        case 'shorts':
            // Shorts se convierte a embed normal pero vertical
            const shortsId = url.split('shorts/')[1]?.split('?')[0];
            if (shortsId) {
                 // Usamos un wrapper con clickAction para abrir zoom
                return `<div class="media-wrapper shorts-preview" ${clickAction} style="cursor:pointer; position:relative;">
                            <iframe style="pointer-events:none;" src="https://www.youtube.com/embed/${shortsId}?controls=0&autoplay=0" frameborder="0"></iframe>
                            <div style="position:absolute; inset:0; z-index:2;"></div>
                        </div>`;
            }
            return '';

        case 'tiktok':
            return `<div class="media-wrapper social-embed" ${clickAction}>
                        <blockquote class="tiktok-embed" cite="${url}" data-video-id="${url.split('/video/')[1]?.split('?')[0]}" style="max-width: 605px;min-width: 325px;">
                            <section>Cargando TikTok...</section>
                        </blockquote>
                    </div>`;

        case 'instagram':
             // Usa iframe simple de instagram /embed
             const instaId = url.match(/(?:p|reel)\/([a-zA-Z0-9_-]+)/)?.[1];
             if(instaId) {
                 return `<div class="media-wrapper social-embed" ${clickAction}>
                            <iframe src="https://www.instagram.com/p/${instaId}/embed" width="100%" height="400" frameborder="0" scrolling="no" style="pointer-events:none;"></iframe>
                         </div>`;
             }
             return '';

        case 'twitter':
             return `<div class="media-wrapper social-embed" ${clickAction}>
                        <blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>
                     </div>`;

        case 'video':
            return `<div class="media-wrapper" ${clickAction}>
                        <video src="${url}" class="feed-video" loop muted playsinline preload="metadata"></video>
                        <div class="mute-indicator">🔇</div>
                    </div>`;

        default: // image
            return `<div class="media-wrapper" ${clickAction}>
                        <img src="${url}" loading="lazy" alt="media">
                    </div>`;
    }
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

// Inyección dinámica de scripts para embeds
function injectExternalScripts() {
    if (!document.getElementById('tiktok-script')) {
        const script = document.createElement('script');
        script.id = 'tiktok-script';
        script.src = 'https://www.tiktok.com/embed.js';
        document.body.appendChild(script);
    }
    if (!document.getElementById('twitter-script')) {
        const script = document.createElement('script');
        script.id = 'twitter-script';
        script.src = 'https://platform.twitter.com/widgets.js';
        document.body.appendChild(script);
    }
}
