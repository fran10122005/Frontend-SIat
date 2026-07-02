import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full text-center py-6 text-sm text-slate-500 dark:text-slate-400 mt-auto border-t border-slate-200 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} SIAT-TEA — Sistema Inteligente de Acompañamiento Terapéutico</p>
        <p className="text-xs">Desarrollado por Francisco Rincón · UNEFA</p>
      </div>
    </footer>
  );
}
