/**
 * js/auth.js
 * Manejo robusto de Autenticación y Sincronización
 */

// Exponer funciones globalmente
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.initAuth = initAuth;

let currentUserProfile = null;

function initAuth() {
    // Escuchar cambios de sesión en tiempo real
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Usuario detectado por Firebase -> Verificar Whitelist
            checkWhitelist(user.email);
        } else {
            // No hay usuario -> Limpiar estado
            currentUserProfile = null;
            handleLogoutState();
        }
    });
}

function checkWhitelist(email) {
    // Referencia a la lista de permitidos
    firebase.database().ref('allowedUsers').once('value')
        .then(snapshot => {
            const users = snapshot.val();
            // Buscar si el email existe en la DB
            if (users && users[email]) {
                const role = users[email]; // 'rigbin' o 'candy'
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

    // 1. Guardar perfil en memoria
    currentUserProfile = {
        id: role,
        email: email,
        ...CONFIG.PROFILES[role]
    };

    // 2. Actualizar la UI (Botones, Avatar)
    if (typeof window.updateUIForLogin === 'function') {
        window.updateUIForLogin(currentUserProfile);
    }

    // 3. Si estamos en la página del Feed, forzar la carga AHORA
    if (typeof window.initFeedListeners === 'function') {
        window.initFeedListeners();
    }
}

function handleLogoutState() {
    if (typeof window.updateUIForLogout === 'function') {
        window.updateUIForLogout();
    }

    // Si estamos en el feed y no hay usuario, mostrar mensaje de bloqueo
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
        .then((result) => {
            // LOGIN EXITOSO MANUAL
            // Recargamos la página para asegurar que todo esté limpio y sincronizado
            console.log("Login exitoso, recargando...");
            window.location.reload();
        })
        .catch((error) => {
            console.error("Error login:", error);
            alert("Error al iniciar sesión: " + error.message);
        });
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.reload(); // Recargar para limpiar cache y UI
    });
}

// Helper para obtener usuario actual
window.getCurrentUser = () => currentUserProfile;
// Inicializar autenticación automáticamente al cargar
initAuth();
