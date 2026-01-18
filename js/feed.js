/**
 * js/feed.js
 * Lógica del Feed
 */

// Exponer funciones globalmente
window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;

const feedContainer = document.getElementById('feedContainer');

function initFeedListeners() {
    if (!feedContainer) return;

    console.log("📡 Conectando al feed...");
    feedContainer.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.6">Cargando recuerdos...</div>';

    const db = firebase.database();

    db.ref('posts').limitToLast(100).on('value', (snapshot) => {
        feedContainer.innerHTML = ''; // Limpiar loader
        const data = snapshot.val();

        if (!data) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px;">El baúl está vacío... sé el primero en publicar.</div>';
            return;
        }

        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        posts.forEach(renderPost);

        // Iniciar observador de videos
        if (typeof initVideoObserver === 'function') initVideoObserver();
    });
}

function publishPost() {
    const user = window.getCurrentUser();
    if (!user) return alert("Error: No hay sesión iniciada.");

    const textInput = document.getElementById('postTextInput');
    const mediaInput = document.getElementById('postMediaInput');

    // Fix: Validar inputs correctamente
    const content = textInput ? textInput.value.trim() : '';
    const media = mediaInput ? mediaInput.value.trim() : '';

    if (!content && !media) return alert("El mensaje está vacío.");

    const db = firebase.database();
    const newKey = db.ref().child('posts').push().key;

    const postData = {
        id: newKey,
        authorId: user.id,
        content: content,
        media: media,
        type: detectMediaType(media),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('posts/' + newKey).set(postData, (err) => {
        if (!err) {
            if(typeof closePublishPanel === 'function') closePublishPanel();
            if(textInput) textInput.value = '';
            if(mediaInput) mediaInput.value = '';
        } else {
            alert("Error al publicar: " + err.message);
        }
    });
}

function renderPost(post) {
    const author = CONFIG.PROFILES[post.authorId] || CONFIG.PROFILES['rigbin'];
    const user = window.getCurrentUser();
    const isOwner = user && user.id === post.authorId;

    const contentHtml = linkify(post.content);
    let mediaHtml = '';

    // Preparar onclick para lightbox (escapando comillas)
    const safeText = (post.content || '').replace(/"/g, '&quot;').replace(/'/g, "\\'");
    const dateStr = new Date(post.timestamp).toLocaleDateString();

    // Determinar si es YouTube o archivo directo
    const youtube = getYoutubeEmbed(post.media || post.content);

    if (youtube) {
        mediaHtml = `<div class="media-wrapper youtube-container">${youtube}</div>`;
    } else if (post.media) {
        const clickAction = `onclick="if(window.lightbox) window.lightbox.open('${post.type}', '${post.media}', '${safeText}', '${author.name}', '${dateStr}')"`;

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

    const html = `
        <article class="post-card">
            <div class="post-header">
                <div class="author-info">
                    <img src="${author.avatar}" class="post-avatar" style="border: 2px solid ${author.color}">
                    <div class="author-text">
                        <span class="author-name" style="color:${author.color}">${author.name}</span>
                        <span class="post-date">${formatDate(post.timestamp)}</span>
                    </div>
                </div>
                ${isOwner ? `<button onclick="deletePost('${post.id}')" style="background:none;border:none;cursor:pointer;">🗑</button>` : ''}
            </div>
            <div class="post-content">${contentHtml}</div>
            ${mediaHtml}
        </article>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    feedContainer.appendChild(tempDiv.firstElementChild);
}

function deletePost(id) {
    if(confirm("¿Borrar?")) firebase.database().ref('posts/'+id).remove();
}

// --- HELPERS INTERNOS ---
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

function formatDate(ts) {
    return new Date(ts).toLocaleDateString();
}

function initVideoObserver() {
    const videos = document.querySelectorAll('video.feed-video');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.play().catch(e=>{});
            else entry.target.pause();
        });
    }, { threshold: 0.6 });
    videos.forEach(v => observer.observe(v));
}
