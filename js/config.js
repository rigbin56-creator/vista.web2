/**
 * js/config.js
 * Configuración global, Usuarios y Preferencias
 */

const CONFIG = {
    // 🔥 CONFIGURACIÓN REAL DE TU FIREBASE 🔥
    firebaseConfig: {
        apiKey: "AIzaSyBUdWBsR8quP0CMJoq57Iejte6WgcY6RPA",
        authDomain: "mi-web-de-recuerdos.firebaseapp.com",
        databaseURL: "https://mi-web-de-recuerdos-default-rtdb.firebaseio.com",
        projectId: "mi-web-de-recuerdos",
        storageBucket: "mi-web-de-recuerdos.firebasestorage.app",
        messagingSenderId: "40238788337",
        appId: "1:40238788337:web:6e87395335471a822c8350"
    },

    // --- USUARIOS DEL SITIO ---
    AUTHORS: {
        'rigbin': {
            id: 'rigbin',
            name: 'Rigbin',
            avatar: 'assets/avatars/rigbin.jpeg',
            color: '#bd7ccf',
            profileLink: 'rigbin.html'
        },
        'candy': {
            id: 'candy',
            name: 'Candy',
            avatar: 'assets/avatars/candy.jpeg',
            color: '#ff9ce0',
            profileLink: 'candy.html'
        }
    }
};

// --- SISTEMA DE USUARIO (LOGIN SIMULADO) ---
const UserSystem = {
    getCurrentUser: () => {
        const stored = localStorage.getItem('baul_user');
        return stored ? CONFIG.AUTHORS[stored] : CONFIG.AUTHORS['rigbin'];
    },

    login: (userId) => {
        if (CONFIG.AUTHORS[userId]) {
            localStorage.setItem('baul_user', userId);
            location.reload();
        }
    }
};

// --- SISTEMA DE PREFERENCIAS (MODO OSCURO / CLARO) ---
const ThemeSystem = {
    init: () => {
        const savedTheme = localStorage.getItem('baul_theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }
    },

    toggle: () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('baul_theme', isLight ? 'light' : 'dark');
        return isLight ? '☀️' : '🌙';
    }
};

// Inicializar tema al cargar
ThemeSystem.init();
