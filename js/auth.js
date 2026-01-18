/**
 * js/auth.js
 * Corrección de mapeo de perfiles y authorId
 */

window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.initAuth = initAuth;

let currentUserProfile = null;

function initAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            checkWhitelist(user.email);
        } else {
            currentUserProfile = null;
            handleLogoutState();
        }
    });
}

function checkWhitelist(email) {
    const safeEmail = email.replace(/\./g, '_');

    firebase.database().ref('allowedUsers/' + safeEmail).once('value')
        .then(snapshot => {
            const data = snapshot.val();

            // 🔴 FIX REAL: puede ser string o objeto
            const role = typeof data === 'string' ? data : data?.role;

            if (role) {
                loginSuccess(role, email);
            } else {
                alert("Acceso denegado.");
                firebase.auth().signOut();
            }
        })
        .catch(() => handleLogoutState());
}

function loginSuccess(role, email) {
    // ✅ id SIEMPRE string ('rigbin' / 'candy')
    currentUserProfile = {
        id: role,
        email: email,
        ...CONFIG.PROFILES[role]
    };

    console.log("PERFIL LOGUEADO:", currentUserProfile);

    if (typeof window.updateUIForLogin === 'function') {
        window.updateUIForLogin(currentUserProfile);
    }

    if (typeof window.initFeedListeners === 'function') {
        window.initFeedListeners();
    }
}

function handleLogoutState() {
    if (typeof window.updateUIForLogout === 'function') {
        window.updateUIForLogout();
    }
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .catch(error => alert("Error: " + error.message));
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.reload();
    });
}

window.getCurrentUser = () => currentUserProfile;
