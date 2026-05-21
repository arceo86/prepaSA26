process.stdout.setEncoding('utf8');
const fs = require('fs');
const path = require('path');


// RUTAS
const historiaDir = path.join(__dirname, 'HISTORIA');
const jsonFile = path.join(historiaDir, 'lista.json');

// PALABRAS CLAVE PARA DETECTAR CATEGORÍAS
const categoriaKeywords = {
    
    "PRIMEROS DIAS": ["PRIMER DIA"],
    "ESCOLTA": ["ESCOLTA", "ENTRADA"],
    "REUNIONES": ["REUNION"],
    "DIA DE MUERTOS": ["DIA DE MUERTO", "MUERTOS"],
    "SEPTIEMBRE": ["SEPT"],
    "NOVIEMBRE": ["NOV", "20 NOV"],
    "AVENTURA": ["AVENTURA"],
    "AMIGOS": ["AMIX", "ALUMN"],
    "RECONOCIMIENTOS": ["RECONO"],
    "PADRES": ["PLATICA", "PADRES", "PAPAS "]
};
function utf8Fix(texto){

    return Buffer
    .from(texto, 'latin1')
    .toString('utf8')
    .normalize('NFC');
}
function limpiarTexto(texto) {

    return texto
    .normalize("NFC")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Â/g, "");
}
// LEER ARCHIVOS DE HISTORIA
function obtenerFotosDelDirectorio() {
    try {
      return fs.readdirSync(historiaDir, { encoding: 'utf8' })
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
          const categoria = utf8Fix(detectarCategoria(foto));
            
            // CREAR CATEGORÍA SI NO EXISTE
            if (!datos.categorias[categoria]) {
                datos.categorias[categoria] = [];
            }
            
            datos.categorias[categoria].push(utf8Fix(foto));
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
fs.writeFileSync(
    jsonFile,
JSON.stringify(datos, null, 2),
    { encoding: 'utf8' }
);
    console.log("📁 Galería actualizada correctamente en: lista.json\n");
    
    // MOSTRAR ESTRUCTURA
    console.log("📊 Estructura actual:");
    Object.entries(datos.categorias).forEach(([categoria, fotos]) => {
        console.log(`   ${categoria}: ${fotos.length} foto(s)`);
    });
}

// EJECUTAR INICIAL
console.log("🚀 Iniciando monitoreo de galería en tiempo real...\n");
actualizarGaleria();

// MONITOREO CONFIABLE EN TIEMPO REAL
let fotosPrevias = new Set(obtenerFotosDelDirectorio());
let intervaloMonitoreo = null;

function monitorearCambios() {
    const fotosActuales = new Set(obtenerFotosDelDirectorio());
    
    // COMPARAR CON LAS PREVIAS
    const fotosNuevas = [...fotosActuales].filter(foto => !fotosPrevias.has(foto));
    const fotosEliminadas = [...fotosPrevias].filter(foto => !fotosActuales.has(foto));
    
    if (fotosNuevas.length > 0 || fotosEliminadas.length > 0) {
        if (fotosNuevas.length > 0) {
            console.log(`\n⏰ Se detectaron ${fotosNuevas.length} foto(s) nueva(s):`);
            fotosNuevas.forEach(foto => console.log(`   → ${foto}`));
        }
        if (fotosEliminadas.length > 0) {
            console.log(`\n⏰ Se detectaron ${fotosEliminadas.length} foto(s) eliminada(s):`);
            fotosEliminadas.forEach(foto => console.log(`   → ${foto}`));
        }
        
        actualizarGaleria();

        fotosPrevias = new Set(fotosActuales);
    }
}


// VERIFICAR CAMBIOS CADA 2 SEGUNDOS
intervaloMonitoreo = setInterval(monitorearCambios, 2000);

console.log("👁️  Monitoreando carpeta HISTORIA cada 2 segundos...\n");
console.log("Presiona Ctrl+C para detener\n");
