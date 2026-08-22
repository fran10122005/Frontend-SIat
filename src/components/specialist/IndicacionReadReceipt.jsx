import { CheckCircle, Eye } from "lucide-react";
import Button from "../ui/Button";

export default function IndicacionReadReceipt({ indicacion, onMarkRead }) {
  if (!indicacion) return null;

  const isLeida = indicacion.indi_leid === true;

  return (
    <span className="inline-flex items-center gap-1.5">
      {isLeida ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-3 h-3" />
          Leída
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Eye className="w-3 h-3" />
            Pendiente de lectura
          </span>
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Eye className="w-3 h-3" />}
            onClick={() => onMarkRead?.(indicacion.ind_codi)}
          >
            Marcar como leída
          </Button>
        </>
      )}
    </span>
  );
}
