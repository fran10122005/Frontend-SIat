import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import useIdleTimer from "../hooks/useIdleTimer";
import { toastError } from "../utils/errorHandler";
import { disconnectSocket } from "../hooks/socket";

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

const viewToPath = {
  login: "/login",
  register: "/register",
  forgot: "/forgot",
  "reset-password": "/reset-password",
  "register-repre": "/register-repre",
  dashboard: "/dashboard",
  admin: "/admin",
  student: "/student",
  patients: "/patients",
  rutinas: "/rutinas",
  agenda: "/agenda",
  herramientas: "/herramientas",
  perfil_padre: "/perfil-padre",
  diario_hogar: "/diario-hogar",
  profile: "/profile",
  settings: "/configuracion",
  inventario: "/inventario",
  sensores: "/sensores",
  historial: "/historial",
  home_analytics: "/home-analytics",
};

const pathToView = Object.fromEntries(
  Object.entries(viewToPath).map(([k, v]) => [v, k]),
);

// Rutas paginadas por pestaña del panel admin (URL con deep-linking: /admin/especialistas, etc.)
export const adminTabPaths = {
  dashboard: "/admin",
  especialistas: "/admin/especialistas",
  representantes: "/admin/representantes",
  historial_clinico: "/admin/historial-clinico",
  asignaciones: "/admin/asignaciones",
  catalogos: "/admin/catalogos",
  usuarios: "/admin/usuarios",
  infraestructura: "/admin/infraestructura",
};

// Todas las rutas del panel admin resuelven a la vista "admin"
Object.values(adminTabPaths).forEach((p) => {
  pathToView[p] = "admin";
});

export const GlobalProvider = ({ children }) => {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    return pathToView[path] || localStorage.getItem("currentView") || "login";
  });
  const [nomNino, setNomNino] = useState(null);
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("userRole") || "ESPECIALISTA",
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || "",
  );
  const [userFoto, setUserFoto] = useState("");
  const [adminActiveTab, setAdminActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggleTheme = (mode) => {
    // mode: 'light' | 'dark' | 'system' | undefined (toggle)
    if (mode === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("siat_theme", "light");
      setIsDark(false);
    } else if (mode === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("siat_theme", "dark");
      setIsDark(true);
    } else if (mode === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      localStorage.setItem("siat_theme", "system");
      setIsDark(prefersDark);
    } else {
      // simple toggle
      if (isDark) {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
      setIsDark(!isDark);
    }
  };

  // UI Preferences: accent color, font size, density
  // Las preferencias están delimitadas POR PERFIL (rol), de modo que un
  // especialista, representante o administrador tienen sus propias
  // configuraciones sin afectarse entre sí.
  const roleToKey = (role) => {
    if (role === "ROL_ADM") return "admin";
    if (role === "ROL_ESP") return "especialista";
    if (role === "ROL_REP") return "representante";
    return "guest";
  };

  const uiPrefsKey = `siat_ui_prefs_${roleToKey(userRole)}`;

  const defaultUiPrefs = {
    accentColor: "blue",
    fontSize: "normal",
    density: "normal",
    theme: "system",
  };

  const readUiPrefs = (key) => {
    try {
      const saved = localStorage.getItem(key);
      return saved
        ? { ...defaultUiPrefs, ...JSON.parse(saved) }
        : { ...defaultUiPrefs };
    } catch {
      return { ...defaultUiPrefs };
    }
  };

  const [uiPrefs, setUiPrefs] = useState(() =>
    readUiPrefs(`siat_ui_prefs_${roleToKey(userRole)}`),
  );

  const ACCENT_COLORS = {
    blue: { primary: "#2563eb", ring: "#3b82f6", css: "accent-blue" },
    indigo: { primary: "#4f46e5", ring: "#6366f1", css: "accent-indigo" },
    violet: { primary: "#7c3aed", ring: "#8b5cf6", css: "accent-violet" },
    emerald: { primary: "#059669", ring: "#10b981", css: "accent-emerald" },
    cyan: { primary: "#0891b2", ring: "#06b6d4", css: "accent-cyan" },
    rose: { primary: "#e11d48", ring: "#f43f5e", css: "accent-rose" },
  };

  const applyUiPrefs = (prefs) => {
    const root = document.documentElement;
    // Accent color CSS vars
    const accent = ACCENT_COLORS[prefs.accentColor] || ACCENT_COLORS.blue;
    root.style.setProperty("--color-brand", accent.primary);
    root.style.setProperty("--color-brand-ring", accent.ring);
    // Font size
    const fontMap = { small: "14px", normal: "16px", large: "18px" };
    root.style.setProperty(
      "--base-font-size",
      fontMap[prefs.fontSize] || "16px",
    );
    // Density
    root.dataset.density = prefs.density || "normal";
  };

  const updateUiPrefs = (newPrefs) => {
    setUiPrefs((prev) => {
      const merged = { ...prev, ...newPrefs };
      localStorage.setItem(uiPrefsKey, JSON.stringify(merged));
      applyUiPrefs(merged);
      // Also handle theme change
      if (newPrefs.theme !== undefined) {
        toggleTheme(newPrefs.theme);
      }
      return merged;
    });
  };

  // Aplica las preferencias de UI al montar (color, tamaño, densidad, tema)
  useEffect(() => {
    applyUiPrefs(uiPrefs);
    toggleTheme(uiPrefs.theme || "system");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambia el rol (login/logout/cambio de perfil), se recargan y
  // aplican las preferencias de ESE perfil, sin afectar a otros roles.
  useEffect(() => {
    const prefs = readUiPrefs(uiPrefsKey);
    setUiPrefs(prefs);
    applyUiPrefs(prefs);
    toggleTheme(prefs.theme || "system");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const [specialistConfig, setSpecialistConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("specialistConfig");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateSpecialistConfig = (newConfig) => {
    setSpecialistConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      localStorage.setItem("specialistConfig", JSON.stringify(merged));
      return merged;
    });
  };

  const isQuietHours = useMemo(() => {
    if (!specialistConfig.quietHoursEnabled) return false;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const current = h * 60 + m;
    const [sh, sm] = (specialistConfig.quietStart || "22:00")
      .split(":")
      .map(Number);
    const [eh, em] = (specialistConfig.quietEnd || "07:00")
      .split(":")
      .map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (start > end) return current >= start || current < end;
    return current >= start && current < end;
  }, [specialistConfig]);

  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      const target = viewToPath[currentView];
      if (target) routerNavigate(target, { replace: true });
      return;
    }
    const view = pathToView[path];
    if (view && view !== currentView) {
      setCurrentView(view);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("userRole", userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem("userName", userName);
  }, [userName]);

  // Idle session timeout (default: 15 min)
  const IDLE_TIMEOUT = Number(import.meta.env.VITE_IDLE_TIMEOUT) || 900;
  const publicViews = [
    "login",
    "register",
    "forgot",
    "reset-password",
    "register-repre",
  ];
  const hasToken = !!localStorage.getItem("token");
  const isPublicView = publicViews.includes(currentView);
  const idleActive = hasToken && !isPublicView;

  const handleIdleTimeout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("currentView");
    setCurrentView("login");
    routerNavigate("/login", { replace: true });
    showToast("⏱️ Sesión cerrada por inactividad");
  }, [routerNavigate]);

  useIdleTimer(IDLE_TIMEOUT, handleIdleTimeout, idleActive);

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showEmergencyGuard, setShowEmergencyGuard] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [listaNinos, setListaNinos] = useState([]);

  const fetchNinos = async () => {
    try {
      const res = await api.get("/ninos/mis-ninos");
      const ninosData = res.data.data;
      if (ninosData && ninosData.length > 0) {
        const mapped = ninosData.map((n) => ({
          id_ninos: n.nin_codi,
          nom_nino: n.nin_nomb,
          ape_nino: n.nin_apel,
          niv_desa: n.nin_nivd,
          est_disp: "Online", // Simulado por ahora
          est_asign:
            n.tc_asign && n.tc_asign.length > 0 ? "Activo" : "Sin asignar",
          nin_fnac: n.nin_fnac,
          nin_gner: n.nin_gner,
          nin_ingr: n.nin_ingr,
          nin_codi: n.nin_codi,
          ins_codi: n.ins_codi,
          tm_insti: n.tm_insti,
          nin_foto: n.nin_foto || "",
          nin_diag: n.nin_diag || "",
        }));
        setListaNinos(mapped);
        if (!selectedChildId && userRole !== "ESPECIALISTA") {
          setSelectedChildId(mapped[0].id_ninos);
          setNomNino(mapped[0].nom_nino);
        }
      } else {
        setListaNinos([]);
      }
    } catch (err) {
      console.error("Error fetching niños:", err);
      toastError(err, showToast, "Error al cargar los datos del sistema.");
    }
  };

  const activeChild = useMemo(() => {
    if (!listaNinos || listaNinos.length === 0) return null;
    return (
      listaNinos.find(
        (n) => n.id_ninos === selectedChildId || n.nin_codi === selectedChildId,
      ) || listaNinos[0]
    );
  }, [selectedChildId, listaNinos]);

  useEffect(() => {
    if (activeChild) {
      if (activeChild.nom_nino && activeChild.nom_nino !== nomNino) {
        setNomNino(activeChild.nom_nino);
      }
    }
  }, [activeChild, nomNino]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isPublic =
      currentView === "login" ||
      currentView === "register" ||
      currentView === "forgot" ||
      currentView === "reset-password" ||
      currentView === "register-repre";

    // El Administrador NO debe pedir la lista de niños, solo Especialistas y Representantes
    if (
      token &&
      !isPublic &&
      (userRole === "ESPECIALISTA" || userRole === "REPRESENTANTE")
    ) {
      fetchNinos();
    } else if (!token || isPublic) {
      setListaNinos([]); // Limpiar estado residual
    }
  }, [currentView, userRole]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isPublic =
      currentView === "login" ||
      currentView === "register" ||
      currentView === "forgot" ||
      currentView === "reset-password" ||
      currentView === "register-repre";

    if (
      token &&
      !isPublic &&
      (userRole === "ESPECIALISTA" || userRole === "REPRESENTANTE")
    ) {
      fetchRoutines();
      fetchCategories();
    }
  }, [currentView, userRole, selectedChildId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isPublic =
      currentView === "login" ||
      currentView === "register" ||
      currentView === "forgot" ||
      currentView === "reset-password" ||
      currentView === "register-repre";

    let active = true;
    if (!token || isPublic) {
      setUserFoto("");
      return () => {
        active = false;
      };
    }

    api
      .get("/auth/me")
      .then((res) => {
        if (!active) return;
        const u = res.data?.data || {};
        let foto = "";
        if (u.rol_codi === "ROL_ESP" && u.tm_espec) {
          foto = u.tm_espec.esp_foto || "";
        } else if (u.rol_codi === "ROL_REP" && u.tm_repre) {
          foto = u.tm_repre.rep_foto || "";
        } else if (u.rol_codi === "ROL_ADM" && u.tm_admin) {
          foto = u.tm_admin.adm_foto || "";
        }
        if (foto) setUserFoto(foto);
      })
      .catch(() => {
        /* si falla, se mantiene el estado actual */
      });

    return () => {
      active = false;
    };
  }, [currentView, userRole]);

  const [routines, setRoutines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isRoutinesLoading, setIsRoutinesLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/sesiones/categorias?limite=100");
      const data = res.data.data;
      setCategories(data?.items || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchRoutines = async () => {
    setIsRoutinesLoading(true);
    try {
      const url = selectedChildId
        ? `/sesiones/actividades?nin_codi=${selectedChildId}&limite=100`
        : "/sesiones/actividades?limite=100";
      const res = await api.get(url);
      const data = res.data.data;
      const items = data?.items || [];
      const mapped = items.map((act) => ({
        id: act.act_codi,
        title: act.act_trea,
        category: act.tm_categ?.cat_nomb || "Monitoreo",
        categoryCode: act.cat_codi,
        description: act.act_desc || "",
        difficulty: act.act_difi || "Baja",
        status: act.act_estd || "Activa",
        durationStr: act.act_time ? `${act.act_time} min` : "Sin duración",
        act_time: act.act_time || 15,
        inst: act.act_guia || "",
        media: act.act_med || "",
        materials: act.act_meta || "",
        sessionCount: act._count?.tr_sesio || 0,
      }));
      setRoutines(mapped);
    } catch (err) {
      console.error("Error fetching routines:", err);
    } finally {
      setIsRoutinesLoading(false);
    }
  };

  const resolveCategory = (name) =>
    categories.find(
      (c) =>
        c.cat_nomb?.trim().toLowerCase() === String(name || "").toLowerCase(),
    ) ||
    categories.find((c) => c.cat_codi === "CAT_SIM") ||
    categories[0] ||
    null;

  const createRoutine = async (formData) => {
    try {
      const cat = resolveCategory(formData.category);
      if (!cat) {
        showToast("⚠️ No hay categorías disponibles. Crea una primero.");
        return;
      }

      const payload = {
        cat_codi: cat.cat_codi,
        act_trea: formData.title,
        act_desc: formData.description || undefined,
        act_meta: formData.materials?.trim() || undefined,
        act_difi: formData.difficulty || "Baja",
        act_med: formData.mediaUrl?.trim() || undefined,
        act_guia: formData.steps
          ? formData.steps
              .map((s, index) => `${index + 1}. ${s.text} (${s.time})`)
              .join("\n")
          : "",
        act_time: parseInt(formData.durationStr) || 15,
        nin_codi: selectedChildId || null,
      };

      await api.post("/sesiones/actividades", payload);
      showToast("✨ Terapia creada y guardada en el backend.");
      await fetchRoutines();
    } catch (err) {
      console.error("Error creating routine:", err);
      toastError(err, showToast, "Error al guardar la rutina.");
    }
  };

  const updateRoutine = async (act_codi, formData) => {
    try {
      const cat = resolveCategory(formData.category);
      if (!cat) {
        showToast("⚠️ No hay categorías disponibles. Crea una primero.");
        return;
      }

      const payload = {
        cat_codi: cat.cat_codi,
        act_trea: formData.title,
        act_desc: formData.description || undefined,
        act_meta: formData.materials?.trim() || undefined,
        act_difi: formData.difficulty || "Baja",
        act_med: formData.mediaUrl?.trim() || undefined,
        act_guia: formData.steps
          ? formData.steps
              .map((s, index) => `${index + 1}. ${s.text} (${s.time})`)
              .join("\n")
          : "",
        act_time: parseInt(formData.durationStr) || 15,
      };

      await api.put(`/sesiones/actividades/${act_codi}`, payload);
      showToast("✅ Terapia actualizada correctamente.");
      await fetchRoutines();
    } catch (err) {
      console.error("Error updating routine:", err);
      toastError(err, showToast, "Error al actualizar la rutina.");
    }
  };

  const deleteRoutine = async (act_codi) => {
    try {
      await api.delete(`/sesiones/actividades/${act_codi}`);
      showToast("🗑️ Terapia eliminada.");
      await fetchRoutines();
    } catch (err) {
      console.error("Error deleting routine:", err);
      toastError(err, showToast, "Error al eliminar la rutina.");
    }
  };

  const createCategory = async (cat_nomb, cat_deta = "") => {
    try {
      await api.post("/sesiones/categorias", {
        cat_nomb,
        cat_deta: cat_deta || undefined,
      });
      showToast("✅ Categoría creada.");
      await fetchCategories();
    } catch (err) {
      console.error("Error creating category:", err);
      toastError(err, showToast, "Error al crear la categoría.");
    }
  };

  const updateCategory = async (cat_codi, data) => {
    try {
      await api.put(`/sesiones/categorias/${cat_codi}`, data);
      showToast("✅ Categoría actualizada.");
      await fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      toastError(err, showToast, "Error al actualizar la categoría.");
    }
  };

  const deleteCategory = async (cat_codi) => {
    try {
      await api.delete(`/sesiones/categorias/${cat_codi}`);
      showToast("🗑️ Categoría eliminada.");
      await fetchCategories();
      await fetchRoutines();
    } catch (err) {
      console.error("Error deleting category:", err);
      toastError(err, showToast, "No se pudo eliminar la categoría.");
    }
  };

  const [childDataMap, setChildDataMap] = useState({});

  const [globalHistoricalData, setGlobalHistoricalData] = useState([]);

  // Hardware y Wearables vinculados
  const [globalReports, setGlobalReports] = useState([]);
  const [globalHardware, setGlobalHardware] = useState([]);

  const addHardware = (hardwareData) => {
    const newId = `HW-${String(globalHardware.length + 1).padStart(3, "0")}`;
    const newDevice = {
      id_hardw: newId,
      est_disp: "Online",
      battery: 100,
      signal: 100,
      type: hardwareData.type,
      name: hardwareData.name,
    };
    setGlobalHardware((prev) => [...prev, newDevice]);
    showToast(`✅ Sensor ${newDevice.name} añadido correctamente.`);
  };

  const registerConnectedDevice = useCallback((deviceInfo) => {
    if (!deviceInfo || !deviceInfo.name) return;
    setGlobalHardware((prev) => {
      const exists = prev.some((d) => d.name === deviceInfo.name);
      if (exists) {
        return prev.map((d) =>
          d.name === deviceInfo.name
            ? {
                ...d,
                est_disp: "Online",
                battery: deviceInfo.batteryLevel ?? d.battery ?? 100,
                signal: deviceInfo.signal ?? d.signal ?? 100,
              }
            : d,
        );
      }
      const safeId =
        deviceInfo.id ||
        `BLE-${deviceInfo.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "DEV"}`;
      return [
        {
          id_hardw: safeId,
          est_disp: "Online",
          battery: deviceInfo.batteryLevel ?? 100,
          signal: deviceInfo.signal ?? 100,
          type: "Smartwatch Bluetooth BLE",
          name: deviceInfo.name,
        },
        ...prev,
      ];
    });
  }, []);

  const [globalAlertas, setGlobalAlertas] = useState([]);

  // Telemetría de alta resolución (segundo a segundo) durante la ventana de la crisis (5 min aprox)
  const crisisTelemetry = {};

  // --- Datos Simulados de Análisis en Casa (Padre) ---
  const [homeHistoricalData, setHomeHistoricalData] = useState([]);

  const [parentNotesMap, setParentNotesMap] = useState({});

  const parentNotes = useMemo(() => {
    return selectedChildId ? parentNotesMap[selectedChildId] || [] : [];
  }, [parentNotesMap, selectedChildId]);

  const addHomeReport = (report) => {
    const [y, m, day] = (report.date || "").split("-").map(Number);
    const d = new Date(y, m - 1, day);
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dia = d instanceof Date && !isNaN(d) ? days[d.getDay()] : "Hoy";

    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const bpm = report.bpm
      ? parseInt(report.bpm)
      : report.mood === "Crisis / Sobrecarga"
        ? 120
        : 80;

    const summaryText = `[Sueño: ${report.sleepHours}h - ${report.sleepQuality}] [Apetito: ${report.appetite}] ${report.text}`;

    if (selectedChildId) {
      setParentNotesMap((prev) => ({
        ...prev,
        [selectedChildId]: [
          { time, bpm, dia, text: summaryText },
          ...(prev[selectedChildId] || []),
        ],
      }));
    }

    // Calcular nueva calma según el mood reportado
    let newCalma = 70;
    if (report.mood === "Muy Calmo") newCalma = 95;
    if (report.mood === "Estable") newCalma = 80;
    if (report.mood === "Irritable") newCalma = 45;
    if (report.mood === "Crisis / Sobrecarga") newCalma = 15;

    setHomeHistoricalData((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((item) => item.dia === dia);
      if (idx !== -1) {
        copy[idx] = {
          ...copy[idx],
          calma: Math.round((copy[idx].calma + newCalma) / 2),
          sobrecarga: Math.round((copy[idx].sobrecarga + (100 - newCalma)) / 2),
          notas: copy[idx].notas + 1,
        };
      } else {
        copy.push({
          dia,
          calma: newCalma,
          sobrecarga: 100 - newCalma,
          notas: 1,
        });
      }
      return copy;
    });

    showToast(
      "✅ Reporte del hogar enviado con éxito. Especialista notificado.",
    );
  };

  const [clinicalHistory, setClinicalHistory] = useState([]);
  const [clinicalReports, setClinicalReports] = useState([]);
  const [clinicalAlerts, setClinicalAlerts] = useState([]);
  const [clinicalBitacoras, setClinicalBitacoras] = useState([]);

  const fetchHistorialCompleto = async (childId) => {
    if (!childId) return;
    try {
      const res = await api.get(`/reportes/historial-completo/${childId}`);
      const { reportes, sesiones } = res.data.data;

      // Map reportes (Indicaciones)
      if (reportes && reportes.length > 0) {
        const mappedReports = reportes.map((r) => ({
          fec_repo: r.rpt_inpe,
          pro_calm: r.rpt_meta,
          tot_sesi: r.rpt_sesi,
          fue_efec: r.rpt_nube,
          com_tend: r.rpt_nota || "",
          id_rutin: r.rpt_graf,
        }));
        setClinicalReports(mappedReports);
      } else {
        setClinicalReports([]);
      }

      // Map sesiones (Evolución)
      if (sesiones && sesiones.length > 0) {
        const mappedHistory = sesiones.map((s) => {
          const hasAlerts = s.tr_alert && s.tr_alert.length > 0;
          const proCalm = hasAlerts ? 65 : 95;
          const note = s.ses_nota || "Sesión terapéutica regular";
          return {
            fec_repo: new Date(s.ses_inic).toLocaleDateString("es-ES"),
            pro_calm: proCalm,
            tot_sesi: 1,
            fue_efec: !hasAlerts,
            com_tend: note,
          };
        });
        setClinicalHistory(mappedHistory);

        // Map alertas
        const allAlerts = [];
        sesiones.forEach((s) => {
          if (s.tr_alert) {
            s.tr_alert.forEach((al) => {
              allAlerts.push({
                id_alert: al.ale_codi,
                fec_hora: al.ale_time,
                est_dete: al.ale_meto || "SOBRECARGA",
                fue_efec: al.tr_feedb?.[0]?.fed_efec ?? null,
                bpm_max: 124,
                mov_max: 2.1,
                stress_index: 85,
                com_padr: al.tr_feedb?.[0]?.com_padr || "",
              });
            });
          }
        });
        setClinicalAlerts(allAlerts);
      } else {
        setClinicalHistory([]);
        setClinicalAlerts([]);
      }
    } catch (err) {
      console.error("Error fetching child complete history:", err);
    }
  };

  const [globalPeiGoals, setGlobalPeiGoals] = useState([]);

  const [crisisAlerts, setCrisisAlerts] = useState([]);
  const [crisisTelemetryMap, setCrisisTelemetryMap] = useState({});

  const fetchCrisisAlerts = async (childId) => {
    if (!childId) return;
    try {
      const res = await api.get(`/especialista/alertas/${childId}`);
      const data = res.data.data || [];
      const map = {};
      data.forEach((al) => {
        map[al.id_alert] = al.telemetry || [];
      });
      setCrisisAlerts(data);
      setCrisisTelemetryMap(map);
    } catch (err) {
      console.error("Error fetching crisis alerts:", err);
      setCrisisAlerts([]);
      setCrisisTelemetryMap({});
    }
  };

  const fetchPeiGoals = async (childId) => {
    if (!childId) return;
    try {
      const res = await api.get(`/metas/${childId}`);
      setGlobalPeiGoals(res.data.data);
    } catch (err) {
      console.error("Error fetching PEI goals:", err);
    }
  };

  const crearPeiGoal = async (childId, goalData) => {
    try {
      await api.post("/metas", {
        nin_codi: childId,
        ...goalData,
      });
      await fetchPeiGoals(childId);
    } catch (err) {
      console.error("Error creating PEI goal:", err);
      throw err;
    }
  };

  const incrementPeiTrial = async (goalId, childId) => {
    try {
      await api.patch(`/metas/${goalId}/ensayo`);
      if (childId) await fetchPeiGoals(childId);
    } catch (err) {
      console.error("Error incrementing PEI trial:", err);
      throw err;
    }
  };

  const crearIndicacion = async (childId, data) => {
    try {
      await api.post("/especialista/indicaciones", {
        nin_codi: childId,
        ...data,
      });
      await fetchHistorialCompleto(childId);
    } catch (err) {
      console.error("Error creating indicacion:", err);
      throw err;
    }
  };

  // ==== SESSIONS HOOKS (FASE 1.2) ====
  const [sessions, setSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const fetchSessions = useCallback(async (childId) => {
    if (!childId) return;
    setIsSessionsLoading(true);
    try {
      const res = await api.get(`/sesiones/ninos/${childId}/sesiones`);
      setSessions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  const startSession = useCallback(
    async (sessionData) => {
      try {
        const nin_codi =
          sessionData.nin_codi ||
          sessionData.patient?.nin_codi ||
          sessionData.patient?.id_ninos;
        let act_codi = sessionData.act_codi;

        if (!act_codi && sessionData.activities?.length > 0) {
          act_codi = sessionData.activities[0];
        }

        if (!nin_codi || !act_codi) {
          throw new Error(
            "Faltan datos: seleccione un paciente y al menos una actividad",
          );
        }

        const res = await api.post("/sesiones/iniciar", { nin_codi, act_codi });
        if (nin_codi) await fetchSessions(nin_codi);
        return res.data;
      } catch (err) {
        console.error("Error starting session:", err);
        throw err;
      }
    },
    [fetchSessions],
  );

  const closeSession = useCallback(
    async (sesCodi, childId, summaryData) => {
      try {
        const res = await api.put(`/sesiones/${sesCodi}/cerrar`, summaryData);
        if (childId) await fetchSessions(childId);
        return res.data;
      } catch (err) {
        console.error("Error closing session:", err);
        throw err;
      }
    },
    [fetchSessions],
  );

  const logActivity = useCallback(async (activityData) => {
    try {
      const res = await api.post("/sesiones/actividades", activityData);
      return res.data;
    } catch (err) {
      console.error("Error logging activity:", err);
      throw err;
    }
  }, []);

  // ==== INDICACIONES HOOKS (FASE 1.3) ====
  const markIndicacionRead = useCallback(async (indicacionId) => {
    try {
      await api.patch(`/especialista/indicaciones/${indicacionId}/leer`);
    } catch (err) {
      console.error("Error marking indication as read:", err);
      throw err;
    }
  }, []);

  const fetchIndicacionStatus = useCallback(async (childId) => {
    if (!childId) return [];
    try {
      const res = await api.get(`/especialista/indicaciones/${childId}`);
      return res.data.data || [];
    } catch (err) {
      console.error("Error fetching indications:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchHistorialCompleto(selectedChildId);
      fetchPeiGoals(selectedChildId);
      fetchCrisisAlerts(selectedChildId);
      fetchSessions(selectedChildId);
    }
  }, [selectedChildId]);

  const currentChildId = selectedChildId || "N001";
  const valMini = childDataMap[currentChildId]?.valMini || 65;
  const valMaxi = childDataMap[currentChildId]?.valMaxi || 110;
  const offset = childDataMap[currentChildId]?.offset || 0;

  // Conexión directa a la base de datos sin inyección de Mocks destructivos
  const historicalData = clinicalHistory || [];
  const alertas = clinicalAlerts || [];
  const reports = clinicalReports || [];

  const hardware = globalHardware.map((h, i) => ({
    ...h,
    id_hardw: h.id_hardw || `HW-20${i}`,
    battery: Math.min(100, Math.max(5, h.battery + offset)),
    signal: Math.min(100, Math.max(10, h.signal - offset)),
  }));

  const evaluateAlert = async (id_alert, fue_efec, com_padr = "") => {
    try {
      await api.post(`/reportes/alertas/${id_alert}/feedback`, {
        fed_efec: fue_efec,
        com_padr: com_padr,
      });
      showToast(
        fue_efec
          ? "✅ Efectividad registrada exitosamente"
          : "⚠️ Registrado como no efectivo",
      );
      if (selectedChildId) {
        await fetchHistorialCompleto(selectedChildId);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toastError(err, showToast, "Error al registrar feedback en el servidor.");
    }
  };

  // --- Datos de objetivos de terapia para TEA (derivados de PEI o indicaciones reales) ---
  const [customWeeklyGoal, setCustomWeeklyGoal] = useState(null);

  const weeklyGoal = useMemo(() => {
    if (customWeeklyGoal) return customWeeklyGoal;
    if (globalPeiGoals && globalPeiGoals.length > 0) {
      const active =
        globalPeiGoals.find((g) => (g.met_prog || 0) < 100) ||
        globalPeiGoals[0];
      if (active && active.met_desc) return active.met_desc;
    }
    if (reports && reports.length > 0) {
      const last = reports[0];
      if (last && last.com_tend) return last.com_tend;
    }
    return null;
  }, [customWeeklyGoal, globalPeiGoals, reports]);

  const reportGoalProgress = async () => {
    try {
      if (selectedChildId) {
        await api.post("/ninos/bitacora", {
          nin_codi: selectedChildId,
          date: new Date().toISOString().split("T")[0],
          mood: "Estable",
          crisisCount: 0,
          text: `[Avance de Objetivo Terapéutico] ${weeklyGoal || "Avance reportado por el representante"}`,
        });
      }
      showToast(
        "🌟 Progreso del objetivo semanal registrado con éxito en el expediente clínico.",
      );
    } catch (err) {
      console.error("Error al registrar avance de meta:", err);
      showToast("🌟 Progreso del objetivo semanal registrado.");
    }
  };

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const handler = (e) => showToast(e.detail.message);
    window.addEventListener("global-toast", handler);
    return () => window.removeEventListener("global-toast", handler);
  }, []);

  const navigate = (view) => {
    if (view === "student" && userRole !== "ESPECIALISTA") {
      showToast("⚠️ Acceso denegado: Se requiere rol de Especialista.");
      return;
    }

    setCurrentView(view);
    const path = viewToPath[view];
    if (path) routerNavigate(path);
  };

  const addFeedback = (fue_efec) => {
    // La UI ya usa evaluateAlert que hace el API request correcto.
    showToast("Feedback registrado (Actualice con la base de datos).");
  };

  const updateThresholds = (min, max) => {
    setChildDataMap((prev) => ({
      ...prev,
      [currentChildId]: {
        ...prev[currentChildId],
        valMini: Number(min),
        valMaxi: Number(max),
      },
    }));
    api
      .put(`/ninos/${currentChildId}/umbrales`, {
        val_mini: Number(min),
        val_maxi: Number(max),
      })
      .then(() =>
        showToast("Umbrales de sensibilidad guardados correctamente."),
      )
      .catch((err) => {
        console.error("Error al guardar umbrales en el servidor:", err);
        showToast(
          "⚠️ Umbrales guardados localmente. Error al sincronizar con el servidor.",
        );
      });
  };

  const calculateStressIndex = (bpm, movimiento) => {
    if (bpm <= valMini) return 0;
    const bpmRange = valMaxi - valMini;
    const bpmRatio = Math.min(
      1,
      Math.max(0, (bpm - valMini) / (bpmRange || 1)),
    );
    const movRatio = Math.min(1, Math.max(0, movimiento / 10));

    let stress = bpmRatio * 100 * (1 - movRatio * 0.4);

    if (movimiento > 8 && bpmRatio > 0.4) {
      stress = Math.max(stress, 80);
    }
    return Math.round(stress);
  };

  const saveCalibrationBaseline = (bpmBaseline) => {
    const min = Math.round(bpmBaseline * 0.9);
    const max = Math.round(bpmBaseline * 1.45);
    updateThresholds(min, max);
  };

  return (
    <GlobalContext.Provider
      value={{
        currentView,
        nomNino,
        userRole,
        userName,
        selectedChildId,
        adminActiveTab,
        setAdminActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        isDark,
        toggleTheme,
        activeChild,
        listaNinos,
        valMini,
        valMaxi,
        historicalData,
        navigate,
        addFeedback,
        updateThresholds,
        setNomNino,
        setUserRole,
        setUserName,
        userFoto,
        setUserFoto,
        setSelectedChildId,
        showToast,
        alertas,
        evaluateAlert,
        hardware,
        addHardware,
        registerConnectedDevice,
        reports,
        isOnline,
        setIsOnline,
        showEmergencyGuard,
        setShowEmergencyGuard,
        pendingNavigation,
        setPendingNavigation,
        setCurrentView,
        fetchNinos,
        homeHistoricalData,
        parentNotes,
        addHomeReport,
        weeklyGoal,
        reportGoalProgress,
        calculateStressIndex,
        saveCalibrationBaseline,
        crisisTelemetry,
        routines,
        fetchRoutines,
        createRoutine,
        updateRoutine,
        deleteRoutine,
        categories,
        isRoutinesLoading,
        createCategory,
        updateCategory,
        deleteCategory,
        clinicalAlerts,
        clinicalHistory,
        crisisAlerts,
        crisisTelemetryMap,
        fetchCrisisAlerts,
        crearIndicacion,
        globalPeiGoals,
        crearPeiGoal,
        incrementPeiTrial,
        sessions,
        isSessionsLoading,
        fetchSessions,
        startSession,
        closeSession,
        logActivity,
        markIndicacionRead,
        fetchIndicacionStatus,
        specialistConfig,
        updateSpecialistConfig,
        isQuietHours,
        uiPrefs,
        updateUiPrefs,
        ACCENT_COLORS,
      }}
    >
      {children}
      {/* Toast Notification simulando Shadcn */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border-l-4 border-brand-500 p-4 rounded-lg shadow-xl z-[300] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-brand-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </GlobalContext.Provider>
  );
};
