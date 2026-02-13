# 🌐 PlayaManager - Aplicación Web

## ✅ Ventajas de la Versión Web

- ✅ No necesitas instalar apps en el celular
- ✅ Funciona en cualquier navegador (Chrome, Safari, Firefox)
- ✅ Responsive: se adapta a celular, tablet y desktop
- ✅ Más rápido de probar y desarrollar
- ✅ Modificaciones en tiempo real

---

## 🚀 Inicio Rápido (5 minutos)

### Paso 1: Backend (Ya lo tienes funcionando ✅)

En una terminal:

```bash
cd ~/Documents/playamanager-mvp/backend
npm run dev
```

Deberías ver: `🚀 Server running on port 3000`

### Paso 2: Instalar Dependencias de la Web App

Abre **otra terminal** nueva:

```bash
cd ~/Documents/playamanager-mvp/webapp
npm install
```

Esto tomará ~2 minutos.

### Paso 3: Iniciar la Aplicación Web

En la misma terminal:

```bash
npm run dev
```

Verás algo como:
```
  ➜  Local:   http://localhost:3001/
  ➜  Network: http://192.168.1.178:3001/
```

### Paso 4: Abrir en el Navegador

1. Abre **Chrome** o **Safari**
2. Ve a: **http://localhost:3001**
3. ¡Listo! Verás la pantalla de login

---

## 🔐 Credenciales de Prueba

```
Company ID: BK-001
Username:   admin
Password:   demo123
```

---

## 📱 Usar desde tu iPhone

Si quieres usarlo desde tu iPhone/celular:

1. Asegúrate que tu iPhone y Mac están en la **misma WiFi**
2. En el iPhone, abre Safari
3. Ve a: `http://192.168.1.178:3001` (usa la IP que aparece en "Network")
4. ¡Funciona como una app!

**Tip:** En Safari móvil, toca el botón "Compartir" → "Añadir a pantalla de inicio" para crear un acceso directo como si fuera una app.

---

## 🎨 Páginas Implementadas

✅ **Login** - Completa y funcional
✅ **Dashboard** - Con KPIs en tiempo real
✅ **Rentals List** - Lista de arriendos activos
🚧 **New Rental** - Por completar
🚧 **Rental Detail** - Por completar
🚧 **Products** - Por completar
🚧 **History** - Por completar
🚧 **Profile** - Por completar
🚧 **Sync** - Por completar

Las páginas marcadas con 🚧 tienen la estructura base. Puedes pedirme que las complete cuando quieras.

---

## 🔧 Modificaciones en Vivo

La gran ventaja de la versión web:

1. Hago cambios en el código
2. Guardas el archivo
3. ¡El navegador se refresca automáticamente!

**No hay compilación ni esperas.**

---

## 🐛 Solución de Problemas

### "Cannot GET /"
El backend no está corriendo. Inicia el backend primero.

### "Network Error" al hacer login
Verifica que el backend esté en `http://localhost:3000`

### No carga en el iPhone
- Verifica que ambos están en la misma WiFi
- Usa la IP que aparece en "Network:" en la terminal
- Ejemplo: `http://192.168.1.178:3001`

---

## 📊 Tecnologías Usadas

- **React 18** - Framework de UI
- **TypeScript** - JavaScript tipado
- **Vite** - Build tool (súper rápido)
- **TailwindCSS** - Estilos utility-first
- **React Router** - Navegación
- **Zustand** - State management
- **Axios** - HTTP client

---

## ✨ Próximos Pasos

Una vez que confirmes que funciona el login y el dashboard:

1. Te completo las páginas faltantes
2. Agregamos funcionalidades específicas que necesites
3. Mejoramos el diseño según tus preferencias
4. Optimizamos para dispositivos móviles

**Todo en tiempo real, sin instalaciones complicadas** 🚀

---

## 📝 Comandos Útiles

```bash
# Iniciar backend
cd backend && npm run dev

# Iniciar webapp
cd webapp && npm run dev

# Ver ambos en paralelo (opcional)
# Terminal 1: backend
# Terminal 2: webapp

# Compilar para producción (cuando estés listo)
cd webapp && npm run build
```

---

¿Listo para probar? ¡Ejecuta los comandos y avísame qué ves! 🎉
