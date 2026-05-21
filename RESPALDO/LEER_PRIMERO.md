# 🖼️ ACTUALIZAR GALERÍA AUTOMÁTICAMENTE

## ¿Cómo funciona?

Este script actualiza automáticamente la galería cuando añades nuevas fotos a la carpeta `HISTORIA`.

## 📋 Pasos para usar:

### 1️⃣ **Agregar nuevas fotos**
- Copia las nuevas fotos a la carpeta `HISTORIA`
- El script las detectará automáticamente

### 2️⃣ **Ejecutar el actualizador**

#### Opción A: Doble clic (MÁS FÁCIL) ⭐
- Haz doble clic en **`actualizar-galeria.bat`**
- Se abre una ventana, ejecuta y se cierra

#### Opción B: Terminal
```bash
node actualizar-galeria.js
```

### 3️⃣ **Verificar**
- El archivo `lista.json` se actualiza automáticamente
- Las nuevas fotos aparecen en la galería
- Se detectan automáticamente en la categoría correcta

---

## 🏷️ Detección de Categorías

El script detecta categorías por el **nombre del archivo**:

| Nombre contiene... | Se agrega a... |
|---|---|
| `PRIMER DIA` | Primer Día |
| `ESCOLTA` o `ENTRADA` | Escolta |
| `REUNION` | Reuniones |
| `DIA DE MUERTO` o `MUERTOS` | Día de Muertos |
| `SEPT` | Septiembre |
| `NOV` o `20 NOV` | Noviembre |
| `AVENTURA` | Aventura |
| `AMIX` o `ALUMN` | Amigos |
| `RECONO` | Reconocimiento |
| `PLATICA` | Pláticas |
| *Otra cosa* | Otros |

**Ejemplo:**
- `PRIMER DIA 8.jpg` → Se agrega a "Primer Día"
- `REUNION 10.jpg` → Se agrega a "Reuniones"
- `foto_random.jpg` → Se agrega a "Otros"

---

## 📝 Agregar fotos a categoría específica

Si quieres agregar una foto a una categoría específica sin usar el script:

1. Abre `HISTORIA/lista.json`
2. Busca la categoría:
```json
"Primer Día": [
    "PRIMER DIA.jpg",
    "TU_FOTO_AQUI.jpg"  ← Agrega el nombre aquí
]
```
3. Guarda el archivo

---

## ⚙️ Requisitos

- **Node.js** instalado en tu PC ([Descargar aquí](https://nodejs.org/))

---

## 💡 Consejos

- **Nombra las fotos claramente** para que se detecten bien
- Usa palabras clave del nombre original: `PRIMER DIA 8.jpg`, `REUNION 5.jpg`, etc.
- Ejecuta el script después de copiar nuevas fotos

---

## ❓ Preguntas frecuentes

**P: ¿Se borra el JSON?**
A: No, solo se actualizan. Las categorías manuales se mantienen.

**P: ¿Qué pasa si cargo una foto con el mismo nombre?**
A: No se duplica, el script verifica antes de agregar.

**P: ¿Puedo editar el JSON manualmente?**
A: Sí, pero después ejecuta el script para actualizar nuevas fotos.

---

**¡Listo!** Ahora tu galería se actualiza automáticamente. 🎉
