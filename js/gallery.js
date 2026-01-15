/**
 * js/gallery.js
 * Galería grid con lightbox simple.
 */

// Simulación de base de datos de imágenes
// IMPORTANTE: Pon imágenes reales en assets/photos/ para verlas
const galleryData = [
    { type: 'img', src: 'assets/avatars/rigbin.jpeg', caption: 'Foto de perfil Rigbin' },
    { type: 'img', src: 'assets/avatars/candy.jpeg', caption: 'Foto de perfil Candy' },
    // Agrega más aquí: { type: 'img', src: 'assets/photos/foto1.jpg', caption: 'Día de parque' },
];

const galleryGrid = document.getElementById('galleryGrid');

function renderGallery() {
    galleryGrid.innerHTML = '';

    if(galleryData.length === 0) {
        galleryGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:var(--text-dim)">Aún no hay fotos.</p>';
        return;
    }

    galleryData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.style.backgroundImage = `url('${item.src}')`;
        div.onclick = () => openLightbox(index);
        galleryGrid.appendChild(div);
    });
}

// Lightbox (Visor a pantalla completa)
function openLightbox(index) {
    const item = galleryData[index];
    // Crear modal al vuelo
    const modal = document.createElement('div');
    modal.className = 'lightbox';
    modal.innerHTML = `
        <div class="lightbox-content">
            <img src="${item.src}">
            <p>${item.caption}</p>
            <button class="btn" onclick="this.closest('.lightbox').remove()">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

document.addEventListener('DOMContentLoaded', renderGallery);
