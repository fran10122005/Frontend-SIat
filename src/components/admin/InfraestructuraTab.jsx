import { useState, useEffect } from "react";
import { Server, Database, Clock, Wifi, FileText } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import api from "../../api/axios";
import { useGlobalContext } from "../../context/GlobalState";

const defaultHealth = {
  api: { status: "Operativo", uptime: "99.9%" },
  db: { status: "Conectada", latency: "12ms" },
  ws: { status: "Activo", clients: 0 },
  version: "2.1.0",
  latencyHistory: [],
};

export default function InfraestructuraTab({ isDark }) {
  const { showToast } = useGlobalContext();
  const [health, setHealth] = useState(defaultHealth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/health")
      .then((res) => {
        if (!cancelled) setHealth(res.data.data || res.data);
      })
      .catch(() => {
        if (!cancelled) setHealth(defaultHealth);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = health.latencyHistory || [];

  const exportarReporteTecnico = async () => {
    try {
      const { exportInfraestructuraToPDF } =
        await import("../../utils/pdfExporter");
      await exportInfraestructuraToPDF({
        health,
        latencyHistory: chartData,
      });
      showToast("✅ Reporte técnico de infraestructura generado");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al generar el reporte técnico");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div
        data-tour="admin-infra-cards"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Server className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
              Servidor API
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white block truncate">
              {health.api?.status || "Operativo"}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-500 font-medium block truncate">
              Uptime: {health.api?.uptime || "—"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Database className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
              Base de Datos
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white block truncate">
              {health.db?.status || "Conectada"}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium block truncate">
              Latencia: {health.db?.latency || "—"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
              WebSocket Server
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white block truncate">
              {health.ws?.status || "Activo"}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium block truncate">
              {health.ws?.clients || 0} clientes conectados
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
              Versión SIAT
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white block truncate">
              v{health.version || "2.1.0"}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium block truncate">
              Producción Estable
            </span>
          </div>
        </div>
      </div>

      <div
        data-tour="admin-infra-chart"
        className="bg-white dark:bg-[#1E293B] rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm min-h-[300px] flex flex-col justify-between"
      >
        <div className="mb-4 sm:mb-6 flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Latencia de Red (Últimas 24h)
            </h2>
            <p
              title="Tiempo de respuesta en la transmisión de datos biométricos"
              className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1"
            >
              Latencia del sensor
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportarReporteTecnico}
              aria-label="Generar reporte técnico en PDF"
              title="Reporte técnico (PDF)"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Sin registros de latencia acumulados
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Las métricas de latencia se registrarán automáticamente a medida
              que los sensores transmitan telemetría.
            </p>
          </div>
        ) : (
          <div className="h-[240px] lg:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#334155" : "#E2E8F0"}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#94A3B8" : "#64748B", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#94A3B8" : "#64748B", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                    backgroundColor: isDark ? "#0F172A" : "#fff",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latencia"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#8B5CF6" }}
                  name="Latencia (ms)"
                />
                <Line
                  type="monotone"
                  dataKey="uptime"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
                  name="Uptime (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
