<div align="center">
  <img src="./siat_tech_variation_2_1782859644790-removebg-preview.png" alt="SIAT Logo" width="120" />
  <h1 align="center">SIAT</h1>
  <p><strong>Sistema Inteligente de Acompañamiento Terapéutico</strong></p>
  <p>Plataforma SaaS de telemonitoreo clínico y seguimiento conductual para niños con TEA, basada en IoT</p>
</div>

---

## 📋 Descripción

**SIAT** es una plataforma SaaS (Software as a Service) diseñada para el monitoreo, registro conductual y asistencia terapéutica de niños con Trastorno del Espectro Autista (TEA). Integra wearables IoT (smartwatches biométricos y sensores) con un software clínico avanzado para permitir la detección temprana de crisis de sobrecarga sensorial, el seguimiento de metas PEI, la bitácora conductual A-B-C y la coordinación continua entre especialistas, representantes y directores institucionales.

---

## 🏗️ Arquitectura

### Multi-Tenant Institucional (SaaS)

La plataforma sigue un modelo multi-inquilino donde los datos están estrictamente aislados por institución (`ins_codi`), garantizando que un especialista o representante de una institución no pueda acceder a datos ni expedientes de otra.

### Roles del Sistema

| Rol | Descripción | Vistas Principales |
| :--- | :--- | :--- |
| **ADMIN_INSTITUCION** | Administrador de una institución o centro clínico | Panel Institucional, Especialistas, Representantes, Historial Clínico, Asignaciones, Infraestructura |
| **ESPECIALISTA** | Profesional clínico (terapeuta, psicólogo, médico) | Panel de Sesión, Metas PEI, Incidentes A-B-C, Historial de Evolución, Gestión de Pacientes, Terapias |
| **REPRESENTANTE** | Padre, madre o tutor legal del paciente | Inicio / Estado en Vivo, Diario del Hogar, Agenda Día a Día, Herramientas de Apoyo (AAC, Temporizador, Economía de Fichas) |

### Flujo de Datos IoT y Telemetría

```
Smartwatch / Pulsera BLE → WebSockets / Web BLE → Backend Node.js → PostgreSQL (Neon)
                                                       ↓
                                         Evaluación de umbrales clínicos
                                                       ↓
                               ┌────────────────────────────────────────────────┐
                               │  Estado normal    → Registro basal y promedios │
                               │  Sobrecarga/Crisis→ Alta resolución + Alerta   │
                               └────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades Principales

### Por Rol

#### Administrador de Institución
- **Panel Clínico Institucional**: KPIs de pacientes activos, especialistas, asignaciones y crisis del mes.
- **Nómina de Especialistas**: Alta con validación MPPS/colegio médico, especialidades clínicas y control de estado.
- **Directorio de Representantes**: Vinculación filial, control de acceso y alta de pacientes con cédula.
- **Auditoría e Historial Global**: Bitácora centralizada de eventos, crisis e incidentes conductuales.
- **Monitor de Infraestructura**: Uptime del API Core, latencia de base de datos y clientes WebSocket conectados.

#### Especialista
- **Panel del Paciente**: Resumen de sesión, detonantes sensoriales, resumen del hogar y accesos rápidos de acción.
- **Metas PEI (SMART)**: Registro de objetivos terapéuticos, seguimiento de ensayos en vivo (`+1 ensayo`), criterio de logro y vigencia.
- **Bitácora de Incidentes Conductuales (Modelo A-B-C)**:
  - **A (Antecedente)**: Detonante sensorial o situacional.
  - **B (Conducta)**: Tipo de crisis/conducta, severidad y duración en minutos.
  - **C (Consecuencia)**: Intervención terapéutica, nivel de autorregulación y observaciones clínicas.
- **Indicaciones Clínicas**: Prescripción multidisciplinaria con acuse de lectura y vinculación con terapias.
- **Historial de Evolución**: Doble pestaña interactiva (Evolución y Sesiones vs Bitácora A-B-C con KPIs, filtros y exportación PDF).
- **Terapias y Actividades en Vivo**: Reproductor paso a paso con cronómetro, autoguía, materiales y evaluación de cooperación (1–5 estrellas).
- **Calibración de Sensores Wearables**: Prueba guiada de 15 segundos para fijar la línea base del pulso en reposo.

#### Representante (Padre/Tutor)
- **Inicio / Estado en Vivo**: Semáforo visual de regulación emocional, bioseñales en tiempo real (BPM, movimiento, estrés) y protocolo SOS.
- **Diario del Hogar**: Registro diario de sueño, ánimo, apetito, medicación y factores desencadenantes (protegido con Consentimiento LOPNNA).
- **Agenda Visual Día a Día**: Checklist interactivo de tareas diarias y sincronización con terapias.
- **Herramientas de Apoyo**:
  - **Tablero AAC**: Comunicación Aumentativa con síntesis de voz (TTS).
  - **Primero - Después**: Estructurador visual de contingencias.
  - **Regulación Sensorial**: 12 estrategias guiadas por voz con temporizador.
  - **Temporizador Visual**: Dial circular con alarma sonora.
  - **Economía de Fichas**: Sistema gamificado de estrellas y recompensas canjeables.

### Transversales y Seguridad
- **Autenticación JWT & Passkeys (WebAuthn)**: Inicio de sesión seguro biométrico / hardware key.
- **Rate Limiting Activo**: Protección contra fuerza bruta en endpoints de autenticación (`authLimiter`: 10 req / 15 min, HTTP 429).
- **Consentimiento Legal Informado**: Cumplimiento de normativas de protección de menores (LOPNNA Art. 65 / Ley de Infogobierno Art. 79).
- **Soporte PWA y Web BLE**: Conexión directa por Bluetooth Low Energy al smartwatch del niño y Service Worker con precache estático.
- **Resiliencia ante Fallos de Red**: Tolerancia a desconexiones transitorias con reintentos automáticos en cliente HTTP.
- **Exportación de Informes**: Generación de reportes clínicos apaisados (tablas/auditoría) y verticales (evolución/ficha) en PDF y Excel.
- **Tema Oscuro & Preferencias**: Personalización de densidad, temas visuales y tamaño de tipografía.

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
| :--- | :--- | :--- |
| [React](https://react.dev/) | ^18.3.1 | Librería principal de componentes |
| [Vite](https://vitejs.dev/) | ^5.4.1 | Bundler ultra-rápido y servidor de desarrollo |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.0 | Sistema de diseño y modo oscuro por clase |
| [Lucide React](https://lucide.dev/) | ^1.17.0 | Iconografía vectorial |
| [Recharts](https://recharts.org/) | ^3.8.1 | Gráficos clínicos (donas, barras, áreas, líneas) |
| [jsPDF + autotable](https://github.com/parallax/jsPDF) | ^4.2.1 / ^5.0.8 | Motor de exportación de informes clínicos en PDF |
| [xlsx](https://sheetjs.com/) | ^0.18.5 | Exportación de registros de auditoría a Excel |
| [Axios](https://axios-http.com/) | ^1.16.1 | Cliente HTTP con interceptores JWT y manejo de 429 |
| [Socket.IO Client](https://socket.io/) | ^4.8.3 | Conexión WebSocket para telemetría en tiempo real |
| [@simplewebauthn/browser](https://simplewebauthn.dev/) | ^13.3.0 | Autenticación biométrica WebAuthn / Passkeys |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1.3.0 | Progressive Web App con Service Worker y precache |

### Backend & Base de Datos
| Tecnología | Uso |
| :--- | :--- |
| [Node.js + Express](https://nodejs.org/) | API RESTful con arquitectura modular |
| [PostgreSQL (Neon Serverless)](https://neon.tech/) | Base de datos relacional escalable |
| [Prisma ORM](https://www.prisma.io/) | Modelado, migraciones y tipado de esquemas clínicos |
| [WebSockets / Socket.IO](https://socket.io/) | Servidor de eventos de telemetría y alertas IoT |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | Protección perimetral contra abuso y ataques de fuerza bruta |

---

## 🚀 Instalación y Uso

### Prerrequisitos
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd siat

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar en modo desarrollo
npm run dev

# 5. Compilar para producción
npm run build

# 6. Vista previa del bundle de producción
npm run preview
```

### Configuración de Variables de Entorno (`.env`)

```ini
# URL base de la API backend (Render o Local)
VITE_API_URL=https://backend-siat.onrender.com/api

# Tiempo de inactividad antes del auto-logout clínico (segundos)
VITE_IDLE_TIMEOUT=900
```

---

## 🔐 Cuentas de Acceso y Perfiles de Demostración

| Rol | Perfil de Usuario | Cuenta de Prueba (Sandbox) |
| :--- | :--- | :--- |
| **ADMIN_INSTITUCION** | Director / Administrador Clínico | `admin_fundacion@siat.com` |
| **ESPECIALISTA** | Terapeuta Ocupacional / Psicólogo | `especialista@siat.com` |
| **REPRESENTANTE** | Madre / Padre / Tutor Legal | `padre@siat.com` |

> ℹ️ *Las contraseñas de los entornos de prueba se generan mediante los seeders del backend (`npm run prisma:seed` en el repositorio backend) y se configuran de manera segura en las variables de entorno locales.*

---

## 📁 Estructura del Proyecto

```
siat/
├── index.html                 # Punto de entrada HTML
├── package.json               # Dependencias y scripts
├── vite.config.js             # Configuración de Vite, PWA y Vitest
├── tailwind.config.js         # Configuración de Tailwind CSS
├── docs/                      # Especificaciones y manuales técnicos
│   ├── DOCUMENTACION_MODULOS_SIAT.md
│   └── MANUAL_COMANDOS_DOCKER.md
└── src/
    ├── main.jsx               # Entry point de React
    ├── App.jsx                # Router RBAC y shell principal
    ├── index.css              # Variables de diseño y estilos base
    ├── api/
    │   ├── axios.js           # Cliente Axios con interceptor 429 y JWT
    │   └── passkey.js         # Endpoints de desafío/verificación WebAuthn
    ├── context/
    │   ├── GlobalState.jsx    # Estado clínico global y navegación
    │   └── SmartwatchContext.jsx # Web BLE, telemetría y bioseñales
    ├── hooks/
    │   ├── socket.js          # Conexión WebSocket
    │   ├── useTelemetry.js    # Hook de acceso a telemetría
    │   ├── useConsentimiento.js # Validación de consentimiento legal
    │   └── useDebounce.js     # Optimización de búsquedas
    ├── pages/
    │   ├── AdminDashboard.jsx       # Panel institucional del administrador
    │   ├── SpecialistDashboard.jsx  # Panel clínico del especialista
    │   ├── MainDashboard.jsx        # Panel de inicio del representante
    │   ├── PatientManagement.jsx    # Directorio y alta de pacientes
    │   ├── StudentRecord.jsx        # Ficha clínica digital
    │   ├── HistoryProgress.jsx      # Historial de evolución y bitácora A-B-C
    │   ├── Routines.jsx             # Terapias y reproductor de sesiones
    │   ├── HardwareInventory.jsx    # Calibración y monitoreo de sensores
    │   ├── HomeAnalytics.jsx        # Analíticas del hogar
    │   ├── AgendaDiaria.jsx         # Agenda visual de actividades
    │   ├── DiarioHogar.jsx          # Registro diario de bienestar
    │   ├── Herramientas.jsx         # CAA, Temporizador, Economía de Fichas
    │   ├── ParentProfile.jsx        # Expediente clínico del representante
    │   └── UserProfile.jsx          # Perfil, seguridad, passkeys y preferencias
    ├── components/
    │   ├── specialist/        # Componentes clínicos del especialista
    │   │   ├── IncidentModal.jsx        # Formulario de incidentes (Modelo A-B-C)
    │   │   ├── IndicacionModal.jsx      # Prescripción de indicaciones
    │   │   ├── NewPeiGoalModal.jsx      # Alta de metas PEI SMART
    │   │   ├── AlertRulesConfig.jsx     # Ajuste de umbrales clínicos y alertas
    │   │   └── SpecialistGlobalView.jsx # Vista agregada sin paciente seleccionado
    │   ├── shared/            # Componentes reutilizables
    │   │   ├── SmartwatchConnectWidget.jsx # Conexión Web BLE al reloj
    │   │   ├── TherapySessionPlayer.jsx   # Reproductor de terapia guiada
    │   │   ├── RegisterChildModal.jsx     # Wizard de 3 pasos de alta
    │   │   ├── ConsentimientoModal.jsx    # Modal legal LOPNNA
    │   │   ├── AlertCenter.jsx            # Centro de alertas con feedback
    │   │   ├── FilterBar.jsx              # Barra interactiva de filtros
    │   │   ├── Pagination.jsx             # Paginador accesible
    │   │   └── FotoUpload.jsx             # Subida optimizada a Cloudinary
    │   └── ui/                # UI Primitives
    │       ├── Button.jsx, Card.jsx, Fab.jsx, PageTitle.jsx
    └── utils/
        ├── errorHandler.js    # Parseo amigable de errores HTTP
        ├── pdfExporter.js     # Generación de reportes PDF clínicos
        └── exportManualPdf*.js # Generadores de manuales en PDF
```

---

## 📄 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local de desarrollo con Vite |
| `npm run build` | Compila el bundle de producción y genera Service Worker PWA |
| `npm run preview` | Ejecuta un servidor local para probar el build de producción |
| `npm run lint` | Ejecuta ESLint sobre todo el código fuente |
| `npm test` | Ejecuta la suite de pruebas unitarias con Vitest |

---

## 📝 Licencia y Alcance

Proyecto desarrollado con fines académicos y de investigación para la defensa del Trabajo Especial de Grado en Ingeniería de Sistemas / Informática.
