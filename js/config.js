/**
 * js/config.js
 * Configuración global y constantes.
 */

const CONFIG = {
    // Cambiar a 'feed' para redirigir automáticamente al entrar
    START_PAGE: "home",

    // Configuración de usuarios (Base para futura autenticación)
    AUTHORS: {
        rigbin: {
            id: "rigbin",
            name: "Rigbin",
            color: "var(--accent-1)", // Violeta
            avatar: "assets/avatars/rigbin.jpeg",
            profileLink: "rigbin.html"
        },
        candy: {
            id: "candy",
            name: "Candy",
            color: "var(--accent-2)", // Celeste
            avatar: "assets/avatars/candy.jpeg",
            profileLink: "candy.html"
        }
    }
};

// Lógica de redirección inmediata
(function checkRedirect() {
    const path = window.location.pathname;
    const isHome = path.endsWith("index.html") || path.endsWith("/");

    // Si estamos en Home y la config dice Feed, redirigimos
    if (isHome && CONFIG.START_PAGE === "feed") {
        window.location.href = "feed.html";
    }
})();
