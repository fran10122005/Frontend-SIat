export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "Todo el historial" },
  { value: "this_week", label: "Esta semana" },
  { value: "last_week", label: "Semana pasada" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes pasado" },
  { value: "7days", label: "Últimos 7 días" },
  { value: "30days", label: "Últimos 30 días" },
  { value: "90days", label: "Últimos 3 meses" },
  { value: "custom", label: "Rango personalizado..." },
];

export const parseCalendarDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : new Date(dateInput);
  }
  const str = String(dateInput).trim();
  const isoYmd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoYmd) {
    const [, y, m, d] = isoYmd;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  }
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    let year = Number(y);
    if (year < 100) year += 2000;
    const parsed = new Date(year, Number(m) - 1, Number(d), 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const toLocalYmd = (dateInput) => {
  const d = parseCalendarDate(dateInput);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getDateRangeBounds = (
  rangeKey = "all",
  customFrom = "",
  customTo = "",
  referenceDate = new Date(),
) => {
  const key = rangeKey === "month" ? "this_month" : rangeKey || "all";
  const ref = new Date(referenceDate);
  const startOfDay = (dt) =>
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0);
  const endOfDay = (dt) =>
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999);

  if (key === "all") {
    return { start: null, end: null };
  }

  if (key === "this_week") {
    const dayOfWeek = (ref.getDay() + 6) % 7; // Mon = 0 .. Sun = 6
    const mon = new Date(
      ref.getFullYear(),
      ref.getMonth(),
      ref.getDate() - dayOfWeek,
    );
    return { start: startOfDay(mon), end: endOfDay(ref) };
  }

  if (key === "last_week") {
    const dayOfWeek = (ref.getDay() + 6) % 7;
    const prevMon = new Date(
      ref.getFullYear(),
      ref.getMonth(),
      ref.getDate() - dayOfWeek - 7,
    );
    const prevSun = new Date(
      prevMon.getFullYear(),
      prevMon.getMonth(),
      prevMon.getDate() + 6,
    );
    return { start: startOfDay(prevMon), end: endOfDay(prevSun) };
  }

  if (key === "this_month") {
    const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
    return { start: startOfDay(first), end: endOfDay(ref) };
  }

  if (key === "last_month") {
    const first = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
    const last = new Date(ref.getFullYear(), ref.getMonth(), 0);
    return { start: startOfDay(first), end: endOfDay(last) };
  }

  if (key === "7days" || key === "30days" || key === "90days") {
    const days = key === "7days" ? 7 : key === "30days" ? 30 : 90;
    const from = new Date(
      ref.getFullYear(),
      ref.getMonth(),
      ref.getDate() - (days - 1),
    );
    return { start: startOfDay(from), end: endOfDay(ref) };
  }

  if (key === "custom") {
    const parsedFrom = customFrom ? parseCalendarDate(customFrom) : null;
    const parsedTo = customTo ? parseCalendarDate(customTo) : null;
    const start = parsedFrom ? startOfDay(parsedFrom) : null;
    const end = parsedTo ? endOfDay(parsedTo) : null;
    return {
      start: start && !Number.isNaN(start.getTime()) ? start : null,
      end: end && !Number.isNaN(end.getTime()) ? end : null,
    };
  }

  return { start: null, end: null };
};

export const isDateInRange = (
  dateInput,
  rangeKey = "all",
  customFrom = "",
  customTo = "",
  referenceDate = new Date(),
) => {
  const { start, end } = getDateRangeBounds(
    rangeKey,
    customFrom,
    customTo,
    referenceDate,
  );
  if (!start && !end) return true;
  const target = parseCalendarDate(dateInput);
  if (!target) return true;
  if (start && target < start) return false;
  if (end && target > end) return false;
  return true;
};

export const formatRangeSubtitle = (
  rangeKey = "all",
  customFrom = "",
  customTo = "",
  count = 0,
  nounSingular = "registro",
  nounPlural = "registros",
  referenceDate = new Date(),
) => {
  const { start, end } = getDateRangeBounds(
    rangeKey,
    customFrom,
    customTo,
    referenceDate,
  );
  const countText = `${count} ${count === 1 ? nounSingular : nounPlural}`;
  if (!start && !end) {
    return `Todo el historial • ${countText}`;
  }
  const fmt = (dt) =>
    dt.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  if (start && end) {
    return `Del ${fmt(start)} al ${fmt(end)} • ${countText}`;
  }
  if (start) {
    return `Desde ${fmt(start)} • ${countText}`;
  }
  return `Hasta ${fmt(end)} • ${countText}`;
};

export const calculateConsecutiveStreak = (
  entries = [],
  referenceDate = new Date(),
) => {
  if (!Array.isArray(entries) || entries.length === 0) return 0;
  const dateSet = new Set();
  entries.forEach((b) => {
    const ymd = toLocalYmd(b?.bit_fech || b?.bit_crea || b);
    if (ymd) dateSet.add(ymd);
  });
  if (dateSet.size === 0) return 0;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0,
  );
  const todayYmd = toLocalYmd(ref);
  const yesterday = new Date(ref);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayYmd = toLocalYmd(yesterday);

  let cursor = null;
  if (dateSet.has(todayYmd)) {
    cursor = new Date(ref);
  } else if (dateSet.has(yesterdayYmd)) {
    cursor = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  while (dateSet.has(toLocalYmd(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
