/**
 * js/ui.js
 * Interfaz Gráfica y Eventos
 */

 // Agrega esto al inicio de js/ui.js si no estaba explícito
 window.updateUIForLogin = updateUIForLogin;
 window.updateUIForLogout = updateUIForLogout;
 window.initUI = initUI;

// Hacer Lightbox global
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

// Funciones globales de UI
window.closePublishPanel = () => document.getElementById('publishPanel').classList.remove('active');
window.updateUIForLogin = updateUIForLogin;
window.updateUIForLogout = updateUIForLogout;

function initUI() {
    const fab = document.getElementById('fabBtn');
    if(fab) fab.onclick = () => document.getElementById('publishPanel').classList.add('active');

    // Header Profile Dropdown
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

    // Lightbox Close
    const lbClose = document.querySelector('.lightbox-close');
    if(lbClose) lbClose.onclick = window.lightbox.close;

    // Tema
    const themeBtn = document.getElementById('themeToggleBtn');
    if(themeBtn) themeBtn.onclick = toggleTheme;
    applyStoredTheme();
}

function updateUIForLogin(user) {
    const img = document.getElementById('headerProfileImg');
    const ph = document.getElementById('headerIconPlaceholder');
    const fab = document.getElementById('fabBtn');

    if(img) { img.src = user.avatar; img.style.display = 'block'; }
    if(ph) ph.style.display = 'none';
    if(fab) fab.classList.remove('hidden');

    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';

    const myProfile = document.getElementById('myProfileLink');
    if(myProfile) { myProfile.href = user.link; myProfile.style.display = 'flex'; }
}

function updateUIForLogout() {
    const img = document.getElementById('headerProfileImg');
    const ph = document.getElementById('headerIconPlaceholder');
    const fab = document.getElementById('fabBtn');

    if(img) img.style.display = 'none';
    if(ph) ph.style.display = 'flex';
    if(fab) fab.classList.add('hidden');

    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('myProfileLink').style.display = 'none';
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('baul_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function applyStoredTheme() {
    if(localStorage.getItem('baul_theme') === 'light') document.body.classList.add('light-mode');
}
