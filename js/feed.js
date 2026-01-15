/**
 * js/feed.js
 * Lógica del Feed, UI Moderna y Firebase
 */

// --- 1. CONFIGURACIÓN E INICIO ---
let db;
const currentUser = UserSystem.getCurrentUser();

// Elementos UI
const feedContainer = document.getElementById('feedList');
const fabBtn = document.getElementById('fabBtn');
const createPanel = document.getElementById('createPostPanel');
const closePanelBtn = document.getElementById('closePanelBtn');
const publishBtn = document.getElementById('publishBtn');
const contentInput = document.getElementById('postContent');
const mediaInput = document.getElementById('mediaUrl');
const themeBtn = document.getElementById('themeToggle');
const userAvatar = document.getElementById('currentUserAvatar');

// Elementos Modal
const modal = document.getElementById('mediaModal');
const modalClose = document.querySelector('.modal-close');
const modalContainer = document.getElementById('modalMediaContainer');
const modalText = document.getElementById('modalText');
const modalAuthor = document.getElementById('modalAuthor');
const modalAvatar = document.getElementById('modalAvatar');
const modalDate = document.getElementById('modalDate');

try {
    firebase.initializeApp(CONFIG.firebaseConfig);
    db = firebase.database();
} catch (e) { console.error("Error Firebase", e); }

// --- 2. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Configurar Avatar Header
    if(userAvatar) userAvatar.src = currentUser.avatar;

    // Configurar Botón Tema
    if(themeBtn) {
        themeBtn.onclick = () => { themeBtn.textContent = ThemeSystem.toggle(); };
        // Setear icono inicial
        themeBtn.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
    }

    // FAB y Panel
    fabBtn.onclick = () => createPanel.classList.add('open');
    closePanelBtn.onclick = () => createPanel.classList.remove('open');
    publishBtn.onclick = publishPost;

    // Modal Cierres
    modalClose.onclick = closeModal;
    // Cerrar con Swipe Down (básico para móvil)
    let touchStartY = 0;
    modal.addEventListener('touchstart', e => touchStartY = e.touches[0].clientY);
    modal.addEventListener('touchend', e => {
        if (e.changedTouches[0].clientY - touchStartY > 100) closeModal();
    });

    listenForPosts();
});

// --- 3. FUNCIONES DE FIREBASE ---
function publishPost() {
    const content = contentInput.value.trim();
    const media = mediaInput.value.trim();

    if (!content && !media) return alert("Escribe algo o pon un link.");

    const newPostKey = db.ref().child('posts').push().key;
    const postData = {
        id: newPostKey,
        authorId: currentUser.id, // Usa el usuario logueado en localStorage
        content: content,
        media: media,
        type: getMediaType(media),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        edited: false
    };

    db.ref('posts/' + newPostKey).set(postData, (err) => {
        if (!err) {
            createPanel.classList.remove('open'); // Cerrar panel
            contentInput.value = '';
            mediaInput.value = '';
        }
    });
}

function listenForPosts() {
    db.ref('posts').limitToLast(50).on('value', (snapshot) => {
        const data = snapshot.val();
        feedContainer.innerHTML = '';

        if (!data) {
            feedContainer.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.6">Nada por aquí aún...</div>`;
            return;
        }

        const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        posts.forEach(renderPost);
        initVideoObserver();
    });
}

function deletePost(postId) {
    if(confirm("¿Borrar este recuerdo?")) db.ref('posts/' + postId).remove();
}

function editPost(postId, currentContent) {
    const newText = prompt("Editar mensaje:", currentContent);
    if (newText && newText !== currentContent) {
        db.ref('posts/' + postId).update({ content: newText, edited: true });
    }
}

// --- 4. RENDERIZADO Y MODAL ---
function renderPost(post) {
    const author = CONFIG.AUTHORS[post.authorId] || CONFIG.AUTHORS['rigbin'];
    const isOwner = currentUser.id === post.authorId;
    const contentHtml = linkify(post.content);

    let mediaHtml = '';
    let mediaClickAttr = ''; // Para abrir modal

    // Preparar Media
    const ytEmbed = getYoutubeEmbed(post.media || post.content);

    if (ytEmbed) {
        // YouTube no abre modal, se reproduce inline
        mediaHtml = ytEmbed;
    } else if (post.media) {
        // Guardamos datos en atributos data- para el modal
        const safeContent = post.content.replace(/"/g, '&quot;');
        mediaClickAttr = `onclick="openModal('${post.type}', '${post.media}', '${author.name}', '${author.avatar}', '${formatTimestamp(post.timestamp)}', '${safeContent}')"`;

        if (post.type === 'video') {
            mediaHtml = `
                <div class="video-wrapper" ${mediaClickAttr}>
                    <video src="${post.media}" class="feed-video" loop muted playsinline preload="metadata"></video>
                    <button class="mute-btn" onclick="event.stopPropagation(); toggleMute(this)">🔇</button>
                </div>`;
        } else {
            mediaHtml = `
                <div class="media-container" ${mediaClickAttr}>
                    <img src="${post.media}" loading="lazy" alt="Media">
                </div>`;
        }
    }

    const article = document.createElement('article');
    article.className = 'post-card';
    article.innerHTML = `
        <div class="post-header">
            <a href="${author.profileLink}">
                <img src="${author.avatar}" class="avatar" style="border: 2px solid ${author.color}">
            </a>
            <div class="post-info">
                <span class="author-name" style="color: ${author.color}">${author.name}</span>
                ${post.edited ? '<span class="edit-tag"> · editado</span>' : ''}
                <div class="post-meta">${formatTimestamp(post.timestamp)}</div>
            </div>
            ${isOwner ? `
            <div class="post-menu">
                <button onclick="editPost('${post.id}', '${post.content.replace(/'/g, "\\'")}')">✎</button>
                <button onclick="deletePost('${post.id}')" style="color:var(--danger)">🗑</button>
            </div>` : ''}
        </div>
        <div class="post-content">${contentHtml}</div>
        ${mediaHtml}
    `;
    feedContainer.appendChild(article);
}

// --- 5. LÓGICA DEL MODAL ---
window.openModal = function(type, url, author, avatar, date, text) {
    modalContainer.innerHTML = '';
    modalText.innerHTML = linkify(text);
    modalAuthor.textContent = author;
    modalAvatar.src = avatar;
    modalDate.textContent = date;

    if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.style.width = '100%';
        modalContainer.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = url;
        modalContainer.appendChild(img);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
};

function closeModal() {
    modal.classList.remove('active');
    modalContainer.innerHTML = ''; // Limpiar para detener video
    document.body.style.overflow = '';
}

// --- 6. UTILIDADES (Videos Observer, Youtube, Linkify) ---
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

function toggleMute(btn) {
    const video = btn.previousElementSibling;
    video.muted = !video.muted;
    btn.textContent = video.muted ? "🔇" : "🔊";
}

function getYoutubeEmbed(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
        return `<div class="media-container youtube-container"><iframe src="https://www.youtube.com/embed/${match[2]}?rel=0" frameborder="0" allowfullscreen></iframe></div>`;
    }
    return null;
}

function getMediaType(url) {
    if (!url) return 'none';
    return url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image';
}

function linkify(text) {
    return text ? text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:var(--accent)">$1</a>') : '';
}

function formatTimestamp(ts) {
    const date = new Date(ts);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}
