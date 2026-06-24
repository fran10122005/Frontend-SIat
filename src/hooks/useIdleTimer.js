import { useState, useEffect, useRef } from 'react';

export default function useIdleTimer(timeoutSeconds, onTimeout, isActive) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isActive) {
      timeoutRef.current = setTimeout(() => {
        setIsIdle(true);
        if (onTimeout) onTimeout();
      }, timeoutSeconds * 1000);
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      setIsIdle(false);
      resetTimer();
    };

    // Initial start
    resetTimer();

    // Add listeners
    events.forEach(event => document.addEventListener(event, handleActivity));

    // Cleanup
    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [timeoutSeconds, onTimeout, isActive]);

  return isIdle;
}
