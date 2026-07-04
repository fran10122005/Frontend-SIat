import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../../hooks/socket';
import { useGlobalContext } from '../../context/GlobalState';
import api from '../../api/axios';
import { Bell, AlertTriangle, Trash2, UserPlus, Activity, ShieldAlert, ServerCrash, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'siat_notifications';
const MAX_NOTIFICATIONS = 30;

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStored(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS))); } catch {}
}

const iconMap = {
  crisis: AlertTriangle,
  new_specialist: UserPlus,
  new_representative: UserPlus,
  new_user: UserPlus,
  system: ServerCrash,
  incident: ShieldAlert,
  warning: Activity,
};

const colorMap = {
  crisis: 'bg-rose-100 dark:bg-rose-950/30 text-rose-500',
  new_specialist: 'bg-blue-100 dark:bg-blue-950/30 text-blue-500',
  new_representative: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500',
  new_user: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-500',
  system: 'bg-amber-100 dark:bg-amber-950/30 text-amber-500',
  incident: 'bg-red-100 dark:bg-red-950/30 text-red-500',
  warning: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-500',
};

export default function NotificationBell() {
  const { showToast, userRole } = useGlobalContext();
  const [notifications, setNotifications] = useState(loadStored);
  const [isOpen, setIsOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef(null);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notif.id);
      if (exists) return prev;
      const next = [notif, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveStored(next);
      return next;
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveStored(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      saveStored(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveStored([]);
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.12, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(987.77, now, 0.2);
      playTone(1318.51, now + 0.15, 0.3);
    } catch (e) { console.warn('Audio error:', e); }
  }, []);

  const triggerAlert = useCallback((notif) => {
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 1000);
    playAlertSound();
    addNotification(notif);
    showToast(`🔔 ${notif.message}`);
  }, [addNotification, playAlertSound, showToast]);

  // Cargar historial según rol
  useEffect(() => {
    if (userRole === 'REPRESENTANTE') {
      api.get('/reportes/alertas-representante')
        .then(res => {
          const list = (res.data.data || []).map(alert => ({
            id: `alert_${alert.ale_codi || Date.now()}`,
            type: 'crisis',
            message: `Alerta: Crisis de ${(alert.ale_meto || '').replace(/_/g, ' ')} detectada.`,
            time: alert.ale_time ? new Date(alert.ale_time).toISOString() : new Date().toISOString(),
            read: false,
          }));
          list.forEach(n => addNotification(n));
        })
        .catch(() => {});
    }

    if (userRole === 'ESPECIALISTA' || userRole === 'ADMIN_INSTITUCION') {
      api.get('/reportes/alertas-representante')
        .then(res => {
          const list = (res.data.data || []).map(alert => ({
            id: `alert_${alert.ale_codi || Date.now()}`,
            type: 'crisis',
            message: `Crisis: ${(alert.ale_meto || '').replace(/_/g, ' ')} detectada.`,
            time: alert.ale_time ? new Date(alert.ale_time).toISOString() : new Date().toISOString(),
            read: false,
          }));
          list.forEach(n => addNotification(n));
        })
        .catch(() => {});
    }

    if (userRole === 'ADMIN_INSTITUCION') {
      api.get('/admin/users')
        .then(res => {
          const users = res.data.data || [];
          const recent = users.filter(u => {
            const created = u.usu_fcr || u.createdAt;
            if (!created) return false;
            return Date.now() - new Date(created).getTime() < 7 * 24 * 60 * 60 * 1000;
          });
          recent.forEach(u => {
            const isRep = u.rol_codi === 'ROL_REP';
            const isEsp = u.rol_codi === 'ROL_ESP';
            if (isEsp || isRep) {
              addNotification({
                id: `new_${u.usu_codi}`,
                type: isEsp ? 'new_specialist' : 'new_representative',
                message: isEsp
                  ? `Nuevo especialista registrado: ${u.tm_espec?.esp_nomb || ''} ${u.tm_espec?.esp_apel || ''}`
                  : `Nuevo representante registrado: ${u.tm_repre?.rep_nomb || ''} ${u.tm_repre?.rep_apel || ''}`,
                time: u.usu_fcr || u.createdAt,
                read: false,
              });
            }
          });
        })
        .catch(() => {});
    }
  }, [userRole, addNotification]);

  // WebSocket en tiempo real
  useEffect(() => {
    const socket = getSocket();
    const onAlert = (data) => {
      const notif = {
        id: `ws_${data.id_alert || Date.now()}`,
        type: 'crisis',
        message: `Crisis: ${(data.est_dete || '').replace(/_/g, ' ')}${data.niño ? ` en ${data.niño}` : ''}.${data.bpm_max ? ` BPM: ${data.bpm_max}` : ''}${data.stress_index ? ` Estrés: ${data.stress_index}%` : ''}`,
        time: data.fec_hora || new Date().toISOString(),
        read: false,
      };
      triggerAlert(notif);
    };
    socket.on('new_alert', onAlert);
    return () => socket.off('new_alert', onAlert);
  }, [triggerAlert]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return 'Ahora';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } catch { return ''; }
  };

  const sorted = [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (isOpen) markAllAsRead(); }}
        className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isVibrating ? 'animate-bounce' : ''}`}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Notificaciones
              {unreadCount > 0 && <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">{unreadCount}</span>}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  title="Marcar todas leídas"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
              {sorted.length > 0 && (
                <button onClick={clearAll}
                  className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  title="Limpiar todas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {sorted.length > 0 ? (
              sorted.map((notif) => {
                const Icon = iconMap[notif.type] || AlertTriangle;
                const color = colorMap[notif.type] || colorMap.warning;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3.5 flex gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'opacity-75'}`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 h-fit ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${!notif.read ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatTime(notif.time)}</p>
                    </div>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-40" />
                <span className="text-xs font-semibold">Sin notificaciones recientes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
