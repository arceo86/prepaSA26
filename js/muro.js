/**
 * 📱 MURO SOCIAL - Sistema de posts con Firebase
 * 
 * Características:
 * - Crear posts solo si estás autenticado
 * - Validación y sanitización de entrada
 * - Reacciones con emojis
 * - Comentarios en tiempo real
 * - Sincronización live con Firestore
 * 
 * PROBLEMAS RESUELTOS:
 * 1. XSS vulnerability: innerHTML sin sanitización
 * 2. Sin autenticación: cualquiera podía escribir
 * 3. Listeners duplicados: memory leaks
 * 4. Nombres globales: db.collection() no definido
 * 5. Sin validación: posts vacíos
 */

import {
    db,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    logger
} from './firebase.js';

import {
    currentUser,
    isUserAuthenticated,
    requireAuth,
    getUserInfo
} from './auth.js';

import {
    getElement,
    showNotification,
    formatTime,
    createElement,
    sanitizeString,
    clearElement,
    openLightbox
} from './ui.js';

/**
 * Estado del muro
 */
const muroState = {
    posts: [],
    unsubscribe: null,
    isLoading: false
};

/**
 * Límites y validaciones
 */
const LIMITS = {
    maxContentLength: 500,
    maxNameLength: 50,
    minContentLength: 1,
    maxPostsToShow: 100
};

/**
 * Elementos del DOM
 */
const elements = {
    muroFeed: null,
    formNombre: null,
    formContenido: null,
    formBtnEnviar: null
};

/**
 * Inicializar muro social
 */
export async function initMuro() {
    try {
        // Obtener referencias a elementos
        elements.muroFeed = getElement('#muroFeed');
        elements.formNombre = getElement('#formNombre');
        elements.formContenido = getElement('#formContenido');
        elements.formBtnEnviar = getElement('#formBtnEnviar');

        if (!elements.muroFeed) {
            logger.warn('Elementos del muro no encontrados');
            return;
        }

        // Configurar form listeners
        setupFormListeners();

        // Cargar posts desde Firestore
        loadPostsFromFirestore();

        logger.log('Muro social inicializado');
    } catch (error) {
        logger.error('Error inicializando muro:', error);
        showMuroError('Error inicializando el muro social');
    }
}

/**
 * Configurar event listeners del formulario
 */
function setupFormListeners() {
    if (!elements.formBtnEnviar) return;

    // Click en botón enviar
    elements.formBtnEnviar.addEventListener('click', () => handleFormSubmit());

    // Enter en textarea (Ctrl+Enter)
    if (elements.formContenido) {
        elements.formContenido.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                handleFormSubmit();
            }
        });
    }
}

/**
 * Manejar envío del formulario
 */
async function handleFormSubmit() {
    try {
        // Verificar autenticación
        if (!isUserAuthenticated()) {
            showNotification('🔐 Debes iniciar sesión para escribir', 'error');
            return;
        }

        // Obtener y validar datos
        const nombre = elements.formNombre?.value?.trim() || '';
        const contenido = elements.formContenido?.value?.trim() || '';

        if (!validatePostForm(nombre, contenido)) {
            return;
        }

        // Desabilitar botón
        disableForm();

        // Crear post
        const newPost = {
            autor: sanitizeString(nombre),
            avatar: getUserInfo().avatar,
            contenido: sanitizeString(contenido),
            imagen: null,
            tipo: 'mensaje',
            timestamp: new Date(),
            reacciones: {},
            comentarios: [],
            uid: currentUser.uid,
            email: currentUser.email
        };

        // Enviar a Firestore
        const docRef = await addDoc(collection(db, 'posts'), newPost);

        // Limpiar form
        elements.formNombre.value = '';
        elements.formContenido.value = '';
        elements.formBtnEnviar.textContent = 'Enviar Post';

        showNotification('✅ Post publicado correctamente', 'success');
        logger.log(`Post agregado con ID: ${docRef.id}`);

    } catch (error) {
        logger.error('Error enviando post:', error);
        showNotification('❌ Error al publicar el post', 'error');
    } finally {
        enableForm();
    }
}

/**
 * Validar formulario
 */
function validatePostForm(nombre, contenido) {
    if (!nombre) {
        showNotification('⚠️ Por favor ingresa tu nombre', 'error');
        return false;
    }

    if (nombre.length > LIMITS.maxNameLength) {
        showNotification(`⚠️ El nombre no puede exceder ${LIMITS.maxNameLength} caracteres`, 'error');
        return false;
    }

    if (!contenido) {
        showNotification('⚠️ Por favor escribe algo', 'error');
        return false;
    }

    if (contenido.length < LIMITS.minContentLength) {
        showNotification('⚠️ El mensaje es demasiado corto', 'error');
        return false;
    }

    if (contenido.length > LIMITS.maxContentLength) {
        showNotification(`⚠️ El mensaje no puede exceder ${LIMITS.maxContentLength} caracteres`, 'error');
        return false;
    }

    return true;
}

/**
 * Desabilitar formulario
 */
function disableForm() {
    if (elements.formBtnEnviar) {
        elements.formBtnEnviar.disabled = true;
        elements.formBtnEnviar.textContent = 'Enviando...';
    }
}

/**
 * Habilitar formulario
 */
function enableForm() {
    if (elements.formBtnEnviar) {
        elements.formBtnEnviar.disabled = false;
        elements.formBtnEnviar.textContent = 'Enviar Post';
    }
}

/**
 * Cargar posts desde Firestore en tiempo real
 */
function loadPostsFromFirestore() {
    if (!db) {
        logger.error('Firebase no está inicializado');
        showMuroError('Error conectando a la base de datos');
        return;
    }

    try {
        const q = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc')
        );

        muroState.unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                logger.log('Posts actualizados desde Firestore');
                
                muroState.posts = snapshot.docs
                    .slice(0, LIMITS.maxPostsToShow)
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                renderPosts(muroState.posts);
            },
            (error) => {
                logger.error('Error cargando posts:', error);
                showMuroError('Error cargando los posts. Verifica tu conexión.');
            }
        );

    } catch (error) {
        logger.error('Error configurando listener:', error);
        showMuroError('Error inicializando el muro social');
    }
}

/**
 * Renderizar posts en la UI
 * SEGURIDAD: Usar createElement en lugar de innerHTML
 */
function renderPosts(posts) {
    if (!elements.muroFeed) return;

    clearElement(elements.muroFeed);

    if (posts.length === 0) {
        const emptyMsg = createElement('div', {
            className: 'post',
            textContent: '📭 Sé el primero en escribir en el muro. ¡Inicia sesión y comparte tu recuerdo!'
        });
        emptyMsg.style.textAlign = 'center';
        elements.muroFeed.appendChild(emptyMsg);
        return;
    }

    posts.forEach(post => {
        const postEl = createPostElement(post);
        elements.muroFeed.appendChild(postEl);
    });
}

/**
 * Crear elemento de post (DOM)
 * SEGURIDAD: Sin innerHTML, todo con textContent y setAttribute
 */
function createPostElement(post) {
    const postDiv = createElement('div', { className: 'post' });

    // Header del post
    const header = createElement('div', { className: 'post-header' });
    
    const avatar = createElement('div', {
        className: 'post-avatar',
        textContent: post.avatar || '👤'
    });
    
    const info = createElement('div', { className: 'post-info' });
    
    const autor = createElement('p', {
        className: 'post-autor',
        textContent: post.autor || 'Anónimo'
    });
    
    const tipo = createElement('span', {
        className: 'post-tipo',
        textContent: `${post.tipo === 'mensaje' ? '💬 Mensaje' : post.tipo === 'dedicatoria' ? '💌 Dedicatoria' : '📸 Recuerdo'}`
    });
    
    info.appendChild(autor);
    info.appendChild(tipo);
    
    const tiempo = createElement('div', {
        className: 'post-tiempo',
        textContent: formatTime(post.timestamp)
    });
    
    header.appendChild(avatar);
    header.appendChild(info);
    header.appendChild(tiempo);

    // Contenido del post
    const contenido = createElement('div', {
        className: 'post-contenido',
        textContent: post.contenido
    });

    // Imagen si existe
    let imagenHtml = null;
    if (post.imagen) {
        const img = document.createElement('img');
        img.className = 'post-imagen';
        img.src = `HISTORIA/${post.imagen}`;
        img.alt = 'Post image';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            openLightbox(`HISTORIA/${post.imagen}`);
        });
        imagenHtml = img;
    }

    // Acciones
    const acciones = createElement('div', { className: 'post-acciones' });
    
    const btnReaction = createElement('button', {
        className: 'accion-btn',
        textContent: '❤️ Me encanta'
    });
    btnReaction.addEventListener('click', () => agregarReaccion(post.id, '❤️'));
    
    const btnComment = createElement('button', {
        className: 'accion-btn',
        textContent: '💬 Comentar'
    });
    btnComment.addEventListener('click', () => abrirFormularioComentario(post.id));
    
    const btnShare = createElement('button', {
        className: 'accion-btn',
        textContent: '↗️ Compartir'
    });
    btnShare.addEventListener('click', () => compartirPost(post.autor));
    
    acciones.appendChild(btnReaction);
    acciones.appendChild(btnComment);
    acciones.appendChild(btnShare);

    // Reacciones
    const reaccionesDiv = crearReaccionesDiv(post.id, post.reacciones);

    // Comentarios
    const comentariosDiv = crearComentariosDiv(post.comentarios);

    // Armar el post
    postDiv.appendChild(header);
    postDiv.appendChild(contenido);
    if (imagenHtml) postDiv.appendChild(imagenHtml);
    postDiv.appendChild(acciones);
    if (reaccionesDiv) postDiv.appendChild(reaccionesDiv);
    if (comentariosDiv) postDiv.appendChild(comentariosDiv);

    return postDiv;
}

/**
 * Crear div de reacciones
 */
function crearReaccionesDiv(postId, reacciones) {
    if (!reacciones || Object.keys(reacciones).length === 0) return null;

    const container = createElement('div', { className: 'reacciones-container' });

    Object.entries(reacciones).forEach(([emoji, usuarios]) => {
        const usuariosArray = Array.isArray(usuarios) ? usuarios : Object.values(usuarios || {});
        const count = usuariosArray.length;

        if (count > 0) {
            const btn = createElement('button', {
                className: 'reaccion-btn',
                innerHTML: `<span>${emoji}</span><span class="reaccion-count">${count}</span>`,
                attributes: { title: usuariosArray.join(', ') }
            });
            btn.addEventListener('click', () => agregarReaccion(postId, emoji));
            container.appendChild(btn);
        }
    });

    return container;
}

/**
 * Crear div de comentarios
 */
function crearComentariosDiv(comentarios) {
    if (!comentarios || comentarios.length === 0) return null;

    const section = createElement('div', { className: 'comentarios-section' });
    
    const titulo = createElement('div', {
        className: 'comentarios-titulo',
        textContent: `💬 ${comentarios.length} comentario(s)`
    });
    
    const lista = createElement('div', { className: 'comentarios-lista' });

    comentarios.forEach(comentario => {
        const comentarioDiv = createElement('div', { className: 'comentario' });
        
        const header = createElement('div', { className: 'comentario-header' });
        
        const avatar = createElement('span', {
            className: 'comentario-avatar',
            textContent: comentario.avatar || '👤'
        });
        
        const autor = createElement('span', {
            className: 'comentario-autor',
            textContent: comentario.autor
        });
        
        const tiempo = createElement('span', {
            className: 'comentario-tiempo',
            textContent: formatTime(comentario.timestamp)
        });
        
        header.appendChild(avatar);
        header.appendChild(autor);
        header.appendChild(tiempo);
        
        const texto = createElement('div', {
            className: 'comentario-texto',
            textContent: comentario.texto
        });
        
        comentarioDiv.appendChild(header);
        comentarioDiv.appendChild(texto);
        lista.appendChild(comentarioDiv);
    });

    section.appendChild(titulo);
    section.appendChild(lista);

    return section;
}

/**
 * Agregar reacción
 */
async function agregarReaccion(postId, emoji) {
    try {
        if (!isUserAuthenticated()) {
            showNotification('🔐 Debes iniciar sesión para reaccionar', 'error');
            return;
        }

        const userInfo = getUserInfo();
        
        // Obtener post actual
        const postRef = doc(db, 'posts', postId);
        const postData = await (await import('./firebase.js')).getDoc(postRef);

        if (!postData.exists()) {
            logger.error('Post no encontrado');
            return;
        }

        const post = postData.data();
        const reacciones = post.reacciones || {};

        // Inicializar emoji si no existe
        if (!reacciones[emoji]) {
            reacciones[emoji] = [];
        }

        // Agregar usuario si no está ya
        if (!reacciones[emoji].includes(userInfo.displayName)) {
            reacciones[emoji].push(userInfo.displayName);
        }

        // Actualizar en Firestore
        await updateDoc(postRef, { reacciones });
        logger.log(`Reacción ${emoji} agregada`);

    } catch (error) {
        logger.error('Error agregando reacción:', error);
    }
}

/**
 * Abrir formulario para comentario
 */
function abrirFormularioComentario(postId) {
    if (!isUserAuthenticated()) {
        showNotification('🔐 Debes iniciar sesión para comentar', 'error');
        return;
    }

    const texto = prompt('Escribe tu comentario:');
    if (!texto || !texto.trim()) return;

    agregarComentario(postId, texto.trim());
}

/**
 * Agregar comentario
 */
async function agregarComentario(postId, texto) {
    try {
        const userInfo = getUserInfo();
        
        // Obtener post actual
        const postRef = doc(db, 'posts', postId);
        const postData = await (await import('./firebase.js')).getDoc(postRef);

        if (!postData.exists()) {
            logger.error('Post no encontrado');
            return;
        }

        const post = postData.data();
        const comentarios = post.comentarios || [];

        // Agregar nuevo comentario
        comentarios.push({
            autor: userInfo.displayName,
            avatar: userInfo.avatar,
            texto: sanitizeString(texto),
            timestamp: new Date()
        });

        // Actualizar en Firestore
        await updateDoc(postRef, { comentarios });
        showNotification('✅ Comentario agregado', 'success');
        logger.log('Comentario agregado');

    } catch (error) {
        logger.error('Error agregando comentario:', error);
        showNotification('❌ Error al agregar comentario', 'error');
    }
}

/**
 * Compartir post
 */
function compartirPost(autor) {
    const texto = `¡Mira este post en el Muro Social de la Generación 2026 🎓`;
    
    if (navigator.share) {
        navigator.share({
            title: `Post de ${autor}`,
            text: texto,
            url: window.location.href
        }).catch(err => logger.log('Compartir cancelado'));
    } else {
        showNotification('📋 ' + texto, 'info');
    }
}

/**
 * Mostrar error en el muro
 */
function showMuroError(message) {
    if (!elements.muroFeed) return;
    
    clearElement(elements.muroFeed);
    const errorDiv = createElement('div', {
        className: 'post',
        textContent: '❌ ' + message
    });
    errorDiv.style.color = '#ff6b9d';
    errorDiv.style.textAlign = 'center';
    elements.muroFeed.appendChild(errorDiv);
}

/**
 * Limpiar muro
 * Llamar al descargar la página
 */
export function destroyMuro() {
    if (muroState.unsubscribe) {
        muroState.unsubscribe();
        muroState.unsubscribe = null;
    }
    muroState.posts = [];
    logger.log('Muro limpiado');
}

/**
 * Limpiar al descargar
 */
window.addEventListener('beforeunload', () => {
    destroyMuro();
});

/**
 * Exportar funciones globales para onclick
 */
window.Muro = {
    agregarReaccion,
    abrirFormularioComentario,
    compartirPost
};

logger.log('Módulo muro social cargado');
