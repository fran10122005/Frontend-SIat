import { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import {
  CheckCircle2,
  NotebookPen,
  Calendar,
  X,
  Moon,
  Utensils,
  AlertTriangle,
  Heart,
  Watch,
  Search,
} from "lucide-react";
import LoadingState from "../components/dashboard/LoadingState";
import Topbar from "../components/layout/Topbar";
import Pagination from "../components/shared/Pagination";
import FilterBar from "../components/shared/FilterBar";
import { useConsentimiento } from "../hooks/useConsentimiento";
import ConsentimientoModal from "../components/shared/ConsentimientoModal";

import PageTitle from "../components/ui/PageTitle";

// Helper para parsear fechas sin desfase horario UTC
const parseLocalDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  const str = String(dateInput);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
  }
  const d = new Date(str);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

export default function DiarioHogar() {
  const { userRole, selectedChildId, navigate, showToast, listaNinos } =
    useGlobalContext();

  const genero = useMemo(() => {
    const nino = listaNinos.find(
      (n) => (n.id_ninos || n.nin_codi) === selectedChildId,
    );
    return nino?.nin_gner === "F" ? "femenino" : "masculino";
  }, [listaNinos, selectedChildId]);

  const art = genero === "femenino" ? "la" : "el";
  const ninoLabel = genero === "femenino" ? "niña" : "niño";

  // API Integration States
  const [bitacorasList, setBitacorasList] = useState([]);
  const [loadingBitacoras, setLoadingBitacoras] = useState(true);

  const { consentimientoOk, loadingConsentimiento, aceptarConsentimiento } =
    useConsentimiento(selectedChildId);
  const [isAcceptingConsent, setIsAcceptingConsent] = useState(false);

  const handleAcceptConsent = async (version) => {
    setIsAcceptingConsent(true);
    await aceptarConsentimiento(version);
    setIsAcceptingConsent(false);
  };

  // Form states for Bitácora
  const todayLocal = new Date();
  const localDate = new Date(
    todayLocal.getTime() - todayLocal.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split("T")[0];
  const [reportDate, setReportDate] = useState(localDate);
  const [mood, setMood] = useState("Estable");
  const [crisisCount, setCrisisCount] = useState(0);
  const [sleepHours, setSleepHours] = useState(8);
  const [appetite, setAppetite] = useState("");
  const [notes, setNotes] = useState("");
  const [triggers, setTriggers] = useState("");
  const [positiveNote, setPositiveNote] = useState("");
  const [therapyDone, setTherapyDone] = useState("");
  const [showExtra, setShowExtra] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMood, setFilterMood] = useState("TODOS");
  const [filterCrisis, setFilterCrisis] = useState("TODOS");
  const [filterDateRange, setFilterDateRange] = useState("TODOS");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filteredBitacoras = useMemo(() => {
    let data = bitacorasList;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (b) =>
          (b.bit_text && b.bit_text.toLowerCase().includes(q)) ||
          (b.bit_algo && b.bit_algo.toLowerCase().includes(q)) ||
          (b.bit_dese && b.bit_dese.toLowerCase().includes(q)) ||
          (b.bit_anim && b.bit_anim.toLowerCase().includes(q)) ||
          (b.bit_obse && b.bit_obse.toLowerCase().includes(q)),
      );
    }

    if (filterMood !== "TODOS") {
      data = data.filter((b) => b.bit_anim === filterMood);
    }

    if (filterCrisis === "CON_CRISIS") {
      data = data.filter((b) => (b.bit_crisi || 0) > 0);
    } else if (filterCrisis === "SIN_CRISIS") {
      data = data.filter((b) => !b.bit_crisi || b.bit_crisi === 0);
    }

    if (filterDateRange === "HOY") {
      const todayStr = new Date().toISOString().split("T")[0];
      data = data.filter((b) => {
        const dStr = b.bit_fech ? String(b.bit_fech).substring(0, 10) : "";
        return dStr === todayStr;
      });
    } else if (filterDateRange === "7DIAS") {
      const now = new Date();
      const cutoff = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7,
      );
      data = data.filter((b) => parseLocalDate(b.bit_fech) >= cutoff);
    } else if (filterDateRange === "30DIAS") {
      const now = new Date();
      const cutoff = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 30,
      );
      data = data.filter((b) => parseLocalDate(b.bit_fech) >= cutoff);
    } else if (filterDateRange === "CUSTOM") {
      if (filterDateFrom) {
        const from = parseLocalDate(filterDateFrom);
        from.setHours(0, 0, 0, 0);
        data = data.filter((b) => parseLocalDate(b.bit_fech) >= from);
      }
      if (filterDateTo) {
        const to = parseLocalDate(filterDateTo);
        to.setHours(23, 59, 59, 999);
        data = data.filter((b) => parseLocalDate(b.bit_fech) <= to);
      }
    }

    return data;
  }, [
    bitacorasList,
    searchTerm,
    filterMood,
    filterCrisis,
    filterDateRange,
    filterDateFrom,
    filterDateTo,
  ]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (searchTerm) {
      chips.push({
        key: "search",
        label: `Búsqueda: "${searchTerm}"`,
        onRemove: () => setSearchTerm(""),
      });
    }
    if (filterMood !== "TODOS") {
      chips.push({
        key: "mood",
        label: `Ánimo: ${filterMood}`,
        onRemove: () => setFilterMood("TODOS"),
      });
    }
    if (filterCrisis !== "TODOS") {
      chips.push({
        key: "crisis",
        label: filterCrisis === "CON_CRISIS" ? "Con crisis" : "Sin crisis",
        onRemove: () => setFilterCrisis("TODOS"),
      });
    }
    if (filterDateRange !== "TODOS") {
      const labels = {
        HOY: "Hoy",
        "7DIAS": "Últimos 7 días",
        "30DIAS": "Últimos 30 días",
        CUSTOM: `Rango: ${filterDateFrom || "..."} - ${filterDateTo || "..."}`,
      };
      chips.push({
        key: "dateRange",
        label: labels[filterDateRange] || "Rango de fechas",
        onRemove: () => {
          setFilterDateRange("TODOS");
          setFilterDateFrom("");
          setFilterDateTo("");
        },
      });
    }
    return chips;
  }, [
    searchTerm,
    filterMood,
    filterCrisis,
    filterDateRange,
    filterDateFrom,
    filterDateTo,
  ]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filteredBitacoras.length / PAGE_SIZE);
  const pagedBitacoras = filteredBitacoras.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [
    searchTerm,
    filterMood,
    filterCrisis,
    filterDateRange,
    filterDateFrom,
    filterDateTo,
  ]);

  const fetchBitacoras = useCallback(async () => {
    try {
      setLoadingBitacoras(true);
      const endpoint =
        userRole === "ESPECIALISTA" && selectedChildId
          ? `/ninos/${selectedChildId}/bitacora`
          : selectedChildId
            ? `/ninos/bitacora?nin_codi=${selectedChildId}`
            : "/ninos/bitacora";
      const res = await api.get(endpoint);
      setBitacorasList(res.data.data || []);
    } catch (err) {
      console.error(err);
      setBitacorasList([]);
    } finally {
      setLoadingBitacoras(false);
    }
  }, [userRole, selectedChildId]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nin_codi: selectedChildId,
        date: reportDate,
        mood,
        crisisCount: Number(crisisCount),
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        appetite: appetite || null,
        text: notes || null,
        triggers: triggers || null,
        positiveNote: positiveNote || null,
        therapyDone: therapyDone || null,
      };
      await api.post("/ninos/bitacora", payload);
      showToast("✅ Reporte guardado");
      setCrisisCount(0);
      setMood("Estable");
      setNotes("");
      setTriggers("");
      setAppetite("");
      setPositiveNote("");
      setTherapyDone("");
      setSleepHours(8);
      fetchBitacoras();
    } catch (err) {
      console.error(err);
      showToast(
        "❌ Error al registrar la bitácora: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  useEffect(() => {
    if (userRole === "REPRESENTANTE") {
      fetchBitacoras();
    }
  }, [userRole, fetchBitacoras, selectedChildId]);

  // Security Guard
  if (userRole !== "REPRESENTANTE") {
    return (
      <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Módulo exclusivo para Representantes (Padres).
          </p>
          <button
            onClick={() => navigate("dashboard")}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const list = Array.isArray(bitacorasList) ? bitacorasList : [];
  const totalReports = list.length;
  const totalCrisis = list.reduce(
    (sum, b) => sum + (Number(b?.bit_crisi) || 0),
    0,
  );
  const lastMood = list.length > 0 ? list[0]?.bit_anim || "—" : "—";

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F4F7F9] dark:bg-slate-900">
        {!consentimientoOk && !loadingConsentimiento && (
          <ConsentimientoModal
            onAccept={handleAcceptConsent}
            loading={isAcceptingConsent}
          />
        )}

        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Header del Módulo */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 md:gap-4">
              <div>
                <PageTitle icon={NotebookPen} data-tour="dh-header">
                  Diario de Hogar
                </PageTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Registro diario del estado y evolución de {art} {ninoLabel}
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div
              data-tour="dh-stats"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4"
            >
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <NotebookPen className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Reportes
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {totalReports}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Último Ánimo
                  </p>
                  <p className="text-sm md:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {lastMood}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Crisis (Total)
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {totalCrisis}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Racha
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {bitacorasList.length > 0
                      ? `${Math.min(bitacorasList.length, 7)} días`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div
              data-tour="dh-form"
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6 md:mb-8"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <NotebookPen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Registrar Nuevo Reporte Diario
                </h3>
              </div>
              <form
                onSubmit={handleReportSubmit}
                className="p-5 md:p-8 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Fecha
                    </label>
                    <input
                      type="date"
                      data-tour="dh-date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Ánimo de {art} {ninoLabel}
                    </label>
                    <select
                      data-tour="dh-mood"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option>Muy Calmo</option>
                      <option>Estable</option>
                      <option>Irritable</option>
                      <option>Ansioso</option>
                      <option>Triste</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Crisis hoy
                    </label>
                    <input
                      type="number"
                      min="0"
                      data-tour="dh-crisis"
                      value={crisisCount}
                      readOnly
                      title="Las crisis son detectadas automáticamente por la pulsera IoT"
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none cursor-not-allowed text-slate-500 transition-all"
                    />
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 mt-1">
                      <Watch className="w-3 h-3" /> Sincronizado vía IoT
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Algo positivo de hoy
                  </label>
                  <input
                    type="text"
                    data-tour="dh-positive"
                    placeholder={
                      genero === "femenino"
                        ? "Ej: Hoy logró comer sola, se vistió sola..."
                        : "Ej: Hoy logró comer solo, se vistió solo..."
                    }
                    value={positiveNote}
                    onChange={(e) => setPositiveNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Notas (opcional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder={
                      genero === "femenino"
                        ? "Cómo fue el día, eventos importantes..."
                        : "Cómo fue el día, eventos importantes..."
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    data-tour="dh-extra"
                    onClick={() => setShowExtra(!showExtra)}
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    {showExtra ? "− Ocultar" : "+ Más detalles"} (sueño,
                    apetito, terapia...)
                  </button>

                  {showExtra && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Horas de sueño
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={sleepHours}
                          onChange={(e) => setSleepHours(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Apetito
                        </label>
                        <select
                          value={appetite}
                          onChange={(e) => setAppetite(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">—</option>
                          <option>Bueno</option>
                          <option>Regular</option>
                          <option>Selectivo</option>
                          <option>Rechazó alimentos</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Terapia hoy
                        </label>
                        <select
                          value={therapyDone}
                          onChange={(e) => setTherapyDone(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">—</option>
                          <option value="si">Sí, completa</option>
                          <option value="parcial">Sí, parcial</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Desencadenantes
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Ruido, cambio de rutina"
                          value={triggers}
                          onChange={(e) => setTriggers(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    data-tour="dh-save"
                    className="w-full sm:w-auto px-5 py-2.5 bg-brand-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Guardar Reporte
                  </button>
                </div>
              </form>
            </div>

            {/* Historial */}
            <div
              data-tour="dh-history"
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Historial de Diario
                </h3>
              </div>
              <div className="p-4 md:p-8 pt-4">
                {/* Filtros en una sola fila */}
                <div
                  data-tour="dh-filters"
                  className="bg-white dark:bg-[#1E293B] p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col gap-2.5"
                >
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 w-full">
                    {/* Buscador */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar en notas o bitácoras..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-3.5 pr-9 py-2 h-10 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    {/* Desplegables en la misma fila */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      <select
                        value={filterMood}
                        onChange={(e) => setFilterMood(e.target.value)}
                        className="h-10 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Filtrar por estado de ánimo"
                      >
                        <option value="TODOS">Todos los ánimos</option>
                        <option value="Muy Calmo">Muy Calmo 😌</option>
                        <option value="Estable">Estable 😊</option>
                        <option value="Irritable">Irritable 😠</option>
                        <option value="Ansioso">Ansioso 😟</option>
                        <option value="Triste">Triste 😢</option>
                      </select>

                      <select
                        value={filterCrisis}
                        onChange={(e) => setFilterCrisis(e.target.value)}
                        className="h-10 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Filtrar por eventos de crisis"
                      >
                        <option value="TODOS">Todas las entradas</option>
                        <option value="CON_CRISIS">Solo con crisis 🚨</option>
                        <option value="SIN_CRISIS">Sin crisis 🟢</option>
                      </select>

                      <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                        className="h-10 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Filtrar por rango de fechas"
                      >
                        <option value="TODOS">Todo el historial</option>
                        <option value="HOY">Hoy</option>
                        <option value="7DIAS">Últimos 7 días</option>
                        <option value="30DIAS">Últimos 30 días</option>
                        <option value="CUSTOM">Rango personalizado...</option>
                      </select>

                      {filterDateRange === "CUSTOM" && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="h-10 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            title="Fecha desde"
                          />
                          <span className="text-xs text-slate-400">a</span>
                          <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="h-10 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            title="Fecha hasta"
                          />
                        </div>
                      )}

                      {activeChips.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setFilterMood("TODOS");
                            setFilterCrisis("TODOS");
                            setFilterDateRange("TODOS");
                            setFilterDateFrom("");
                            setFilterDateTo("");
                          }}
                          className="h-10 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                          title="Limpiar filtros"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Limpiar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chips activos si hay filtros */}
                  {activeChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      {activeChips.map((chip) => (
                        <span
                          key={chip.key}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800"
                        >
                          {chip.label}
                          <button
                            type="button"
                            onClick={chip.onRemove}
                            className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            aria-label={`Quitar filtro ${chip.label}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  {loadingBitacoras ? (
                    <LoadingState variant="table" rows={4} />
                  ) : filteredBitacoras.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                      <Calendar className="w-8 h-8 opacity-50" />
                      <span className="text-sm font-medium">
                        Aún no hay reportes registrados
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pagedBitacoras.map((bitacora, idx) => {
                        const dateObj = parseLocalDate(bitacora.bit_fech);
                        const diaSemana = dateObj.toLocaleDateString("es-ES", {
                          weekday: "short",
                        });
                        const diaFormato = dateObj.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        });
                        const fechaTexto = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;
                        const animoIconos = {
                          "Muy Calmo": "😌",
                          Estable: "😊",
                          Irritable: "😠",
                          Ansioso: "😟",
                          Triste: "😢",
                        };
                        const crisisColor =
                          (bitacora.bit_crisi || 0) > 0
                            ? "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30"
                            : "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30";

                        return (
                          <div
                            key={bitacora.bit_codi || idx}
                            className="px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/60"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                  {fechaTexto}
                                </span>
                              </div>
                              <span
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap shrink-0 ${crisisColor}`}
                              >
                                <AlertTriangle className="w-3 h-3" />{" "}
                                {bitacora.bit_crisi || 0} crisis
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              <div
                                className="flex items-center justify-center gap-1 px-1 py-1 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={bitacora.bit_anim}
                              >
                                <span className="text-sm shrink-0">
                                  {animoIconos[bitacora.bit_anim] || "😐"}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_anim}
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-center gap-1 px-1 py-1 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={
                                  bitacora.bit_suen
                                    ? `${bitacora.bit_suen}h`
                                    : "—"
                                }
                              >
                                <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_suen
                                    ? `${bitacora.bit_suen}h`
                                    : "—"}
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-center gap-1 px-1 py-1 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={bitacora.bit_apet || "—"}
                              >
                                <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_apet || "—"}
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-center gap-1 px-1 py-1 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={
                                  bitacora.positiveNote ||
                                  bitacora.bit_algo ||
                                  "—"
                                }
                              >
                                <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.positiveNote ||
                                    bitacora.bit_algo ||
                                    "—"}
                                </span>
                              </div>
                            </div>

                            {(bitacora.bit_dese || bitacora.bit_obse) && (
                              <div className="mt-1.5 space-y-0.5">
                                {bitacora.bit_dese && (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-300 truncate">
                                    🧩 {bitacora.bit_dese}
                                  </p>
                                )}
                                {bitacora.bit_obse && (
                                  <p className="text-[10px] text-blue-700 dark:text-blue-300 truncate">
                                    💬 {bitacora.bit_obse}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
