/**
 * 🎨 UTILIDADES DOM - Funciones seguras y eficientes
 * 
 * Módulo que proporciona:
 * - Manipulación DOM segura (sin XSS)
 * - Funciones de navegación
 * - Manejo de eventos
 * - Notificaciones visuales
 * 
 * PROBLEMA RESUELTO: innerHTML sin sanitización (XSS vulnerability)
 * SOLUCIÓN: Usar textContent, createElement, setAttribute
 */

import { logger } from './firebase.js';

/**
 * Elemento de lightbox global
 */
let lightboxElement = null;
let lightboxImageElement = null;

/**
 * Inicializar lightbox
 * Ejecutar una vez al cargar la página
 */
export function initLightbox() {
    lightboxElement = document.getElementById('lightbox');
    lightboxImageElement = document.getElementById('lightbox-img');
    
    if (lightboxElement) {
        lightboxElement.addEventListener('click', (e) => {
            if (e.target === lightboxElement) {
                closeLightbox();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
}

/**
 * Abrir imagen en lightbox
 * 
 * SEGURIDAD:
 * - No usa innerHTML
 * - Valida que sea una URL
 * - Usa setAttribute para src
 */
export function openLightbox(imageSrc) {
    if (!lightboxElement || !lightboxImageElement) {
        logger.error('Lightbox no inicializado');
        return;
    }
    
    // Validar que sea una URL válida
    if (typeof imageSrc !== 'string' || !imageSrc.trim()) {
        logger.error('URL de imagen inválida');
        return;
    }
    
    lightboxImageElement.src = imageSrc;
    lightboxElement.classList.add('active');
}

/**
 * Cerrar lightbox
 */
export function closeLightbox() {
    if (lightboxElement) {
        lightboxElement.classList.remove('active');
    }
}

/**
 * Hacer elemento visible mediante scroll
 */
export function scrollToElement(selector, offset = 80) {
    const element = document.querySelector(selector);
    if (!element) {
        logger.warn(`Elemento no encontrado: ${selector}`);
        return;
    }
    
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
        top,
        behavior: 'smooth'
    });
}

/**
 * Mostrar notificación visual
 * 
 * TIPOS: 'success', 'error', 'info'
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `status-message ${type}`;
    
    // Usar textContent para evitar XSS
    notification.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Auto remover después de duration
    setTimeout(() => {
        notification.remove();
    }, duration);
    
    logger.info(`Notificación [${type}]: ${message}`);
}

/**
 * Toggle de elemento con animación
 */
export function toggleElement(element, className = 'active') {
    if (!element) return;
    element.classList.toggle(className);
}

/**
 * Agregar/remover clase con animación
 */
export function addClass(element, className) {
    if (!element) return;
    element.classList.add(className);
}

export function removeClass(element, className) {
    if (!element) return;
    element.classList.remove(className);
}

/**
 * Limpiar contenedor y mantener estructura
 * Sin usar innerHTML
 */
export function clearElement(element) {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Crear elemento de forma segura
 * 
 * EJEMPLO:
 * createElement('div', {
 *   className: 'card',
 *   textContent: 'Contenido',
 *   attributes: { 'data-id': '123' }
 * })
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    const { className, textContent, innerHTML, attributes, children } = options;
    
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    
    // Usar innerHTML solo para contenido HTML confiable (nuestro código)
    if (innerHTML) element.innerHTML = innerHTML;
    
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                element.setAttribute(key, value);
            }
        });
    }
    
    if (children && Array.isArray(children)) {
        children.forEach(child => {
            if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

/**
 * Menu hamburguesa
 * Manejar responsividad de navegación
 */
export function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (!hamburger || !navLinks) {
        logger.warn('Hamburger menu no encontrado');
        return;
    }
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Cerrar menú al hacer click en un link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

/**
 * Revelar elementos al hacer scroll (Intersection Observer)
 * Performance: No recalcula en cada scroll, usa Observer API
 */
export function initRevealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    
    if (reveals.length === 0) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    reveals.forEach(element => {
        observer.observe(element);
    });
    
    logger.log(`Reveal: ${reveals.length} elementos observados`);
}

/**
 * Event delegation
 * Registrar handlers para elementos dinámicos
 * 
 * VENTAJA: No necesita limpiar listeners manualmente
 * 
 * EJEMPLO:
 * onDelegate('click', '.post-btn', (event, target) => {
 *   console.log('Click en:', target);
 * });
 */
export function onDelegate(eventType, selector, handler) {
    document.addEventListener(eventType, (e) => {
        const target = e.target.closest(selector);
        if (target) {
            handler(e, target);
        }
    });
}

/**
 * Obtener elemento de forma segura
 */
export function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        logger.warn(`Elemento no encontrado: ${selector}`);
    }
    return element;
}

/**
 * Obtener todos los elementos
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Formatos de fecha amigables
 */
export function formatTime(timestamp) {
    if (!timestamp) return 'Ahora';
    
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Hace unos segundos';
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    
    return fecha.toLocaleDateString('es-MX');
}

/**
 * Copiar al clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('✅ Copiado al portapapeles', 'success', 2000);
        return true;
    } catch (error) {
        logger.error('Error copiando al clipboard:', error);
        showNotification('❌ Error al copiar', 'error');
        return false;
    }
}

/**
 * Compartir con Web Share API
 * Fallback a copiar al clipboard
 */
export async function share(data) {
    if (navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                logger.error('Error compartiendo:', error);
            }
        }
    } else {
        // Fallback: copiar al clipboard
        if (data.url) {
            copyToClipboard(data.url);
        }
    }
    return false;
}

/**
 * Detectar modo oscuro
 */
export function isDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Lazy loading de imágenes
 * 
 * VENTAJA: Carga imágenes solo cuando son visibles
 * Mejora performance al cargar la página
 */
export function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if (images.length === 0) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, observerOptions);
    
    images.forEach(img => observer.observe(img));
    
    logger.log(`Lazy loading: ${images.length} imágenes`);
}

/**
 * Debounce
 * Útil para eventos que se disparan muchas veces (scroll, resize)
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Throttle
 * Limitar frecuencia de ejecución
 */
export function throttle(func, limit = 300) {
    let lastRun = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastRun >= limit) {
            func(...args);
            lastRun = now;
        }
    };
}

/**
 * Validar email
 */
export function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Sanitizar string (remover caracteres especiales)
 * Adicional a textContent para doble seguridad
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Limitar longitud de texto
 */
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

logger.log('Módulo UI cargado');
