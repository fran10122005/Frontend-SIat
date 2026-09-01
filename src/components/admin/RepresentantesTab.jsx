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
  FileText,
  Download,
  Camera,
} from "lucide-react";
import { useGlobalContext } from "../../context/GlobalState";
import StatusBadge from "../shared/StatusBadge";
import FilterBar from "../shared/FilterBar";
import Pagination from "../shared/Pagination";
import AdminModal from "../shared/AdminModal";
import FotoUpload from "../shared/FotoUpload";
import DocumentosClinicos from "../shared/DocumentosClinicos";
import api from "../../api/axios";
import useExpandableRows from "../../hooks/useExpandableRows";
import { toastError } from "../../utils/errorHandler";

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
              {nino.nin_fnac
                ? new Date(nino.nin_fnac).toLocaleDateString("es-VE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Sin fecha"}
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
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                label: "Diagnóstico Clínico",
                value:
                  ficha?.nin_diag ||
                  nino?.nin_diag ||
                  "Sin diagnóstico registrado",
                full: true,
              },
              ...(ficha?.sensibilidad?.sen_nota || nino?.sensibilidad?.sen_nota
                ? [
                    {
                      label: "Notas Clínicas de la Condición",
                      value:
                        ficha?.sensibilidad?.sen_nota ||
                        nino?.sensibilidad?.sen_nota,
                      full: true,
                    },
                  ]
                : []),
              {
                label: "Perfil Sensorial",
                value: ficha?.sensibilidad
                  ? `${ficha.sensibilidad.sen_tipo} · ${ficha.sensibilidad.sen_nvli}`
                  : nino?.sensibilidad
                    ? `${nino.sensibilidad.sen_tipo} · ${nino.sensibilidad.sen_nvli}`
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
                  "No registrada",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 ${item.full ? "sm:col-span-2" : ""}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                  {item.label}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.value}
                </p>
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
  if (!fechaNac) return "Edad no disponible";
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let años = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) años--;
  return `${años} año${años !== 1 ? "s" : ""}`;
};

const VALIDACIONES_TELF = (value) => {
  if (!value) return "";
  return /^(\+58|0058|0)?4\d{2}[- ]?\d{3}[- ]?\d{4}$/.test(String(value).trim())
    ? ""
    : "Formato venezolano: +584121234567";
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
  const [page, setPage] = useState(0);
  const [resettingId, setResettingId] = useState(null);
  const [previewRep, setPreviewRep] = useState(null);
  const [previewTab, setPreviewTab] = useState("rep");
  const [editErrores, setEditErrores] = useState({});
  const [updatingFotoNin, setUpdatingFotoNin] = useState(null);

  const validarEditCampo = (campo) => {
    if (campo === "rep_telf") return VALIDACIONES_TELF(editingRep?.rep_telf);
    if (campo === "rep_cedu") {
      const cedu = String(editingRep?.rep_cedu || "").trim();
      if (!cedu) return "";
      return /^\d{6,8}$/.test(cedu)
        ? ""
        : "La cédula debe tener entre 6 y 8 dígitos";
    }
    if (campo === "usu_crro") {
      const correo = String(editingRep?.usu_crro || "").trim();
      if (!correo) return "El correo es requerido";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
        ? ""
        : "Correo electrónico inválido";
    }
    return "";
  };

  const validarEditTodo = () => {
    const nuevos = {};
    ["rep_telf", "rep_cedu", "usu_crro"].forEach((campo) => {
      const err = validarEditCampo(campo);
      if (err) nuevos[campo] = err;
    });
    setEditErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const filtered = useMemo(() => {
    return representantes.filter((r) => {
      const nombre =
        `${r.rep_nomb || ""} ${r.rep_apel || ""} ${r.usu_crro || ""}`.toLowerCase();
      const q = search.toLowerCase();
      if (search && !nombre.includes(q)) return false;
      if (filterEstado === "ACTIVO" && !r.usu_estd) return false;
      if (filterEstado === "INACTIVO" && r.usu_estd) return false;
      return true;
    });
  }, [representantes, search, filterEstado]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setSearch("");
    setFilterEstado("TODOS");
    setPage(0);
  };

  const filterChips = [
    filterEstado !== "TODOS" && {
      key: "estado",
      label: filterEstado === "ACTIVO" ? "Activos" : "Inactivos",
      onRemove: () => {
        setFilterEstado("TODOS");
        setPage(0);
      },
    },
  ].filter(Boolean);

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

  const handleUpdateNino = async (e) => {
    e.preventDefault();
    if (!editingNino) return;
    setSavingNino(true);
    try {
      const payload = {
        nin_nomb: editingNino.nin_nomb,
        nin_apel: editingNino.nin_apel,
        nin_fnac: editingNino.nin_fnac,
        nin_gner: editingNino.nin_gner,
        nin_nivd: editingNino.nin_nivd,
        nin_diag: editingNino.nin_diag,
        ...(editingNino.sen_tipo && {
          sen_tipo: editingNino.sen_tipo,
          sen_nvli: editingNino.sen_nvli || "Leve",
          sen_nota: editingNino.sen_nota || "",
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
      setEditingNino(null);
      onRefresh();
    } catch (err) {
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <FilterBar
        dataTour="admin-rep-search"
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Buscar por nombre o correo..."
        activeCount={(search ? 1 : 0) + (filterEstado !== "TODOS" ? 1 : 0)}
        onClearAll={clearFilters}
        chips={filterChips}
      >
        <select
          value={filterEstado}
          onChange={(e) => {
            setFilterEstado(e.target.value);
            setPage(0);
          }}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
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
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={exportExcel}
              aria-label="Exportar a Excel"
              title="Exportar a Excel"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
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
                              setEditingRep({
                                usu_codi: r.usu_codi,
                                rep_nomb: r.rep_nomb || "",
                                rep_apel: r.rep_apel || "",
                                rep_telf: r.rep_telf || "",
                                rep_rela: r.rep_rela || "",
                                rep_cedu: r.rep_cedu || "",
                                rep_foto: r.rep_foto || "",
                                usu_crro: r.usu_crro || "",
                              });
                            }}
                            title="Editar"
                            className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetPass(r.usu_codi, r.usu_crro);
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
                              handleToggleEstado(r.usu_codi, r.usu_estd);
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
        onClose={() => setEditingRep(null)}
        title="Editar Representante"
        subtitle={`${editingRep?.rep_nomb || ""} ${editingRep?.rep_apel || ""}`.trim()}
        maxWidth="max-w-xl"
        icon={Pencil}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validarEditTodo()) return;
            const ok = await handleUpdateRepresentante(e);
            if (ok) setEditingRep(null);
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
                Nombres
              </label>
              <input
                required
                maxLength={50}
                type="text"
                value={editingRep?.rep_nomb || ""}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, rep_nomb: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors"
                placeholder="Ej. María"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Apellidos
              </label>
              <input
                required
                maxLength={50}
                type="text"
                value={editingRep?.rep_apel || ""}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, rep_apel: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors"
                placeholder="Ej. Rodríguez"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cédula de Identidad
              </label>
              <input
                required
                inputMode="numeric"
                maxLength={8}
                type="text"
                value={editingRep?.rep_cedu || ""}
                onChange={(e) => {
                  setEditingRep({
                    ...editingRep,
                    rep_cedu: e.target.value.replace(/\D/g, ""),
                  });
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_cedu: validarEditCampo("rep_cedu"),
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors whitespace-nowrap"
                placeholder="Ej. 12345678"
              />
              {editErrores.rep_cedu && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 inline-block" />{" "}
                  {editErrores.rep_cedu}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Vínculo Legal
              </label>
              <select
                value={editingRep?.rep_rela || ""}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, rep_rela: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm focus:outline-none focus:border-brand-600"
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
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Correo Electrónico (acceso)
              </label>
              <input
                required
                maxLength={50}
                type="email"
                value={editingRep?.usu_crro || ""}
                onChange={(e) => {
                  setEditingRep({ ...editingRep, usu_crro: e.target.value });
                  setEditErrores((prev) => ({
                    ...prev,
                    usu_crro: validarEditCampo("usu_crro"),
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors"
                placeholder="correo@ejemplo.com"
              />
              {editErrores.usu_crro && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 inline-block" />{" "}
                  {editErrores.usu_crro}
                </p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                Se usa para iniciar sesión en SIAT.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Teléfono de Contacto
              </label>
              <input
                maxLength={15}
                type="text"
                value={editingRep?.rep_telf || ""}
                onChange={(e) => {
                  setEditingRep({ ...editingRep, rep_telf: e.target.value });
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_telf: validarEditCampo("rep_telf"),
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors"
                placeholder="+58 412 0000000"
              />
              {editErrores.rep_telf && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 inline-block" />{" "}
                  {editErrores.rep_telf}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setEditingRep(null)}
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
          maxWidth="max-w-xl"
          icon={UserRound}
        >
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setPreviewTab("rep")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                previewTab === "rep"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
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
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              Expediente Clínico
              {(previewRep.ninos?.length || (previewRep.tm_ninos ? 1 : 0)) > 1
                ? "s"
                : ""}
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                {previewRep.ninos?.length || (previewRep.tm_ninos ? 1 : 0)}
              </span>
            </button>
          </div>

          {/* ══ TAB: FICHA GENERAL (UNIFICADA) ══ */}
          {previewTab === "rep" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Tarjeta de Identificación Principal */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900/50 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {previewRep.rep_foto ? (
                    <img
                      src={previewRep.rep_foto}
                      alt={`${previewRep.rep_nomb} ${previewRep.rep_apel}`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md shrink-0">
                      {previewRep.rep_nomb?.charAt(0) || "?"}
                      {previewRep.rep_apel?.charAt(0) || ""}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                        {previewRep.rep_nomb} {previewRep.rep_apel}
                      </h3>
                      <StatusBadge active={previewRep.usu_estd} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-blue-400 bg-brand-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-md border border-brand-200/60 dark:border-blue-800/50">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {previewRep.rep_rela || "Representante Legal"}
                      </span>
                      {previewRep.rep_cedu && (
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          C.I. {previewRep.rep_cedu}
                        </span>
                      )}
                      <span>·</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        ID: {previewRep.rep_codi || previewRep.usu_codi}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grilla de Datos de Contacto y Cuenta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                      Correo Electrónico (Acceso SIAT)
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
                      {previewRep.usu_crro || "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                      Teléfono de Contacto
                    </p>
                    {previewRep.rep_telf ? (
                      <a
                        href={`tel:${previewRep.rep_telf}`}
                        className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {previewRep.rep_telf}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-400">
                        No registrado
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección Integrada: Pacientes Vinculados */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Baby className="w-4 h-4 text-brand-500" />
                    Paciente(s) Bajo Su Representación
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("nino")}
                    className="text-xs font-semibold text-brand-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Ver expediente clínico completo →
                  </button>
                </div>

                {(() => {
                  const ninosLista =
                    previewRep.ninos && previewRep.ninos.length > 0
                      ? previewRep.ninos
                      : [previewRep.tm_ninos].filter(Boolean);

                  if (ninosLista.length === 0) {
                    return (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                        Sin pacientes vinculados registrados.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {ninosLista.map((ninoItem, idx) => (
                        <div
                          key={ninoItem.nin_codi || idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                        >
                          <div className="flex items-center gap-3.5">
                            {ninoItem.nin_foto ? (
                              <img
                                src={ninoItem.nin_foto}
                                alt={ninoItem.nin_nomb}
                                className="w-12 h-12 rounded-full object-cover border-2 border-brand-200 dark:border-brand-800 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-blue-300 font-bold text-base shrink-0">
                                {ninoItem.nin_nomb?.charAt(0) || "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
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
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                                <span>
                                  {ninoItem.nin_gner === "M"
                                    ? "Masculino"
                                    : "Femenino"}
                                </span>
                                <span>·</span>
                                <span>{calcEdad(ninoItem.nin_fnac)}</span>
                                {ninoItem.nin_fnac && (
                                  <>
                                    <span>·</span>
                                    <span>
                                      Nacido:{" "}
                                      {new Date(
                                        ninoItem.nin_fnac,
                                      ).toLocaleDateString("es-VE", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {ninoItem.nin_diag && (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] block mb-0.5">
                                Diagnóstico Clínico
                              </span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {ninoItem.nin_diag}
                              </p>
                            </div>
                          )}

                          {ninoItem.nin_docs &&
                            ninoItem.nin_docs.length > 0 && (
                              <div className="mt-2">
                                <DocumentosClinicos docs={ninoItem.nin_docs} />
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Botones de acción directa en el pie del modal */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    const r = previewRep;
                    setPreviewRep(null);
                    setEditingRep({
                      usu_codi: r.usu_codi,
                      rep_nomb: r.rep_nomb || "",
                      rep_apel: r.rep_apel || "",
                      rep_telf: r.rep_telf || "",
                      rep_rela: r.rep_rela || "",
                      rep_cedu: r.rep_cedu || "",
                      rep_foto: r.rep_foto || "",
                      usu_crro: r.usu_crro || "",
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar Representante
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleResetPass(previewRep.usu_codi, previewRep.usu_crro)
                  }
                  disabled={resettingId === previewRep.usu_codi}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Restablecer Clave
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleEstado(
                      previewRep.usu_codi,
                      previewRep.usu_estd,
                    );
                    setPreviewRep((prev) =>
                      prev ? { ...prev, usu_estd: !prev.usu_estd } : prev,
                    );
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    previewRep.usu_estd
                      ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
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
              onEditNino={(ninoItem) => {
                setEditingNino({
                  nin_codi: ninoItem.nin_codi,
                  nin_nomb: ninoItem.nin_nomb || "",
                  nin_apel: ninoItem.nin_apel || "",
                  nin_fnac: ninoItem.nin_fnac
                    ? ninoItem.nin_fnac.split("T")[0]
                    : "",
                  nin_gner: ninoItem.nin_gner || "M",
                  nin_nivd: ninoItem.nin_nivd || "Nivel 1",
                  nin_diag: ninoItem.nin_diag || "",
                  sen_tipo: ninoItem.sensibilidad?.sen_tipo || "",
                  sen_nvli: ninoItem.sensibilidad?.sen_nvli || "Leve",
                  sen_nota: ninoItem.sensibilidad?.sen_nota || "",
                });
              }}
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
          onClose={() => setEditingNino(null)}
          title="Editar Datos del Paciente"
          subtitle={`${editingNino.nin_nomb || ""} ${editingNino.nin_apel || ""}`.trim()}
          maxWidth="max-w-xl"
          icon={Pencil}
        >
          <form onSubmit={handleUpdateNino} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nombre(s)</label>
                <input
                  required
                  type="text"
                  value={editingNino.nin_nomb || ""}
                  onChange={(e) =>
                    setEditingNino({ ...editingNino, nin_nomb: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors text-base sm:text-sm"
                  placeholder="Ej. José Andrés"
                />
              </div>
              <div>
                <label className="form-label">Apellido(s)</label>
                <input
                  required
                  type="text"
                  value={editingNino.nin_apel || ""}
                  onChange={(e) =>
                    setEditingNino({ ...editingNino, nin_apel: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors text-base sm:text-sm"
                  placeholder="Ej. Rodríguez Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Fecha de Nacimiento</label>
                <input
                  required
                  type="date"
                  value={editingNino.nin_fnac || ""}
                  onChange={(e) =>
                    setEditingNino({ ...editingNino, nin_fnac: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="form-label">Sexo Biológico</label>
                <select
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
              <label className="form-label">Diagnóstico Clínico</label>
              <textarea
                rows={3}
                value={editingNino.nin_diag || ""}
                onChange={(e) =>
                  setEditingNino({ ...editingNino, nin_diag: e.target.value })
                }
                className="form-input text-base sm:text-sm"
                placeholder="Describa el diagnóstico médico u observaciones iniciales..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="form-label">Perfil Sensorial</label>
                <select
                  value={editingNino.sen_tipo || ""}
                  onChange={(e) =>
                    setEditingNino({ ...editingNino, sen_tipo: e.target.value })
                  }
                  className="form-select text-base sm:text-sm"
                >
                  <option value="">Sin especificar</option>
                  <option value="Hiperesensible">Hiperesensible</option>
                  <option value="Hiposensible">Hiposensible</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>
              <div>
                <label className="form-label">Severidad Sensorial</label>
                <select
                  value={editingNino.sen_nvli || "Leve"}
                  onChange={(e) =>
                    setEditingNino({ ...editingNino, sen_nvli: e.target.value })
                  }
                  className="form-select text-base sm:text-sm"
                >
                  <option value="Leve">Leve</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Severo">Severo</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditingNino(null)}
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
    </div>
  );
}
