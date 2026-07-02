# PLAN DE IMPLEMENTACIÓN - Correcciones SIAT

## 1. Texto técnico en pantalla de registro

**Archivo:** `src/components/Register.jsx`

**Problema:** El contenido que aparece al hacer clic en "Cómo obtener acceso" usa lenguaje muy técnico que una persona común (padre/madre representante) no entiende:

- Línea 48: *"sistema multi-tenant de SIAT"*
- Línea 67: *"hardware del wearable sensor"*
- Línea 86: *"telemetría cardíaca y de estrés"*

**Solución:** Reescribir los 3 textos con lenguaje simple y claro para cualquier persona:

**Paso 1** (líneas 47-49):
```diff
- Tu centro terapéutico, fundación o especialista tratante debe estar incorporado en el sistema multi-tenant de SIAT.
+ El centro terapéutico o fundación donde asistes debe estar registrado en nuestro sistema. Tu especialista te indicará si ya lo están.
```

**Paso 2** (líneas 66-68):
```diff
- El especialista o administrador de la fundación ingresará tu información y la del menor para vincular de forma segura el hardware del wearable sensor.
+ El especialista o la fundación registrará tus datos y los del niño en el sistema para que puedas acceder a toda la información de sus terapias.
```

**Paso 3** (líneas 85-87):
```diff
- Recibirás un enlace de activación en tu correo. Al abrirlo, podrás asignar tu contraseña y comenzar a ver telemetría cardíaca y de estrés de inmediato.
+ Recibirás un enlace en tu correo electrónico. Al abrirlo, podrás crear tu contraseña y empezar a usar el sistema de inmediato.
```

---

## 2. Pantalla de carga con "wake-up" del servidor y mensajes motivacionales

**Archivos:** `src/App.jsx`, `src/api/axios.js`, (nuevo) `src/components/SplashScreen.jsx`

**Problema:** El backend está en Render (free tier) y se duerme por inactividad. La primera carga puede tardar 30-60 segundos sin que el usuario sepa qué está pasando.

**Solución:**  
- Crear un componente `SplashScreen` con diseño atractivo, logo, animación y mensajes motivacionales que rotan cada 4-5 segundos.
- Apenas se abre la app, enviar un request al backend (`/api/health` o `GET /api`) para activarlo.
- Mostrar el `SplashScreen` mientras el warm-up no haya respondido (con un timeout máximo de 45 segundos).
- Al recibir respuesta (o al cumplirse el timeout), mostrar la app normal.

**Nuevo componente `SplashScreen.jsx`:**
```jsx
import { useState, useEffect } from 'react'
import { Heart, Sparkles, Shield, Star, Sun } from 'lucide-react'

const mensajes = [
  'Preparando un espacio seguro para tu hijo...',
  'Cargando herramientas de apoyo terapéutico...',
  'Conectando con tu equipo de especialistas...',
  'Protegiendo la información clínica...',
  'Un momento, estamos afinando los sensores...',
  'SIAT está listo para acompañarte...',
  'Tus datos están siendo cifrados con cuidado...',
]

const iconos = [Heart, Sparkles, Shield, Star, Sun]

export default function SplashScreen() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % mensajes.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const IconoActual = iconos[index % iconos.length]

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F4F7F9] dark:bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-700">
      {/* Logo */}
      <div className="mb-8">
        <img src="/Logo.png" alt="SIAT-TEA" className="w-24 h-24 object-contain animate-pulse" />
      </div>
      
      {/* Animación de carga */}
      <div className="flex gap-1 mb-8">
        <span className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>

      {/* Mensaje motivacional */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 animate-in fade-in">
        <IconoActual className="w-5 h-5 text-brand-500" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-xs">
          {mensajes[index]}
        </p>
      </div>
    </div>
  )
}
```

**En `App.jsx`**, agregar estado `serverReady` y efecto de warm-up:
```diff
+ import SplashScreen from './components/SplashScreen'
+ import api from './api/axios'
+ 
  export default function App() {
+   const [serverReady, setServerReady] = useState(false)
+   const [splashDone, setSplashDone] = useState(false)
+ 
+   // Warm-up: activar el servidor al cargar la app
+   useEffect(() => {
+     let cancelled = false
+     const controller = new AbortController()
+ 
+     async function warmUp() {
+       try {
+         await api.get('/health', { signal: controller.signal, timeout: 45000 })
+       } catch {
+         // Si falla o timeout, igual mostramos la app
+       } finally {
+         if (!cancelled) {
+           setServerReady(true)
+           // Dar tiempo a que el usuario lea al menos un par de mensajes
+           setTimeout(() => setSplashDone(true), 3000)
+         }
+       }
+     }
+ 
+     warmUp()
+ 
+     // Timeout de seguridad: mostrar app aunque no responda
+     const fallbackTimer = setTimeout(() => {
+       if (!cancelled) {
+         setServerReady(true)
+         setSplashDone(true)
+       }
+     }, 15000)
+ 
+     return () => {
+       cancelled = true
+       controller.abort()
+       clearTimeout(fallbackTimer)
+     }
+   }, [])
+ 
+   // ... resto del código
+   if (!splashDone) return <SplashScreen />
    return (...)
  }
```

**En `src/api/axios.js`:**

```diff
- timeout: 15000,
+ timeout: 45000, // Aumentado para permitir warm-up de Render
```

---

## 3. Título del panel del especialista

**Archivo:** `src/components/SpecialistDashboard.jsx` (línea 228)

**Problema:** Cuando no hay paciente seleccionado, el título dice "Panel Global de Especialista". Como el usuario ya sabe que es especialista, debería ser un saludo.

**Solución:** Cambiar a "Bienvenido, [nombre]" o "Resumen General". Aprovechar la variable `userName` del context.

```diff
- {activeChild ? `Panel Clínico: ${activeChild.nom_nino} ${activeChild.ape_nino}` : 'Panel Global de Especialista'}
+ {activeChild ? `Panel Clínico: ${activeChild.nom_nino} ${activeChild.ape_nino}` : `Bienvenido, ${userName}`}
```

Y en la línea 5 importar `userName`:

```diff
- const { ... clinicalAlerts, globalPeiGoals, incrementPeiTrial, isDark } = useGlobalContext()
+ const { ... clinicalAlerts, globalPeiGoals, incrementPeiTrial, isDark, userName } = useGlobalContext()
```

---

## 4. Error "TrendingUp is not defined"

**Archivo:** `src/components/SpecialistDashboard.jsx` (línea 257)

**Problema:** Se usa el ícono `TrendingUp` en el botón "Ver Historial Completo" pero no está importado.

**Solución:** Agregar `TrendingUp` a la importación de lucide-react en la línea 4-6:

```diff
- import { FileText, AlertCircle, Users, FilePlus } from 'lucide-react'
+ import { FileText, AlertCircle, Users, FilePlus, TrendingUp } from 'lucide-react'
```

---

## 5. Agenda - seleccionar paciente deja pantalla en blanco

**Archivos:** `src/components/specialist/SpecialistGlobalView.jsx`, `src/components/SpecialistDashboard.jsx`

**Problema:**  
- En `SpecialistGlobalView.jsx`, los datos mock (`agendaHoy`) se pasan con propiedades como `id_cita`, `nin_nomb`, `nin_apel`, pero el filtro `agendaFiltrada` accede a `cita.paciente`, `cita.childId`.
- El `key` del map usa `cita.id` pero los datos mock usan `id_cita`.
- Los botones "Ir a Paciente" llaman a `setSelectedChildId(cita.childId)` pero `childId` no existe en los datos mock.
- Los datos del API pueden devolver estructura diferente.

**Solución:** Normalizar los datos al recibirlos para que los campos sean consistentes:

En `SpecialistDashboard.jsx`, dentro de `fetchAgenda`, mapear los datos del API a una estructura uniforme:

```javascript
// Después de recibir res.data.data
const normalized = data.map(c => ({
  id: c.id_cita || c.id,
  hora: c.hora || c.hor_cita,
  tipo: c.tipo || c.tip_cita,
  estado: c.estado || c.est_cita,
  paciente: c.nin_nomb || c.paciente || `${c.nin_nomb} ${c.nin_apel || ''}`,
  childId: c.nin_codi || c.childId || c.id_ninos
}));
```

Lo mismo aplicar a los datos mock de respaldo (fallback).

---

## 6. Timeout al cargar niños y rutinas (15s)

**Archivo:** `src/api/axios.js`

**Problema:** El timeout de Axios está en 15 segundos y el backend puede tardar más. La app no muestra un estado de carga adecuado.

**Solución:**  
- Aumentar el timeout en el cliente Axios a 30 segundos.
- Mostrar un indicador de carga (spinner/skeleton) mientras se obtienen los datos.
- Mejorar el mensaje de error para que sea más claro.

En `src/api/axios.js`, verificar/cambiar:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // Aumentar de 15000 a 30000
  headers: { 'Content-Type': 'application/json' }
});
```

En `src/components/SpecialistDashboard.jsx`, el efecto de carga solo espera 700ms fijos. Cambiarlo para que realmente espere a que los datos lleguen:

```javascript
useEffect(() => {
  setLoading(listaNinos.length === 0) // Solo mostrar carga si no hay datos
}, [listaNinos])
```

---

## 7. Error de validación al actualizar perfil de administrador

**Archivo:** `src/components/UserProfile.jsx`

**Problema:** Al enviar `submitProfile`, se envían campos como `nomb`, `apel`, `telf`, pero para el rol `ADMIN_INSTITUCION` el backend espera los nombres correctos según la tabla del admin (`adm_nomb`, `adm_apel`, etc.).

**Solución:** Agregar lógica condicional para enviar los nombres de campo correctos según el rol:

```javascript
const submitProfile = async (e) => {
  e.preventDefault();
  setSaving(true);
  try {
    const payload = {};
    
    if (userRole === 'ADMIN_INSTITUCION') {
      payload.adm_nomb = profile.nomb;
      payload.adm_apel = profile.apel;
      payload.adm_telf = profile.telf;
    } else if (userRole === 'ESPECIALISTA') {
      payload.esp_nomb = profile.nomb;
      payload.esp_apel = profile.apel;
      payload.esp_telf = profile.telf;
      payload.esp_licencia = profile.licencia;
    } else if (userRole === 'REPRESENTANTE') {
      payload.rep_nomb = profile.nomb;
      payload.rep_apel = profile.apel;
      payload.rep_telf = profile.telf;
      payload.rep_rela = profile.rela;
    }
    
    await api.put('/auth/me', payload);
    // ... resto del código
  }
}
```

---

## 8. Gráfica de latencia de red (Infraestructura)

**Archivo:** `src/components/AdminDashboard.jsx` (líneas 88-95, 589-598)

**Problema:** El gráfico de latencia usa `mockUptimeData` con clave `name` para la hora, pero el `<XAxis dataKey="time" />` busca una propiedad `time` que no existe, por lo que el gráfico no se renderiza correctamente.

**Solución:** Cambiar `dataKey="time"` por `dataKey="name"` en el XAxis:

```diff
- <XAxis dataKey="time" ... />
+ <XAxis dataKey="name" ... />
```

---

## 9. Datos "Generado por inyector de historial"

**Problema:** Estos textos vienen del backend (base de datos seed o datos de prueba). Como el frontend solo consume la API, estos datos deben limpiarse del backend.

**Solución (Backend):**
- Revisar en la base de datos las tablas de sesiones, reportes, y alertas.
- Ejecutar consultas SQL para encontrar y eliminar registros que contengan "inyector de historial", "Generado por" o textos similares.
- Limpiar los seeders o migraciones que hayan insertado esos datos de prueba.

```sql
-- Ejemplos de consultas SQL para identificar los datos
SELECT * FROM sesiones WHERE ses_nota LIKE '%inyector%';
SELECT * FROM reportes WHERE rpt_nota LIKE '%Generado por%';
SELECT * FROM alertas WHERE ale_meto LIKE '%inyector%';

-- Opcional: actualizar o eliminar según sea necesario
UPDATE sesiones SET ses_nota = '' WHERE ses_nota LIKE '%inyector%';
```

**En el frontend:** No hay nada que modificar, ya que solo se muestra lo que devuelve la API.

---

## 10. Mejora del Footer

**Archivo:** `src/components/Footer.jsx`

**Problema:** El footer es muy básico, solo muestra "Desarrollado por Francisco Rincon UNEFA 2026".

**Solución:** Mejorar con más información institucional y diseño más cuidado:

```jsx
export default function Footer() {
  return (
    <footer className="w-full text-center py-6 text-sm text-slate-500 dark:text-slate-400 mt-auto border-t border-slate-200 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} SIAT-TEA — Sistema Inteligente de Acompañamiento Terapéutico</p>
        <p className="text-xs">Desarrollado por Francisco Rincón · UNEFA</p>
      </div>
    </footer>
  )
}
```

---

## Prioridades sugeridas

| # | Tarea | Prioridad | Esfuerzo |
|---|-------|-----------|----------|
| 4 | Error TrendingUp no definido | 🔴 Alta | 5 min |
| 5 | Agenda en blanco al seleccionar paciente | 🔴 Alta | 30 min |
| 7 | Error de validación perfil admin | 🔴 Alta | 20 min |
| 2 | Pantalla de carga + wake-up servidor | 🟡 Media | 45 min |
| 6 | Timeout al cargar datos | 🟡 Media | 15 min |
| 8 | Gráfica de latencia no se ve | 🟡 Media | 10 min |
| 3 | Cambiar título "Panel Global de Especialista" | 🟡 Media | 5 min |
| 9 | Limpiar datos "inyector de historial" | 🟡 Media | 30 min (backend) |
| 1 | Texto técnico en pantalla de registro | 🟢 Baja | 10 min |
| 10 | Mejorar Footer | 🟢 Baja | 10 min |
