/**
 * js/feed.js
 * Corrección de bugs: 404 en imágenes y error al publicar.
 */

window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;

const feedContainer = document.getElementById('feedContainer');
let isListenerAttached = false;

function initFeedListeners() {
    if (!feedContainer || isListenerAttached) return;

    isListenerAttached = true;
    const db = firebase.database();

    db.ref('posts').limitToLast(100).on('value', (snapshot) => {
        const data = snapshot.val();
        feedContainer.innerHTML = '';

        if (!data) {
            feedContainer.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-dim)">El baúl está vacío.</div>';
            return;
        }

        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        posts.forEach(renderPost);

        if (typeof initVideoObserver === 'function') initVideoObserver();
    });
}

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

    // 🔽 CORRECCIÓN CRÍTICA: Fallback para author y authorId 🔽
    const postData = {
        id: newKey,
        authorId: user.id || 'unknown',
        author: CONFIG.PROFILES[user.id]?.name || user.email,
        content: content,
        media: media,
        type: detectMediaType(media),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('posts/' + newKey).set(postData, (err) => {
        if (!err) {
            if(typeof window.closePublishPanel === 'function') window.closePublishPanel();
            if(textInput) textInput.value = '';
            if(mediaInput) mediaInput.value = '';
        } else {
            alert("Error al publicar: " + err.message);
        }
    });
}

function renderPost(post) {
    const profile = (typeof CONFIG !== 'undefined' && CONFIG.PROFILES && CONFIG.PROFILES[post.authorId])
                    ? CONFIG.PROFILES[post.authorId]
                    : { name: post.author || 'Anónimo', avatar: './assets/avatars/default.png', color: '#ccc' };

    const user = window.getCurrentUser();
    const isOwner = user && (user.id === post.authorId || user.email === post.email);

    // 🔽 CORRECCIÓN CRÍTICA: Evitar src="undefined" 🔽
    const avatarSrc = profile.avatar || './assets/avatars/default.png';

    const contentHtml = linkify(post.content);
    const dateStr = new Date(post.timestamp).toLocaleDateString() + ' ' + new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    let mediaHtml = '';
    const safeText = (post.content || '').replace(/"/g, '&quot;').replace(/'/g, "\\'");
    const youtube = getYoutubeEmbed(post.media || post.content);

    if (youtube) {
        mediaHtml = `<div class="media-wrapper youtube-container">${youtube}</div>`;
    } else if (post.media) {
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

    const html = `
        <article class="post-card">
            <div class="post-header">
                <div class="author-info">
                    <img src="${avatarSrc}" class="post-avatar" style="border: 2px solid ${profile.color}">
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

// Helpers
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
