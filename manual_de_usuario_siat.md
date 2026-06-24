# 🏥 SIAT - Manual de Usuario y Credenciales

Este documento contiene las credenciales de acceso para los diferentes perfiles del sistema SIAT y un manual de usuario básico para operar la plataforma durante la defensa.

---

## 🔐 Credenciales de Acceso

Las siguientes credenciales están configuradas en la base de datos por defecto para probar los distintos perfiles de la plataforma:

| Perfil | Rol | Correo Electrónico (Usuario) | Contraseña |
| :--- | :--- | :--- | :--- |
| **Director Global** | Súper Administrador | `director@siat.com` | `123456` |
| **Admin Fundación** | Administrador de Institución | `admin_fundacion@siat.com` | `123456` |
| **Especialista** | Profesional de la Salud | `especialista@siat.com` | `123456` |
| **Representante** | Padre / Tutor | `padre@siat.com` | `123456` |

> [!IMPORTANT]
> **Aislamiento de Datos (Multi-tenant):** Recuerda mencionar durante tu defensa que, aunque todos inician sesión en la misma plataforma, cada usuario tiene un nivel de acceso restringido y los datos están estrictamente aislados por la institución a la que pertenecen (mediante el código `ins_codi`).

---

## 📖 Manual de Usuario por Perfiles

A continuación, se describen las funciones principales disponibles en el panel de control (Dashboard) de cada perfil.

### 1. Perfil Súper Administrador (Director Global)
**Acceso:** `director@siat.com`

El Director Global tiene una vista panorámica de **todas las instituciones y el ecosistema completo** del SIAT.

*   **Panel General (Dashboard):** Muestra métricas globales como el total de instituciones afiliadas, el total de especialistas activos y la cantidad global de niños en terapia.
*   **Gestión de Instituciones:** Permite visualizar y (próximamente) registrar nuevas fundaciones o clínicas en la plataforma SaaS.
*   **Auditoría de Actividad (SaaS Audit Trails):** Registro global de las acciones importantes que ocurren en el sistema (por ejemplo, accesos no autorizados, creación de instituciones). Esta función demuestra la seguridad y trazabilidad del sistema.

### 2. Perfil Administrador de Institución (Admin Fundación)
**Acceso:** `admin_fundacion@siat.com`

Este perfil está restringido únicamente a los datos de su propia fundación o clínica (ej. Clínica Principal SIAT). **No puede ver datos de otras instituciones.**

*   **Panel General (Dashboard):** Muestra las métricas específicas de su clínica: especialistas registrados en su sede, niños en terapia bajo su institución y la ocupación de camas/recursos.
*   **Gestión de Personal:** Administración de los especialistas que laboran en su clínica.
*   **Registro de Actividad (Recent Activity Log):** Historial de acciones realizadas dentro de su institución (ej. Especialista inició sesión, Nueva terapia registrada).
*   **Control de Monitoreo en Vivo (Simulador):** Permite ver el estado actual de los pacientes. Cuenta con botones de simulación (**Simular Crisis** / **Volver a la Calma**) ideales para demostrar en tiempo real cómo el sistema detecta anomalías y emite alertas (función especial para la defensa).

### 3. Perfil Especialista
**Acceso:** `especialista@siat.com`

El especialista utiliza el sistema para el diagnóstico, seguimiento clínico y parametrización de umbrales.

*   **Resumen Global (`SpecialistDashboard.jsx`):** Muestra las citas agendadas, un historial de alertas críticas y el estado actual de los niños asignados (indicador semáforo en reposo).
*   **Gestión de Pacientes (`patients`):** Expediente clínico digital del niño, terapias y notas evolutivas.
*   **Historial de Evolución (`history`):** Gráficos acumulados de calma y estrés del paciente con capacidad de exportación a PDF clínico.
*   **Calibración de Sensores (`HardwareInventory.jsx` / `inventario`):** Permite al profesional calibrar los wearables de los niños a través del **Asistente de Línea Base de 15 segundos**, estableciendo científicamente los límites cardíacos (`valMini`/`valMaxi`) en reposo para evitar falsos positivos domésticos.

### 4. Perfil Representante (Padre)
**Acceso:** `padre@siat.com`

Este perfil está optimizado para su uso diario en el hogar, promoviendo una experiencia limpia y reduciendo la ansiedad familiar.

*   **Panel de Inicio (`MainDashboard.jsx`):** Muestra un resumen del estado de la agenda escolar/terapéutica del día, notificaciones de eventos clínicos y el estado general de conexión del wearable (batería, señal e ID de hardware).
*   **Agenda Diaria (`AgendaDiaria.jsx`):** Checklist interactivo de actividades diarias asignadas en casa.
*   **Herramientas TEA (`Herramientas.jsx`):** Caja de recursos que incluye:
    *   *Tablero de Pictogramas AAC:* Con sintetizador de voz (Speech Synthesis API) para que el niño pueda comunicarse.
    *   *Economía de Fichas (Premios):* Para motivar al niño a completar sus actividades a cambio de recompensas.
    *   *Respiración Guiada SOS:* Ejercicio interactivo de relajación guiada (Inhala / Exhala) para control de crisis.
*   **Gestor de Rutinas (`rutinas`):** Visualizador de las actividades recurrentes del menor.
*   **Seguimiento en Vivo (`HardwareInventory.jsx` / `sensores`):** **[NUEVA UBICACIÓN DEDICADA]** Sección exclusiva de monitoreo en tiempo real. Muestra el ritmo cardíaco (BPM), el movimiento inercial (G) y el índice de estrés calculado instantáneamente. Cuenta con una gráfica continua de telemetría deslizante y un botón de simulación de crisis para demostraciones rápidas de alertas predictivas.
*   **Perfil y Bitácora (`ParentProfile.jsx`):** Envío de reportes diarios (calidad de sueño, estado de ánimo, observaciones del hogar) directamente al especialista.

---

## 💡 Consejos para la Defensa (Demo en Vivo)

1.  **Inicia sesión primero como Administrador de Fundación** para mostrar el entorno de trabajo diario de una clínica. Muestra el registro de actividad.
2.  **Utiliza la función de Simulación ("Simular Crisis"):** Para demostrar cómo el sistema SIAT reacciona ante un evento clínico adverso. Esto hará la presentación interactiva.
3.  **Cierra sesión e ingresa como Director Global (Súper Admin):** Demuestra cómo este perfil tiene un panel completamente diferente, con auditorías globales y control del SaaS, resaltando la arquitectura **Multi-tenant**.
4.  Si te preguntan **"¿Qué pasa si un especialista trabaja en dos clínicas?"**, responde con seguridad apoyándote en el documento técnico: "El sistema maneja una relación 'Uno a Muchos' entre el Especialista y las Instituciones en la base de datos (tabla puente), permitiendo que el mismo usuario pueda tener roles y accesos aislados según la clínica con la que inicie la sesión en ese momento".
simular pulsera node wearable_simulator.js
