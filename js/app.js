/**
 * 🎯 APP - Orquestador Principal
 * 
 * Este módulo:
 * - Importa todos los módulos
 * - Inicializa la aplicación
 * - Gestiona el ciclo de vida
 * - Coordina entre módulos
 * 
 * ARQUITECTURA:
 * firebase.js (inicialización base)
 *     ↓
 * auth.js (autenticación)
 * ui.js (utilidades DOM)
 *     ↓
 * countdown.js, gallery.js, muro.js (características)
 *     ↓
 * app.js (orquestador)
 */

// Importar módulos
import { logger } from './firebase.js';
import { initAuthListener, onAuthChange, updateAuthUI } from './auth.js';
import { 
    initLightbox, 
    initHamburgerMenu, 
    initRevealOnScroll, 
    showNotification, 
    getElement 
} from './ui.js';
import { initCountdown } from './countdown.js';
import { initGallery } from './gallery.js';
import { initMuro } from './muro.js';

/**
 * Estado global de la aplicación
 */
const appState = {
    isInitialized: false,
    isReady: false
};

/**
 * Inicializar la aplicación
 * Punto de entrada principal
 */
export async function initApp() {
    try {
        logger.info('Iniciando aplicación...');

        // 1. Esperar a que la autenticación esté lista
        logger.info('Configurando autenticación...');
        await initAuthListener();

        // 2. Configurar escuchador de cambios de autenticación
        onAuthChange((user, isAuthenticated) => {
            logger.log(`Estado de autenticación: ${isAuthenticated ? 'Autenticado' : 'Anónimo'}`);
            updateAuthUI();
            updateMuroVisibility(isAuthenticated);
        });

        // 3. Inicializar componentes UI
        logger.info('Inicializando componentes de UI...');
        initLightbox();
        initHamburgerMenu();
        initRevealOnScroll();
        initMusic();

        // 4. Inicializar características
        logger.info('Inicializando características...');
        initCountdown();
        await initGallery();
        await initMuro();

        // 5. Registrar event listeners globales
        setupGlobalEventListeners();

        // 6. Marcar como inicializado
        appState.isInitialized = true;
        appState.isReady = true;

        logger.log('✅ Aplicación inicializada correctamente');
        showNotification('🎓 ¡Bienvenido a la Ceremonia de Graduación!', 'success', 3000);

    } catch (error) {
        logger.error('Error inicializando aplicación:', error);
        showNotification('❌ Error inicializando la aplicación', 'error', 5000);
        appState.isInitialized = false;
    }
}

/**
 * Actualizar visibilidad del muro según autenticación
 */
function updateMuroVisibility(isAuthenticated) {
    const formContainer = getElement('.post-form-container');
    if (!formContainer) return;

    if (isAuthenticated) {
        formContainer.style.display = 'block';
        // Mostrar mensaje
        const muroSubtitle = getElement('.muro-subtitle');
        if (muroSubtitle) {
            muroSubtitle.textContent = '📱 Comparte tus recuerdos en tiempo real ✨';
        }
    } else {
        formContainer.style.display = 'none';
        // Mostrar hint
        const muroSubtitle = getElement('.muro-subtitle');
        if (muroSubtitle) {
            muroSubtitle.textContent = '🔐 Inicia sesión para escribir en el muro';
        }
    }
}

/**
 * Inicializar música de fondo
 */
function initMusic() {
    const backgroundMusic = getElement('#backgroundMusic');
    const musicToggle = getElement('#musicToggle');

    if (!backgroundMusic || !musicToggle) {
        logger.warn('Elementos de música no encontrados');
        return;
    }

    // Configuración inicial
    backgroundMusic.volume = 0.15;
    backgroundMusic.loop = true;

    /**
     * Intentar reproducir música
     */
    function playMusic() {
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => logger.log('🎵 Música reproduciendo'))
                .catch(err => {
                    // Autoplay bloqueado por navegador - esperar a interacción del usuario
                    logger.warn('⚠️ Autoplay bloqueado. Click para reproducir música');
                });
        }
    }

    // Intentar reproducir al cargar
    window.addEventListener('load', () => {
        playMusic();
    });

    // Permitir reproducir en primer click
    let firstClick = false;
    document.addEventListener('click', () => {
        if (!firstClick && backgroundMusic.paused) {
            firstClick = true;
            playMusic();
        }
    });

    // Toggle música
    let isMuted = false;
    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        isMuted = !isMuted;

        if (isMuted) {
            backgroundMusic.volume = 0;
            musicToggle.classList.add('muted');
            musicToggle.querySelector('.music-icon').textContent = '🔇';
            musicToggle.title = 'Activar música';
        } else {
            backgroundMusic.volume = 0.15;
            musicToggle.classList.remove('muted');
            musicToggle.querySelector('.music-icon').textContent = '🔊';
            musicToggle.title = 'Silenciar música';

            if (backgroundMusic.paused) {
                playMusic();
            }
        }
    });

    logger.log('Música inicializada');
}

/**
 * Configurar event listeners globales
 */
function setupGlobalEventListeners() {
    // Logo clickeable
    const logo = getElement('#logoClickable');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = '#inicio';
        });
    }

    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href !== '#' && href) {
                e.preventDefault();
                const target = getElement(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Prevenir memory leaks en modales
    const modal = getElement('#modalPrivacidad');
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    logger.log('Event listeners globales configurados');
}

/**
 * Abrir modal de privacidad
 * Función global
 */
window.abrirPrivacidad = function() {
    const modal = getElement('#modalPrivacidad');
    if (modal) {
        modal.style.display = 'block';
    }
};

/**
 * Cerrar modal de privacidad
 * Función global
 */
window.cerrarPrivacidad = function() {
    const modal = getElement('#modalPrivacidad');
    if (modal) {
        modal.style.display = 'none';
    }
};

/**
 * Compartir premio
 * Función global
 */
window.compartirPremio = function(premio) {
    const texto = `🏆 Acabo de recibir el premio "${premio}" en la Generación 2026 de Preparatoria San Andrés 🎓`;

    if (navigator.share) {
        navigator.share({
            title: 'Premio Generación 2026',
            text: texto,
            url: window.location.href
        }).catch(err => logger.log('Compartir cancelado'));
    } else {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(`${texto}\n\n${window.location.href}`)
                .then(() => {
                    showNotification(`✅ Texto copiado: "${premio}"`, 'success');
                });
        } else {
            showNotification(`🎉 ${premio}\n\n${texto}`, 'info');
        }
    }
};

/**
 * Obtener estado de la aplicación
 */
export function getAppState() {
    return appState;
}

/**
 * Verificar si la aplicación está lista
 */
export function isAppReady() {
    return appState.isReady;
}

/**
 * Ejecutar cuando el DOM está listo
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

logger.log('Módulo app cargado');
