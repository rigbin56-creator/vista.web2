/**
 * js/ui.js
 * Fase 3 Final: UI Control, Modales, Lightbox Estructurado.
 */

window.initUI = initUI;
window.updateUIForLogin = updateUIForLogin;
window.updateUIForLogout = updateUIForLogout;
window.openImgBB = openImgBB;

/* =========================
   LIGHTBOX LOGIC
   ========================= */
window.lightbox = {
    open: function(type, url, text, author, date, avatar, profileLink) {
        const lb = document.getElementById('mediaLightbox');
        if(!lb) return;

        // 1. Llenar Header
        document.getElementById('lbAvatar').src = avatar || CONFIG.ICONS.default_avatar;
        document.getElementById('lbName').textContent = author;
        document.getElementById('lbName').href = profileLink;
        document.getElementById('lbProfileLink').href = profileLink;
        document.getElementById('lbDate').textContent = date;
        document.getElementById('lbText').textContent = text;

        // 2. Preparar Contenido
        const contentDiv = document.getElementById('lbContent');
        contentDiv.innerHTML = '';
        lb.classList.remove('scroll-mode');

        let html = '';
        let isScrollable = false;

        switch(type) {
            case 'tiktok':
                const tiktokId = url.split('/video/')[1]?.split('?')[0];
                html = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${tiktokId}" style="min-width: 325px;">
                            <section>Cargando TikTok...</section>
                        </blockquote>`;
                isScrollable = true;
                break;

            case 'instagram':
                const instaId = url.match(/(?:p|reel)\/([a-zA-Z0-9_-]+)/)?.[1];
                html = `<iframe src="https://www.instagram.com/p/${instaId}/embed" width="100%" height="600" frameborder="0" style="background:white"></iframe>`;
                isScrollable = true;
                break;

            case 'shorts':
                const shortsId = url.split('shorts/')[1]?.split('?')[0];
                html = `<iframe src="https://www.youtube.com/embed/${shortsId}?autoplay=1" width="100%" height="100%" frameborder="0" allowfullscreen style="aspect-ratio:9/16; max-width:400px; margin:auto; display:block;"></iframe>`;
                isScrollable = true;
                break;

            case 'twitter':
                html = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
                isScrollable = true;
                break;

            case 'video':
                html = `<video src="${url}" controls autoplay style="max-width:100%; max-height:100%"></video>`;
                break;

            default: // image
                html = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain">`;
                break;
        }

        // 3. Inyectar y Activar
        contentDiv.innerHTML = isScrollable ? `<div class="media-wrapper-lb">${html}</div>` : html;

        if (isScrollable) {
            lb.classList.add('scroll-mode');
            // Recargar scripts si es necesario
            if(type === 'tiktok') reloadScript('https://www.tiktok.com/embed.js');
            if(type === 'twitter' && window.twttr) window.twttr.widgets.load();
        }

        lb.classList.add('active');
        document.body.style.overflow = 'hidden'; // Bloquear fondo
    },

    close: function() {
        const lb = document.getElementById('mediaLightbox');
        if(lb) {
            lb.classList.remove('active');
            lb.classList.remove('scroll-mode');
            document.getElementById('lbContent').innerHTML = '';
            document.body.style.overflow = '';
        }
    }
};

function reloadScript(src) {
    const old = document.querySelector(`script[src="${src}"]`);
    if(old) old.remove();
    const s = document.createElement('script');
    s.src = src;
    document.body.appendChild(s);
}

/* =========================
   UI HELPERS
   ========================= */
function openImgBB() {
    const m = document.getElementById('imgbbModal');
    if(m) m.classList.add('active');
}

window.closePublishPanel = () => {
    document.getElementById('publishPanel').classList.remove('active');
};

function initUI() {
    const fab = document.getElementById('fabBtn');
    if(fab) fab.onclick = () => document.getElementById('publishPanel').classList.add('active');

    const profileBtn = document.getElementById('headerProfileBtn');
    if(profileBtn) {
        profileBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('profileDropdown').classList.toggle('active');
        };
    }

    document.addEventListener('click', () => {
        const d = document.getElementById('profileDropdown');
        if(d) d.classList.remove('active');
    });

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
        img.src = user.avatar || CONFIG.ICONS.default_avatar;
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

    if(img) { img.style.display = 'none'; img.src = ''; }
    if(ph) ph.style.display = 'flex';
    if(loginBtn) loginBtn.style.display = 'flex';
    if(logoutBtn) logoutBtn.style.display = 'none';
    if(fab) fab.classList.add('hidden');
    if(myProfile) myProfile.style.display = 'none';
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('baul_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function applyStoredTheme() {
    if(localStorage.getItem('baul_theme') === 'light') document.body.classList.add('light-mode');
}
