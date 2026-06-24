<div align="center">
  <img src="./Logo.png" alt="SIAT Logo" width="120" />
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
- Dashboard con resumen de pacientes, citas y alertas
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
- Solicitud de citas

### Transversales
- **Autenticación JWT** con renovación automática
- **RBAC** (Control de Acceso Basado en Roles) estricto
- **Modo offline** con almacenamiento local y sincronización
- **Auto-logout** por inactividad (políticas de seguridad clínica)
- **Notificaciones** de alertas en tiempo real
- **Exportación** a PDF y Excel
- **Modo oscuro**

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión |
| :--- | :--- |
| [React](https://react.dev/) | ^18.3.1 |
| [Vite](https://vitejs.dev/) | ^5.4.1 |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.0 |
| [Lucide React](https://lucide.dev/) | ^1.17.0 |
| [Recharts](https://recharts.org/) | ^3.8.1 |
| [jsPDF](https://github.com/parallax/jsPDF) | ^4.2.1 |
| [xlsx](https://sheetjs.com/) | ^0.18.5 |
| [Axios](https://axios-http.com/) | ^1.16.1 |
| [Zod](https://zod.dev/) | ^4.4.3 |
| [Socket.IO Client](https://socket.io/) | ^4.8.3 |

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

# Iniciar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

### Configuración

El frontend se conecta al backend en `http://localhost:3000/api` por defecto (configurable en `src/api/axios.js`). El backend debe estar corriendo de forma independiente.

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
├── vite.config.js             # Configuración de Vite
├── tailwind.config.js         # Configuración de Tailwind CSS
├── postcss.config.js          # Configuración de PostCSS
└── src/
    ├── main.jsx               # Punto de entrada React
    ├── App.jsx                # Componente raíz + RBAC
    ├── index.css              # Estilos globales
    ├── App.css                # Estilos de la aplicación
    ├── api/
    │   └── axios.js           # Cliente Axios con interceptores JWT
    ├── context/
    │   └── GlobalState.jsx    # Estado global (Context API)
    ├── hooks/
    │   ├── useTelemetry.js    # Hook de telemetría IoT
    │   ├── useClinicalData.js # Hook de datos clínicos
    │   └── useIdleTimer.js    # Hook de detección de inactividad
    ├── utils/
    │   ├── pdfGenerator.js    # Generación de PDFs clínicos
    │   └── dashboardMocks.js  # Datos mock para demostración
    └── components/
        ├── Auth.jsx           # Login / Registro
        ├── Login.jsx          # Componente de inicio de sesión
        ├── Register.jsx       # Componente de registro
        ├── Sidebar.jsx        # Barra lateral de navegación
        ├── Topbar.jsx         # Barra superior
        ├── MainDashboard.jsx  # Dashboard del representante
        ├── SpecialistDashboard.jsx  # Dashboard del especialista
        ├── AdminDashboard.jsx # Dashboard del administrador
        ├── StudentRecord.jsx  # Expediente del estudiante
        ├── PatientManagement.jsx # Gestión de pacientes
        ├── Routines.jsx       # Gestión de rutinas
        ├── AgendaDiaria.jsx   # Agenda diaria
        ├── DiarioHogar.jsx    # Diario del hogar
        ├── HistoryProgress.jsx # Historial de evolución
        ├── HardwareInventory.jsx # Inventario de hardware / monitoreo
        ├── Herramientas.jsx   # Herramientas del especialista
        ├── HomeAnalytics.jsx  # Analíticas del hogar
        ├── ParentProfile.jsx  # Perfil del representante
        ├── UserProfile.jsx    # Perfil de usuario
        ├── ForgotPassword.jsx # Recuperación de contraseña
        ├── ResetPassword.jsx  # Restablecimiento de contraseña
        ├── RegisterRepre.jsx  # Registro de representante
        ├── AlertCenter.jsx    # Centro de alertas
        ├── NotificationBell.jsx # Campana de notificaciones
        ├── Indicaciones.jsx   # Indicaciones clínicas
        ├── dashboard/
        │   ├── TelemetryChart.jsx        # Gráfica de telemetría
        │   ├── RegulationStatusCard.jsx  # Estado de regulación
        │   ├── BreathingProtocolModal.jsx # Protocolo de respiración
        │   └── AacBoardDrawer.jsx        # Tablero CAA
        ├── specialist/
        │   ├── SpecialistGlobalView.jsx  # Vista global del especialista
        │   ├── PatientBehaviorChart.jsx  # Gráfico de comportamiento
        │   ├── PatientSensoryChart.jsx   # Gráfico sensorial
        │   ├── PatientCrisisLog.jsx      # Registro de crisis
        │   ├── PatientPeiGoals.jsx       # Metas PEI
        │   ├── SoapNoteModal.jsx         # Notas SOAP
        │   ├── IndicacionModal.jsx       # Modal de indicaciones
        │   └── IncidentModal.jsx         # Modal de incidentes
        ├── admin/
        │   ├── AdminKPIs.jsx             # KPI del admin
        │   ├── AdminCharts.jsx           # Gráficos del admin
        │   ├── AdminActivityLog.jsx      # Registro de actividad
        │   ├── UsuariosTab.jsx           # Gestión de usuarios
        │   ├── EspecialistasTab.jsx      # Gestión de especialistas
        │   ├── AsignacionesTab.jsx       # Asignaciones
        │   └── CatalogosTab.jsx          # Catálogos
        └── parent/
            └── PedirCitaModal.jsx        # Solicitud de citas
```

---

## 📄 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite |
| `npm run build` | Compila para producción |
| `npm run preview` | Vista previa del build de producción |

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
