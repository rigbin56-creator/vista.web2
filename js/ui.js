/**
 * js/ui.js
 * Corrección: Fallback defensivo en updateUIForLogin
 */

window.updateUIForLogin = updateUIForLogin;
window.updateUIForLogout = updateUIForLogout;
window.initUI = initUI;

window.lightbox = {
    open: function(type, url, text, author, date) {
        const lb = document.getElementById('mediaLightbox');
        const content = document.getElementById('lightboxContent');
        const info = document.getElementById('lightboxInfo');
        if(!lb || !content) return;

        content.innerHTML = '';
        if (type === 'video') {
            const v = document.createElement('video');
            v.src = url; v.controls = true; v.autoplay = true;
            v.className = 'lightbox-media';
            content.appendChild(v);
        } else {
            const i = document.createElement('img');
            i.src = url; i.className = 'lightbox-media';
            content.appendChild(i);
        }

        info.innerHTML = `<strong>${author}</strong> • ${date}<br><br>${text}`;
        lb.classList.add('active');
    },
    close: function() {
        const lb = document.getElementById('mediaLightbox');
        if(lb) {
            lb.classList.remove('active');
            document.getElementById('lightboxContent').innerHTML = '';
        }
    }
};

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
        // 🔽 CORRECCIÓN: Fallback para evitar error si no hay avatar
        img.src = user.avatar || 'assets/avatars/default.png';
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

    if(img) img.style.display = 'none';
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
