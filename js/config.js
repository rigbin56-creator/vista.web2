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
        'rigbin': { name: 'Rigbin', avatar: './assets/avatars/rigbin.png', color: '#bd7ccf', link: 'rigbin.html' },
        'candy':  { name: 'Candy',  avatar: './assets/avatars/candy.png',  color: '#ff9ce0', link: 'candy.html' },
        'mayo':  { name: 'Mayo',  avatar: './assets/avatars/default.png',  color: '#ff9ce0', link: 'xd.html' }
    }
};

// 🔽 NUEVO: Rutas de Iconos (PNG/SVG) 🔽
    ICONS: {
        like_empty: 'assets/icons/like_empty.png',
        like_full:  'assets/icons/like_full.png',
        fav_empty:  'assets/icons/fav_empty.png',
        fav_full:   'assets/icons/fav_full.png',
        trash:      'assets/icons/trash.png',
        upload:     'assets/icons/upload_img.png',
        close:      'assets/icons/close.png',
        arrow_up:   'assets/icons/arrow_up.png',
        default_avatar: 'assets/avatars/default.png'
    }
};

// Inicialización Crítica
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(CONFIG.firebaseConfig);
    console.log("🔥 Firebase inicializado en config.js");
} else if (typeof firebase === 'undefined') {
    console.error("❌ ERROR: Firebase SDK no cargado.");
}
