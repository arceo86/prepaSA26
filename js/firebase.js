/**
 * 🔥 FIREBASE - Configuración e Inicialización
 * 
 * Módulo que gestiona:
 * - Inicialización única de Firebase
 * - Autenticación con Google
 * - Acceso a Firestore
 * - Manejo de errores
 * 
 * PROBLEMA RESUELTO: Firebase SDK duplicado (líneas 1747-1748 del HTML original)
 * SOLUCIÓN: Inicialización única en este módulo
 */

import { 
    initializeApp,
    getApps,
    getApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import { 
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { 
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDoc,
    deleteDoc,
    limit,
    getDocs,
    where,
    startAt,
    endAt
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Configuración de Firebase
 * ⚠️ SEGURIDAD: En producción, usar variables de entorno
 * Las keys están restringidas en Firebase Console por dominio
 */
const firebaseConfig = {
    apiKey: "AIzaSyBvDDwvOq-p2L2dItuUmgkh8Y7xQxOQEjw",
    authDomain: "grad2026-9547a.firebaseapp.com",
    projectId: "grad2026-9547a",
    storageBucket: "grad2026-9547a.firebasestorage.app",
    messagingSenderId: "541940488857",
    appId: "1:541940488857:web:d709879a78e94654127608",
    measurementId: "G-1YDFNE8QH2"
};

/**
 * Inicializar Firebase
 * - Si ya existe una app, usar esa (evita duplicación)
 * - Si no existe, crear nueva
 */
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

/**
 * Obtener servicios de Firebase
 * - Estos son los singleton que se exportan
 */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Configurar persistencia de sesión
 * Los usuarios permanecerán autenticados aunque cierren la página
 */
setPersistence(auth, browserLocalPersistence)
    .catch(error => console.error('❌ Error configurando persistencia:', error));

/**
 * Exportar funciones de Firestore
 * Para que puedan ser usadas en otros módulos
 */
export {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDoc,
    deleteDoc,
    limit,
    getDocs,
    where,
    startAt,
    endAt
};

/**
 * Exportar funciones de Autenticación
 */
export {
    signInWithPopup,
    signOut,
    onAuthStateChanged
};

/**
 * Logger para debug
 * Ayuda a diagnosticar problemas en desarrollo
 */
export const logger = {
    log: (message) => console.log('✅ ' + message),
    error: (message, error) => console.error('❌ ' + message, error),
    warn: (message) => console.warn('⚠️ ' + message),
    info: (message) => console.info('ℹ️ ' + message)
};

// Confirmación de inicialización
logger.log(`Firebase inicializado en proyecto: ${firebaseConfig.projectId}`);

/**
 * Exportar la instancia de app para referencias futuras
 */
export default app;
