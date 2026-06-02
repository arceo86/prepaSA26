// ===== GALERÍA MÁGICA AUTOMÁTICA =====
async function cargarGaleria() {
    const usuario = "arceo86";
    const repo = "prepaSA26";
    const ruta = "HISTORIA/";
    
    // Categorías según palabras clave
    const keywords = {
    "PRIMEROS DIAS": ["PRIMER", "BIENVENIDA", "INICIO", "ADAPTACION"],
    "ESCOLTA": ["ESCOLTA", "BANDERA", "HONORES"],
    "REUNIONES": ["REUNION", "JUNTA", "ASAMBLEA"],
    "DIA DE MUERTOS": ["MUERTOS", "ALTAR", "CATRINA", "OFRENDA"],
    "SEPTIEMBRE": ["SEPT", "INDEPENDENCIA", "GRITO", "PATRIAS"],
    "NOVIEMBRE": ["NOV", "REVOLUCION"],
    "AVENTURA": ["AVENTURA", "EXCURSION", "PASEO", "VIAJE"],
    "AMIGOS": ["AMIX", "AMIGOS", "ALUMNOS"],
    "RECONOCIMIENTOS": ["RECONO", "DIPLOMA", "PREMIO", "CONSTANCIA"],
    "MAESTROS": ["DOCENTE", "MAESTRA", "PROFE", "MAESTRO"],
    "PADRES": ["PADRES", "PAPAS", "MAMAS", "FAMILIA", "FAM"]
};

    try {
        // 1. Obtener archivos desde GitHub API
        const res = await fetch(`https://api.github.com/repos/${usuario}/${repo}/contents/${ruta}`);
        const archivos = await res.json();
        
        let datos = { categorias: {} };

        // 2. Clasificar archivos
        archivos.forEach(archivo => {
            if (archivo.name.match(/\.(jpg|jpeg|png|webp|gif|JPG|PNG|WEBP)$/i)) {
                let categoriaDetectada = "Otros";
                
                for (const [cat, keys] of Object.entries(keywords)) {
                    if (keys.some(k => archivo.name.toUpperCase().includes(k))) {
                        categoriaDetectada = cat;
                        break;
                    }
                }
                
                if (!datos.categorias[categoriaDetectada]) datos.categorias[categoriaDetectada] = [];
                datos.categorias[categoriaDetectada].push(archivo.name);
            }
        });

        // 3. Fusionar con Firebase y Mostrar
        window.onSnapshot(window.collection(window.db, "galeria"), (snapshot) => {
            let fotosFirebase = [];
            snapshot.forEach(doc => { if(doc.data().imagen) fotosFirebase.push(doc.data().imagen); });
            
            // Si hay fotos de Firebase, las ponemos en "Alumnos 📸"
            if (fotosFirebase.length > 0) datos.categorias["Alumnos 📸"] = fotosFirebase;
            
            renderizarUI(datos);
        });

    } catch (err) {
        console.error("Error en Galería Mágica:", err);
    }
}

function renderizarUI(datos) {
    const filterButtons = document.getElementById("filterButtons");
    filterButtons.innerHTML = "";
    
    // Botón Todos
    const btnTodos = document.createElement("button");
    btnTodos.className = "filter-btn active";
    btnTodos.textContent = "Todos";
    btnTodos.onclick = () => mostrarTodo(datos);
    filterButtons.appendChild(btnTodos);
    
    // Botones de categorías
    Object.keys(datos.categorias).forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.textContent = cat;
        btn.onclick = () => mostrarFotos(datos.categorias[cat]);
        filterButtons.appendChild(btn);
    });
}

function mostrarFotos(lista) {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    lista.forEach(item => {
        const div = document.createElement("div");
        div.className = "gallery-item";
        // Si empieza con http es de Firebase, si no, es de HISTORIA/
        const src = item.startsWith("http") ? item : ("HISTORIA/" + item);
        div.innerHTML = `<img src="${src}" loading="lazy" onclick="abrirLightbox('${src}')">`;
        gallery.appendChild(div);
    });
}

// Inicializar
cargarGaleria();
