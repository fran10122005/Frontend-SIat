import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket, subscribeToSocket } from "../../hooks/socket";
import { useGlobalContext } from "../../context/GlobalState";
import api from "../../api/axios";
import { getValidSession } from "../../utils/authStorage";
import {
  loadUserNotifications,
  saveUserNotifications,
  loadReadNotificationIds,
  markNotificationIdsRead,
  loadDismissedNotificationIds,
  dismissNotificationIds,
  getNotificationPrefs,
} from "../../utils/notificationStorage";
import {
  Bell,
  AlertTriangle,
  Trash2,
  UserPlus,
  Activity,
  ShieldAlert,
  ServerCrash,
  CheckCircle,
  ClipboardList,
  Clock,
  Home,
} from "lucide-react";

const MAX_NOTIFICATIONS = 30;

const iconMap = {
  crisis: AlertTriangle,
  indication: ClipboardList,
  routine_reminder: Clock,
  home_crisis: Home,
  assignment: UserPlus,
  operational_warning: ShieldAlert,
  new_specialist: UserPlus,
  new_representative: UserPlus,
  new_user: UserPlus,
  system: ServerCrash,
  incident: ShieldAlert,
  warning: Activity,
  info: UserPlus,
};

const colorMap = {
  crisis: "bg-rose-100 dark:bg-rose-950/30 text-rose-500",
  indication:
    "bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
  routine_reminder:
    "bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
  home_crisis:
    "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
  assignment:
    "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  operational_warning:
    "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  new_specialist: "bg-blue-100 dark:bg-blue-950/30 text-blue-500",
  new_representative: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500",
  new_user: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-500",
  system: "bg-amber-100 dark:bg-amber-950/30 text-amber-500",
  incident: "bg-red-100 dark:bg-red-950/30 text-red-500",
  warning: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600",
  info: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
};

function resolveCurrentUserId() {
  const session = getValidSession();
  return session?.isValid && session?.decoded?.usu_codi
    ? String(session.decoded.usu_codi)
    : null;
}

export default function NotificationBell() {
  const { showToast, userRole, listaNinos } = useGlobalContext();
  const [activeUserId, setActiveUserId] = useState(resolveCurrentUserId);
  const [notifications, setNotifications] = useState(() =>
    resolveCurrentUserId() ? loadUserNotifications(resolveCurrentUserId()) : [],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const dropdownRef = useRef(null);
  const listaNinosRef = useRef(listaNinos || []);
  const activeUserIdRef = useRef(activeUserId);

  useEffect(() => {
    listaNinosRef.current = listaNinos || [];
  }, [listaNinos]);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  // Sincronizar usuario activo y limpiar estado al cerrar o cambiar de sesión
  useEffect(() => {
    const syncIdentity = () => {
      const uid = resolveCurrentUserId();
      setActiveUserId(uid);
      if (uid && userRole) {
        const readSet = loadReadNotificationIds(uid);
        const dismissedSet = loadDismissedNotificationIds(uid);
        const stored = loadUserNotifications(uid)
          .filter((n) => !dismissedSet.has(String(n.id)))
          .map((n) => ({
            ...n,
            read: Boolean(n.read || readSet.has(String(n.id))),
          }));
        setNotifications(stored);
      } else {
        setNotifications([]);
        setIsOpen(false);
      }
    };

    syncIdentity();

    const handleSessionEnded = () => {
      setActiveUserId(null);
      setNotifications([]);
      setIsOpen(false);
    };

    window.addEventListener("siat:session-started", syncIdentity);
    window.addEventListener("siat:session-ended", handleSessionEnded);
    return () => {
      window.removeEventListener("siat:session-started", syncIdentity);
      window.removeEventListener("siat:session-ended", handleSessionEnded);
    };
  }, [userRole]);

  const addNotificationsBatch = useCallback((incomingList, userIdOverride) => {
    const uid = userIdOverride || activeUserIdRef.current;
    if (!uid || !Array.isArray(incomingList) || incomingList.length === 0) {
      return;
    }

    const readSet = loadReadNotificationIds(uid);
    const dismissedSet = loadDismissedNotificationIds(uid);

    setNotifications((prev) => {
      const byId = new Map();
      prev.forEach((item) => {
        if (item?.id && !dismissedSet.has(String(item.id))) {
          byId.set(String(item.id), {
            ...item,
            read: Boolean(item.read || readSet.has(String(item.id))),
          });
        }
      });

      incomingList.forEach((raw) => {
        if (!raw) return;
        const id = String(raw.id || raw.id_alert || raw.ale_codi || "");
        if (!id || dismissedSet.has(id)) return;
        const existing = byId.get(id);
        const normalized = {
          ...existing,
          ...raw,
          id,
          time:
            raw.time ||
            raw.fec_hora ||
            existing?.time ||
            new Date().toISOString(),
          read: Boolean(existing?.read || raw.read || readSet.has(id)),
        };
        byId.set(id, normalized);
      });

      const merged = Array.from(byId.values())
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, MAX_NOTIFICATIONS);

      saveUserNotifications(merged, uid);
      return merged;
    });
  }, []);

  const addNotification = useCallback(
    (notif) => {
      if (!notif) return;
      addNotificationsBatch([notif]);
    },
    [addNotificationsBatch],
  );

  const markAsRead = useCallback((id) => {
    const uid = activeUserIdRef.current;
    if (uid && id) {
      markNotificationIdsRead(id, uid);
    }
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (uid) saveUserNotifications(next, uid);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const uid = activeUserIdRef.current;
    setNotifications((prev) => {
      if (uid && prev.length > 0) {
        markNotificationIdsRead(
          prev.map((n) => n.id),
          uid,
        );
      }
      const next = prev.map((n) => ({ ...n, read: true }));
      if (uid) saveUserNotifications(next, uid);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    const uid = activeUserIdRef.current;
    setNotifications((prev) => {
      if (uid && prev.length > 0) {
        dismissNotificationIds(
          prev.map((n) => n.id),
          uid,
        );
      }
      if (uid) saveUserNotifications([], uid);
      return [];
    });
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.12, startTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + duration - 0.05,
        );
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(987.77, now, 0.2);
      playTone(1318.51, now + 0.15, 0.3);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }, []);

  const triggerAlert = useCallback(
    (notif) => {
      if (!notif || !activeUserIdRef.current) return;
      const dismissedSet = loadDismissedNotificationIds(
        activeUserIdRef.current,
      );
      const safeId = String(notif.id || notif.id_alert || Date.now());
      if (dismissedSet.has(safeId)) return;

      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 1000);
      playAlertSound();
      addNotification({ ...notif, id: safeId });
      if (typeof showToast === "function") {
        showToast(`🔔 ${notif.message}`);
      }

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          const prefs = getNotificationPrefs();
          if (prefs.alertas_push !== false) {
            new Notification("Alerta SIAT", {
              body: notif.message,
              icon: "/favicon.ico",
              tag: safeId,
            });
          }
        } catch {}
      }
    },
    [addNotification, playAlertSound, showToast],
  );

  // Cargar historial REST acotado estrictamente según rol/módulo
  useEffect(() => {
    if (!activeUserId || !userRole) return;
    let active = true;

    const endpointByRole = {
      REPRESENTANTE: "/reportes/notificaciones-representante",
      ESPECIALISTA: "/especialista/notificaciones",
      ADMIN_INSTITUCION: "/admin/notificaciones",
    };

    const endpoint = endpointByRole[userRole];
    if (!endpoint) return;

    api
      .get(endpoint)
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalized = rows.map((item) => ({
          id: String(item.id || item.ale_codi || Date.now()),
          type: item.type || "warning",
          nin_codi: item.nin_codi || null,
          nin_nomb: item.nin_nomb || null,
          category: item.category || null,
          message:
            item.message ||
            `Notificación: ${(item.ale_meto || "").replace(/_/g, " ")}`,
          time: item.time
            ? new Date(item.time).toISOString()
            : item.ale_time
              ? new Date(item.ale_time).toISOString()
              : new Date().toISOString(),
          read: Boolean(item.read),
        }));
        addNotificationsBatch(normalized, activeUserId);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [activeUserId, userRole, addNotificationsBatch]);

  // Suscripción a WebSockets y eventos locales estrictamente aislada por rol
  useEffect(() => {
    if (!activeUserId || !userRole) return;

    const isChildOwnedByUser = (ninCodi) => {
      if (!ninCodi) return true;
      const children = listaNinosRef.current;
      if (!Array.isArray(children) || children.length === 0) return true;
      return children.some(
        (n) => String(n.nin_codi || n.id_ninos) === String(ninCodi),
      );
    };

    const cleanups = [];
    getSocket();

    if (userRole === "ADMIN_INSTITUCION") {
      // El administrador escucha ÚNICAMENTE alertas operativas institucionales (nunca crisis infantiles)
      const unsubAdmin = subscribeToSocket("admin_notification", (data) => {
        if (!data) return;
        triggerAlert({
          id: String(data.id || `adm_${Date.now()}`),
          type: data.type || "operational_warning",
          category: data.category || "Operaciones",
          message: data.message || "Notificación administrativa del sistema.",
          time: data.time || new Date().toISOString(),
          read: false,
        });
      });
      if (typeof unsubAdmin === "function") cleanups.push(unsubAdmin);
    } else if (userRole === "REPRESENTANTE" || userRole === "ESPECIALISTA") {
      const unsubNewAlert = subscribeToSocket("new_alert", (data) => {
        if (!data) return;
        const ninCodi = data.nin_codi || null;
        if (!isChildOwnedByUser(ninCodi)) return;
        const ninName = data.nin_nomb || data.niño || data.nino || null;
        const notif = {
          id: String(data.id_alert || `ws_${Date.now()}`),
          type: "crisis",
          nin_codi: ninCodi,
          nin_nomb: ninName,
          message: `Crisis: ${(data.est_dete || data.metodo || "SOBRECARGA").replace(/_/g, " ")}${ninName ? ` en ${ninName}` : ""}.${data.bpm_max ? ` BPM: ${data.bpm_max}` : ""}${data.stress_index ? ` Estrés: ${data.stress_index}%` : ""}`,
          time: data.fec_hora || new Date().toISOString(),
          read: false,
        };
        triggerAlert(notif);
      });
      if (typeof unsubNewAlert === "function") cleanups.push(unsubNewAlert);

      const handleLocalCrisis = (e) => {
        if (!e?.detail) return;
        if (!isChildOwnedByUser(e.detail.nin_codi)) return;
        triggerAlert(e.detail);
      };
      window.addEventListener("siat:crisis_alert", handleLocalCrisis);
      cleanups.push(() =>
        window.removeEventListener("siat:crisis_alert", handleLocalCrisis),
      );

      if (userRole === "REPRESENTANTE") {
        const unsubParent = subscribeToSocket("parent_notification", (data) => {
          if (!data) return;
          triggerAlert({
            id: String(data.id || `rep_${Date.now()}`),
            type: data.type || "indication",
            nin_codi: data.nin_codi || null,
            nin_nomb: data.nin_nomb || null,
            message: data.message || "Nueva actualización clínica.",
            time: data.time || new Date().toISOString(),
            read: false,
          });
        });
        if (typeof unsubParent === "function") cleanups.push(unsubParent);
      }

      if (userRole === "ESPECIALISTA") {
        const unsubSpec = subscribeToSocket(
          "specialist_notification",
          (data) => {
            if (!data) return;
            triggerAlert({
              id: String(data.id || `esp_${Date.now()}`),
              type: data.type || "assignment",
              nin_codi: data.nin_codi || null,
              nin_nomb: data.nin_nomb || null,
              message: data.message || "Nueva notificación clínica.",
              time: data.time || new Date().toISOString(),
              read: false,
            });
          },
        );
        if (typeof unsubSpec === "function") cleanups.push(unsubSpec);
      }
    }

    return () => {
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    };
  }, [activeUserId, userRole, triggerAlert]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return "Ahora";
      if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.time) - new Date(a.time),
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) markAllAsRead();
        }}
        className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isVibrating ? "animate-bounce" : ""}`}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  title="Marcar todas leídas"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
              {sorted.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  title="Limpiar todas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[calc(100vh-5rem)] sm:max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {sorted.length > 0 ? (
              sorted.map((notif) => {
                const Icon = iconMap[notif.type] || AlertTriangle;
                const color = colorMap[notif.type] || colorMap.warning;
                const tag = notif.nin_nomb || notif.category;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3.5 flex gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${!notif.read ? "bg-blue-50/40 dark:bg-blue-900/10" : "opacity-75"}`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 h-fit ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${!notif.read ? "text-slate-900 dark:text-white font-semibold" : "text-slate-600 dark:text-slate-400"}`}
                      >
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatTime(notif.time)}
                        </span>
                        {tag && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {tag}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-40" />
                <span className="text-xs font-semibold">
                  Sin notificaciones recientes
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
