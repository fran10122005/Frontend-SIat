import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-5 mt-auto border-t border-slate-200/80 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            SIAT-TEA
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Sistema Inteligente de Acompañamiento Terapéutico
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            v1.0.0
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} Francisco Rincón — UNEFA
          </span>
        </div>
      </div>
    </footer>
  );
}
