/**
 * 🔐 AUTENTICACIÓN - Google Login y Gestión de Sesión
 * 
 * Módulo que gestiona:
 * - Login/Logout con Google
 * - Persistencia de sesión
 * - Estado del usuario actual
 * - UI del usuario autenticado
 * 
 * PROBLEMA RESUELTO: Sin autenticación en versión original
 * - El muro social era anónimo y vulnerable
 * - Cualquiera podía escribir mensajes falsos
 * SOLUCIÓN: Autenticación obligatoria con Google
 */

import {
    auth,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    logger
} from './firebase.js';

/**
 * Estado global del usuario
 */
export let currentUser = null;
export let isAuthenticated = false;

/**
 * Listeners para cambios de autenticación
 */
const authListeners = [];

/**
 * Registrar listener para cambios de autenticación
 * Permite que otros módulos se suscriban a cambios
 */
export function onAuthChange(callback) {
    authListeners.push(callback);
    return () => {
        const index = authListeners.indexOf(callback);
        if (index > -1) authListeners.splice(index, 1);
    };
}

/**
 * Notificar a todos los listeners
 */
function notifyAuthChange() {
    authListeners.forEach(callback => callback(currentUser, isAuthenticated));
}

/**
 * Login con Google
 * 
 * FLUJO:
 * 1. Mostrar popup de Google
 * 2. Obtener credenciales
 * 3. Firebase maneja la sesión automáticamente
 * 4. Notificar cambio a otros módulos
 */
export async function loginWithGoogle() {
    try {
        logger.info('Iniciando login con Google...');
        
        const result = await signInWithPopup(auth, googleProvider);
        
        currentUser = result.user;
        isAuthenticated = true;
        
        logger.log(`Usuario autenticado: ${currentUser.displayName}`);
        notifyAuthChange();
        
        return currentUser;
    } catch (error) {
        // Ignorar errores de cancelación del usuario
        if (error.code === 'auth/popup-closed-by-user') {
            logger.info('Login cancelado por el usuario');
        } else {
            logger.error('Error en login:', error);
        }
        throw error;
    }
}

/**
 * Logout
 * 
 * FLUJO:
 * 1. Desconectar de Firebase
 * 2. Limpiar estado global
 * 3. Notificar cambio
 */
export async function logout() {
    try {
        logger.info('Cerrando sesión...');
        
        await signOut(auth);
        
        currentUser = null;
        isAuthenticated = false;
        
        logger.log('Sesión cerrada correctamente');
        notifyAuthChange();
    } catch (error) {
        logger.error('Error en logout:', error);
        throw error;
    }
}

/**
 * Inicializar escucha de estado de autenticación
 * 
 * Se llama en app.js para:
 * - Obtener usuario al cargar la página
 * - Mantener sesión persistente
 * - Actualizar UI cuando cambia el usuario
 */
export function initAuthListener() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                isAuthenticated = true;
                logger.log(`Sesión restaurada: ${user.displayName}`);
            } else {
                currentUser = null;
                isAuthenticated = false;
                logger.info('No hay usuario autenticado');
            }
            
            notifyAuthChange();
            resolve(user);
        });

        return unsubscribe;
    });
}

/**
 * Obtener datos del usuario actual
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Verificar si usuario está autenticado
 */
export function isUserAuthenticated() {
    return isAuthenticated;
}

/**
 * Obtener información del usuario para mostrar
 */
export function getUserInfo() {
    if (!currentUser) return null;
    
    return {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Usuario',
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        avatar: getAvatarFromEmail(currentUser.email)
    };
}

/**
 * Generar emoji avatar basado en email
 * Si no hay foto, usar emoji consistente
 */
function getAvatarFromEmail(email) {
    const emojis = ['🎓', '👨‍🎓', '👩‍🎓', '🏆', '⭐', '🌟', '✨', '🎉'];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
}

/**
 * Requerir autenticación
 * Lanza error si el usuario no está autenticado
 * Útil para acciones que requieren usuario autenticado
 */
export function requireAuth() {
    if (!isAuthenticated) {
        throw new Error('Debes estar autenticado para realizar esta acción');
    }
    return currentUser;
}

/**
 * Mostrar UI de autenticación
 * Se llama cuando el usuario inicia sesión
 */
export function updateAuthUI() {
    const authContainer = document.querySelector('.auth-container');
    if (!authContainer) return;

    if (isAuthenticated && currentUser) {
        const userInfo = getUserInfo();
        
        authContainer.innerHTML = `
            <div class="user-profile">
                ${userInfo.photoURL ? `<img src="${userInfo.photoURL}" alt="${userInfo.displayName}">` : `<span>${userInfo.avatar}</span>`}
                <span>${userInfo.displayName}</span>
            </div>
            <button class="btn-logout" onclick="Auth.logout()">Logout</button>
        `;
    } else {
        authContainer.innerHTML = `
            <button class="btn-login" onclick="Auth.loginWithGoogle()">
                🔐 Google Login
            </button>
        `;
    }
}

/**
 * Exportar funciones globalmente para onclick
 * window.Auth permite usar Auth.logout() en HTML
 */
window.Auth = {
    loginWithGoogle,
    logout,
    isUserAuthenticated,
    getCurrentUser
};

logger.log('Módulo de autenticación cargado');
