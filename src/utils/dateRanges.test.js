import { describe, it, expect } from "vitest";
import {
  DATE_RANGE_OPTIONS,
  parseCalendarDate,
  toLocalYmd,
  getDateRangeBounds,
  isDateInRange,
  formatRangeSubtitle,
  calculateConsecutiveStreak,
} from "./dateRanges";

describe("dateRanges - utilidades de rango calendario y racha", () => {
  const refWednesday = new Date(2026, 10, 11, 14, 30, 0); // Miércoles 11 Nov 2026

  it("expone todas las opciones de período clínico requeridas", () => {
    const values = DATE_RANGE_OPTIONS.map((o) => o.value);
    expect(values).toEqual(
      expect.arrayContaining([
        "all",
        "this_week",
        "last_week",
        "this_month",
        "last_month",
        "7days",
        "30days",
        "90days",
        "custom",
      ]),
    );
  });

  it("parseCalendarDate parsea fechas ISO y DD/MM/YYYY sin desfase UTC", () => {
    const iso = parseCalendarDate("2026-11-05T00:00:00.000Z");
    expect(toLocalYmd(iso)).toBe("2026-11-05");

    const dmy = parseCalendarDate("09/11/2026");
    expect(toLocalYmd(dmy)).toBe("2026-11-09");

    const dmyShort = parseCalendarDate("5/1/26");
    expect(toLocalYmd(dmyShort)).toBe("2026-01-05");

    expect(parseCalendarDate(null)).toBeNull();
    expect(parseCalendarDate("fecha-invalida")).toBeNull();
  });

  it("getDateRangeBounds calcula lunes-actual para 'this_week' y lunes-domingo previo para 'last_week'", () => {
    const thisWeek = getDateRangeBounds("this_week", "", "", refWednesday);
    expect(toLocalYmd(thisWeek.start)).toBe("2026-11-09"); // Lunes 9 Nov
    expect(toLocalYmd(thisWeek.end)).toBe("2026-11-11"); // Miércoles 11 Nov

    const lastWeek = getDateRangeBounds("last_week", "", "", refWednesday);
    expect(toLocalYmd(lastWeek.start)).toBe("2026-11-02"); // Lunes 2 Nov
    expect(toLocalYmd(lastWeek.end)).toBe("2026-11-08"); // Domingo 8 Nov
  });

  it("getDateRangeBounds calcula correctamente 'this_month', 'last_month', 'month' y 'custom'", () => {
    const thisMonth = getDateRangeBounds("this_month", "", "", refWednesday);
    expect(toLocalYmd(thisMonth.start)).toBe("2026-11-01");
    expect(toLocalYmd(thisMonth.end)).toBe("2026-11-11");

    const monthAlias = getDateRangeBounds("month", "", "", refWednesday);
    expect(toLocalYmd(monthAlias.start)).toBe("2026-11-01");

    const lastMonth = getDateRangeBounds("last_month", "", "", refWednesday);
    expect(toLocalYmd(lastMonth.start)).toBe("2026-10-01");
    expect(toLocalYmd(lastMonth.end)).toBe("2026-10-31");

    const custom = getDateRangeBounds(
      "custom",
      "2026-10-15",
      "2026-10-20",
      refWednesday,
    );
    expect(toLocalYmd(custom.start)).toBe("2026-10-15");
    expect(toLocalYmd(custom.end)).toBe("2026-10-20");

    const invalidCustom = getDateRangeBounds(
      "custom",
      "bad-date",
      "",
      refWednesday,
    );
    expect(invalidCustom.start).toBeNull();
    expect(invalidCustom.end).toBeNull();
  });

  it("isDateInRange filtra registros por período calendario correctamente", () => {
    expect(isDateInRange("2026-11-10", "this_week", "", "", refWednesday)).toBe(
      true,
    );
    expect(isDateInRange("2026-11-08", "this_week", "", "", refWednesday)).toBe(
      false,
    );
    expect(isDateInRange("05/11/2026", "last_week", "", "", refWednesday)).toBe(
      true,
    );
    expect(
      isDateInRange("2026-10-18", "last_month", "", "", refWednesday),
    ).toBe(true);
    expect(
      isDateInRange("2026-09-30", "last_month", "", "", refWednesday),
    ).toBe(false);
    expect(isDateInRange("2020-01-01", "all", "", "", refWednesday)).toBe(true);
  });

  it("formatRangeSubtitle formatea subtítulos en singular y plural", () => {
    expect(
      formatRangeSubtitle("all", "", "", 1, "sesión", "sesiones", refWednesday),
    ).toBe("Todo el historial • 1 sesión");

    const weekSub = formatRangeSubtitle(
      "last_week",
      "",
      "",
      5,
      "sesión",
      "sesiones",
      refWednesday,
    );
    expect(weekSub).toContain("5 sesiones");
    expect(weekSub).toMatch(/^Del /);
  });

  it("calculateConsecutiveStreak calcula días consecutivos reales sin tope artificial ni duplicados", () => {
    expect(calculateConsecutiveStreak([], refWednesday)).toBe(0);

    // Hoy y 9 días previos continuos = 10 días (debe superar antiguo límite de 7)
    const tenDayStreak = Array.from({ length: 10 }, (_, idx) => {
      const d = new Date(2026, 10, 11 - idx);
      return { bit_fech: toLocalYmd(d) };
    });
    // Duplicado en el mismo día no debe inflar la racha
    tenDayStreak.push({ bit_fech: "2026-11-11" });
    expect(calculateConsecutiveStreak(tenDayStreak, refWednesday)).toBe(10);

    // Si aún no se reportó hoy (11), pero sí ayer (10) y antier (9), racha activa = 2
    const yesterdayStreak = [
      { bit_fech: "2026-11-10" },
      { bit_fech: "2026-11-09" },
      { bit_fech: "2026-11-07" }, // hueco el día 8 corta la racha
    ];
    expect(calculateConsecutiveStreak(yesterdayStreak, refWednesday)).toBe(2);

    // Si último reporte fue hace 2+ días, racha = 0
    expect(
      calculateConsecutiveStreak([{ bit_fech: "2026-11-09" }], refWednesday),
    ).toBe(0);
  });
});
