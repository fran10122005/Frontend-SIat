import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Settings2,
  Sun,
  Moon,
  Monitor,
  Type,
  LayoutGrid,
  Palette,
  X,
  Check,
} from "lucide-react";
import { useGlobalContext } from "../../context/GlobalState";

const ACCENT_MAP = {
  blue: { label: "Azul", bg: "#2563eb" },
  indigo: { label: "\u00cdndigo", bg: "#4f46e5" },
  violet: { label: "Violeta", bg: "#7c3aed" },
  emerald: { label: "Esmeralda", bg: "#059669" },
  cyan: { label: "Cyan", bg: "#0891b2" },
  rose: { label: "Rosa", bg: "#e11d48" },
};

const FONT_SIZES = [
  { value: "small", label: "Peque\u00f1o", sample: "text-xs" },
  { value: "normal", label: "Normal", sample: "text-sm" },
  { value: "large", label: "Grande", sample: "text-base" },
];

const DENSITIES = [
  {
    value: "normal",
    label: "Normal",
    desc: "Espaciado est\u00e1ndar",
    icon: "\u25a4",
  },
  {
    value: "compact",
    label: "Compacto",
    desc: "M\u00e1s contenido visible",
    icon: "\u25a6",
  },
];

function SectionLabel({ icon, label }) {
  return (
    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
      {icon}
      {label}
    </p>
  );
}

export default function UserPreferencesModal({ open, onClose }) {
  const { uiPrefs, updateUiPrefs, isDark } = useGlobalContext();

  const [local, setLocal] = useState({
    theme: uiPrefs?.theme || (isDark ? "dark" : "light"),
    accentColor: uiPrefs?.accentColor || "blue",
    fontSize: uiPrefs?.fontSize || "normal",
    density: uiPrefs?.density || "normal",
  });

  const handleSave = () => {
    updateUiPrefs(local);
    onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#141e2d] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-700/60 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[var(--color-brand,#2563eb)] to-[var(--color-brand-ring,#3b82f6)] text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">
                  Preferencias del Sistema
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Personaliza tu experiencia en SIAT
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-7">
          {/* Tema */}
          <section>
            <SectionLabel
              icon={<Moon className="w-3.5 h-3.5" />}
              label="Tema Visual"
            />
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {[
                { value: "light", Icon: Sun, label: "Claro" },
                { value: "system", Icon: Monitor, label: "Sistema" },
                { value: "dark", Icon: Moon, label: "Oscuro" },
              ].map(({ value, Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocal((p) => ({ ...p, theme: value }))}
                  className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border-2 transition-all text-xs font-semibold ${
                    local.theme === value
                      ? "border-[var(--color-brand,#2563eb)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-brand,#2563eb)] dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      local.theme === value
                        ? "bg-[var(--color-brand,#2563eb)]/10"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Color de acento */}
          <section>
            <SectionLabel
              icon={<Palette className="w-3.5 h-3.5" />}
              label="Color de Acento"
            />
            <div className="grid grid-cols-6 gap-2.5 mt-3">
              {Object.entries(ACCENT_MAP).map(([key, { label, bg }]) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => setLocal((p) => ({ ...p, accentColor: key }))}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                    style={{
                      backgroundColor: bg,
                      boxShadow:
                        local.accentColor === key
                          ? `0 0 0 3px white, 0 0 0 5px ${bg}`
                          : undefined,
                      transform:
                        local.accentColor === key ? "scale(1.1)" : undefined,
                    }}
                  >
                    {local.accentColor === key && (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Tamaño de fuente */}
          <section>
            <SectionLabel
              icon={<Type className="w-3.5 h-3.5" />}
              label="Tama\u00f1o de Fuente"
            />
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {FONT_SIZES.map(({ value, label, sample }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocal((p) => ({ ...p, fontSize: value }))}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                    local.fontSize === value
                      ? "border-[var(--color-brand,#2563eb)] bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <span
                    className={`font-bold text-slate-700 dark:text-slate-200 ${sample}`}
                  >
                    Aa
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      local.fontSize === value
                        ? "text-[var(--color-brand,#2563eb)] dark:text-blue-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Densidad */}
          <section>
            <SectionLabel
              icon={<LayoutGrid className="w-3.5 h-3.5" />}
              label="Densidad de Interfaz"
            />
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              {DENSITIES.map(({ value, label, desc, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocal((p) => ({ ...p, density: value }))}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    local.density === value
                      ? "border-[var(--color-brand,#2563eb)] bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <span className="text-2xl leading-none text-slate-400 dark:text-slate-500 shrink-0">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold ${
                        local.density === value
                          ? "text-[var(--color-brand,#2563eb)] dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {desc}
                    </p>
                  </div>
                  {local.density === value && (
                    <Check
                      className="w-4 h-4 ml-auto shrink-0 text-[var(--color-brand,#2563eb)]"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/30 shrink-0">
          <button
            type="button"
            onClick={() =>
              setLocal({
                theme: "system",
                accentColor: "blue",
                fontSize: "normal",
                density: "normal",
              })
            }
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline-offset-2 hover:underline"
          >
            Restablecer valores
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-white text-xs font-bold rounded-xl shadow transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "var(--color-brand, #2563eb)" }}
            >
              Aplicar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
