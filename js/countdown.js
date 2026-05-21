/**
 * ⏱️ COUNTDOWN - Contador regresivo para la ceremonia
 * 
 * Características:
 * - Contador en tiempo real
 * - Fecha configurable
 * - Auto-actualización
 * - Limpieza de intervalo al descargar
 * 
 * PROBLEMA RESUELTO: setInterval sin limpiar al descargar
 * SOLUCIÓN: Guardar intervalId y limpiar en beforeunload
 */

import { logger } from './firebase.js';

/**
 * Configuración del countdown
 * Cambiar la fecha aquí para eventos futuros
 */
const EVENT_DATE = new Date('July 10, 2026 10:00:00').getTime();

/**
 * Referencias a elementos del DOM
 */
const countdownElements = {
    dias: document.getElementById('dias'),
    horas: document.getElementById('horas'),
    minutos: document.getElementById('minutos'),
    segundos: document.getElementById('segundos')
};

/**
 * ID del intervalo para limpiarlo después
 */
let countdownInterval = null;

/**
 * Actualizar display del countdown
 */
function updateCountdown() {
    const ahora = new Date().getTime();
    const diferencia = EVENT_DATE - ahora;

    // Si el evento ya pasó
    if (diferencia <= 0) {
        setAllCounters(0);
        clearCountdown();
        logger.info('¡La ceremonia ha comenzado!');
        return;
    }

    // Calcular tiempo restante
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    // Actualizar UI
    updateCounter('dias', dias);
    updateCounter('horas', horas);
    updateCounter('minutos', minutos);
    updateCounter('segundos', segundos);
}

/**
 * Actualizar valor de un contador individual
 */
function updateCounter(type, value) {
    const element = countdownElements[type];
    if (!element) return;

    const formattedValue = String(value).padStart(2, '0');
    element.textContent = formattedValue;
}

/**
 * Establecer todos los contadores en 0
 */
function setAllCounters(value = 0) {
    Object.keys(countdownElements).forEach(key => {
        updateCounter(key, value);
    });
}

/**
 * Iniciar countdown
 * Llamar una sola vez al cargar la página
 */
export function initCountdown() {
    // Verificar que los elementos existan
    const missingElements = Object.entries(countdownElements)
        .filter(([_, el]) => !el)
        .map(([name]) => name);
    
    if (missingElements.length > 0) {
        logger.warn(`Elementos del countdown no encontrados: ${missingElements.join(', ')}`);
        return;
    }

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    countdownInterval = setInterval(updateCountdown, 1000);
    
    logger.log('Countdown iniciado');
}

/**
 * Limpiar countdown
 * Llamar cuando se deja la página
 */
export function clearCountdown() {
    if (countdownInterval !== null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        logger.log('Countdown limpiado');
    }
}

/**
 * Limpiar intervalo al descargar la página
 * Evita memory leak
 */
window.addEventListener('beforeunload', () => {
    clearCountdown();
});

/**
 * Obtener tiempo restante formateado
 * Útil para compartir en redes sociales
 */
export function getFormattedTime() {
    const ahora = new Date().getTime();
    const diferencia = EVENT_DATE - ahora;

    if (diferencia <= 0) {
        return '¡El evento ha comenzado!';
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    let texto = '';
    if (dias > 0) texto += `${dias}d `;
    if (horas > 0) texto += `${horas}h `;
    texto += `${minutos}m`;

    return texto.trim();
}

/**
 * Obtener porcentaje completado del evento
 * Para barras de progreso, por ejemplo
 */
export function getEventProgress() {
    // Suponer que el evento es el 10 de julio 2026
    // Contar desde el inicio del año escolar (agosto 2023)
    const inicio = new Date('August 1, 2023').getTime();
    const fin = EVENT_DATE;
    const ahora = new Date().getTime();

    const total = fin - inicio;
    const pasado = ahora - inicio;
    const progreso = Math.max(0, Math.min(100, (pasado / total) * 100));

    return Math.round(progreso);
}

logger.log('Módulo countdown cargado');
