const fs = require('fs');
const path = require('path');

// RUTAS
const historiaDir = path.join(__dirname, 'HISTORIA');
const jsonFile = path.join(historiaDir, 'lista.json');

// PALABRAS CLAVE PARA DETECTAR CATEGORÍAS
const categoriaKeywords = {
    "Primer Día": ["PRIMER DIA"],
    "Escolta": ["ESCOLTA", "ENTRADA"],
    "Reuniones": ["REUNION"],
    "Día de Muertos": ["DIA DE MUERTO", "MUERTOS"],
    "Septiembre": ["SEPT"],
    "Noviembre": ["NOV", "20 NOV"],
    "Aventura": ["AVENTURA"],
    "Amigos": ["AMIX", "ALUMN"],
    "Reconocimiento": ["RECONO"],
    "Pláticas": ["PLATICA"]
};

// LEER ARCHIVOS DE HISTORIA
function obtenerFotosDelDirectorio() {
    try {
        return fs.readdirSync(historiaDir)
            .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
            .sort();
    } catch (err) {
        console.error("Error leyendo carpeta:", err);
        return [];
    }
}

// DETECTAR CATEGORÍA POR NOMBRE
function detectarCategoria(nombreArchivo) {
    for (const [categoria, keywords] of Object.entries(categoriaKeywords)) {
        for (const keyword of keywords) {
            if (nombreArchivo.toUpperCase().includes(keyword)) {
                return categoria;
            }
        }
    }
    return "Otros";
}

// ACTUALIZAR JSON
function actualizarGaleria() {
    console.log("📸 Actualizando galería...\n");
    
    // LEER JSON ACTUAL
    let datos;
    try {
        const jsonContent = fs.readFileSync(jsonFile, 'utf8');
        datos = JSON.parse(jsonContent);
    } catch (err) {
        console.log("⚠️  No se encontró lista.json, creando una nueva...");
        datos = { categorias: {} };
    }

    // OBTENER TODAS LAS FOTOS DEL DIRECTORIO
    const fotosDelDirectorio = obtenerFotosDelDirectorio();
    
    // CREAR MAPA DE FOTOS YA EXISTENTES
    const fotosExistentes = new Set();
    Object.values(datos.categorias).forEach(fotos => {
        fotos.forEach(foto => fotosExistentes.add(foto));
    });

    // BUSCAR NUEVAS FOTOS
    let fotosAgregadas = [];
    fotosDelDirectorio.forEach(foto => {
        if (!fotosExistentes.has(foto)) {
            const categoria = detectarCategoria(foto);
            
            // CREAR CATEGORÍA SI NO EXISTE
            if (!datos.categorias[categoria]) {
                datos.categorias[categoria] = [];
            }
            
            datos.categorias[categoria].push(foto);
            fotosAgregadas.push({ foto, categoria });
            console.log(`✅ Agregada: ${foto} → ${categoria}`);
        }
    });

    // MOSTRAR RESUMEN
    console.log("\n" + "=".repeat(50));
    if (fotosAgregadas.length === 0) {
        console.log("✨ No hay nuevas fotos para agregar");
    } else {
        console.log(`✅ ${fotosAgregadas.length} nueva(s) foto(s) agregada(s)`);
    }
    console.log("=".repeat(50) + "\n");

    // GUARDAR JSON ACTUALIZADO
    fs.writeFileSync(jsonFile, JSON.stringify(datos, null, 2), 'utf8');
    console.log("📁 Galería actualizada correctamente en: lista.json\n");
    
    // MOSTRAR ESTRUCTURA
    console.log("📊 Estructura actual:");
    Object.entries(datos.categorias).forEach(([categoria, fotos]) => {
        console.log(`   ${categoria}: ${fotos.length} foto(s)`);
    });
}

// EJECUTAR
actualizarGaleria();
