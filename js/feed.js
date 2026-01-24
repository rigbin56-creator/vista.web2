/**
 * js/feed.js
 * Fase 3 Final: UI con Imágenes, Embeds Estables, Likes/Favs Backend.
 */

window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;
window.toggleLike = toggleLike;
window.toggleFav = toggleFav;
window.showPendingPosts = showPendingPosts;

const feedContainer = document.getElementById('feedContainer');
let isListenerAttached = false;
let latestPostId = null;
let pendingSnapshot = null;
const SCROLL_KEY = 'baul_feed_scroll_y';

function initFeedListeners() {
    if (!feedContainer || isListenerAttached) return;
    isListenerAttached = true;

    const db = firebase.database();

    // 1. Restaurar Scroll
    const savedScroll = localStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
        setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }

    // 2. Guardar Scroll al mover
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            localStorage.setItem(SCROLL_KEY, window.scrollY);
            // Ocultar botón "Nuevos" si subimos al tope
            if (window.scrollY < 100 && pendingSnapshot) showPendingPosts();
        }, 100);
    });

    // 3. Escuchar Posts
    db.ref('posts').limitToLast(50).on('value', (snapshot) => {
        const data = snapshot.val();

        if (!data) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#888">El baúl está vacío.</div>';
            return;
        }

        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        const newestPost = posts[0];

        // Lógica "Nuevos Posts": Si no es carga inicial, y hay scroll, y el ID cambió
        const isFirstLoad = latestPostId === null;
        const isScrolledDown = window.scrollY > 300;
        const hasNewContent = latestPostId && newestPost.id !== latestPostId;

        if (!isFirstLoad && isScrolledDown && hasNewContent) {
            pendingSnapshot = posts; // Guardar en memoria
            updateNewPostsButton(true);
        } else {
            renderFeed(posts);
        }
    });
}

function renderFeed(posts) {
    feedContainer.innerHTML = '';
    posts.forEach(renderPost);

    if (posts.length > 0) latestPostId = posts[0].id;
    updateNewPostsButton(false);
    pendingSnapshot = null;

    if (typeof initVideoObserver === 'function') initVideoObserver();

    // Cargar widgets de Twitter si existen en el DOM
    if (window.twttr) window.twttr.widgets.load();
}

function updateNewPostsButton(show) {
    const btn = document.getElementById('newPostsBtn');
    if (!btn) return;

    if (show) {
        const diff = pendingSnapshot ? Math.abs(pendingSnapshot.length - document.querySelectorAll('.post-card').length) : 1;
        const txt = diff > 1 ? `Nuevos posts` : `Nuevo post`;
        // Inyectar icono y texto
        btn.innerHTML = `<img src="${CONFIG.ICONS.arrow_up}" style="width:16px;height:16px;filter:invert(1)"> ${txt}`;
        btn.style.display = 'flex';
    } else {
        btn.style.display = 'none';
    }
}

function showPendingPosts() {
    if (pendingSnapshot) {
        renderFeed(pendingSnapshot);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/* =========================
   ACCIONES (Likes / Publish)
   ========================= */

function publishPost() {
    const user = window.getCurrentUser();
    if (!user) return alert("Debes iniciar sesión.");

    const textInput = document.getElementById('postTextInput');
    const mediaInput = document.getElementById('postMediaInput');
    const content = textInput.value.trim();
    const media = mediaInput.value.trim();

    if (!content && !media) return alert("Escribe algo o pon un link.");

    const db = firebase.database();
    const newKey = db.ref('posts').push().key;

    const postData = {
        id: newKey,
        authorId: user.id,
        // author: Se resuelve al renderizar usando CONFIG.PROFILES
        content: content,
        media: media,
        type: detectMediaType(media),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('posts/' + newKey).set(postData, (err) => {
        if (!err) {
            if(window.closePublishPanel) window.closePublishPanel();
            textInput.value = '';
            mediaInput.value = '';
            createNotification({ type: 'new_post', fromUserId: user.id, postId: newKey });
        } else {
            alert("Error: " + err.message);
        }
    });
}

function createNotification(data) {
    firebase.database().ref('notifications').push({
        ...data,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        read: false
    });
}

function toggleLike(postId) {
    const user = window.getCurrentUser();
    if(!user) return; // O mostrar login
    const ref = firebase.database().ref(`posts/${postId}/likes/${user.id}`);
    ref.once('value', snap => {
        if(snap.exists()) ref.remove();
        else ref.set(true);
    });
}

function toggleFav(postId) {
    const user = window.getCurrentUser();
    if(!user) return;
    const ref = firebase.database().ref(`users/${user.id}/favorites/${postId}`);
    ref.once('value', snap => {
        if(snap.exists()) ref.remove();
        else ref.set(true);
    });
}

function deletePost(id) {
    if(confirm("¿Borrar recuerdo?")) {
        firebase.database().ref('posts/'+id).remove();
    }
}

/* =========================
   RENDER (HTML Generator)
   ========================= */
function renderPost(post) {
    const user = window.getCurrentUser();
    // Obtener perfil o fallback
    const profile = CONFIG.PROFILES[post.authorId] || {
        name: 'Desconocido',
        avatar: CONFIG.ICONS.default_avatar,
        color: '#999',
        link: '#'
    };

    const isOwner = user && (user.id === post.authorId);

    // Likes Check
    const likesCount = post.likes ? Object.keys(post.likes).length : 0;
    const isLiked = post.likes && user && post.likes[user.id];

    // Iconos
    const likeImg = isLiked ? CONFIG.ICONS.like_full : CONFIG.ICONS.like_empty;
    const favImg = CONFIG.ICONS.fav_empty; // Placeholder

    const contentHtml = linkify(post.content);
    const dateStr = new Date(post.timestamp).toLocaleDateString();

    // Embed Visual
    const mediaHtml = getEmbedHtml(post.media, post.type, post);

    const html = `
        <article class="post-card" id="post-${post.id}">
            <div class="post-header">
                <div class="author-info">
                    <a href="${profile.link}" class="profile-link-wrapper">
                        <img src="${profile.avatar}" class="post-avatar" style="border: 2px solid ${profile.color}">
                    </a>
                    <div class="author-text">
                        <a href="${profile.link}" class="author-name" style="color:${profile.color}">${profile.name}</a>
                        <span class="post-date">${dateStr}</span>
                    </div>
                </div>
                ${isOwner ? `<button onclick="deletePost('${post.id}')" class="icon-btn btn-24" title="Borrar"><img src="${CONFIG.ICONS.trash}"></button>` : ''}
            </div>

            <div class="post-content">${contentHtml}</div>
            ${mediaHtml}

            <div class="post-footer" style="display:flex; gap:15px; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05)">
                <button onclick="toggleLike('${post.id}')" class="icon-btn btn-24">
                    <img src="${likeImg}">
                    ${likesCount > 0 ? `<span style="font-size:12px; margin-left:5px; color:#ccc">${likesCount}</span>` : ''}
                </button>
                <button onclick="toggleFav('${post.id}')" class="icon-btn btn-24">
                    <img src="${favImg}">
                </button>
            </div>
        </article>
    `;

    const div = document.createElement('div');
    div.innerHTML = html;
    feedContainer.appendChild(div.firstElementChild);
}

/* =========================
   HELPERS & MEDIA
   ========================= */
function detectMediaType(url) {
    if (!url) return 'none';
    if (url.includes('youtube.com/shorts/')) return 'shorts';
    if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    return 'image';
}

function getEmbedHtml(url, type, post) {
    if (!url || type === 'none') return '';

    const profile = CONFIG.PROFILES[post.authorId] || { name: 'Anónimo', avatar: CONFIG.ICONS.default_avatar, link: '#' };
    const safeText = (post.content || '').replace(/"/g, '&quot;');
    const dateStr = new Date(post.timestamp).toLocaleDateString();

    // Parametros para abrir el Lightbox
    const lbArgs = `'${type}', '${url}', '${safeText}', '${profile.name}', '${dateStr}', '${profile.avatar}', '${profile.link}'`;
    const openLb = `onclick="window.lightbox.open(${lbArgs})"`;

    switch (type) {
        case 'youtube':
            const vidId = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
            return `<div class="media-wrapper youtube-container"><iframe src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen></iframe></div>`;

        case 'shorts':
            const shortsId = url.split('shorts/')[1]?.split('?')[0];
            return `<div class="media-wrapper shorts-preview" ${openLb} style="cursor:pointer">
                        <iframe src="https://www.youtube.com/embed/${shortsId}?controls=0" style="pointer-events:none; width:100%; height:100%"></iframe>
                        <div style="position:absolute; inset:0; z-index:2"></div>
                    </div>`;

        case 'tiktok':
            return `<div class="media-wrapper tiktok-preview" ${openLb}>
                        <div style="font-size:32px">🎵</div>
                        <p style="margin:5px 0; font-size:14px">Ver TikTok de ${profile.name}</p>
                    </div>`;

        case 'instagram':
            const instaId = url.match(/(?:p|reel)\/([a-zA-Z0-9_-]+)/)?.[1];
            return `<div class="media-wrapper" ${openLb} style="cursor:pointer; text-align:center; background:#111; padding:20px; border-radius:8px">
                        📷 Ver post de Instagram
                    </div>`;

        case 'twitter':
             return `<div class="media-wrapper social-embed" ${openLb}>
                        <blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>
                     </div>`;

        case 'video':
            return `<div class="media-wrapper" ${openLb}>
                        <video src="${url}" class="feed-video" loop muted playsinline></video>
                    </div>`;

        default: // image
            return `<div class="media-wrapper" ${openLb}><img src="${url}" loading="lazy"></div>`;
    }
}

function linkify(text) {
    if(!text) return '';
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--accent)">link</a>');
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
