import React, { useEffect, useState } from 'react';
import { getSocket } from '../hooks/socket';
import { useGlobalContext } from '../context/GlobalState';
import api from '../api/axios';
import { Bell, AlertTriangle, Trash2 } from 'lucide-react';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { showToast, userRole } = useGlobalContext();

  // Cargar historial inicial de alertas desde la base de datos
  useEffect(() => {
    if (userRole !== 'REPRESENTANTE') return;
    
    api.get('/reportes/alertas-representante')
      .then(res => {
        const list = res.data.data.map(alert => ({
          id: alert.ale_codi,
          message: `Alerta: Crisis de ${alert.ale_meto.replace(/_/g, ' ')} detectada.`,
          time: new Date(alert.ale_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(alert.ale_time).toLocaleDateString('es-ES'),
          unread: false
        }));
        setNotifications(list);
      })
      .catch(err => console.error('Error al cargar historial de notificaciones:', err));
  }, [userRole]);

  const playAlertSound = () => {
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
      // High-pitched therapeutic alarm chimes (clean and clear)
      playTone(987.77, now, 0.2); // B5 note
      playTone(1318.51, now + 0.15, 0.3); // E6 note
    } catch (e) {
      console.warn('Audio Context block/failed:', e);
    }
  };

  useEffect(() => {
    const socket = getSocket();

    const onAlert = (data) => {
      // Incrementar contador
      setUnreadCount((prev) => prev + 1);
      
      // Activar animación de vibración
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 1000);

      // Reproducir sonido de alerta
      playAlertSound();

      // Prependear nueva alerta al historial de notificaciones
      const newNotif = {
        id: data.id_alert || Date.now().toString(),
        message: `Crisis: ${data.est_dete.replace(/_/g, ' ')} detectada en ${data.niño}.`,
        time: new Date(data.fec_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(data.fec_hora).toLocaleDateString('es-ES'),
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 15));

      // Mostrar toast emergente enriquecido
      const bpmDetail = data.bpm_max ? ` | BPM Máx: ${data.bpm_max}` : '';
      const stressDetail = data.stress_index ? ` | Estrés: ${data.stress_index}%` : '';
      showToast(`🚨 ALERTA: ${data.est_dete} en ${data.niño}${bpmDetail}${stressDetail}`);
    };

    socket.on('new_alert', onAlert);

    return () => {
      socket.off('new_alert', onAlert);
    };
  }, [showToast]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = () => setIsOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const handleBellClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setUnreadCount(0); // Limpiar contador al abrir
  };

  const clearNotifications = (e) => {
    e.stopPropagation();
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleBellClick}
        className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isVibrating ? 'animate-bounce' : ''}`}
        aria-label="Notificaciones"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-gray-600 dark:text-gray-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown de notificaciones */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Centro de Alertas</span>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="text-slate-450 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-1 text-[10px] font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850/60 custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3.5 flex gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${notif.unread ? 'bg-rose-500/5 dark:bg-rose-500/5 font-bold' : ''}`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 h-fit ${
                    notif.unread 
                      ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-500' 
                      : 'bg-slate-100 dark:bg-slate-850 text-slate-450'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-normal ${notif.unread ? 'text-slate-900 dark:text-white' : 'text-slate-750 dark:text-slate-300'}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-slate-400">
                      <span>{notif.date}</span>
                      <span>•</span>
                      <span>{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-450 dark:text-slate-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-40 text-slate-400" />
                <span className="text-xs font-semibold">No tienes notificaciones recientes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
