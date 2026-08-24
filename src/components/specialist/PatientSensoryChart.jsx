import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Zap } from "lucide-react";

export default function PatientSensoryChart({ sensoryData = [], isDark }) {
  const chartData = useMemo(
    () => sensoryData.filter((d) => d.name !== "Sin eventos"),
    [sensoryData],
  );
  const totalEventos = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const isEmpty = chartData.length === 0;
  const principal = [...chartData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col h-[330px] sm:h-[310px] lg:h-[350px] transition-all duration-200">
      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500 shrink-0" />
        <span className="truncate">
          Sensibilidad Sensorial (7 días)
          {principal && (
            <span
              className="ml-2 text-xs font-semibold align-middle"
              style={{ color: principal.color }}
            >
              Principal: {principal.name}
            </span>
          )}
        </span>
      </h2>
      <div className="relative flex-1 w-full min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <Zap className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Sin registros esta semana</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1E293B" : "#fff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: "8px",
                  }}
                  itemStyle={{
                    color: isDark ? "#e2e8f0" : "#1e293b",
                    fontWeight: "bold",
                  }}
                  formatter={(value, name) => [
                    `${value} evento${value !== 1 ? "s" : ""}`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro del dona */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalEventos}
                </span>
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  Eventos
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {!isEmpty && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5">
          {[...chartData]
            .sort((a, b) => b.value - a.value)
            .map((d) => (
              <li
                key={d.name}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 min-w-0"
              >
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate">{d.name}</span>
                <span className="text-slate-400 font-semibold shrink-0">
                  {Math.round(
                    totalEventos > 0 ? (d.value / totalEventos) * 100 : 0,
                  )}
                  %
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
