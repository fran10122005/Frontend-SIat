import { useState, useMemo, useEffect, useRef } from "react";
import {
  Mail,
  Phone,
  UserRound,
  ChevronDown,
  KeyRound,
  Ban,
  CheckCircle2,
  Baby,
  IdCard,
  Cake,
  ShieldCheck,
  Pencil,
  AlertCircle,
  Camera,
} from "lucide-react";
import pdfIcon from "../../assets/pdf.png";
import excelIcon from "../../assets/excel.png";
import { useGlobalContext } from "../../context/GlobalState";
import StatusBadge from "../shared/StatusBadge";
import FilterBar from "../shared/FilterBar";
import Pagination from "../shared/Pagination";
import AdminModal from "../shared/AdminModal";
import ConfirmDialog from "../shared/ConfirmDialog";
import FotoUpload from "../shared/FotoUpload";
import DocumentosClinicos from "../shared/DocumentosClinicos";
import api from "../../api/axios";
import useExpandableRows from "../../hooks/useExpandableRows";
import { toastError, extractFieldErrors } from "../../utils/errorHandler";
import {
  getAdultOrYouthDateBounds,
  getChildDateBounds,
  formatYmdForInput,
  calcAgeYears,
  parseLocalYMD,
  sanitizeDocumento,
  sanitizeTelefonoVE,
  sanitizeNombrePersona,
  validateNombrePersona,
  validateDocumento,
  validateEmail,
  validateTelefonoMovilVE,
  validateFechaRangoEdad,
  validateFechaPaciente,
  focusFirstError,
} from "../../utils/validators";

const PAGE_SIZE = 10;

function NinoExpedientePanel({
  ninos,
  onUpdateFoto,
  onEditNino,
  onAddDocument,
  uploadingPdf,
}) {
  const { showToast } = useGlobalContext();
  const [ninoActivo, setNinoActivo] = useState(0);
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fotoInputRef = useRef(null);

  const nino =
    ninos && ninos.length > 0
      ? ninos[Math.min(ninoActivo, ninos.length - 1)]
      : null;

  useEffect(() => {
    setFicha(null);
    if (!nino?.nin_codi) return;
    let cancel = false;
    setCargando(true);
    api
      .get(`/ninos/${nino.nin_codi}/ficha`)
      .then((res) => {
        if (!cancel) setFicha(res.data?.data || null);
      })
      .catch((err) => {
        if (!cancel)
          toastError(
            err,
            showToast,
            "Error al cargar el expediente del paciente.",
          );
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nino?.nin_codi]);

  const handleFotoChange = async (file) => {
    if (!file || !nino) return;
    if (!file.type.startsWith("image/")) {
      showToast("❌ Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ La foto no puede superar los 5 MB.");
      return;
    }
    setSubiendoFoto(true);
    try {
      const { uploadToCloudinary } = await import("../../config/cloudinary");
      const { url } = await uploadToCloudinary(
        file,
        "image",
        "siat/pacientes/fotos",
      );
      onUpdateFoto(nino.nin_codi, url);
      setFicha((prev) => (prev ? { ...prev, nin_foto: url } : prev));
    } catch {
      showToast("❌ No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  if (!nino) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
        Sin paciente asociado.
      </p>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {ninos.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {ninos.map((n, idx) => (
            <button
              key={n.nin_codi || idx}
              type="button"
              onClick={() => setNinoActivo(idx)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${idx === ninoActivo ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"}`}
            >
              {n.nin_nomb} {n.nin_apel}
            </button>
          ))}
        </div>
      )}

      {/* Cabecera compacta del niño con foto editable */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
        <div
          onClick={() => !subiendoFoto && fotoInputRef.current?.click()}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shrink-0 cursor-pointer transition-all duration-200
            ${nino.nin_foto ? "border-2 border-brand-100 dark:border-brand-900/30" : "border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"}
            ${subiendoFoto ? "cursor-wait opacity-70" : "hover:border-blue-400"}`}
          title="Cambiar foto del perfil"
        >
          {nino.nin_foto ? (
            <>
              <img
                src={nino.nin_foto}
                alt={`Foto de ${nino.nin_nomb}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-4 h-4 text-white mb-0.5" />
                <span className="text-[8px] font-bold text-white leading-tight text-center px-1">
                  Cambiar foto del perfil
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-semibold">Subir foto</span>
            </div>
          )}
          {subiendoFoto && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            </div>
          )}
        </div>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFotoChange(e.target.files[0])}
          className="hidden"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {nino.nin_nomb} {nino.nin_apel}
            </div>
            {onEditNino && (
              <button
                type="button"
                onClick={() => onEditNino(nino)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:border-brand-300 text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar Paciente
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span>{nino.nin_gner === "M" ? "Masculino" : "Femenino"}</span>
            <span>·</span>
            <span>{calcEdad(nino.nin_fnac)}</span>
            <span>·</span>
            <span>{nino.nin_nivd}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Cake className="w-3 h-3" />
              {(() => {
                const parsed = parseLocalYMD(nino.nin_fnac);
                return parsed
                  ? parsed.date.toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Sin fecha";
              })()}
            </span>
            <span className="font-mono">ID: {nino.nin_codi}</span>
          </div>
        </div>
      </div>

      {/* Expediente clínico (carga automática) */}
      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin" />
          Cargando expediente clínico...
        </div>
      ) : ficha || nino ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs shadow-xs">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Expediente Clínico y Seguimiento
            </div>
            {[
              {
                label: "Diagnóstico Clínico",
                value:
                  ficha?.nin_diag ||
                  nino?.nin_diag ||
                  "Sin diagnóstico registrado",
              },
              ...(ficha?.sensibilidad?.sen_nota || nino?.sensibilidad?.sen_nota
                ? [
                    {
                      label: "Notas de Condición / Sensibilidad",
                      value:
                        ficha?.sensibilidad?.sen_nota ||
                        nino?.sensibilidad?.sen_nota,
                    },
                  ]
                : []),
              {
                label: "Perfil Sensorial",
                value: ficha?.sensibilidad
                  ? `${ficha.sensibilidad.sen_tipo} · Nivel ${ficha.sensibilidad.sen_nvli}`
                  : nino?.sensibilidad
                    ? `${nino.sensibilidad.sen_tipo} · Nivel ${nino.sensibilidad.sen_nvli}`
                    : "No reportado",
              },
              {
                label: "Especialista Asignado",
                value:
                  ficha?.especialista || nino?.especialista || "Sin asignar",
              },
              {
                label: "Ingreso al Sistema",
                value:
                  ficha?.nin_ingr || nino?.nin_ingr
                    ? new Date(
                        ficha?.nin_ingr || nino?.nin_ingr,
                      ).toLocaleDateString("es-VE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-",
              },
              {
                label: "Institución",
                value:
                  ficha?.institucion?.ins_nomb ||
                  nino?.institucion?.ins_nomb ||
                  "Fundación SIAT",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
              >
                <span className="text-slate-600 dark:text-slate-300 font-medium sm:w-1/3 shrink-0">
                  {item.label}
                </span>
                <span className="text-slate-900 dark:text-white font-semibold sm:w-2/3 sm:text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <DocumentosClinicos
            docs={ficha?.nin_docs?.length ? ficha.nin_docs : nino?.nin_docs}
            onAddDocument={
              onAddDocument
                ? (file) => onAddDocument(nino.nin_codi, file)
                : undefined
            }
            uploading={uploadingPdf}
          />
        </div>
      ) : null}
    </div>
  );
}

const calcEdad = (fechaNac) => {
  const años = calcAgeYears(fechaNac);
  if (años === null) return "Edad no disponible";
  return `${años} año${años !== 1 ? "s" : ""}`;
};

export default function RepresentantesTab({
  representantes,
  loading: parentLoading,
  onRefresh,
  onRegisterClick,
  editingRep,
  setEditingRep,
  handleUpdateRepresentante,
}) {
  const { showToast } = useGlobalContext();
  const { expandedId, toggle } = useExpandableRows();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [filterRelacion, setFilterRelacion] = useState("TODOS");
  const [filterPacientes, setFilterPacientes] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [resettingId, setResettingId] = useState(null);
  const [previewRep, setPreviewRep] = useState(null);
  const [previewTab, setPreviewTab] = useState("rep");
  const [editErrores, setEditErrores] = useState({});
  const [ninoErrores, setNinoErrores] = useState({});
  const [updatingFotoNin, setUpdatingFotoNin] = useState(null);
  const repFormRef = useRef(null);
  const ninoFormRef = useRef(null);
  const initialEditRepRef = useRef("");
  const initialEditNinoRef = useRef("");
  const repDateBounds = useMemo(() => getAdultOrYouthDateBounds(12, 75), []);
  const childDateBounds = useMemo(() => getChildDateBounds(25), []);

  const openEditRep = (r) => {
    const initial = {
      usu_codi: r.usu_codi,
      rep_nomb: r.rep_nomb || "",
      rep_apel: r.rep_apel || "",
      rep_telf: r.rep_telf || "",
      rep_rela: r.rep_rela || "",
      rep_cedu: r.rep_cedu || "",
      rep_fnac: formatYmdForInput(r.rep_fnac) || "",
      rep_foto: r.rep_foto || "",
      usu_crro: r.usu_crro || "",
    };
    initialEditRepRef.current = JSON.stringify(initial);
    setEditErrores({});
    setEditingRep(initial);
  };

  const validarEditCampo = (campo, nextValue = editingRep?.[campo]) => {
    switch (campo) {
      case "rep_nomb":
        return validateNombrePersona(nextValue, "El nombre", {
          required: true,
        });
      case "rep_apel":
        return validateNombrePersona(nextValue, "El apellido", {
          required: true,
        });
      case "rep_cedu":
        return validateDocumento(nextValue, "V", { required: false });
      case "rep_rela":
        return !String(nextValue || "").trim()
          ? "Selecciona el vínculo legal"
          : "";
      case "rep_fnac":
        return validateFechaRangoEdad(nextValue, {
          minAge: 12,
          maxAge: 75,
          required: false,
          label: "La fecha de nacimiento",
        });
      case "usu_crro":
        return validateEmail(nextValue, { required: true, max: 50 });
      case "rep_telf":
        return validateTelefonoMovilVE(nextValue, { required: false });
      default:
        return "";
    }
  };

  const validarEditTodo = () => {
    const campos = [
      "rep_nomb",
      "rep_apel",
      "rep_cedu",
      "rep_rela",
      "rep_fnac",
      "usu_crro",
      "rep_telf",
    ];
    const nuevos = {};
    campos.forEach((campo) => {
      const err = validarEditCampo(campo, editingRep?.[campo]);
      if (err) nuevos[campo] = err;
    });
    setEditErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      requestAnimationFrame(() => focusFirstError(nuevos, repFormRef));
      return false;
    }
    return true;
  };

  const filtered = useMemo(() => {
    return representantes.filter((r) => {
      const q = search.toLowerCase();
      const ninosStr = (r.ninos || [])
        .map((n) => `${n.nin_nomb || ""} ${n.nin_apel || ""}`)
        .join(" ")
        .toLowerCase();
      const nombre =
        `${r.rep_nomb || ""} ${r.rep_apel || ""} ${r.usu_crro || ""} ${r.rep_telf || ""} ${r.rep_cedu || ""} ${ninosStr}`.toLowerCase();

      if (search && !nombre.includes(q)) return false;
      if (filterEstado === "ACTIVO" && !r.usu_estd) return false;
      if (filterEstado === "INACTIVO" && r.usu_estd) return false;

      // Filtro por relación / parentesco
      if (filterRelacion !== "TODOS") {
        const rel = (r.rep_rela || "").toLowerCase();
        const targetRel = filterRelacion.toLowerCase();
        if (!rel.includes(targetRel)) return false;
      }

      // Filtro por pacientes asignados
      const count = (r.ninos || []).length;
      if (filterPacientes === "CON_PACIENTE" && count === 0) return false;
      if (filterPacientes === "SIN_PACIENTE" && count > 0) return false;
      if (filterPacientes === "MULTIPLES" && count < 2) return false;

      // Filtro por rango de fechas de ingreso
      if (dateFrom || dateTo) {
        const repDate = r.usu_ingr || r.rep_ingr || r.created_at;
        if (repDate) {
          const d = new Date(repDate);
          if (dateFrom && d < new Date(dateFrom)) return false;
          if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
        }
      }

      return true;
    });
  }, [
    representantes,
    search,
    filterEstado,
    filterRelacion,
    filterPacientes,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setSearch("");
    setFilterEstado("TODOS");
    setFilterRelacion("TODOS");
    setFilterPacientes("TODOS");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const filterChips = [
    filterEstado !== "TODOS" && {
      key: "estado",
      label: filterEstado === "ACTIVO" ? "Estado: Activo" : "Estado: Inactivo",
      onRemove: () => {
        setFilterEstado("TODOS");
        setPage(0);
      },
    },
    filterRelacion !== "TODOS" && {
      key: "relacion",
      label: `Parentesco: ${filterRelacion}`,
      onRemove: () => {
        setFilterRelacion("TODOS");
        setPage(0);
      },
    },
    filterPacientes !== "TODOS" && {
      key: "pacientes",
      label:
        filterPacientes === "CON_PACIENTE"
          ? "Con Pacientes"
          : filterPacientes === "SIN_PACIENTE"
            ? "Sin Pacientes"
            : "Múltiples Pacientes (≥2)",
      onRemove: () => {
        setFilterPacientes("TODOS");
        setPage(0);
      },
    },
    dateFrom && {
      key: "dateFrom",
      label: `Desde: ${dateFrom}`,
      onRemove: () => {
        setDateFrom("");
        setPage(0);
      },
    },
    dateTo && {
      key: "dateTo",
      label: `Hasta: ${dateTo}`,
      onRemove: () => {
        setDateTo("");
        setPage(0);
      },
    },
  ].filter(Boolean);

  const [confirmEstadoState, setConfirmEstadoState] = useState({
    isOpen: false,
    usuCodi: null,
    currentState: false,
    email: "",
  });
  const [confirmResetState, setConfirmResetState] = useState({
    isOpen: false,
    usuCodi: null,
    email: "",
  });

  const handleResetPass = async (usuCodi, email) => {
    setResettingId(usuCodi);
    try {
      const res = await api.post(`/admin/users/${usuCodi}/password`, {});
      const nuevaClave = res.data?.data?.password_generada;
      showToast(
        nuevaClave
          ? `✅ Contraseña restablecida para ${email}. Nueva: ${nuevaClave}`
          : `✅ Contraseña restablecida para ${email}.`,
      );
    } catch (err) {
      toastError(err, showToast, "Error al restablecer la contraseña.");
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleEstado = async (usuCodi, currentState) => {
    try {
      await api.patch(`/admin/users/${usuCodi}/estado`, {
        activo: !currentState,
      });
      showToast(
        `✅ Representante ${!currentState ? "activado" : "desactivado"} exitosamente.`,
      );
      onRefresh();
    } catch (err) {
      toastError(
        err,
        showToast,
        "Error al cambiar el estado del representante.",
      );
    }
  };

  const [editingNino, setEditingNino] = useState(null);
  const [savingNino, setSavingNino] = useState(false);
  const [uploadingPdfNin, setUploadingPdfNin] = useState(false);

  const openEditNino = (ninoItem) => {
    const initial = {
      nin_codi: ninoItem.nin_codi,
      nin_nomb: ninoItem.nin_nomb || "",
      nin_apel: ninoItem.nin_apel || "",
      nin_fnac: formatYmdForInput(ninoItem.nin_fnac),
      nin_gner: ninoItem.nin_gner || "M",
      nin_nivd: ninoItem.nin_nivd || "Nivel 1",
      nin_diag: ninoItem.nin_diag || "",
      sen_tipo: ninoItem.sensibilidad?.sen_tipo || "",
      sen_nvli: ninoItem.sensibilidad?.sen_nvli || "Leve",
      sen_nota: ninoItem.sensibilidad?.sen_nota || "",
    };
    initialEditNinoRef.current = JSON.stringify(initial);
    setNinoErrores({});
    setEditingNino(initial);
  };

  const validarNinoCampo = (
    campo,
    nextValue = editingNino?.[campo],
    currentNino = editingNino,
  ) => {
    switch (campo) {
      case "nin_nomb":
        return validateNombrePersona(nextValue, "El nombre", {
          required: true,
        });
      case "nin_apel":
        return validateNombrePersona(nextValue, "El apellido", {
          required: true,
        });
      case "nin_fnac":
        return validateFechaPaciente(nextValue, { required: true, maxAge: 25 });
      case "nin_diag":
        return String(nextValue || "").trim().length > 255
          ? "El diagnóstico no puede exceder 255 caracteres"
          : "";
      case "sen_nvli":
        return currentNino?.sen_tipo && !String(nextValue || "").trim()
          ? "Selecciona la severidad sensorial"
          : "";
      case "sen_nota":
        return String(nextValue || "").trim().length > 255
          ? "Las notas sensoriales no pueden exceder 255 caracteres"
          : "";
      default:
        return "";
    }
  };

  const validarNinoTodo = () => {
    const campos = [
      "nin_nomb",
      "nin_apel",
      "nin_fnac",
      "nin_diag",
      "sen_nvli",
      "sen_nota",
    ];
    const errs = {};
    campos.forEach((c) => {
      const msg = validarNinoCampo(c, editingNino?.[c], editingNino);
      if (msg) errs[c] = msg;
    });
    setNinoErrores(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs, ninoFormRef));
      return false;
    }
    return true;
  };

  const handleUpdateNino = async (e) => {
    e.preventDefault();
    if (!editingNino) return;
    if (!validarNinoTodo()) return;
    setSavingNino(true);
    try {
      const payload = {
        nin_nomb: String(editingNino.nin_nomb || "").trim(),
        nin_apel: String(editingNino.nin_apel || "").trim(),
        nin_fnac: editingNino.nin_fnac,
        nin_gner: editingNino.nin_gner,
        nin_nivd: editingNino.nin_nivd,
        nin_diag: String(editingNino.nin_diag || "").trim(),
        ...(editingNino.sen_tipo && {
          sen_tipo: editingNino.sen_tipo,
          sen_nvli: editingNino.sen_nvli || "Leve",
          sen_nota: String(editingNino.sen_nota || "").trim(),
        }),
      };
      await api.patch(`/admin/ninos/${editingNino.nin_codi}`, payload);
      showToast("✅ Datos del paciente actualizados correctamente.");
      setPreviewRep((prev) => {
        if (!prev) return prev;
        const actualizar = (n) =>
          n.nin_codi === editingNino.nin_codi
            ? {
                ...n,
                ...payload,
                sensibilidad: payload.sen_tipo
                  ? {
                      sen_tipo: payload.sen_tipo,
                      sen_nvli: payload.sen_nvli,
                      sen_nota: payload.sen_nota,
                    }
                  : n.sensibilidad,
              }
            : n;
        const nuevos = (prev.ninos || []).map(actualizar);
        const primero = prev.ninos && prev.ninos.length > 0 ? nuevos[0] : null;
        return {
          ...prev,
          ninos: nuevos,
          tm_ninos:
            prev.tm_ninos && prev.tm_ninos.nin_codi === editingNino.nin_codi
              ? actualizar(prev.tm_ninos)
              : prev.tm_ninos || primero,
        };
      });
      setNinoErrores({});
      setEditingNino(null);
      onRefresh();
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setNinoErrores((prev) => ({ ...prev, ...fieldErrors }));
        requestAnimationFrame(() => focusFirstError(fieldErrors, ninoFormRef));
      }
      toastError(err, showToast, "Error al actualizar datos del paciente.");
    } finally {
      setSavingNino(false);
    }
  };

  const handleAddNinoDocumento = async (ninCodi, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showToast("❌ Solo se permiten archivos en formato PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("❌ El archivo no puede superar los 10 MB.");
      return;
    }
    setUploadingPdfNin(true);
    try {
      const { uploadToCloudinary, FOLDERS } =
        await import("../../config/cloudinary");
      const { url } = await uploadToCloudinary(
        file,
        "raw",
        FOLDERS.medicalDocs || "siat/pacientes/documentos",
      );
      await api.post(`/admin/ninos/${ninCodi}/documentos`, { doc: url });
      showToast("✅ Documento PDF añadido al expediente clínico.");
      setPreviewRep((prev) => {
        if (!prev) return prev;
        const actualizar = (n) =>
          n.nin_codi === ninCodi
            ? { ...n, nin_docs: [...(n.nin_docs || []), url] }
            : n;
        const nuevos = (prev.ninos || []).map(actualizar);
        const primero = prev.ninos && prev.ninos.length > 0 ? nuevos[0] : null;
        return {
          ...prev,
          ninos: nuevos,
          tm_ninos:
            prev.tm_ninos && prev.tm_ninos.nin_codi === ninCodi
              ? actualizar(prev.tm_ninos)
              : prev.tm_ninos || primero,
        };
      });
      onRefresh();
    } catch (err) {
      toastError(err, showToast, "Error al adjuntar el documento PDF.");
    } finally {
      setUploadingPdfNin(false);
    }
  };

  const handleUpdateNinoFoto = async (ninCodi, url) => {
    setUpdatingFotoNin(ninCodi);
    try {
      await api.patch(`/admin/ninos/${ninCodi}/foto`, {
        nin_foto: url || null,
      });
      showToast("✅ Foto del paciente actualizada correctamente.");
      setPreviewRep((prev) => {
        if (!prev) return prev;
        const actualizar = (nino) =>
          nino.nin_codi === ninCodi ? { ...nino, nin_foto: url } : nino;
        const nuevos = (prev.ninos || []).map(actualizar);
        const primero = prev.ninos && prev.ninos.length > 0 ? nuevos[0] : null;
        return {
          ...prev,
          ninos: nuevos,
          tm_ninos:
            prev.tm_ninos && prev.tm_ninos.nin_codi === ninCodi
              ? { ...prev.tm_ninos, nin_foto: url }
              : prev.tm_ninos || primero,
        };
      });
      onRefresh();
    } catch (err) {
      toastError(err, showToast, "Error al actualizar la foto del paciente.");
    } finally {
      setUpdatingFotoNin(null);
    }
  };

  const exportPDF = async () => {
    try {
      const { exportRepresentantesToPDF } =
        await import("../../utils/pdfExporter");
      await exportRepresentantesToPDF(filtered);
      showToast("✅ Directorio de representantes exportado a PDF");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al exportar PDF de representantes");
    }
  };

  const exportExcel = () => {
    import("xlsx").then((XLSX) => {
      try {
        const data = filtered.map((r) => ({
          Representante:
            `${r.rep_nomb || ""} ${r.rep_apel || ""}`.trim() || "-",
          Cédula: r.rep_cedu || "-",
          Parentesco: r.rep_rela || "-",
          Teléfono: r.rep_telf || "-",
          Correo: r.usu_crro || "-",
          Pacientes: r.ninos?.length
            ? r.ninos
                .map((n) => `${n.nin_nomb || ""} ${n.nin_apel || ""}`.trim())
                .join(", ")
            : "-",
          Estado: r.usu_estd ? "Activo" : "Inactivo",
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Representantes");
        XLSX.writeFile(workbook, "representantes_siat.xlsx");
        showToast("✅ Directorio de representantes exportado a Excel");
      } catch (err) {
        console.error(err);
        showToast("❌ Error al exportar Excel de representantes");
      }
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300">
      <FilterBar
        dataTour="admin-rep-search"
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Buscar por nombre, correo, cédula o paciente..."
        activeCount={filterChips.length + (search ? 1 : 0)}
        onClearAll={clearFilters}
        chips={filterChips}
      >
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Estado
          </label>
          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(0);
            }}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Parentesco
          </label>
          <select
            value={filterRelacion}
            onChange={(e) => {
              setFilterRelacion(e.target.value);
              setPage(0);
            }}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="TODOS">Todos los parentescos</option>
            <option value="Madre">Madre</option>
            <option value="Padre">Padre</option>
            <option value="Tutor">Tutor / Legal</option>
            <option value="Abuelo">Abuelo / Abuela</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Pacientes Asignados
          </label>
          <select
            value={filterPacientes}
            onChange={(e) => {
              setFilterPacientes(e.target.value);
              setPage(0);
            }}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="TODOS">Cualquier cantidad</option>
            <option value="CON_PACIENTE">Con Pacientes (≥1)</option>
            <option value="SIN_PACIENTE">Sin Pacientes (0)</option>
            <option value="MULTIPLES">Múltiples Pacientes (≥2)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Fecha Registro (Desde)
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            Fecha Registro (Hasta)
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
          />
        </div>
      </FilterBar>

      <div
        data-tour="admin-rep-table"
        className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Representantes Legales
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full whitespace-nowrap">
              {filtered.length} registros
            </span>
            <button
              type="button"
              onClick={exportPDF}
              aria-label="Exportar a PDF"
              title="Exportar a PDF"
              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <img
                src={pdfIcon}
                alt="PDF"
                className="w-4 h-4 object-contain shrink-0"
              />
            </button>
            <button
              type="button"
              onClick={exportExcel}
              aria-label="Exportar a Excel"
              title="Exportar a Excel"
              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
            >
              <img
                src={excelIcon}
                alt="Excel"
                className="w-4 h-4 object-contain shrink-0"
              />
            </button>
            {onRegisterClick && (
              <button
                type="button"
                onClick={onRegisterClick}
                data-tour="admin-rep-register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Registrar Niño
              </button>
            )}
          </div>
        </div>

        {parentLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserRound className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">No se encontraron representantes</p>
            <p className="text-xs mt-1">
              Los representantes aparecen aquí cuando son registrados mediante
              invitación clínica.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse responsive-table">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Representante</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3 hidden sm:table-cell">
                      Paciente Asociado
                    </th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paged.map((r) => (
                    <tr
                      key={r.usu_codi || r.rep_codi}
                      onClick={() => setPreviewRep(r)}
                      className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${expandedId === (r.usu_codi || r.rep_codi) ? "mobile-expanded" : ""}`}
                    >
                      <td
                        className="px-6 py-4 mobile-summary"
                        data-label="Representante"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {r.rep_foto ? (
                            <img
                              src={r.rep_foto}
                              alt={`${r.rep_nomb} ${r.rep_apel}`}
                              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0 text-sm">
                              {r.rep_nomb?.charAt(0) || "?"}
                              {r.rep_apel?.charAt(0) || ""}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {r.rep_nomb} {r.rep_apel}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              ID: {r.rep_codi || r.usu_codi}
                            </div>
                          </div>
                        </div>
                        <span className="mobile-summary-status">
                          <StatusBadge active={r.usu_estd} />
                        </span>
                        <button
                          type="button"
                          className="mobile-expand-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(r.usu_codi || r.rep_codi);
                          }}
                          aria-label={
                            expandedId === (r.usu_codi || r.rep_codi)
                              ? "Ver menos"
                              : "Ver más"
                          }
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </td>
                      <td
                        className="px-6 py-4 mobile-detail"
                        data-label="Contacto"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs break-all">
                              {r.usu_crro || "-"}
                            </span>
                          </div>
                          {r.rep_telf && (
                            <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs">{r.rep_telf}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 hidden sm:table-cell mobile-detail"
                        data-label="Paciente"
                      >
                        {r.ninos && r.ninos.length > 0 ? (
                          <div>
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {r.ninos
                                .map((n) => `${n.nin_nomb} ${n.nin_apel || ""}`)
                                .join(", ")}
                            </span>
                            {r.ninos.length > 1 && (
                              <span className="ml-2 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                {r.ninos.length} niños
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-center mobile-detail"
                        data-label="Estado"
                      >
                        <StatusBadge active={r.usu_estd} />
                      </td>
                      <td
                        className="px-6 py-4 text-right mobile-detail"
                        data-label="Acciones"
                      >
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditRep(r);
                            }}
                            title="Editar"
                            className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmResetState({
                                isOpen: true,
                                usuCodi: r.usu_codi,
                                email: r.usu_crro,
                              });
                            }}
                            disabled={resettingId === r.usu_codi}
                            title="Restablecer contraseña"
                            className="action-icon-btn text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
                          >
                            {resettingId === r.usu_codi ? (
                              <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmEstadoState({
                                isOpen: true,
                                usuCodi: r.usu_codi,
                                currentState: r.usu_estd,
                                email: r.usu_crro,
                              });
                            }}
                            title={r.usu_estd ? "Desactivar" : "Activar"}
                            className={`action-icon-btn text-slate-500 ${r.usu_estd ? "hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" : "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                          >
                            {r.usu_estd ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Modal Editar Representante - estilo compacto tipo vista previa */}
      <AdminModal
        open={!!editingRep}
        onClose={() => {
          setEditingRep(null);
          setEditErrores({});
        }}
        title="Editar Representante"
        subtitle={`${editingRep?.rep_nomb || ""} ${editingRep?.rep_apel || ""}`.trim()}
        maxWidth="max-w-xl"
        icon={Pencil}
        hasUnsavedChanges={Boolean(
          editingRep &&
          initialEditRepRef.current &&
          JSON.stringify(editingRep) !== initialEditRepRef.current,
        )}
      >
        <form
          ref={repFormRef}
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validarEditTodo()) return;
            const res = await handleUpdateRepresentante(e);
            const ok = res === true || res?.ok === true;
            if (ok) {
              setEditErrores({});
              setEditingRep(null);
            } else if (
              res?.fieldErrors &&
              Object.keys(res.fieldErrors).length > 0
            ) {
              setEditErrores((prev) => ({ ...prev, ...res.fieldErrors }));
              requestAnimationFrame(() =>
                focusFirstError(res.fieldErrors, repFormRef),
              );
            }
          }}
          className="space-y-4 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900/50"
        >
          {/* Foto del representante */}
          <FotoUpload
            value={editingRep?.rep_foto || ""}
            onChange={(url) =>
              setEditingRep((prev) => ({ ...prev, rep_foto: url || "" }))
            }
            label="Foto de perfil"
            alt={`${editingRep?.rep_nomb || ""} ${editingRep?.rep_apel || ""}`.trim()}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombres <span className="text-rose-500">*</span>
              </label>
              <input
                required
                data-field="rep_nomb"
                name="rep_nomb"
                maxLength={50}
                type="text"
                value={editingRep?.rep_nomb || ""}
                onChange={(e) => {
                  const nextVal = sanitizeNombrePersona(e.target.value, 50);
                  setEditingRep({ ...editingRep, rep_nomb: nextVal });
                  if (editErrores.rep_nomb) {
                    setEditErrores((prev) => ({
                      ...prev,
                      rep_nomb: validarEditCampo("rep_nomb", nextVal),
                    }));
                  }
                }}
                onBlur={() =>
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_nomb: validarEditCampo(
                      "rep_nomb",
                      editingRep?.rep_nomb,
                    ),
                  }))
                }
                aria-invalid={Boolean(editErrores.rep_nomb)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors ${editErrores.rep_nomb ? "form-input-invalid" : ""}`}
                placeholder="Ej. María"
              />
              {editErrores.rep_nomb && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_nomb}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Apellidos <span className="text-rose-500">*</span>
              </label>
              <input
                required
                data-field="rep_apel"
                name="rep_apel"
                maxLength={50}
                type="text"
                value={editingRep?.rep_apel || ""}
                onChange={(e) => {
                  const nextVal = sanitizeNombrePersona(e.target.value, 50);
                  setEditingRep({ ...editingRep, rep_apel: nextVal });
                  if (editErrores.rep_apel) {
                    setEditErrores((prev) => ({
                      ...prev,
                      rep_apel: validarEditCampo("rep_apel", nextVal),
                    }));
                  }
                }}
                onBlur={() =>
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_apel: validarEditCampo(
                      "rep_apel",
                      editingRep?.rep_apel,
                    ),
                  }))
                }
                aria-invalid={Boolean(editErrores.rep_apel)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors ${editErrores.rep_apel ? "form-input-invalid" : ""}`}
                placeholder="Ej. Rodríguez"
              />
              {editErrores.rep_apel && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_apel}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cédula de Identidad
              </label>
              <input
                data-field="rep_cedu"
                name="rep_cedu"
                inputMode="numeric"
                maxLength={8}
                type="text"
                value={editingRep?.rep_cedu || ""}
                onChange={(e) => {
                  const nextVal = sanitizeDocumento(e.target.value, "V");
                  setEditingRep({
                    ...editingRep,
                    rep_cedu: nextVal,
                  });
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_cedu: validarEditCampo("rep_cedu", nextVal),
                  }));
                }}
                onBlur={() =>
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_cedu: validarEditCampo(
                      "rep_cedu",
                      editingRep?.rep_cedu,
                    ),
                  }))
                }
                aria-invalid={Boolean(editErrores.rep_cedu)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors whitespace-nowrap ${editErrores.rep_cedu ? "form-input-invalid" : ""}`}
                placeholder="Ej. 12345678"
              />
              {editErrores.rep_cedu && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_cedu}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Vínculo Legal <span className="text-rose-500">*</span>
              </label>
              <select
                required
                data-field="rep_rela"
                name="rep_rela"
                value={editingRep?.rep_rela || ""}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setEditingRep({ ...editingRep, rep_rela: nextVal });
                  if (editErrores.rep_rela) {
                    setEditErrores((prev) => ({
                      ...prev,
                      rep_rela: validarEditCampo("rep_rela", nextVal),
                    }));
                  }
                }}
                aria-invalid={Boolean(editErrores.rep_rela)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm focus:outline-none focus:border-brand-600 ${editErrores.rep_rela ? "form-input-invalid" : ""}`}
              >
                <option value="" disabled>
                  Seleccione vínculo...
                </option>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor">Tutor</option>
                <option value="Abuela">Abuela</option>
                <option value="Abuelo">Abuelo</option>
                <option value="Hermana">Hermana</option>
                <option value="Hermano">Hermano</option>
                <option value="Otro">Otro</option>
              </select>
              {editErrores.rep_rela && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_rela}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Fecha de Nacimiento
              </label>
              <input
                data-field="rep_fnac"
                name="rep_fnac"
                type="date"
                min={repDateBounds.min}
                max={repDateBounds.max}
                value={editingRep?.rep_fnac || ""}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setEditingRep({ ...editingRep, rep_fnac: nextVal });
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_fnac: validarEditCampo("rep_fnac", nextVal),
                  }));
                }}
                onBlur={() =>
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_fnac: validarEditCampo(
                      "rep_fnac",
                      editingRep?.rep_fnac,
                    ),
                  }))
                }
                aria-invalid={Boolean(editErrores.rep_fnac)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm focus:outline-none focus:border-brand-600 transition-colors ${editErrores.rep_fnac ? "form-input-invalid" : ""}`}
              />
              {editErrores.rep_fnac ? (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_fnac}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Edad permitida: 12 a 75 años
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Teléfono de Contacto
              </label>
              <input
                data-field="rep_telf"
                name="rep_telf"
                inputMode="tel"
                maxLength={
                  (editingRep?.rep_telf || "").startsWith("+") ? 13 : 11
                }
                type="text"
                value={editingRep?.rep_telf || ""}
                onChange={(e) => {
                  const nextVal = sanitizeTelefonoVE(e.target.value);
                  setEditingRep({ ...editingRep, rep_telf: nextVal });
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_telf: validarEditCampo("rep_telf", nextVal),
                  }));
                }}
                onBlur={() =>
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_telf: validarEditCampo(
                      "rep_telf",
                      editingRep?.rep_telf,
                    ),
                  }))
                }
                aria-invalid={Boolean(editErrores.rep_telf)}
                className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors ${editErrores.rep_telf ? "form-input-invalid" : ""}`}
                placeholder="04120000000 o +584120000000"
              />
              {editErrores.rep_telf && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_telf}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Correo Electrónico (acceso){" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              required
              data-field="usu_crro"
              name="usu_crro"
              maxLength={50}
              type="email"
              value={editingRep?.usu_crro || ""}
              onChange={(e) => {
                const nextVal = e.target.value;
                setEditingRep({ ...editingRep, usu_crro: nextVal });
                if (editErrores.usu_crro) {
                  setEditErrores((prev) => ({
                    ...prev,
                    usu_crro: validarEditCampo("usu_crro", nextVal),
                  }));
                }
              }}
              onBlur={() =>
                setEditErrores((prev) => ({
                  ...prev,
                  usu_crro: validarEditCampo("usu_crro", editingRep?.usu_crro),
                }))
              }
              aria-invalid={Boolean(editErrores.usu_crro)}
              className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors ${editErrores.usu_crro ? "form-input-invalid" : ""}`}
              placeholder="correo@ejemplo.com"
            />
            {editErrores.usu_crro && (
              <p className="form-error" role="alert">
                <AlertCircle className="w-3.5 h-3.5" /> {editErrores.usu_crro}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              Se usa para iniciar sesión en SIAT.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setEditingRep(null);
                setEditErrores({});
              }}
              className="md:w-auto w-full px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={parentLoading}
              type="submit"
              className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Vista previa del representante y su paciente */}
      {previewRep && (
        <AdminModal
          open={!!previewRep}
          onClose={() => {
            setPreviewRep(null);
            setPreviewTab("rep");
          }}
          title="Ficha Integral del Representante"
          subtitle={`${previewRep.rep_nomb || ""} ${previewRep.rep_apel || ""}`.trim()}
          maxWidth="max-w-2xl"
          icon={UserRound}
        >
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setPreviewTab("rep")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                previewTab === "rep"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-blue-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserRound className="w-3.5 h-3.5" /> Ficha General
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("nino")}
              disabled={!previewRep.ninos?.length && !previewRep.tm_ninos}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                previewTab === "nino"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-blue-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              Expediente Clínico
              {(previewRep.ninos?.length || (previewRep.tm_ninos ? 1 : 0)) > 1
                ? "s"
                : ""}
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                {previewRep.ninos?.length || (previewRep.tm_ninos ? 1 : 0)}
              </span>
            </button>
          </div>

          {/* ══ TAB: FICHA GENERAL (PC EXECUTIVE LAYOUT) ══ */}
          {previewTab === "rep" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Encabezado Unificado del Perfil */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                {previewRep.rep_foto ? (
                  <img
                    src={previewRep.rep_foto}
                    alt={`${previewRep.rep_nomb} ${previewRep.rep_apel}`}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-800 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/80 dark:to-blue-950/80 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-xl shrink-0 shadow-2xs">
                    {previewRep.rep_nomb?.charAt(0) || "?"}
                    {previewRep.rep_apel?.charAt(0) || ""}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {previewRep.rep_nomb} {previewRep.rep_apel}
                    </h3>
                    <StatusBadge active={previewRep.usu_estd} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md text-[11px] border border-blue-200/60 dark:border-blue-900/60">
                      {previewRep.rep_rela || "Representante Legal"}
                    </span>
                    {previewRep.rep_cedu && (
                      <span className="font-mono text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                        C.I. {previewRep.rep_cedu}
                      </span>
                    )}
                    <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                      ID: {previewRep.rep_codi || previewRep.usu_codi}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ficha Estructurada de Datos en Grid 2x2 Elegante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-900/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Correo Electrónico (SIAT)
                    </span>
                    <span
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block select-all"
                      title={previewRep.usu_crro}
                    >
                      {previewRep.usu_crro || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Teléfono de Contacto
                    </span>
                    {previewRep.rep_telf ? (
                      <a
                        href={`tel:${previewRep.rep_telf}`}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block"
                      >
                        {previewRep.rep_telf}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 block">—</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Cédula de Identidad
                    </span>
                    <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 block">
                      {previewRep.rep_cedu
                        ? `V-${previewRep.rep_cedu}`
                        : "No registrada"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-lg text-purple-600 dark:text-purple-400 shrink-0 border border-purple-100 dark:border-purple-900/40">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Parentesco Registrado
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {previewRep.rep_rela || "Representante Legal"}
                    </span>
                  </div>
                </div>

                {previewRep.rep_fnac && (
                  <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-white dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100 dark:border-amber-900/40">
                      <Cake className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Fecha de Nacimiento
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        {(() => {
                          const parsed = parseLocalYMD(previewRep.rep_fnac);
                          if (!parsed) return "—";
                          return `${parsed.date.toLocaleDateString("es-VE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })} · ${calcEdad(previewRep.rep_fnac)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pacientes Vinculados */}
              <div className="space-y-2 pt-1">
                {(() => {
                  const ninosLista =
                    previewRep.ninos && previewRep.ninos.length > 0
                      ? previewRep.ninos
                      : [previewRep.tm_ninos].filter(Boolean);

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Baby className="w-4 h-4 text-blue-500" />
                          Paciente(s) a Cargo ({ninosLista.length})
                        </h4>
                        {ninosLista.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPreviewTab("nino")}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Ver expediente clínico →
                          </button>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs">
                        {ninosLista.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                            Sin pacientes vinculados registrados.
                          </div>
                        ) : (
                          ninosLista.map((ninoItem, idx) => (
                            <div
                              key={ninoItem.nin_codi || idx}
                              className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {ninoItem.nin_foto ? (
                                  <img
                                    src={ninoItem.nin_foto}
                                    alt={ninoItem.nin_nomb}
                                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shrink-0">
                                    {ninoItem.nin_nomb?.charAt(0) || "?"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                      {ninoItem.nin_nomb} {ninoItem.nin_apel}
                                    </span>
                                    {ninoItem.nin_nivd && (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                          ninoItem.nin_nivd.includes("3")
                                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
                                            : ninoItem.nin_nivd.includes("2")
                                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300"
                                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300"
                                        }`}
                                      >
                                        {ninoItem.nin_nivd}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span>
                                      {ninoItem.nin_gner === "M"
                                        ? "Masculino"
                                        : "Femenino"}
                                    </span>
                                    <span>·</span>
                                    <span>{calcEdad(ninoItem.nin_fnac)}</span>
                                    {ninoItem.nin_diag && (
                                      <>
                                        <span>·</span>
                                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                                          {ninoItem.nin_diag}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setPreviewTab("nino")}
                                className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-800/60 transition-colors shrink-0"
                              >
                                Expediente →
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Botones de acción directa en el pie del modal */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const r = previewRep;
                    setPreviewRep(null);
                    openEditRep(r);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" /> Editar
                  Representante
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmResetState({
                      isOpen: true,
                      usuCodi: previewRep.usu_codi,
                      email: previewRep.usu_crro,
                    })
                  }
                  disabled={resettingId === previewRep.usu_codi}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Restablecer Clave
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmEstadoState({
                      isOpen: true,
                      usuCodi: previewRep.usu_codi,
                      currentState: previewRep.usu_estd,
                      email: previewRep.usu_crro,
                    });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    previewRep.usu_estd
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                  }`}
                >
                  {previewRep.usu_estd ? (
                    <>
                      <Ban className="w-3.5 h-3.5" /> Desactivar Cuenta
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Activar Cuenta
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB: EXPEDIENTE CLÍNICO COMPLETO ══ */}
          {previewTab === "nino" && (
            <NinoExpedientePanel
              ninos={
                previewRep.ninos && previewRep.ninos.length > 0
                  ? previewRep.ninos
                  : [previewRep.tm_ninos].filter(Boolean)
              }
              onUpdateFoto={handleUpdateNinoFoto}
              onEditNino={openEditNino}
              onAddDocument={handleAddNinoDocumento}
              uploadingPdf={uploadingPdfNin}
            />
          )}
        </AdminModal>
      )}

      {/* Modal Editar Paciente (Niño) */}
      {editingNino && (
        <AdminModal
          open={!!editingNino}
          onClose={() => {
            setEditingNino(null);
            setNinoErrores({});
          }}
          title="Editar Datos del Paciente"
          subtitle={`${editingNino.nin_nomb || ""} ${editingNino.nin_apel || ""}`.trim()}
          maxWidth="max-w-xl"
          icon={Pencil}
          hasUnsavedChanges={Boolean(
            editingNino &&
            initialEditNinoRef.current &&
            JSON.stringify(editingNino) !== initialEditNinoRef.current,
          )}
        >
          <form
            ref={ninoFormRef}
            noValidate
            onSubmit={handleUpdateNino}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Nombre(s) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  data-field="nin_nomb"
                  name="nin_nomb"
                  maxLength={50}
                  type="text"
                  value={editingNino.nin_nomb || ""}
                  onChange={(e) => {
                    const nextVal = sanitizeNombrePersona(e.target.value, 50);
                    setEditingNino({ ...editingNino, nin_nomb: nextVal });
                    if (ninoErrores.nin_nomb) {
                      setNinoErrores((prev) => ({
                        ...prev,
                        nin_nomb: validarNinoCampo("nin_nomb", nextVal),
                      }));
                    }
                  }}
                  onBlur={() =>
                    setNinoErrores((prev) => ({
                      ...prev,
                      nin_nomb: validarNinoCampo(
                        "nin_nomb",
                        editingNino.nin_nomb,
                      ),
                    }))
                  }
                  aria-invalid={Boolean(ninoErrores.nin_nomb)}
                  className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors text-base sm:text-sm ${ninoErrores.nin_nomb ? "form-input-invalid" : ""}`}
                  placeholder="Ej. José Andrés"
                />
                {ninoErrores.nin_nomb && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {ninoErrores.nin_nomb}
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">
                  Apellido(s) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  data-field="nin_apel"
                  name="nin_apel"
                  maxLength={50}
                  type="text"
                  value={editingNino.nin_apel || ""}
                  onChange={(e) => {
                    const nextVal = sanitizeNombrePersona(e.target.value, 50);
                    setEditingNino({ ...editingNino, nin_apel: nextVal });
                    if (ninoErrores.nin_apel) {
                      setNinoErrores((prev) => ({
                        ...prev,
                        nin_apel: validarNinoCampo("nin_apel", nextVal),
                      }));
                    }
                  }}
                  onBlur={() =>
                    setNinoErrores((prev) => ({
                      ...prev,
                      nin_apel: validarNinoCampo(
                        "nin_apel",
                        editingNino.nin_apel,
                      ),
                    }))
                  }
                  aria-invalid={Boolean(ninoErrores.nin_apel)}
                  className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors text-base sm:text-sm ${ninoErrores.nin_apel ? "form-input-invalid" : ""}`}
                  placeholder="Ej. Rodríguez Pérez"
                />
                {ninoErrores.nin_apel && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {ninoErrores.nin_apel}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Fecha de Nacimiento <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  data-field="nin_fnac"
                  name="nin_fnac"
                  type="date"
                  min={childDateBounds.min}
                  max={childDateBounds.max}
                  value={editingNino.nin_fnac || ""}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setEditingNino({ ...editingNino, nin_fnac: nextVal });
                    setNinoErrores((prev) => ({
                      ...prev,
                      nin_fnac: validarNinoCampo("nin_fnac", nextVal),
                    }));
                  }}
                  onBlur={() =>
                    setNinoErrores((prev) => ({
                      ...prev,
                      nin_fnac: validarNinoCampo(
                        "nin_fnac",
                        editingNino.nin_fnac,
                      ),
                    }))
                  }
                  aria-invalid={Boolean(ninoErrores.nin_fnac)}
                  className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors text-base sm:text-sm ${ninoErrores.nin_fnac ? "form-input-invalid" : ""}`}
                />
                {ninoErrores.nin_fnac && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {ninoErrores.nin_fnac}
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">Sexo Biológico</label>
                <select
                  data-field="nin_gner"
                  name="nin_gner"
                  value={editingNino.nin_gner || "M"}
                  onChange={(e) =>
                    setEditingNino({ ...editingNino, nin_gner: e.target.value })
                  }
                  className="form-select text-base sm:text-sm"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">
                Nivel de Soporte Requerido (DSM-5)
              </label>
              <select
                data-field="nin_nivd"
                name="nin_nivd"
                value={editingNino.nin_nivd || "Nivel 1"}
                onChange={(e) =>
                  setEditingNino({ ...editingNino, nin_nivd: e.target.value })
                }
                className="form-select text-base sm:text-sm"
              >
                <option value="Nivel 1">Nivel 1 — Necesita Apoyo</option>
                <option value="Nivel 2">
                  Nivel 2 — Necesita Apoyo Sustancial
                </option>
                <option value="Nivel 3">
                  Nivel 3 — Necesita Apoyo Muy Sustancial
                </option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label form-label-inline">
                  Diagnóstico Clínico
                </label>
                <span
                  className={`text-[11px] font-medium ${(editingNino.nin_diag || "").length >= 230 ? "text-rose-500" : "text-slate-400"}`}
                >
                  {(editingNino.nin_diag || "").length}/255
                </span>
              </div>
              <textarea
                rows={3}
                data-field="nin_diag"
                name="nin_diag"
                maxLength={255}
                value={editingNino.nin_diag || ""}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setEditingNino({ ...editingNino, nin_diag: nextVal });
                  if (ninoErrores.nin_diag) {
                    setNinoErrores((prev) => ({
                      ...prev,
                      nin_diag: validarNinoCampo("nin_diag", nextVal),
                    }));
                  }
                }}
                aria-invalid={Boolean(ninoErrores.nin_diag)}
                className={`form-input text-base sm:text-sm ${ninoErrores.nin_diag ? "form-input-invalid" : ""}`}
                placeholder="Describa el diagnóstico médico u observaciones iniciales..."
              />
              {ninoErrores.nin_diag && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" /> {ninoErrores.nin_diag}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="form-label">Perfil Sensorial</label>
                <select
                  data-field="sen_tipo"
                  name="sen_tipo"
                  value={editingNino.sen_tipo || ""}
                  onChange={(e) => {
                    const nextTipo = e.target.value;
                    const updated = {
                      ...editingNino,
                      sen_tipo: nextTipo,
                      sen_nvli: nextTipo ? editingNino.sen_nvli || "Leve" : "",
                    };
                    setEditingNino(updated);
                    if (!nextTipo) {
                      setNinoErrores((prev) => ({ ...prev, sen_nvli: "" }));
                    }
                  }}
                  className="form-select text-base sm:text-sm"
                >
                  <option value="">Sin especificar</option>
                  <optgroup label="Perfiles Generales">
                    <option value="Hiperesensible">Hiperesensible</option>
                    <option value="Hiposensible">Hiposensible</option>
                    <option value="Mixto">Mixto</option>
                  </optgroup>
                  <optgroup label="Sensorialidades Específicas">
                    <option value="Auditiva">
                      Hipersensibilidad Auditiva (Hiperacusia)
                    </option>
                    <option value="Táctil">
                      Hipersensibilidad Táctil (Táctil Defensiva)
                    </option>
                    <option value="Visual">
                      Hipersensibilidad Visual (Fotofobia)
                    </option>
                    <option value="Olfativa">Hipersensibilidad Olfativa</option>
                    <option value="Vestibular">
                      Procesamiento Vestibular Atípico
                    </option>
                    <option value="Propioceptiva">
                      Procesamiento Propioceptivo Atípico
                    </option>
                  </optgroup>
                  <optgroup label="Comorbilidades">
                    <option value="TDAH">TDAH</option>
                    <option value="Ansiedad">Ansiedad Generalizada</option>
                    <option value="Epilepsia">
                      Epilepsia / Trastorno Convulsivo
                    </option>
                    <option value="TOC">TOC</option>
                    <option value="DI">Discapacidad Intelectual</option>
                    <option value="Otro">Otra condición</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="form-label">
                  Severidad Sensorial{" "}
                  {editingNino.sen_tipo && (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <select
                  data-field="sen_nvli"
                  name="sen_nvli"
                  disabled={!editingNino.sen_tipo}
                  value={editingNino.sen_nvli || "Leve"}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setEditingNino({ ...editingNino, sen_nvli: nextVal });
                    if (ninoErrores.sen_nvli) {
                      setNinoErrores((prev) => ({
                        ...prev,
                        sen_nvli: validarNinoCampo(
                          "sen_nvli",
                          nextVal,
                          editingNino,
                        ),
                      }));
                    }
                  }}
                  aria-invalid={Boolean(ninoErrores.sen_nvli)}
                  className={`form-select text-base sm:text-sm ${ninoErrores.sen_nvli ? "form-input-invalid" : ""}`}
                >
                  <option value="Leve">Leve</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Severo">Severo</option>
                </select>
                {ninoErrores.sen_nvli && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {ninoErrores.sen_nvli}
                  </p>
                )}
              </div>
            </div>

            {editingNino.sen_tipo && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label form-label-inline">
                    Notas de Condición Sensorial
                  </label>
                  <span
                    className={`text-[11px] font-medium ${(editingNino.sen_nota || "").length >= 230 ? "text-rose-500" : "text-slate-400"}`}
                  >
                    {(editingNino.sen_nota || "").length}/255
                  </span>
                </div>
                <textarea
                  rows={2}
                  data-field="sen_nota"
                  name="sen_nota"
                  maxLength={255}
                  value={editingNino.sen_nota || ""}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setEditingNino({ ...editingNino, sen_nota: nextVal });
                    if (ninoErrores.sen_nota) {
                      setNinoErrores((prev) => ({
                        ...prev,
                        sen_nota: validarNinoCampo("sen_nota", nextVal),
                      }));
                    }
                  }}
                  aria-invalid={Boolean(ninoErrores.sen_nota)}
                  className={`form-input text-base sm:text-sm ${ninoErrores.sen_nota ? "form-input-invalid" : ""}`}
                  placeholder="Detonantes o recomendaciones sensoriales específicas..."
                />
                {ninoErrores.sen_nota && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {ninoErrores.sen_nota}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setEditingNino(null);
                  setNinoErrores({});
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingNino}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {savingNino ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      <ConfirmDialog
        isOpen={confirmEstadoState.isOpen}
        onClose={() =>
          setConfirmEstadoState({
            isOpen: false,
            usuCodi: null,
            currentState: false,
            email: "",
          })
        }
        onConfirm={() => {
          const { usuCodi, currentState } = confirmEstadoState;
          setConfirmEstadoState({
            isOpen: false,
            usuCodi: null,
            currentState: false,
            email: "",
          });
          if (usuCodi) {
            handleToggleEstado(usuCodi, currentState);
            setPreviewRep((prev) =>
              prev && prev.usu_codi === usuCodi
                ? { ...prev, usu_estd: !currentState }
                : prev,
            );
          }
        }}
        title={
          confirmEstadoState.currentState
            ? "Desactivar Representante"
            : "Activar Representante"
        }
        message={
          confirmEstadoState.email
            ? `¿Estás seguro de que deseas <b>${confirmEstadoState.currentState ? "desactivar" : "activar"}</b> al representante <b>${confirmEstadoState.email}</b>?`
            : ""
        }
        type={confirmEstadoState.currentState ? "danger" : "success"}
        confirmLabel={
          confirmEstadoState.currentState ? "Desactivar" : "Activar"
        }
      />

      <ConfirmDialog
        isOpen={confirmResetState.isOpen}
        onClose={() =>
          setConfirmResetState({ isOpen: false, usuCodi: null, email: "" })
        }
        onConfirm={() => {
          const { usuCodi, email } = confirmResetState;
          setConfirmResetState({ isOpen: false, usuCodi: null, email: "" });
          if (usuCodi) handleResetPass(usuCodi, email);
        }}
        title="Restablecer Contraseña"
        message={
          confirmResetState.email
            ? `¿Estás seguro de que deseas restablecer la contraseña de <b>${confirmResetState.email}</b>? Se generará una nueva clave aleatoria de acceso seguro.`
            : ""
        }
        type="warning"
        confirmLabel="Restablecer"
      />
    </div>
  );
}
