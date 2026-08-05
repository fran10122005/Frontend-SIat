import { createContext, useContext, useState, useCallback } from 'react';
import { useTour } from '../hooks/useTour';
import {
  adminTourSteps,
  specialistTourSteps,
  parentTourSteps,
  getDynamicTourSteps
} from '../config/tourSteps';

const TourContext = createContext(undefined);

const TOUR_STORAGE_KEY = 'siat_tour_seen';

export const TourProvider = ({ children }) => {
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  });

  const tour = useTour({
    showProgress: true,
    doneBtnText: 'Finalizar',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    onFinish: () => {
      markTourAsSeen();
    },
  });

  const startRoleTour = useCallback((role) => {
    let steps = [];
    if (role === 'ADMIN_INSTITUCION') steps = adminTourSteps;
    else if (role === 'ESPECIALISTA') steps = specialistTourSteps;
    else if (role === 'REPRESENTANTE') steps = parentTourSteps;

    if (steps.length > 0) {
      tour.startTour(steps);
    }
  }, [tour]);

  const startPageTour = useCallback((path, contextData) => {
    const steps = getDynamicTourSteps(path, contextData);
    if (steps && steps.length > 0) {
      tour.startTour(steps);
    }
  }, [tour]);

  const stopTour = useCallback(() => {
    tour.stopTour();
  }, [tour]);

  const markTourAsSeen = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setHasSeenTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasSeenTour(false);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isTourActive: tour.isActive(),
        startRoleTour,
        startPageTour,
        stopTour,
        hasSeenTour,
        markTourAsSeen,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
};
