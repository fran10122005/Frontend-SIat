import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import {
  Activity,
  Bell,
  AlertTriangle,
  NotebookPen,
  CheckSquare,
  Wind,
  Grid,
  LayoutDashboard,
  Download,
  Settings2,
} from "lucide-react";
import Footer from "../components/layout/Footer";
import { exportDashboardReport } from "../utils/pdfExporter";

import { useTelemetry } from "../hooks/useTelemetry";
import { useClinicalData } from "../hooks/useClinicalData";

import ChildStatusBanner from "../components/dashboard/ChildStatusBanner";
import DaySummary from "../components/dashboard/DaySummary";
import BreathingProtocolModal from "../components/dashboard/BreathingProtocolModal";
import AacBoardDrawer from "../components/dashboard/AacBoardDrawer";
import UserPreferencesModal from "../components/shared/UserPreferencesModal";

import PageTitle from "../components/ui/PageTitle";
import SmartwatchConnectWidget from "../components/shared/SmartwatchConnectWidget";

export default function MainDashboard() {
  const {
    nomNino,
    navigate,
    weeklyGoal,
    userRole,
    userName,
    homeHistoricalData,
    routines,
    listaNinos,
    selectedChildId,
    setSelectedChildId,
    setNomNino,
  } = useGlobalContext();
  const [showBreathing, setShowBreathing] = useState(false);
  const [showAac, setShowAac] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const { liveBpm, liveStress, liveMov, isWebSocketActive } = useTelemetry();
  const { alertsList } = useClinicalData();

  const [latestReport, setLatestReport] = useState(null);

  useEffect(() => {
    let cancel = false;
    const fetchLatestBitacora = async () => {
      try {
        const endpoint =
          userRole === "ESPECIALISTA" && selectedChildId
            ? `/ninos/${selectedChildId}/bitacora`
            : selectedChildId
              ? `/ninos/bitacora?nin_codi=${selectedChildId}`
              : "/ninos/bitacora";
        const res = await api.get(endpoint);
        const list = res.data.data || [];
        if (!cancel && list.length > 0) {
          const sorted = [...list].sort((a, b) => {
            const da = new Date(
              a.bit_fech || a.date || a.created_at || 0,
            ).getTime();
            const db = new Date(
              b.bit_fech || b.date || b.created_at || 0,
            ).getTime();
            return db - da;
          });
          setLatestReport(sorted[0]);
        } else if (!cancel) {
          setLatestReport(null);
        }
      } catch (err) {
        if (!cancel) setLatestReport(null);
      }
    };
    fetchLatestBitacora();
    return () => {
      cancel = true;
    };
  }, [userRole, selectedChildId]);

  const handleExportDashboard = async () => {
    setExporting(true);
    try {
      const crisisCount = alertsList?.length || 0;
      const kpis = [
        {
          label: "Estado actual",
          value:
            liveStress <= 50
              ? "Calma"
              : liveStress <= 75
                ? "Inquieto"
                : "Crisis",
        },
        { label: "Pulso", value: `${liveBpm} BPM` },
        {
          label: "Pulsera",
          value: isWebSocketActive ? "Conectada" : "Desconectada",
        },
        { label: "Alertas", value: crisisCount.toString() },
      ];
      await exportDashboardReport({
        userName,
        userRole,
        paciente: nomNino || "No asignado",
        kpis,
        alerts: (alertsList || []).map((a) => ({
          time: a.ale_time,
          message: `Alerta: ${(a.ale_meto || "").replace(/_/g, " ")}`,
        })),
        titulo: "Reporte del Dashboard",
      });
    } catch (err) {
      console.error("Error al exportar:", err);
    } finally {
      setExporting(false);
    }
  };

  const finalAlerts = (alertsList || []).map((a) => ({
    id: a.ale_codi,
    time: new Date(a.ale_time).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: "warning",
    message: `Alerta: ${(a.ale_meto || "").replace(/_/g, " ")}`,
    icon: AlertTriangle,
  }));

  const getAlertColor = (type) => {
    switch (type) {
      case "warning":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      case "success":
        return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";
      case "info":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-800";
    }
  };

  const homeData = homeHistoricalData?.[homeHistoricalData.length - 1];

  const agendaHoy = (routines || []).slice(0, 4);

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <PageTitle icon={LayoutDashboard}>Inicio</PageTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Paciente:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {nomNino || "No Asignado"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportDashboard}
                  disabled={exporting}
                  className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />{" "}
                  {exporting ? "Generando..." : "Reporte"}
                </button>
                <button
                  onClick={() => navigate("diario_hogar")}
                  className="px-3 py-2 bg-brand-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all flex items-center gap-1.5 text-xs"
                >
                  <NotebookPen className="w-3.5 h-3.5" /> Diario de Hoy
                </button>
              </div>
            </div>

            {/* Smartwatch Conexión Bluetooth */}
            <SmartwatchConnectWidget />

            {/* Estado del niño */}
            <ChildStatusBanner
              liveBpm={liveBpm}
              liveStress={liveStress}
              liveMov={liveMov}
              isWebSocketActive={isWebSocketActive}
              nomNino={nomNino}
            />

            {/* Cuerpo: dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <DaySummary
                  homeData={latestReport || homeData}
                  agenda={agendaHoy}
                  indicacion={weeklyGoal}
                  onNavigate={navigate}
                />

                {/* Foco Clínico */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl card-padding shadow-sm border border-slate-200 dark:border-slate-800/60">
                  <span className="text-overline bg-blue-50/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded">
                    Foco Clínico de la Semana
                  </span>
                  <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight mt-3">
                    {weeklyGoal
                      ? `"${weeklyGoal}"`
                      : "Sin indicaciones asignadas para esta semana"}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {weeklyGoal
                      ? "Establecido por tu especialista"
                      : "El terapeuta asignará las metas prioritarias para el niño"}
                  </p>
                  <button
                    onClick={() => navigate("agenda")}
                    className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" /> Ver Agenda del Día
                  </button>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="flex flex-col gap-6">
                {/* Zona SOS */}
                <div className="bg-white dark:bg-[#1E293B] rounded-xl card-padding shadow-sm border border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-overline text-rose-600 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    SOS Sensorial
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Herramientas de auxilio inmediato.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => setShowBreathing(true)}
                      className="py-2.5 px-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Wind className="w-4 h-4" /> Respiración
                    </button>
                    <button
                      onClick={() => setShowAac(true)}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600"
                    >
                      <Grid className="w-4 h-4 text-blue-500 dark:text-blue-400" />{" "}
                      Tablero AAC
                    </button>
                  </div>
                </div>

                {/* Últimos Eventos */}
                <div className="bg-white dark:bg-[#1E293B] rounded-xl card-padding shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col max-h-[260px]">
                  <h3 className="text-overline text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-slate-400" /> Últimos
                    Eventos
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {finalAlerts.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                        Sin eventos recientes
                      </p>
                    ) : (
                      finalAlerts.slice(0, 4).map((alert) => {
                        const IconComponent = alert.icon;
                        return (
                          <div
                            key={alert.id}
                            className="flex gap-2 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                          >
                            <div
                              className={`p-1.5 rounded-lg shrink-0 h-fit ${getAlertColor(alert.type)}`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                {alert.message}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {alert.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Monitoreo Biométrico */}
                <div className="bg-white dark:bg-[#1E293B] rounded-xl card-padding shadow-sm border border-slate-200 dark:border-slate-800/60">
                  <div className="flex justify-between items-center">
                    <h3 className="text-overline text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />{" "}
                      Smartwatch Telemetría
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        isWebSocketActive
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                          : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {isWebSocketActive ? "Transmitiendo" : "En Espera"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">
                        Pulsaciones Actuales
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {liveBpm !== null && liveBpm !== undefined
                          ? `${liveBpm} BPM`
                          : "-- BPM"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400">
                        Nivel de Estrés
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {liveStress !== null && liveStress !== undefined
                          ? `${liveStress}%`
                          : "--%"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">
                        Transmisión Cloud
                      </span>
                      <span
                        className={`font-semibold ${
                          isWebSocketActive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {isWebSocketActive
                          ? "Socket.IO Transmitiendo"
                          : "Socket.IO En Espera"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main>

      <BreathingProtocolModal
        showBreathing={showBreathing}
        setShowBreathing={setShowBreathing}
      />
      <AacBoardDrawer showAac={showAac} setShowAac={setShowAac} />
    </div>
  );
}
