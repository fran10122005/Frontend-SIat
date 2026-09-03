<div align="center">
  <img src="./siat_tech_variation_2_1782859644790-removebg-preview.png" alt="SIAT Logo" width="120" />
  <h1 align="center">SIAT</h1>
  <p><strong>Sistema Integrado de Asistencia Terapéutica</strong></p>
  <p>Plataforma SaaS de telemonitoreo clínico para niños con TEA, basada en IoT</p>
</div>

---

## 📋 Descripción

**SIAT** es una plataforma SaaS (Software as a Service) diseñada para el monitoreo y asistencia terapéutica de niños con Trastorno del Espectro Autista (TEA). Integra wearables IoT (pulseras biométricas) con un sistema de software clínico para permitir la detección temprana de crisis de sobrecarga sensorial, el seguimiento de la evolución del paciente y la coordinación entre especialistas y representantes.

---

## 🏗️ Arquitectura

### Multi-Tenant (SaaS)

La plataforma sigue un modelo multi-inquilino donde los datos están estrictamente aislados por institución (`ins_codi`), garantizando que un especialista de una institución no pueda acceder a datos de otra.

### Roles del Sistema

| Rol | Descripción |
| :--- | :--- |
| **ADMIN_INSTITUCION** | Administrador de una institución/clínica |
| **ESPECIALISTA** | Profesional de la salud (terapeuta, psicólogo) |
| **REPRESENTANTE** | Padre, madre o tutor del niño |

### Flujo de Datos IoT

```
Pulsera (ESP32) → WebSockets → Backend Node.js → PostgreSQL
                                        ↓
                                  Evaluación de umbrales
                                        ↓
                          ┌──────────────────────────────┐
                          │  Estado normal → Promedio     │
                          │  Estado crisis → Alta resolución + Alerta │
                          └──────────────────────────────┘
```

---

## ✨ Funcionalidades

### Por Rol

#### Administrador de Institución
- Panel general con métricas de la clínica
- Gestión de especialistas
- Registro de actividad institucional
- Simulador de monitoreo en vivo

#### Especialista
- Dashboard con resumen de pacientes, metas PEI y alertas
- Gestión de pacientes (expediente clínico digital)
- Historial de evolución con gráficos (exportable a PDF)
- Calibración de sensores wearables (línea base de 15s)
- Metas PEI (Plan de Educación Individualizada)
- Notas SOAP, indicaciones y registro de crisis
- Evaluación de efectividad de alertas

#### Representante (Padre/Tutor)
- Dashboard con resumen de agenda diaria
- Seguimiento en vivo del wearable (BPM, aceleración, índice de estrés)
- Reportes diarios desde el hogar (sueño, ánimo, apetito)
- Diario del hogar
- Agenda y rutinas del niño

### Transversales
- **Autenticación JWT** con renovación automática
- **Passkeys (WebAuthn)** como método de autenticación biométrica
- **RBAC** (Control de Acceso Basado en Roles) estricto
- **Modo offline** con almacenamiento local y sincronización
- **Auto-logout** por inactividad (políticas de seguridad clínica)
- **Tour interactivo** guiado para nuevos usuarios (driver.js)
- **Notificaciones** de alertas en tiempo real
- **Exportación** a PDF y Excel
- **Modo oscuro**

### Preferencias del Sistema (`/configuracion`)
Accesible desde el menú **Configuración** de la barra lateral (disponible para los tres roles):
- **Tema visual**: Claro / Sistema / Oscuro
- **Color de acento**: Azul, Índigo, Violeta, Esmeralda, Cyan o Rosa
- **Tamaño de fuente**: Pequeño / Normal / Grande
- **Densidad de interfaz**: Normal / Compacta

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
| :--- | :--- | :--- |
| [React](https://react.dev/) | ^18.3.1 | Librería de UI |
| [React Router DOM](https://reactrouter.com/) | ^7.18.1 | Navegación y enrutado |
| [Vite](https://vitejs.dev/) | ^5.4.1 | Bundler y dev server |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.0 | Framework de estilos |
| [Lucide React](https://lucide.dev/) | ^1.17.0 | Iconografía |
| [Recharts](https://recharts.org/) | ^3.8.1 | Gráficos clínicos |
| [jsPDF + autotable](https://github.com/parallax/jsPDF) | ^4.2.1 / ^5.0.8 | Exportación a PDF |
| [xlsx](https://sheetjs.com/) | ^0.18.5 | Exportación a Excel |
| [Axios](https://axios-http.com/) | ^1.16.1 | Cliente HTTP |
| [Zod](https://zod.dev/) | ^4.4.3 | Validación de esquemas |
| [Socket.IO Client](https://socket.io/) | ^4.8.3 | WebSockets en tiempo real |
| [@simplewebauthn/browser](https://simplewebauthn.dev/) | ^13.3.0 | Autenticación con passkeys |
| [driver.js](https://driverjs.com/) | ^1.8.0 | Tour interactivo de la UI |

### Testing y Calidad de Código
| Herramienta | Versión | Uso |
| :--- | :--- | :--- |
| [Vitest](https://vitest.dev/) | ^4.1.10 | Framework de pruebas unitarias |
| [Testing Library](https://testing-library.com/) | ^16.3.2 | Pruebas de componentes React |
| [ESLint](https://eslint.org/) | ^9.39.4 | Linter (config flat) |
| [Prettier](https://prettier.io/) | ^3.9.6 | Formateo de código |
| [Husky](https://typicode.github.io/husky/) | ^9.1.7 | Git hooks (lint-staged en pre-commit) |

### Backend (separado)
- Node.js con WebSockets
- PostgreSQL + Prisma ORM
- Arquitectura Multi-Tenant

### IoT / Hardware
- Microcontrolador ESP32
- Sensor óptico MAX30100/MAX30102 (fotopletismografía)
- Acelerómetro MPU6050
- Comunicación vía WebSockets/MQTT

---

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js >= 18
- npm >= 9

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd siat

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

### Configuración

Variables de entorno (ver `.env.example`):

| Variable | Descripción | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base de la API del backend | `http://localhost:3000/api` |
| `VITE_IDLE_TIMEOUT` | Tiempo de inactividad antes del auto-logout (segundos) | `900` |

El backend debe estar corriendo de forma independiente.

---

## 🔐 Credenciales de Prueba

| Perfil | Rol | Correo | Contraseña |
| :--- | :--- | :--- | :--- |
| Director Global | Súper Admin | `director@siat.com` | `123456` |
| Admin Fundación | Admin Institución | `admin_fundacion@siat.com` | `123456` |
| Especialista | Profesional de la Salud | `especialista@siat.com` | `123456` |
| Representante | Padre / Tutor | `padre@siat.com` | `123456` |

---

## 📁 Estructura del Proyecto

```
siat/
├── index.html                 # Entry point HTML
├── package.json               # Dependencias y scripts
├── vite.config.js             # Configuración de Vite + Vitest
├── tailwind.config.js         # Configuración de Tailwind CSS
├── postcss.config.js          # Configuración de PostCSS
├── eslint.config.js           # ESLint (config flat)
├── .env.example               # Variables de entorno de ejemplo
└── src/
    ├── main.jsx               # Punto de entrada React
    ├── App.jsx                # Componente raíz + RBAC
    ├── index.css              # Estilos globales (Tailwind)
    ├── App.css                # Estilos de la aplicación
    ├── setupTests.js          # Setup global de pruebas
    ├── api/
    │   ├── axios.js           # Cliente Axios con interceptores JWT
    │   └── passkey.js         # Autenticación con passkeys (WebAuthn)
    ├── config/
    │   ├── cloudinary.js      # Configuración de Cloudinary (subida de imágenes)
    │   └── tourSteps.js       # Definición de pasos del tour interactivo
    ├── context/
    │   ├── GlobalState.jsx    # Estado global (Context API)
    │   └── TourContext.jsx    # Estado del tour guiado
    ├── hooks/
    │   ├── socket.js          # Conexión WebSocket
    │   ├── useTelemetry.js    # Telemetría IoT
    │   ├── useClinicalData.js # Datos clínicos
    │   ├── useIdleTimer.js    # Detección de inactividad
    │   ├── useConsentimiento.js # Consentimiento informado
    │   ├── useDebounce.js     # Debounce para inputs/búsquedas
    │   ├── useExpandableRows.js # Filas expandibles en tablas
    │   ├── useMediaQuery.js   # Media queries responsivas
    │   └── useTour.jsx        # Lógica del tour interactivo
    ├── pages/                 # Vistas principales por rol
    │   ├── AdminDashboard.jsx       # Dashboard del administrador
    │   ├── SpecialistDashboard.jsx  # Dashboard del especialista
    │   ├── MainDashboard.jsx        # Dashboard del representante
    │   ├── PatientManagement.jsx    # Gestión de pacientes
    │   ├── StudentRecord.jsx        # Expediente del estudiante
    │   ├── HistoryProgress.jsx      # Historial de evolución
    │   ├── HardwareInventory.jsx    # Inventario de hardware / monitoreo
    │   ├── Herramientas.jsx         # Herramientas del especialista
    │   ├── HomeAnalytics.jsx        # Analíticas del hogar
    │   ├── Routines.jsx             # Gestión de rutinas
    │   ├── AgendaDiaria.jsx         # Agenda diaria
    │   ├── DiarioHogar.jsx          # Diario del hogar
    │   ├── ParentProfile.jsx        # Perfil del representante
    │   └── UserProfile.jsx          # Perfil de usuario
    ├── utils/
    │   ├── errorHandler.js    # Manejo centralizado de errores
    │   ├── pdfExporter.js     # Exportación genérica a PDF
    │   ├── exportManualPdf*.js # Manuales en PDF por rol
    │   ├── speech.js          # Síntesis de voz (accesibilidad CAA)
    │   └── dashboardMocks.js  # Datos mock para demostración
    └── components/
        ├── auth/              # Login, registro, recuperación de contraseña
        │   ├── Auth.jsx             # Contenedor Login / Registro
        │   ├── Login.jsx            # Inicio de sesión (+ passkeys)
        │   ├── Register.jsx         # Registro
        │   ├── RegisterRepre.jsx    # Registro de representante
        │   ├── ForgotPassword.jsx   # Recuperación de contraseña
        │   └── ResetPassword.jsx    # Restablecimiento de contraseña
        ├── layout/
        │   ├── Sidebar.jsx          # Barra lateral de navegación
        │   ├── AdminSidebar.jsx     # Barra lateral del admin
        │   ├── Topbar.jsx           # Barra superior
        │   ├── Footer.jsx           # Pie de página
        │   └── NotificationBell.jsx # Campana de notificaciones
        ├── dashboard/         # Widgets del dashboard del representante
        │   ├── TelemetryChart.jsx        # Gráfica de telemetría IoT
        │   ├── RegulationStatusCard.jsx  # Estado de regulación emocional
        │   ├── ChildStatusBanner.jsx     # Banner de estado del niño
        │   ├── DaySummary.jsx            # Resumen del día
        │   ├── BreathingProtocolModal.jsx # Protocolo de respiración
        │   ├── AacBoardDrawer.jsx        # Tablero CAA
        │   ├── Skeleton.jsx              # Placeholders de carga
        │   └── LoadingState.jsx          # Estados de carga
        ├── specialist/        # Módulos clínicos del especialista
        │   ├── SpecialistGlobalView.jsx  # Vista global del especialista
        │   ├── SessionManager.jsx        # Gestión de sesiones terapéuticas
        │   ├── SessionWizard.jsx         # Asistente de nueva sesión
        │   ├── SoapNoteModal.jsx         # Notas SOAP
        │   ├── SoapTemplateManager.jsx   # Plantillas SOAP
        │   ├── PatientPeiGoals.jsx       # Metas PEI
        │   ├── NewPeiGoalModal.jsx       # Nueva meta PEI
        │   ├── PeiReportModal.jsx        # Reporte PEI
        │   ├── AlertRulesConfig.jsx      # Configuración de reglas de alerta
        │   ├── CrisisReportModal.jsx     # Reporte de crisis
        │   ├── InterventionCatalog.jsx   # Catálogo de intervenciones
        │   ├── MonthlyReportScheduler.jsx # Programador de reportes mensuales
        │   ├── SpecialistSettings.jsx    # Ajustes del especialista
        │   ├── ReadOnlyMode.jsx          # Modo solo lectura
        │   ├── ActivityLog.jsx           # Registro de actividad
        │   ├── IndicacionReadReceipt.jsx # Confirmación de lectura de indicaciones
        │   ├── PatientBehaviorChart.jsx  # Gráfico de comportamiento
        │   ├── PatientSensoryChart.jsx   # Gráfico sensorial
        │   ├── PatientCrisisLog.jsx      # Registro de crisis
        │   ├── IncidentModal.jsx         # Modal de incidentes
        │   ├── IndicacionModal.jsx       # Modal de indicaciones
        │   └── SessionReportModal.jsx    # Modal de reporte de sesión
        ├── admin/             # Módulos administrativos
        │   ├── AdminKPIs.jsx             # KPIs institucionales
        │   ├── AdminCharts.jsx           # Gráficos del admin
        │   ├── AdminActivityLog.jsx      # Registro de actividad
        │   ├── UsuariosTab.jsx           # Gestión de usuarios
        │   ├── EspecialistasTab.jsx      # Gestión de especialistas
        │   ├── RepresentantesTab.jsx     # Gestión de representantes
        │   ├── AsignacionesTab.jsx       # Asignaciones
        │   ├── CatalogosTab.jsx          # Catálogos
        │   ├── HistorialClinicoTab.jsx   # Historial clínico
        │   └── InfraestructuraTab.jsx    # Infraestructura / dispositivos
        ├── shared/            # Componentes reutilizables
        │   ├── AlertCenter.jsx       # Centro de alertas
        │   ├── Indicaciones.jsx      # Indicaciones clínicas
        │   ├── AdminModal.jsx        # Modal genérico del admin
        │   ├── ConfirmDialog.jsx     # Diálogo de confirmación
        │   ├── EmptyState.jsx        # Estado vacío
        │   ├── FilterBar.jsx         # Barra de filtros
        │   ├── FormAlert.jsx         # Alertas de formularios
        │   ├── FotoUpload.jsx        # Subida de fotos
        │   ├── Pagination.jsx        # Paginación
        │   ├── StatusBadge.jsx       # Etiquetas de estado
        │   ├── SplashScreen.jsx      # Pantalla de inicio
        │   ├── RegisterChildModal.jsx # Registro de niño/paciente
        │   └── ConsentimientoModal.jsx # Consentimiento informado
        └── ui/                # Design system base
            ├── Button.jsx               # Botón
            └── index.js                 # Barrel export
```

---

## 📄 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite |
| `npm run build` | Compila para producción |
| `npm run preview` | Vista previa del build de producción |
| `npm run lint` | Ejecuta ESLint sobre `src/` |
| `npm run test` | Ejecuta las pruebas unitarias (Vitest) |
| `npm run test:watch` | Pruebas en modo watch |

> Los hooks de Husky ejecutan `eslint --fix` y `prettier --write` sobre los archivos staged antes de cada commit.

---

## 🤝 Contribución

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es desarrollado con fines académicos y de defensa técnica.
