import { useEffect, useRef } from "react";
import api from "../api/axios";

const CHECK_INTERVAL_MS = 30000;
const TOLERANCE_MIN = 5;
const STORAGE_KEY = "reportSchedule";
const SENT_KEY = "reportScheduleSent_v1";

function parseTime(timeStr) {
  const [h, m] = (timeStr || "08:00").split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

const SPANISH_DAYS = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
};

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function occurrenceKey(config, now) {
  const d = new Date(now);
  if (config.frequency === "monthly") {
    return `m-${d.getFullYear()}-${d.getMonth()}`;
  }
  if (config.frequency === "weekly") {
    const mon = getMonday(d);
    const mm = String(mon.getMonth() + 1).padStart(2, "0");
    const dd = String(mon.getDate()).padStart(2, "0");
    return `w-${mon.getFullYear()}-${mm}-${dd}`;
  }
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `d-${d.getFullYear()}-${mm}-${dd}`;
}

function shouldFire(config, now) {
  if (!config?.enabled || !config?.email) return false;
  const { h, m } = parseTime(config.time);
  const cur = new Date(now);
  const curMinutes = cur.getHours() * 60 + cur.getMinutes();
  const targetMinutes = h * 60 + m;
  if (curMinutes < targetMinutes) return false;
  if (curMinutes - targetMinutes > TOLERANCE_MIN) return false;

  if (config.frequency === "weekly") {
    const todayIndex = cur.getDay();
    const configuredIndex =
      SPANISH_DAYS[String(config.day || "").toLowerCase()];
    if (configuredIndex === undefined || todayIndex !== configuredIndex) {
      return false;
    }
  }

  if (config.frequency === "monthly" && cur.getDate() !== 1) return false;

  return true;
}

function getSentKeys() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function markSent(key) {
  const keys = getSentKeys();
  if (!keys.includes(key)) {
    keys.push(key);
    localStorage.setItem(SENT_KEY, JSON.stringify(keys));
  }
}

function showGlobalToast(message) {
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message } }),
  );
}

export default function useReportScheduler() {
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = async () => {
      let config;
      try {
        config = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      } catch {
        config = null;
      }
      if (!config || !config.enabled) return;

      const now = new Date();
      if (!shouldFire(config, now)) return;

      const key = occurrenceKey(config, now);
      if (getSentKeys().includes(key)) return;

      try {
        await api.post("/admin/reportes/enviar-ahora", config);
        markSent(key);
        showGlobalToast(
          "📬 Reporte programado enviado exitosamente a " + config.email,
        );
      } catch {
        showGlobalToast(
          "⚠️ No se pudo enviar el reporte programado. Intenta de nuevo.",
        );
      }
    };

    timerRef.current = setInterval(tick, CHECK_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}

useReportScheduler.displayName = "useReportScheduler";
