import { createContext, useContext, useCallback, useRef } from "react";
import { useTour } from "../hooks/useTour";
import {
  adminTourSteps,
  specialistTourSteps,
  parentTourSteps,
  getDynamicTourSteps,
} from "../config/tourSteps";

const TourContext = createContext(undefined);

const normalizeRole = (role) => {
  if (role === "ROL_ADM" || role === "ADMIN_INSTITUCION")
    return "ADMIN_INSTITUCION";
  if (role === "ROL_ESP" || role === "ESPECIALISTA") return "ESPECIALISTA";
  if (role === "ROL_REP" || role === "REPRESENTANTE") return "REPRESENTANTE";
  return role;
};

export const TourProvider = ({ children }) => {
  const tour = useTour({
    showProgress: true,
    doneBtnText: "Finalizar",
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
  });

  const moduleKeyRef = useRef(null);

  const startRoleTour = useCallback(
    (role) => {
      let steps = [];
      const normRole = normalizeRole(role);
      if (normRole === "ADMIN_INSTITUCION") steps = adminTourSteps;
      else if (normRole === "ESPECIALISTA") steps = specialistTourSteps;
      else if (normRole === "REPRESENTANTE") steps = parentTourSteps;

      const visible = steps.filter(
        (step) => !step.element || document.querySelector(step.element),
      );
      if (visible.length > 0) {
        tour.startTour(visible);
      }
    },
    [tour],
  );

  /**
   * Define el módulo activo para los tours contextuales. Las páginas con
   * sub-vistas (ej. tabs del panel admin) lo registran para que el icono del
   * header lance el tour correcto.
   */
  const setModuleContext = useCallback((key) => {
    moduleKeyRef.current = key;
  }, []);

  const clearModuleContext = useCallback(() => {
    moduleKeyRef.current = null;
  }, []);

  /**
   * Tour manual desde el icono del header: si hay una guía para el módulo
   * actual la muestra; si no, cae al resumen general del rol. Los pasos cuyo
   * elemento no existe en la pantalla actual (UI condicional) se omiten.
   */
  const startContextualTour = useCallback(
    (role, fallbackKey) => {
      if (!role) return;
      const rawKey = moduleKeyRef.current || fallbackKey;
      const key =
        rawKey === "global_dashboard"
          ? "dashboard"
          : rawKey === "settings"
            ? "profile"
            : rawKey;
      const steps = getDynamicTourSteps(key, role);
      const visible = steps.filter(
        (step) => !step.element || document.querySelector(step.element),
      );
      if (visible.length > 0) {
        tour.startTour(visible);
      } else {
        startRoleTour(role);
      }
    },
    [tour, startRoleTour],
  );

  const stopTour = useCallback(() => {
    tour.stopTour();
  }, [tour]);

  return (
    <TourContext.Provider
      value={{
        isTourActive: tour.isActive(),
        startRoleTour,
        startContextualTour,
        setModuleContext,
        clearModuleContext,
        stopTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTourContext must be used within a TourProvider");
  }
  return context;
};
