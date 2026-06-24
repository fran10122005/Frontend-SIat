# Documento de Defensa Técnica: Sistema Integrado de Asistencia Terapéutica (SIAT)

Este documento contiene los argumentos técnicos estructurados para la defensa del proyecto SIAT ante el jurado o tutora, con un fuerte enfoque en la integración de hardware (IoT) y la arquitectura de software escalable.

---

## 1. Arquitectura de Software: Modelo Multi-Tenant (SaaS)

> [!IMPORTANT]
> **Argumento Principal:** "SIAT no es un sistema desarrollado a la medida para una única institución; es una Plataforma como Servicio (SaaS) universal y altamente escalable."

Para garantizar que el sistema sea viable a nivel nacional o global, la base de datos (PostgreSQL vía Prisma ORM) fue diseñada bajo el patrón **Multi-Tenant** (Multi-Inquilino). 
* **Aislación Estricta:** Todas las entidades críticas (Niños, Especialistas, Representantes y Dispositivos) están atadas obligatoriamente a una llave foránea institucional (`ins_codi`). 
* **Seguridad Clínica:** Esto garantiza por diseño arquitectónico que un especialista de la "Institución A" tiene imposibilidad técnica de consultar o cruzar expedientes y telemetría de un paciente de la "Institución B".
* **Escalabilidad Comercial:** Permite al administrador global desplegar el sistema en cientos de fundaciones utilizando la misma base de código y servidor, reduciendo costos de infraestructura.

---

## 2. Integración IoT y Telemetría: Las Pulseras (Núcleo del Sistema)

La innovación principal de SIAT radica en la integración de hardware (wearables) con el software clínico. La pulsera actúa como un nodo IoT (Internet de las Cosas) que transmite constantes vitales.

### A. Sensores y Adquisición de Datos
La pulsera utiliza una combinación de biosensores para medir la fisiología del paciente en tiempo real:
* **Frecuencia Cardíaca (Fotopletismografía):** A través de un sensor óptico (como el MAX30100/MAX30102), se mide el pulso (BPM) del paciente para detectar taquicardias asociadas a ansiedad o crisis de sobrecarga sensorial.
* **Acelerómetro de 3 Ejes:** Mediante un sensor inercial (como el MPU6050), se mide la magnitud de movimiento y aceleración, permitiendo detectar estereotipias motoras (aleteos, balanceos) o hiperactividad física característica durante una crisis.

### B. Transmisión de Alta Frecuencia (Protocolos Ligeros)
> [!CAUTION]
> **El problema del enfoque tradicional:** Si 50 pulseras enviaran datos cada segundo mediante peticiones HTTP/REST (`POST`), el servidor colapsaría rápidamente (DDOS auto-infligido) y la base de datos se llenaría de "basura" en cuestión de días.

**La Solución Implementada en SIAT:**
* **Protocolos Bidireccionales:** Las pulseras se comunican utilizando protocolos de baja latencia como **WebSockets** (o MQTT). Esto mantiene un "tubo" abierto con el servidor de Node.js, permitiendo que la telemetría fluya en microsegundos sin la sobrecarga de los *headers* HTTP.
* **Procesamiento "Edge" (En el borde):** El microcontrolador de la pulsera (ej. un ESP32) no envía todos los datos crudos. Aplica algoritmos de limpieza locales y promedia las lecturas antes de enviarlas al servidor, optimizando el ancho de banda.

---

## 3. Motor de Ingesta y Reglas en el Backend

El backend no es solo un puente, es un analizador en tiempo real. 

1. **Recepción:** Node.js recibe el flujo de datos vía WebSocket.
2. **Evaluación de Umbrales:** El servidor consulta la tabla `tc_umbra` (Umbrales) personalizada para ese niño específico. Ejecuta una regla lógica: *Si los latidos > Umbral Máximo Y el nivel de movimiento > 6, entonces dispara el estado de "SOBRECARGA".*
3. **Persistencia Inteligente:** 
   * **En estado de CALMA:** El servidor promedia los datos de los últimos minutos y guarda un solo registro en PostgreSQL para el historial clínico.
   * **En estado de CRISIS:** El servidor guarda los datos en alta resolución (segundo a segundo) para que el especialista tenga un "zoom" del momento exacto del evento, y registra el evento en la tabla de Alertas (`tr_alert`).
4. **Desacoplamiento de Efectos Secundarios (Notificación No Bloqueante):**
   * **El problema de latencia:** Enviar correos electrónicos de alerta (vía servidores SMTP externos) es una operación propensa a retrasos y tiempos de espera de red (timeouts). Si se manejara de forma síncrona en la ruta crítica del endpoint de telemetría (`await emailService.sendEmail(...)`), cualquier demora del servidor de correo congelaría el flujo de ingesta de datos de la pulsera.
   * **La solución en SIAT:** Las notificaciones por correo electrónico se ejecutan asíncronamente en segundo plano (removiendo el `await` y capturando errores mediante promesas). Esto garantiza que el endpoint de telemetría responda en milisegundos y mantenga el flujo continuo de datos fisiológicos intacto, mientras la notificación por email se procesa en paralelo.

---

## 4. Diseño UX/UI Híbrido y Modular: Evitando la Ansiedad Familiar y la Sobrecarga Cognitiva

A nivel de frontend (React), el sistema está estructurado bajo una estricta separación de responsabilidades para evitar la sobrecarga cognitiva y la ansiedad familiar:

*   **Rol Representante (Familiar):**
    *   **Dashboard de Inicio Limpio (`MainDashboard.jsx`):** Para evitar disparar la ansiedad del padre con telemetría oscilante constante o falsas alarmas en su pantalla principal, el panel de inicio se mantiene como una "portada de bienvenida". Muestra el resumen de la agenda diaria, un feed de eventos/alertas pasados y un estado simplificado del wearable (Online/Offline, batería, señal).
    *   **Seguimiento en Vivo Modular (`HardwareInventory.jsx` como "Seguimiento en Vivo"):** La telemetría en tiempo real (BPM, aceleración y el índice de estrés calculado) se traslada a una sección exclusiva del menú lateral. Solo cuando el familiar desea supervisar activamente al niño, ingresa aquí para ver la gráfica de telemetría deslizante y los indicadores fisiológicos en vivo.
*   **Rol Especialista (Clínico):**
    *   **Dashboard Preventivo Semáforo (`SpecialistDashboard.jsx`):** El especialista maneja un panel global con un indicador semáforo para todos los niños a su cargo (Verde = Calma, Rojo = Crisis). Esto evita que el terapeuta tenga que mirar 20 pantallas de telemetría en movimiento, reduciendo la fatiga visual.
    *   **Calibración de Sensores (`HardwareInventory.jsx` como "Calibración"):** Permite al especialista ejecutar el **Asistente de Línea Base de 15 segundos**. Durante este proceso, se promedia el pulso del niño en reposo para redefinir los umbrales personalizados en la base de datos (`valMini` y `valMaxi`), asegurando que las alarmas reactivas se ajusten exactamente a la fisiología de cada paciente.

### B. Modularización y Mantenibilidad de Dashboards (Estándar de Producción)
*   **Reducción de Deuda Técnica:** Originalmente, los tres paneles de control (`AdminDashboard.jsx`, `SpecialistDashboard.jsx` y `SuperAdminDashboard.jsx`) contenían miles de líneas que mezclaban lógica de estado, llamadas HTTP, renderizado de formularios CRUD, modales de interacción y gráficos interactivos.
*   **Separación de Responsabilidades:** Se crearon subcarpetas específicas (`/admin`, `/specialist` y `/superadmin`) para aislar los subcomponentes lógicos y visuales. Por ejemplo, los modales SOAP e Incidentes del especialista, y los formularios de aprovisionamiento de inquilinos del director global ahora residen en archivos limpios y enfocados de menos de 150 líneas.
*   **Flujo de Datos Unidireccional Reactivo:** La lógica principal y las peticiones a la API se conservaron en los contenedores padre, inyectando datos y callbacks (`handlers`) hacia los subcomponentes mediante **props**. Esto evita la redundancia de código, reduce la huella de memoria y garantiza que los datos reactivos del contexto global de React sigan fluyendo de manera fluida y predecible.
*   **Consolidación de Roles Administrativos (Fase 4):** Para cumplir con los requerimientos comerciales de un sistema SaaS de alto nivel, integramos de forma modular los componentes del súper administrador (`InstitucionesSuperTab.jsx`) directamente en el panel de control del administrador de la fundación (`AdminDashboard.jsx`). Esto consolida todas las funciones de aprovisionamiento y mantenimiento de catálogos en una experiencia de usuario única y fluida.

---

## 5. Resumen de Valor para el Jurado

*"SIAT combina el hardware (IoT) y software en una arquitectura SaaS madura. Hemos resuelto el problema de la sobrecarga de datos (Big Data clínico) filtrando los datos irrelevantes en tiempo real, garantizando la privacidad entre instituciones, y otorgándole al especialista una herramienta preventiva (alertas instantáneas) y diagnóstica (historial de alta resolución) sin precedentes en el manejo de neurodivergencias."*

---

## 7. Preguntas de la Tutora y Defensa Clínica/Técnica

### 💡 Pregunta 1: "¿Qué pasa si al momento de registrar un especialista, este pertenece a dos o más instituciones de salud? ¿Por qué la relación en la base de datos es 1-a-Muchos y no Muchos-a-Muchos?"

**Respuesta Técnica y de Negocio (SaaS):**
Esta decisión de diseño no es una limitación técnica, sino una **medida obligatoria de seguridad clínica, auditoría y cumplimiento legal (SaaS Multi-tenant)**:

1. **Aislamiento de Clientes (Tenancy Isolation):** En una plataforma SaaS, cada institución es un inquilino independiente ("tenant"). Si un especialista compartiera una única cuenta unificada para ambas clínicas en la base de datos, habría un riesgo inmenso de violación de confidencialidad de datos médicos. Para evitar cruces accidentales, el especialista se registra de manera independiente en el contexto de cada institución. Así, cuando inicia sesión para la **Fundación A**, no tiene visibilidad ni acceso a la telemetría, alertas ni expedientes de los pacientes de la **Fundación B**.
2. **Auditoría Clínica Exacta:** La vinculación de terapias, alarmas físicas (`tr_alert`) e indicaciones médicas (`tr_repor`) debe estar asociada formalmente a la institución que provee el servicio. Separar los registros permite al sistema auditar de forma precisa qué institución es responsable del historial de un paciente.
3. **Defensa de la Estructura de Base de Datos:** Si el jurado insistiera en una relación Muchos-a-Muchos, la solución a nivel técnico sería eliminar la columna `ins_codi` de la tabla `tm_espec` y crear una tabla relacional intermedia (ej. `tr_espec_institucion`) con llaves compuestas. Sin embargo, para fines de confidencialidad médica, se optó por el enfoque de aislamiento completo, el cual es el estándar de oro de la industria en plataformas clínicas SaaS.

### 💡 Pregunta 2: "¿Cómo se garantiza la seguridad de datos entre clínicas si el Administrador de la Fundación tiene poder global?"
* **Respuesta:** Mediante una clara separación entre la **Gestión del Ecosistema SaaS** y la **Operación de Pacientes/Especialistas**. Con la consolidación de roles (Fase 4), el Administrador de la Fundación adquiere el rango de Súper Administrador Global de la plataforma SIAT, permitiéndole aprovisionar múltiples sedes (tenants) y estandarizar especialidades base. Sin embargo, para los usuarios clínicos ordinarios (especialistas) y familiares (representantes), se mantiene un aislamiento absoluto por diseño. El backend inyecta de forma inmutable el `ins_codi` en sus tokens JWT, impidiendo cualquier intento de lectura o modificación cruzada de historiales de pacientes o biometría entre clínicas.

### 💡 Pregunta 3: "¿Cómo simulan el comportamiento del hardware (wearable) si aún no han adquirido los dispositivos físicos finales?"
* **Respuesta:** Para validar la arquitectura de extremo a extremo sin depender del hardware físico en esta etapa de prototipo, desarrollamos un **Simulador de Hardware IoT en Node.js (`wearable_simulator.js`)** que emula el firmware de la pulsera:
  1.  **Autenticación Real (JWT):** El simulador se conecta a la API realizando un login legítimo (`/api/auth/login`) con credenciales del representante familiar, adquiriendo el token JWT necesario para autorizar las transmisiones en el middleware del backend.
  2.  **Transmisión de Biometría:** Envía de forma continua (cada 5 segundos) las lecturas fisiológicas de frecuencia cardíaca (BPM) del sensor MAX30102 y aceleración (G) del giroscopio MPU6050.
  3.  **Interactividad en Tiempo Real (Consola):** El evaluador puede presionar directamente la tecla `[S]` en la terminal del simulador (o presionar Enter como fallback en consolas no-TTY) para forzar un pico de estrés. Esto altera la frecuencia cardíaca (>120 BPM) y reduce la aceleración, permitiendo verificar en vivo cómo el motor de reglas del backend evalúa los umbrales personalizados de la base de datos, registra el evento en `tr_alert`, dispara el envío de correos asíncronos y emite la alerta mediante Socket.io a la interfaz del usuario.
