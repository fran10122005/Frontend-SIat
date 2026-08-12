import { useState, useEffect, useRef } from "react";

const STYLES = {
  error: {
    box: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60",
    text: "text-red-700 dark:text-red-300",
    icon: "text-red-500",
  },
  success: {
    box: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-500",
  },
  warning: {
    box: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-500",
  },
  info: {
    box: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
  },
};

const ICONS = {
  error: (
    <svg
      className="w-5 h-5 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4m0 4h.01" />
    </svg>
  ),
  success: (
    <svg
      className="w-5 h-5 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4m0 4h.01" />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4m0-4h.01" />
    </svg>
  ),
};

export default function FormAlert({
  variant = "error",
  message,
  onDismiss,
  className = "",
}) {
  const [dismissed, setDismissed] = useState(false);
  const prevMessage = useRef(message);

  // Si llega un mensaje nuevo (p. ej. tras otro intento de envío), el alert
  // vuelve a mostrarse aunque el usuario lo hubiera cerrado antes.
  useEffect(() => {
    if (prevMessage.current !== message) {
      prevMessage.current = message;
      setDismissed(false);
    }
  }, [message]);

  if (!message || dismissed) return null;

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    setDismissed(true);
  };

  const styles = STYLES[variant] || STYLES.error;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 border px-4 py-3 rounded-xl animate-in slide-in-from-top-2 fade-in duration-200 ${styles.box} ${className}`}
    >
      <span className={styles.icon}>{ICONS[variant]}</span>
      <p className={`text-sm leading-relaxed flex-1 ${styles.text}`}>
        {message}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar mensaje"
        className={`shrink-0 opacity-60 hover:opacity-100 transition-opacity ${styles.text}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
