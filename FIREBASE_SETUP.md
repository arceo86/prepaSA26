# ⚙️ Configuración de Firebase - Paso a Paso

## El problema
Los posts se quedaban en "Enviando..." porque la API de Firebase no estaba configurada correctamente.

## ✅ Solución Implementada
He reescrito el código para usar la **API modular de Firebase** (versión 10.12.2), que es más confiable y moderna.

---

## 🔧 PASOS PARA HACER FUNCIONAR:

### PASO 1: Abre Firebase Console
1. Ve a https://console.firebase.google.com/
2. Selecciona el proyecto **grad2026-9547a**

### PASO 2: Crea la Colección "posts"
1. En el panel izquierdo, haz clic en **Firestore Database**
2. Si ves botón "Crear base de datos", haz clic
3. Selecciona modo: **Empezar en modo de prueba** (para desarrollo)
4. Selecciona ubicación: **us-central1** (o la más cercana)
5. Clic en **Crear**

### PASO 3: Crea la Colección
Una vez que Firestore esté listo:
1. Haz clic en el botón **+ Crear colección**
2. Nombre: `posts` (exactamente así)
3. Haz clic en **Siguiente**
4. En los campos del documento, rellena UN EJEMPLO:
   - Hacer clic en **Auto-ID** para generar ID automático
   - Agrega estos campos:

```
autor: "Prueba" (texto)
avatar: "👤" (texto)
contenido: "Mensaje de prueba" (texto)
comentarios: [] (array)
imagen: null (nulo)
reacciones: {} (mapa)
tipo: "mensaje" (texto)
timestamp: [fecha actual] (hora del servidor)
```

5. Haz clic en **Guardar**

### PASO 4: Actualiza las Reglas de Seguridad
1. Aún en Firestore, ve a la pestaña **Reglas**
2. Reemplaza el contenido con esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite lectura/escritura en posts mientras estés en desarrollo
    match /posts/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Haz clic en **Publicar**

### PASO 5: Prueba en la Página
1. Abre `index.html` en tu navegador
2. Presiona **F12** para abrir DevTools → **Console**
3. Busca el mensaje: ✅ **Firebase inicializado correctamente**
4. Si lo ves, ¡Firebase funciona! 🎉
5. Prueba a escribir un post en la sección "Muro Social"

---

## 🐛 Si Algo Falla

### Error: "Error cargando posts"
- Verifica que la colección "posts" existe en Firestore
- Revisa las Reglas de Seguridad (deben permitir read/write)

### Consola muestra: "❌ Firebase no está inicializado"
- Espera 2-3 segundos y recarga (Ctrl+F5)
- Verifica que tienes conexión a internet

### El botón sigue en "Enviando..."
- Abre **DevTools → Console** (F12)
- Busca mensajes de error rojo
- Copia el error y comparte

---

## 📱 Estructura de Datos

Cada post en Firestore se ve así:

```json
{
  "id": "auto-generado",
  "autor": "Nombre del estudiante",
  "avatar": "👤",
  "contenido": "El mensaje o dedicatoria",
  "imagen": null,
  "tipo": "mensaje|dedicatoria|recuerdo",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "reacciones": {
    "❤️": ["Juan", "María"],
    "😂": ["Pedro"]
  },
  "comentarios": [
    {
      "autor": "Comentarista",
      "avatar": "👤",
      "texto": "Qué bonito",
      "timestamp": "2025-01-15T10:35:00.000Z"
    }
  ]
}
```

---

## 🚀 Próximos Pasos (Opcional)

Una vez funcione en modo prueba:
- Implementar autenticación (opcionales: Google, anónimo)
- Configurar reglas de seguridad más estrictas para producción
- Agregar validaciones en el servidor

---

**¿Preguntas?** Revisa los logs en la **Consola del Navegador (F12)**
