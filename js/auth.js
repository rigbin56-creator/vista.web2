/**
 * js/auth.js
 * Autenticación y Whitelist
 */

// Hacemos las funciones accesibles globalmente para el HTML
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;

let currentUserProfile = null;

function initAuth() {
    const auth = firebase.auth();
    auth.onAuthStateChanged(handleAuthState);
}

function handleAuthState(user) {
    if (user) {
        checkWhitelist(user.email);
    } else {
        currentUserProfile = null;
        if (typeof updateUIForLogout === 'function') updateUIForLogout();
        // Si estamos en feed, mostrar mensaje de que se requiere login
        const feedEl = document.getElementById('feedContainer');
        if (feedEl) feedEl.innerHTML = '<div style="text-align:center; padding:40px;">🔒 Inicia sesión para ver el baúl.</div>';
    }
}

function checkWhitelist(email) {
    // Reemplaza puntos por comas si tu DB las guarda así, o busca directo
    firebase.database().ref('allowedUsers').once('value')
        .then(snapshot => {
            const users = snapshot.val();
            // Lógica simple: verificar si el email existe en el objeto
            if (users && users[email]) {
                const role = users[email];
                loginSuccess(role, email);
            } else {
                alert("Acceso denegado. Tu email no está en la lista.");
                firebase.auth().signOut();
            }
        })
        .catch(err => console.error("Error Whitelist:", err));
}

function loginSuccess(role, email) {
    currentUserProfile = {
        id: role,
        email: email,
        ...CONFIG.PROFILES[role]
    };

    // Actualizar UI
    if (typeof updateUIForLogin === 'function') updateUIForLogin(currentUserProfile);

    // CARGAR EL FEED AHORA QUE TENEMOS PERMISO
    if (typeof window.initFeedListeners === 'function') {
        window.initFeedListeners();
    }
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(error => {
        console.error("Error login:", error);
        alert("Error al iniciar sesión: " + error.message);
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        location.reload();
    });
}

// Exportar para uso en otros scripts
window.getCurrentUser = () => currentUserProfile;
