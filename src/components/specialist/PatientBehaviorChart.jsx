import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

const SERIES = [
  { key: "Berrinche", label: "Berrinche", color: "#F43F5E" },
  { key: "Estereotipia", label: "Estereotipia", color: "#6366F1" },
  { key: "Agresión", label: "Agresión", color: "#F59E0B" },
];

const TOTAL_LABEL = "Total final";

function BarTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((acc, entry) => acc + (entry.value || 0), 0);
  const items = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
  return (
    <div
      className="rounded-lg border shadow-lg px-3 py-2 text-xs"
      style={{
        backgroundColor: isDark ? "#1E293B" : "#ffffff",
        borderColor: isDark ? "#334155" : "#e2e8f0",
      }}
    >
      <p
        className="font-bold mb-1"
        style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
      >
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((entry) => (
          <li
            key={entry.dataKey}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: isDark ? "#cbd5e1" : "#475569" }}>
              {entry.name}:
            </span>
            <span
              className="font-bold"
              style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
            >
              {entry.value}
            </span>
            <span style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
              ({total > 0 ? Math.round(((entry.value || 0) / total) * 100) : 0}
              %)
            </span>
          </li>
        ))}
      </ul>
      <p
        className="mt-1.5 pt-1.5 border-t flex justify-between gap-6 font-bold"
        style={{
          color: isDark ? "#f1f5f9" : "#1e293b",
          borderColor: isDark ? "#334155" : "#e2e8f0",
        }}
      >
        <span>{TOTAL_LABEL}</span>
        <span>{total}</span>
      </p>
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="flex gap-4 flex-wrap">
      {SERIES.map((s) => (
        <div
          key={s.key}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: s.color }}
          />
          {s.label}
        </div>
      ))}
    </div>
  );
}

export default function PatientBehaviorChart({ behaviorHistory, isDark }) {
  const chartData = useMemo(() => {
    return behaviorHistory && behaviorHistory.length > 0 ? behaviorHistory : [];
  }, [behaviorHistory]);

  const isEmpty = chartData.length === 0;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col h-[280px] lg:h-[350px] transition-all duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          Historial Conductual y Crisis (Semana)
        </h2>
        <div className="flex gap-4 flex-wrap">
          <ChartLegend />
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <Activity className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Sin registros esta semana</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#334155" : "#e2e8f0"}
              />
              <XAxis
                dataKey="dia"
                stroke={isDark ? "#94a3b8" : "#64748b"}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={isDark ? "#94a3b8" : "#64748b"}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, "auto"]}
                width={32}
              />
              <RechartsTooltip
                cursor={{ fill: isDark ? "#334155" : "#f1f5f9" }}
                content={<BarTooltip isDark={isDark} />}
              />
              <Bar
                dataKey="Berrinche"
                stackId="a"
                fill="#F43F5E"
                radius={[0, 0, 4, 4]}
              />
              <Bar dataKey="Estereotipia" stackId="a" fill="#6366F1" />
              <Bar
                dataKey="Agresión"
                stackId="a"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
