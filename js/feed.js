/**
 * js/feed.js
 * Lógica del Feed con protección de carga infinita
 */

// Exponer funciones necesarias
window.publishPost = publishPost;
window.initFeedListeners = initFeedListeners;
window.deletePost = deletePost;

const feedContainer = document.getElementById('feedContainer');
let feedInitialized = false; // evita dobles cargas

function initFeedListeners() {
    if (!feedContainer) return; // No estamos en feed.html
    if (feedInitialized) return;

    const user = window.getCurrentUser();

    if (!user) {
        console.warn("⏳ Usuario no listo, esperando auth...");
        // Reintentar una sola vez cuando Auth termine
        setTimeout(initFeedListeners, 300);
        return;
    }

    feedInitialized = true;

    console.log("📡 Cargando recuerdos...");
    feedContainer.innerHTML =
        '<div style="text-align:center; padding-top:50px;">🔄 Cargando recuerdos...</div>';

    const db = firebase.database();
    const postsRef = db.ref('posts');

    // Timeout de seguridad
    const loadTimeout = setTimeout(() => {
        if (feedContainer.innerHTML.includes('🔄')) {
            feedContainer.innerHTML =
                '<div style="text-align:center; padding:30px; opacity:0.6">La conexión está lenta o no hay datos.</div>';
        }
    }, 8000);

    postsRef.limitToLast(100).on('value', (snapshot) => {
        clearTimeout(loadTimeout);
        feedContainer.innerHTML = '';

        const data = snapshot.val();

        if (!data) {
            feedContainer.innerHTML =
                '<div style="text-align:center; padding:40px; color:var(--text-dim)">El baúl está vacío.</div>';
            return;
        }

        const posts = Object.values(data).sort(
            (a, b) => b.timestamp - a.timestamp
        );

        posts.forEach(renderPost);

        if (typeof initVideoObserver === 'function') {
            initVideoObserver();
        }
    });
}

/* =========================
   PUBLICAR POST
   ========================= */

function publishPost(content, type = "text") {
    const user = window.getCurrentUser();

    if (!user) {
        alert("Sesión no iniciada.");
        return;
    }

    const postData = {
        uid: user.uid,
        author: user.displayName || "Anónimo",
        content: content,
        type: type,
        timestamp: Date.now()
    };

    firebase
        .database()
        .ref("posts")
        .push(postData)
        .then(() => {
            console.log("✅ Post publicado");
        })
        .catch((err) => {
            console.error("❌ Error al publicar:", err);
        });
}

/* =========================
   RENDER POST
   ========================= */

function renderPost(post) {
    const user = window.getCurrentUser();

    const postEl = document.createElement("div");
    postEl.className = "post";

    postEl.innerHTML = `
        <div class="post-header">
            <strong>${post.author}</strong>
            <span class="post-date">${new Date(post.timestamp).toLocaleString()}</span>
        </div>
        <div class="post-content">${post.content}</div>
    `;

    if (user && post.uid === user.uid) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Eliminar";
        deleteBtn.onclick = () => deletePost(post.timestamp);
        postEl.appendChild(deleteBtn);
    }

    feedContainer.appendChild(postEl);
}

/* =========================
   BORRAR POST
   ========================= */

function deletePost(timestamp) {
    const user = window.getCurrentUser();
    if (!user) return;

    const postsRef = firebase.database().ref("posts");

    postsRef.once("value", (snapshot) => {
        snapshot.forEach((child) => {
            const post = child.val();
            if (post.timestamp === timestamp && post.uid === user.uid) {
                child.ref.remove();
            }
        });
    });
}
