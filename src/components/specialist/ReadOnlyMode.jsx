import { EyeOff } from "lucide-react";

export default function ReadOnlyMode({ enabled, children }) {
  if (!enabled) return children;

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide shadow-sm">
        <EyeOff className="w-3 h-3" />
        Solo Lectura
      </div>
      <div className="pointer-events-none opacity-60">{children}</div>
    </div>
  );
}
