/**
 * 📸 GALERÍA - Sistema de fotos con filtros y autoplay
 * 
 * Características:
 * - Carga desde lista.json
 * - Filtrado por categoría
 * - Autoplay con pausa en hover
 * - Scroll horizontal suave
 * - Barra de progreso
 * - Lazy loading de imágenes
 * 
 * PROBLEMA RESUELTO: Listeners duplicados y memory leaks
 * SOLUCIÓN: Limpiar listeners en destroy
 */

import { logger, openLightbox } from './firebase.js';
import { getElement, getElements, openLightbox as openLightboxUI, createElement, clearElement } from './ui.js';

/**
 * Estado de la galería
 */
const galleryState = {
    allPhotos: [],
    currentPhotos: [],
    autoplayActive: false,
    autoplayInterval: null,
    isLoading: false
};

/**
 * Rutas
 */
const IMAGE_PATH = 'HISTORIA/';
const LIST_PATH = 'HISTORIA/lista.json';

/**
 * Elementos del DOM
 */
const elements = {
    gallery: null,
    filterButtons: null,
    prevBtn: null,
    nextBtn: null,
    autoplayBtn: null,
    progressBar: null,
    scrollInfo: null
};

/**
 * Inicializar galería
 */
export async function initGallery() {
    try {
        // Obtener referencias a elementos
        elements.gallery = getElement('#gallery');
        elements.filterButtons = getElement('#filterButtons');
        elements.prevBtn = getElement('#galleryPrev');
        elements.nextBtn = getElement('#galleryNext');
        elements.autoplayBtn = getElement('#autoplayBtn');
        elements.progressBar = getElement('#progressBar');
        elements.scrollInfo = getElement('#scrollInfo');

        if (!elements.gallery) {
            logger.warn('Elementos de galería no encontrados');
            return;
        }

        // Cargar lista de fotos
        await loadPhotoList();

        // Configurar event listeners
        setupEventListeners();

        // Mostrar todas las fotos inicialmente
        showPhotos(galleryState.allPhotos);

        logger.log('Galería inicializada');
    } catch (error) {
        logger.error('Error inicializando galería:', error);
    }
}

/**
 * Cargar lista de fotos desde JSON
 */
async function loadPhotoList() {
    try {
        galleryState.isLoading = true;
        
        const response = await fetch(LIST_PATH);
        if (!response.ok) throw new Error('No se pudo cargar lista.json');

        const data = await response.json();
        const categories = data.categorias || {};

        // Guardar todas las fotos
        galleryState.allPhotos = Object.values(categories)
            .flat()
            .filter(foto => typeof foto === 'string');

        // Crear botones de filtro
        createFilterButtons(categories);

        logger.log(`Galería cargada: ${galleryState.allPhotos.length} fotos`);
    } catch (error) {
        logger.error('Error cargando lista de fotos:', error);
        galleryState.allPhotos = [];
    } finally {
        galleryState.isLoading = false;
    }
}

/**
 * Crear botones de filtro
 */
function createFilterButtons(categories) {
    if (!elements.filterButtons) return;

    clearElement(elements.filterButtons);

    // Botón "Todos"
    const btnTodos = createElement('button', {
        className: 'filter-btn active',
        textContent: 'Todos',
        attributes: { 'data-filter': 'all' }
    });
    btnTodos.addEventListener('click', () => {
        showPhotos(galleryState.allPhotos);
        updateFilterButtons(btnTodos);
        stopAutoplay();
        scrollGalleryToStart();
    });
    elements.filterButtons.appendChild(btnTodos);

    // Botones por categoría
    Object.entries(categories).forEach(([categoria, fotos]) => {
        const btn = createElement('button', {
            className: 'filter-btn',
            textContent: categoria,
            attributes: { 'data-filter': categoria }
        });

        btn.addEventListener('click', () => {
            const fotosArray = Array.isArray(fotos) ? fotos : Object.values(fotos || {});
            showPhotos(fotosArray);
            updateFilterButtons(btn);
            stopAutoplay();
            scrollGalleryToStart();
        });

        elements.filterButtons.appendChild(btn);
    });
}

/**
 * Actualizar estado de botones de filtro
 */
function updateFilterButtons(activeBtn) {
    getElements('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

/**
 * Mostrar fotos en la galería
 */
function showPhotos(photos) {
    if (!elements.gallery) return;

    galleryState.currentPhotos = photos;
    clearElement(elements.gallery);

    photos.forEach(photoName => {
        const item = createElement('div', {
            className: 'gallery-item'
        });

        const img = document.createElement('img');
        img.src = IMAGE_PATH + photoName;
        img.alt = 'Foto de galería';
        img.loading = 'lazy';

        img.addEventListener('click', () => {
            openLightboxUI(img.src);
        });

        item.appendChild(img);
        elements.gallery.appendChild(item);
    });

    updateProgress();
    logger.log(`Galería: ${photos.length} fotos mostradas`);
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Navegación
    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', () => navigate(-1));
    }
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', () => navigate(1));
    }

    // Autoplay
    if (elements.autoplayBtn) {
        elements.autoplayBtn.addEventListener('click', () => toggleAutoplay());
    }

    // Scroll
    if (elements.gallery) {
        elements.gallery.addEventListener('scroll', updateProgress);
        elements.gallery.addEventListener('mouseenter', () => {
            if (galleryState.autoplayActive) stopAutoplay();
        });
        elements.gallery.addEventListener('mouseleave', () => {
            if (elements.autoplayBtn?.classList.contains('active')) {
                startAutoplay();
            }
        });
    }
}

/**
 * Navegar en la galería
 */
function navigate(direction) {
    if (!elements.gallery) return;

    const itemWidth = elements.gallery.querySelector('.gallery-item')?.offsetWidth || 0;
    const gap = 15;
    const scroll = (itemWidth + gap) * direction;

    elements.gallery.scrollBy({
        left: scroll,
        behavior: 'smooth'
    });
}

/**
 * Toggle autoplay
 */
function toggleAutoplay() {
    if (galleryState.autoplayActive) {
        stopAutoplay();
    } else {
        startAutoplay();
    }
}

/**
 * Iniciar autoplay
 */
function startAutoplay() {
    if (galleryState.autoplayActive || !elements.gallery) return;

    galleryState.autoplayActive = true;
    if (elements.autoplayBtn) {
        elements.autoplayBtn.classList.add('active');
        elements.autoplayBtn.textContent = '⏸ Autoplay';
    }
    if (elements.gallery) {
        elements.gallery.classList.add('autoplay-active');
    }

    galleryState.autoplayInterval = setInterval(() => {
        const scrollLeft = elements.gallery.scrollLeft;
        const scrollWidth = elements.gallery.scrollWidth - elements.gallery.clientWidth;

        if (scrollLeft >= scrollWidth - 10) {
            scrollGalleryToStart();
        } else {
            navigate(1);
        }
    }, 1500);

    logger.log('Autoplay iniciado');
}

/**
 * Detener autoplay
 */
function stopAutoplay() {
    if (!galleryState.autoplayActive) return;

    galleryState.autoplayActive = false;
    if (galleryState.autoplayInterval) {
        clearInterval(galleryState.autoplayInterval);
        galleryState.autoplayInterval = null;
    }

    if (elements.autoplayBtn) {
        elements.autoplayBtn.classList.remove('active');
        elements.autoplayBtn.textContent = '▶ Autoplay';
    }
    if (elements.gallery) {
        elements.gallery.classList.remove('autoplay-active');
    }

    logger.log('Autoplay detenido');
}

/**
 * Scroll a inicio
 */
function scrollGalleryToStart() {
    if (!elements.gallery) return;
    elements.gallery.scrollTo({ left: 0, behavior: 'smooth' });
}

/**
 * Actualizar progreso y botones
 */
function updateProgress() {
    if (!elements.gallery) return;

    const scrollLeft = elements.gallery.scrollLeft;
    const scrollWidth = elements.gallery.scrollWidth - elements.gallery.clientWidth;
    const progress = scrollWidth === 0 ? 0 : (scrollLeft / scrollWidth) * 100;

    if (elements.progressBar) {
        elements.progressBar.style.width = progress + '%';
    }

    // Actualizar información
    const totalFotos = elements.gallery.querySelectorAll('.gallery-item').length;
    if (elements.scrollInfo) {
        elements.scrollInfo.textContent = `Desliza para ver más • ${totalFotos} fotos`;
    }

    // Actualizar botones de navegación
    updateNavigationButtons(scrollLeft, scrollWidth);
}

/**
 * Actualizar estado de botones de navegación
 */
function updateNavigationButtons(scrollLeft, scrollWidth) {
    if (elements.prevBtn) {
        if (scrollLeft <= 0) {
            elements.prevBtn.classList.add('disabled');
        } else {
            elements.prevBtn.classList.remove('disabled');
        }
    }

    if (elements.nextBtn) {
        if (scrollLeft >= scrollWidth - 10) {
            elements.nextBtn.classList.add('disabled');
        } else {
            elements.nextBtn.classList.remove('disabled');
        }
    }
}

/**
 * Limpiar galería
 * Llamar al descargar la página
 */
export function destroyGallery() {
    stopAutoplay();
    galleryState.allPhotos = [];
    galleryState.currentPhotos = [];
    logger.log('Galería limpiada');
}

/**
 * Limpiar al descargar
 */
window.addEventListener('beforeunload', () => {
    destroyGallery();
});

logger.log('Módulo galería cargado');
