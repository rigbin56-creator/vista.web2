/**
 * js/ui.js
 * Fase 2: Zoom Avanzado (Vertical Feed), Perfiles Clickeables y Soporte Embeds.
 */

window.updateUIForLogin = updateUIForLogin;
window.updateUIForLogout = updateUIForLogout;
window.initUI = initUI;

/* =========================
   LIGHTBOX AVANZADO (ZOOM)
   ========================= */
window.lightbox = {
    open: function(type, url, text, authorName, date, authorAvatar, authorLink) {
        const lb = document.getElementById('mediaLightbox');
        const content = document.getElementById('lightboxContent');
        const info = document.getElementById('lightboxInfo');
        if(!lb || !content) return;

        // Limpiar
        content.innerHTML = '';
        lb.className = 'lightbox'; // Reset clases

        // 1. Renderizar Contenido según Tipo
        let mediaHtml = '';
        let isVerticalMode = false;

        switch(type) {
            case 'video':
                const v = document.createElement('video');
                v.src = url; v.controls = true; v.autoplay = true;
                v.className = 'lightbox-media';
                content.appendChild(v);
                break;

            case 'shorts':
                // Shorts en Zoom: iframe real interactivo
                const shortsId = url.split('shorts/')[1]?.split('?')[0];
                mediaHtml = `<iframe src="https://www.youtube.com/embed/${shortsId}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%; min-height:80vh;"></iframe>`;
                isVerticalMode = true;
                break;

            case 'tiktok':
                mediaHtml = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${url.split('/video/')[1]?.split('?')[0]}"><section></section></blockquote>`;
                isVerticalMode = true;
                break;

            case 'instagram':
                 const instaId = url.match(/(?:p|reel)\/([a-zA-Z0-9_-]+)/)?.[1];
                 mediaHtml = `<iframe src="https://www.instagram.com/p/${instaId}/embed" width="100%" height="800" frameborder="0" scrolling="no"></iframe>`;
                 isVerticalMode = true;
                 break;

            case 'twitter':
                 mediaHtml = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
                 isVerticalMode = true;
                 break;

            default: // image
                const i = document.createElement('img');
                i.src = url; i.className = 'lightbox-media';
                content.appendChild(i);
                break;
        }

        if (mediaHtml) content.innerHTML = mediaHtml;

        // 2. Configurar Zoom Vertical (Scroll Lock)
        if (isVerticalMode) {
            lb.classList.add('vertical-mode');
            document.body.style.overflow = 'hidden'; // Bloquear scroll página

            // Re-ejecutar scripts externos para que rendericen dentro del lightbox
            if(window.twttr) window.twttr.widgets.load();
            // TikTok script se auto-ejecuta usualmente, si no, se requiere reload manual del script
        } else {
            document.body.style.overflow = '';
        }

        // 3. Renderizar Info del Autor Clickeable
        const avatarHtml = authorAvatar ? `<a href="${authorLink}"><img src="${authorAvatar}" class="lightbox-avatar"></a>` : '';
        const nameHtml = `<a href="${authorLink}" style="color:inherit; text-decoration:none;"><strong>${authorName}</strong></a>`;

        info.innerHTML = `
            <div class="lightbox-header">
                ${avatarHtml}
                <div class="lightbox-meta">
                    ${nameHtml}
                    <span style="opacity:0.7; font-size:0.85em;">• ${date}</span>
                </div>
            </div>
            <div class="lightbox-text">${text}</div>
        `;

        lb.classList.add('active');
    },

    close: function() {
        const lb = document.getElementById('mediaLightbox');
        if(lb) {
            lb.classList.remove('active');
            lb.classList.remove('vertical-mode');
            document.getElementById('lightboxContent').innerHTML = '';

            // Desbloquear scroll
            document.body.style.overflow = '';

            // Pausar videos si había
            const videos = lb.querySelectorAll('video, iframe');
            videos.forEach(v => v.src = '');
        }
    }
};

/* =========================
   UI HELPERS (Mantener)
   ========================= */
window.closePublishPanel = () => {
    const p = document.getElementById('publishPanel');
    if(p) p.classList.remove('active');
};

function initUI() {
    const fab = document.getElementById('fabBtn');
    if(fab) fab.onclick = () => document.getElementById('publishPanel').classList.add('active');

    const profileBtn = document.getElementById('headerProfileBtn');
    if(profileBtn) {
        profileBtn.onclick = (e) => {
            e.stopPropagation();
            const d = document.getElementById('profileDropdown');
            if(d) d.classList.toggle('active');
        };
    }

    document.addEventListener('click', () => {
        const d = document.getElementById('profileDropdown');
        if(d) d.classList.remove('active');
    });

    const lbClose = document.querySelector('.lightbox-close');
    if(lbClose) lbClose.onclick = window.lightbox.close;

    const themeBtn = document.getElementById('themeToggleBtn');
    if(themeBtn) themeBtn.onclick = toggleTheme;

    applyStoredTheme();
}

function updateUIForLogin(user) {
    const img = document.getElementById('headerProfileImg');
    const ph = document.getElementById('headerIconPlaceholder');
    const fab = document.getElementById('fabBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const myProfile = document.getElementById('myProfileLink');

    if(img) {
        img.src = user.avatar || './assets/avatars/default.png';
        img.style.display = 'block';
    }

    if(ph) ph.style.display = 'none';
    if(loginBtn) loginBtn.style.display = 'none';
    if(logoutBtn) logoutBtn.style.display = 'flex';
    if(fab) fab.classList.remove('hidden');

    if(myProfile) {
        myProfile.href = user.link || '#';
        myProfile.style.display = 'flex';
    }
}

function updateUIForLogout() {
    const img = document.getElementById('headerProfileImg');
    const ph = document.getElementById('headerIconPlaceholder');
    const fab = document.getElementById('fabBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const myProfile = document.getElementById('myProfileLink');

    if(img) {
        img.style.display = 'none';
        img.src = '';
    }

    if(ph) ph.style.display = 'flex';
    if(loginBtn) loginBtn.style.display = 'flex';
    if(logoutBtn) logoutBtn.style.display = 'none';
    if(fab) fab.classList.add('hidden');
    if(myProfile) myProfile.style.display = 'none';
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem(
        'baul_theme',
        document.body.classList.contains('light-mode') ? 'light' : 'dark'
    );
}

function applyStoredTheme() {
    if(localStorage.getItem('baul_theme') === 'light') {
        document.body.classList.add('light-mode');
    }
}
