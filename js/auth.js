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
            const role = snapshot.val(); // Devuelve 'rigbin' o 'candy'
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
    // CORRECCIÓN: id debe ser el role para que CONFIG.PROFILES[post.authorId] funcione
    currentUserProfile = {
        id: role,
        email: email,
        ...CONFIG.PROFILES[role]
    };

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
        .then(() => {
            // Dejamos que onAuthStateChanged maneje la carga
        })
        .catch(error => alert("Error: " + error.message));
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.reload();
    });
}

window.getCurrentUser = () => currentUserProfile;
