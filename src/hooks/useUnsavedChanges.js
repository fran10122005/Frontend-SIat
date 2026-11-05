import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Hook para proteger formularios contra pérdidas accidentales de datos.
 * Maneja el evento nativo `beforeunload` del navegador y provee utilidades
 * para confirmar la salida si hay cambios sin guardar.
 *
 * @param {boolean} isDirty - Indica si el formulario tiene cambios sin guardar.
 * @param {Function} onClose - Función que cierra el modal o vista.
 * @returns {{
 *   showDiscardConfirm: boolean,
 *   setShowDiscardConfirm: Function,
 *   handleAttemptClose: Function,
 *   confirmDiscard: Function,
 *   cancelDiscard: Function
 * }}
 */
export default function useUnsavedChanges(isDirty = false, onClose = () => {}) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Interceptar recarga de página (F5) o cierre de pestaña del navegador
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = ""; // Requerido por estándares modernos de navegadores
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleAttemptClose = useCallback(() => {
    if (isDirtyRef.current) {
      setShowDiscardConfirm(true);
    } else {
      if (typeof onClose === "function") onClose();
    }
  }, [onClose]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    if (typeof onClose === "function") onClose();
  }, [onClose]);

  const cancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  return {
    showDiscardConfirm,
    setShowDiscardConfirm,
    handleAttemptClose,
    confirmDiscard,
    cancelDiscard,
  };
}
