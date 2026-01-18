/**
 * js/config.js
 * Configuración global e INICIALIZACIÓN DE FIREBASE
 */

const CONFIG = {
    firebaseConfig: {
        apiKey: "AIzaSyBUdWBsR8quP0CMJoq57Iejte6WgcY6RPA",
        authDomain: "mi-web-de-recuerdos.firebaseapp.com",
        databaseURL: "https://mi-web-de-recuerdos-default-rtdb.firebaseio.com",
        projectId: "mi-web-de-recuerdos",
        storageBucket: "mi-web-de-recuerdos.firebasestorage.app",
        messagingSenderId: "40238788337",
        appId: "1:40238788337:web:6e87395335471a822c8350"
    },

    PROFILES: {
        'rigbin': { name: 'Rigbin', avatar: 'assets/avatars/rigbin.jpeg', color: '#bd7ccf', link: 'rigbin.html' },
        'candy':  { name: 'Candy',  avatar: 'assets/avatars/candy.jpeg',  color: '#ff9ce0', link: 'candy.html' }
    }
};

// --- INICIALIZACIÓN CENTRALIZADA (CRÍTICO) ---
// Esto asegura que Firebase exista antes de que cualquier otro script corra.
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(CONFIG.firebaseConfig);
    console.log("🔥 Firebase inicializado en config.js");
} else if (typeof firebase === 'undefined') {
    console.error("❌ ERROR: El SDK de Firebase no se ha cargado en el HTML.");
}
