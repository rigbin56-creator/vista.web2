/**
 * js/auth.js
 * Manejo robusto de Autenticación y Sincronización
 */

// Exponer funciones globalmente
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.initAuth = initAuth;

// Estado actual del usuario
let currentUserProfile = null;

function initAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Usuario detectado → verificar whitelist
            checkWhitelist(user.email);
        } else {
            // No hay usuario
            currentUserProfile = null;
            handleLogoutState();
        }
    });
}

function checkWhitelist(email) {
    firebase.database().ref('allowedUsers').once('value')
        .then(snapshot => {
            const users = snapshot.val();
            const safeEmail = email.replace(/\./g, '_');

            if (users && users[safeEmail]) {
                const role = users[safeEmail]; // rigbin / candy
                loginSuccess(role, email);
            } else {
                alert("Acceso denegado. Tu email no está autorizado.");
                firebase.auth().signOut();
                handleLogoutState();
            }
        })
        .catch(err => {
            console.error("Error verificando whitelist:", err);
            handleLogoutState();
        });
}

function loginSuccess(role, email) {
    console.log("✅ Autorizado como:", role);

    // Guardar perfil en memoria
    currentUserProfile = {
        id: role,
        email: email,
        ...CONFIG.PROFILES[role]
    };

    // Actualizar UI
    if (typeof window.updateUIForLogin === 'function') {
        window.updateUIForLogin(currentUserProfile);
    }

    // Cargar feed si existe
    if (typeof window.initFeedListeners === 'function') {
        window.initFeedListeners();
    }
}

function handleLogoutState() {
    if (typeof window.updateUIForLogout === 'function') {
        window.updateUIForLogout();
    }

    // Si estamos en el feed, mostrar bloqueo
    const feedContainer = document.getElementById('feedContainer');
    if (feedContainer) {
        feedContainer.innerHTML = `
            <div style="text-align:center; padding:50px; color:var(--text-dim);">
                🔒 <strong>Contenido Privado</strong><br><br>
                Debes iniciar sesión para ver los recuerdos.
            </div>
        `;
    }
}

// --- ACCIONES DEL USUARIO ---

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(() => {
            console.log("Login exitoso");
            // NO forzamos reload acá, dejamos que onAuthStateChanged maneje todo
        })
        .catch((error) => {
            console.error("Error login:", error);
            alert("Error al iniciar sesión: " + error.message);
        });
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.reload();
    });
}

// Helper para otros scripts
window.getCurrentUser = () => currentUserProfile;

// Inicializar automáticamente
initAuth();
