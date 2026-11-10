import { useState, useMemo, useEffect, useRef } from "react";
import {
  KeyRound,
  ChevronDown,
  Pencil,
  Ban,
  CheckCircle2,
  Archive,
  RotateCcw,
  Plus,
  ShieldCheck,
  Stethoscope,
  Hash,
  User,
  Mail,
  BadgeCheck,
  Camera,
  AlertCircle,
  Phone,
  IdCard,
  Cake,
  Users,
  X,
  CalendarDays,
  Award,
  UserRound,
} from "lucide-react";
import pdfIcon from "../../assets/pdf.png";
import excelIcon from "../../assets/excel.png";
import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../../config/cloudinary";
import StatusBadge from "../shared/StatusBadge";
import Pagination from "../shared/Pagination";
import AdminModal from "../shared/AdminModal";
import FilterBar from "../shared/FilterBar";
import useExpandableRows from "../../hooks/useExpandableRows";
import {
  ESC_CODI_REGEX,
  getAdultOrYouthDateBounds,
  formatYmdForInput,
  sanitizeDocumento,
  sanitizeTelefonoVE,
  sanitizeNombrePersona,
  sanitizeLicencia,
  sanitizeEscCodi,
  validateDocumento,
  validateNombrePersona,
  validateEmail,
  validateTelefonoMovilVE,
  validateFechaRangoEdad,
  validateLicencia,
  validateRequiredText,
  focusFirstError,
} from "../../utils/validators";

function FotoPerfilZona({
  preview,
  onFileSelect,
  uploading,
  progress,
  onRemove,
}) {
  const inputRef = useRef(null);
  return (
    <div className="flex items-center gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        title="Cambiar foto"
        className={`relative w-12 h-12 rounded-full overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 transition-opacity ${uploading ? "opacity-60 cursor-wait" : ""}`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Foto del especialista"
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="w-5 h-5 text-slate-400" />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Camera className="w-4 h-4 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-white text-[10px] font-bold">
              {progress}%
            </span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onFileSelect(e.target.files[0])}
        className="hidden"
      />
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Foto de perfil
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold disabled:opacity-50"
          >
            {preview ? "Cambiar" : "Subir foto"}
          </button>
          {preview && !uploading && (
            <>
              <span className="text-slate-300 dark:text-slate-600 text-[11px]">
                ·
              </span>
              <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-0.5 text-[11px] text-rose-500 hover:text-rose-600 font-medium"
              >
                <X className="w-3 h-3" /> Quitar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EspecialistasTab({
  especialistas,
  catalogos,
  newEsp,
  setNewEsp,
  editingEsp,
  setEditingEsp,
  loading,
  handleCreateEspecialista,
  handleUpdateEsp,
  handleToggleActivo,
  handleResetPassword,
  exportEspecialistasToPDF,
  exportEspecialistasToExcel,
  newEspCat,
  setNewEspCat,
  editingEspCat,
  setEditingEspCat,
  handleCreateEspecialidad,
  handleUpdateEspecialidad,
  handleToggleEspecialidad,
}) {
  const { expandedId, toggle } = useExpandableRows();
  const [subView, setSubView] = useState("especialistas");
  const [showRegistro, setShowRegistro] = useState(false);
  const [showCatRegistro, setShowCatRegistro] = useState(false);
  const [showEditEsp, setShowEditEsp] = useState(false);
  const [showEditEspCat, setShowEditEspCat] = useState(false);
  const [fotoUploading, setFotoUploading] = useState(false);
  const [fotoProgress, setFotoProgress] = useState(0);
  const [fotoError, setFotoError] = useState("");
  const [errores, setErrores] = useState({});
  const [editErrores, setEditErrores] = useState({});
  const [catErrores, setCatErrores] = useState({});
  const [catEditErrores, setCatEditErrores] = useState({});
  const regFormRef = useRef(null);
  const editFormRef = useRef(null);
  const catRegFormRef = useRef(null);
  const catEditFormRef = useRef(null);
  const initialEditEspRef = useRef("");
  const initialEditEspCatRef = useRef("");
  const espDateBounds = useMemo(() => getAdultOrYouthDateBounds(12, 75), []);
  const [previewEsp, setPreviewEsp] = useState(null);
  const [searchEsp, setSearchEsp] = useState("");
  const [filterEspecialidad, setFilterEspecialidad] = useState("TODAS");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [filterGenero, setFilterGenero] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchEspCat, setSearchEspCat] = useState("");
  const [filterEspCatEstado, setFilterEspCatEstado] = useState("TODOS");

  const filteredEspecialistas = useMemo(() => {
    return especialistas.filter((esp) => {
      const docFull = esp.esp_cedu
        ? `${esp.esp_tdoc || "V"}-${esp.esp_cedu}`
        : "";
      const searchable =
        `${esp.esp_nomb} ${esp.esp_apel} ${docFull} ${esp.esp_cedu || ""} ${esp.esp_codi || ""} ${esp.esp_licencia || ""} ${esp.tm_usuar?.usu_crro || ""}`.toLowerCase();
      const q = searchEsp.toLowerCase();
      if (searchEsp && !searchable.includes(q)) return false;
      if (
        filterEspecialidad !== "TODAS" &&
        esp.tm_especi?.esc_codi !== filterEspecialidad
      )
        return false;
      if (filterEstado === "ACTIVO" && !esp.tm_usuar?.usu_estd) return false;
      if (filterEstado === "INACTIVO" && esp.tm_usuar?.usu_estd) return false;
      if (filterGenero !== "TODOS" && esp.esp_gner !== filterGenero)
        return false;
      if (
        dateFrom &&
        esp.tm_usuar?.usu_crea &&
        new Date(esp.tm_usuar.usu_crea) < new Date(dateFrom)
      )
        return false;
      if (dateTo && esp.tm_usuar?.usu_crea) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(esp.tm_usuar.usu_crea) > end) return false;
      }
      return true;
    });
  }, [
    especialistas,
    searchEsp,
    filterEspecialidad,
    filterEstado,
    filterGenero,
    dateFrom,
    dateTo,
  ]);

  const filteredEspecialidades = useMemo(() => {
    return catalogos.especialidades.filter((esc) => {
      const q = searchEspCat.toLowerCase();
      if (
        searchEspCat &&
        !esc.esc_nomb.toLowerCase().includes(q) &&
        !esc.esc_codi.toLowerCase().includes(q)
      )
        return false;
      if (filterEspCatEstado === "ACTIVA" && esc.esc_estd === false)
        return false;
      if (filterEspCatEstado === "INACTIVA" && esc.esc_estd !== false)
        return false;
      return true;
    });
  }, [catalogos.especialidades, searchEspCat, filterEspCatEstado]);

  const PAGE_SIZE = 8;
  const [pageEsp, setPageEsp] = useState(0);
  const [pageEspCat, setPageEspCat] = useState(0);
  const totalEspPages = Math.ceil(filteredEspecialistas.length / PAGE_SIZE);
  const pagedEspecialistas = filteredEspecialistas.slice(
    pageEsp * PAGE_SIZE,
    (pageEsp + 1) * PAGE_SIZE,
  );
  const totalEspCatPages = Math.ceil(filteredEspecialidades.length / PAGE_SIZE);
  const pagedEspecialidades = filteredEspecialidades.slice(
    pageEspCat * PAGE_SIZE,
    (pageEspCat + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPageEsp(0);
  }, [
    searchEsp,
    filterEspecialidad,
    filterEstado,
    filterGenero,
    dateFrom,
    dateTo,
  ]);
  useEffect(() => {
    setPageEspCat(0);
  }, [searchEspCat, filterEspCatEstado]);

  const clearEspFilters = () => {
    setSearchEsp("");
    setFilterEspecialidad("TODAS");
    setFilterEstado("TODOS");
    setFilterGenero("TODOS");
    setDateFrom("");
    setDateTo("");
  };

  const clearEspCatFilters = () => {
    setSearchEspCat("");
    setFilterEspCatEstado("TODOS");
  };

  const espFilterChips = [
    filterEspecialidad !== "TODAS" && {
      key: "especialidad",
      label: "Especialidad seleccionada",
      onRemove: () => setFilterEspecialidad("TODAS"),
    },
    filterEstado !== "TODOS" && {
      key: "estado",
      label: filterEstado === "ACTIVO" ? "Activos" : "Inactivos",
      onRemove: () => setFilterEstado("TODOS"),
    },
    filterGenero !== "TODOS" && {
      key: "genero",
      label: filterGenero === "M" ? "Masculino" : "Femenino",
      onRemove: () => setFilterGenero("TODOS"),
    },
    dateFrom && {
      key: "dateFrom",
      label: `Desde: ${dateFrom}`,
      onRemove: () => setDateFrom(""),
    },
    dateTo && {
      key: "dateTo",
      label: `Hasta: ${dateTo}`,
      onRemove: () => setDateTo(""),
    },
  ].filter(Boolean);

  const espCatFilterChips = [
    filterEspCatEstado !== "TODOS" && {
      key: "estado",
      label: filterEspCatEstado === "ACTIVA" ? "Activas" : "Inactivas",
      onRemove: () => setFilterEspCatEstado("TODOS"),
    },
  ].filter(Boolean);

  const validarCampo = (
    campo,
    nextValue = newEsp?.[campo],
    nextTdoc = newEsp?.esp_tdoc || "V",
  ) => {
    switch (campo) {
      case "esp_cedu":
        return validateDocumento(nextValue, nextTdoc, { required: true });
      case "esp_nomb":
        return validateNombrePersona(nextValue, "El nombre", {
          required: true,
        });
      case "esp_apel":
        return validateNombrePersona(nextValue, "El apellido", {
          required: true,
        });
      case "esp_fnac":
        return validateFechaRangoEdad(nextValue, {
          minAge: 12,
          maxAge: 75,
          required: true,
          label: "La fecha de nacimiento",
        });
      case "usu_crro":
        return validateEmail(nextValue, { required: true, max: 50 });
      case "esp_telf":
        return validateTelefonoMovilVE(nextValue, { required: false });
      case "esp_licencia":
        return validateLicencia(nextValue, { required: false });
      case "esc_codi":
        return !String(nextValue || "").trim()
          ? "Selecciona una especialidad clínica"
          : "";
      default:
        return "";
    }
  };

  const validarCampoEdit = (
    campo,
    nextValue = editingEsp?.[campo],
    nextTdoc = editingEsp?.esp_tdoc || "V",
  ) => {
    switch (campo) {
      case "esp_cedu":
        return validateDocumento(nextValue, nextTdoc, { required: true });
      case "esp_nomb":
        return validateNombrePersona(nextValue, "El nombre", {
          required: true,
        });
      case "esp_apel":
        return validateNombrePersona(nextValue, "El apellido", {
          required: true,
        });
      case "esp_fnac":
        return validateFechaRangoEdad(nextValue, {
          minAge: 12,
          maxAge: 75,
          required: false,
          label: "La fecha de nacimiento",
        });
      case "usu_crro":
        return validateEmail(nextValue, { required: true, max: 50 });
      case "esp_telf":
        return validateTelefonoMovilVE(nextValue, { required: false });
      case "esp_licencia":
        return validateLicencia(nextValue, { required: false });
      case "esc_codi":
        return !String(nextValue || "").trim()
          ? "Selecciona una especialidad clínica"
          : "";
      default:
        return "";
    }
  };

  const validarTodo = () => {
    const tdoc = newEsp?.esp_tdoc || "V";
    const campos = [
      "esp_cedu",
      "esp_nomb",
      "esp_apel",
      "esp_fnac",
      "usu_crro",
      "esp_telf",
      "esp_licencia",
      "esc_codi",
    ];
    const nuevos = {};
    for (const c of campos) {
      const msg = validarCampo(c, newEsp?.[c], tdoc);
      if (msg) nuevos[c] = msg;
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      requestAnimationFrame(() => focusFirstError(nuevos, regFormRef));
      return false;
    }
    return true;
  };

  const validarTodoEdit = () => {
    const tdoc = editingEsp?.esp_tdoc || "V";
    const campos = [
      "esp_cedu",
      "esp_nomb",
      "esp_apel",
      "esp_fnac",
      "usu_crro",
      "esp_telf",
      "esp_licencia",
      "esc_codi",
    ];
    const nuevos = {};
    for (const c of campos) {
      const msg = validarCampoEdit(c, editingEsp?.[c], tdoc);
      if (msg) nuevos[c] = msg;
    }
    setEditErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      requestAnimationFrame(() => focusFirstError(nuevos, editFormRef));
      return false;
    }
    return true;
  };

  const validarCatCreate = () => {
    const nuevos = {};
    const nomErr = validateRequiredText(
      newEspCat?.esc_nomb,
      "La denominación",
      {
        min: 2,
        max: 50,
      },
    );
    if (nomErr) nuevos.esc_nomb = nomErr;
    const codRaw = String(newEspCat?.esc_codi || "").trim();
    if (codRaw && !ESC_CODI_REGEX.test(codRaw)) {
      nuevos.esc_codi = "Usa 2 a 10 caracteres (letras, números, - o _)";
    }
    if (String(newEspCat?.esc_desc || "").trim().length > 500) {
      nuevos.esc_desc = "La descripción no puede exceder 500 caracteres";
    }
    setCatErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      requestAnimationFrame(() => focusFirstError(nuevos, catRegFormRef));
      return false;
    }
    return true;
  };

  const validarCatEdit = () => {
    const nuevos = {};
    const nomErr = validateRequiredText(
      editingEspCat?.esc_nomb,
      "La denominación",
      { min: 2, max: 50 },
    );
    if (nomErr) nuevos.esc_nomb = nomErr;
    if (String(editingEspCat?.esc_desc || "").trim().length > 500) {
      nuevos.esc_desc = "La descripción no puede exceder 500 caracteres";
    }
    setCatEditErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      requestAnimationFrame(() => focusFirstError(nuevos, catEditFormRef));
      return false;
    }
    return true;
  };

  const manejarFoto = async (file, setter, target) => {
    if (!file) return;
    setFotoError("");
    if (!file.type.startsWith("image/")) {
      setFotoError("Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFotoError("La foto no puede superar los 5 MB.");
      return;
    }
    if (!isCloudinaryReady()) {
      setFotoError("Cloudinary no está configurado.");
      return;
    }
    setFotoUploading(true);
    setFotoProgress(0);
    try {
      const { url } = await uploadToCloudinary(
        file,
        "image",
        FOLDERS.specialistPhotos,
        (p) => setFotoProgress(p),
      );
      setter({ ...target, esp_foto: url });
    } catch {
      setFotoError("No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setFotoUploading(false);
    }
  };

  const manejarFotoAlta = (file) => manejarFoto(file, setNewEsp, newEsp);
  const manejarFotoEdit = (file) =>
    manejarFoto(file, setEditingEsp, editingEsp);

  const quitarFoto = () => setNewEsp({ ...newEsp, esp_foto: "" });
  const quitarFotoEdit = () => setEditingEsp({ ...editingEsp, esp_foto: "" });

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300">
      {/* Sub-navegación */}
      <div
        data-tour="admin-esp-subnav"
        className="flex gap-4 border-b border-slate-200 dark:border-slate-700"
      >
        <button
          onClick={() => setSubView("especialistas")}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${subView === "especialistas" ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          Especialistas
        </button>
        <button
          onClick={() => setSubView("especialidades")}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${subView === "especialidades" ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
        >
          Especialidades
        </button>
      </div>

      {subView === "especialistas" && (
        <>
          {/* Modal Alta */}
          <AdminModal
            open={showRegistro}
            onClose={() => {
              setShowRegistro(false);
              setErrores({});
              setFotoError("");
            }}
            title="Acreditación de Nuevo Especialista"
            icon={BadgeCheck}
            maxWidth="max-w-xl"
            hasUnsavedChanges={Boolean(
              newEsp?.esp_nomb?.trim() ||
              newEsp?.esp_apel?.trim() ||
              newEsp?.esp_cedu?.trim() ||
              newEsp?.usu_crro?.trim() ||
              newEsp?.esp_telf?.trim(),
            )}
          >
            <form
              ref={regFormRef}
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (fotoUploading) return;
                if (!validarTodo()) return;
                const result = await handleCreateEspecialista(e);
                const ok = result === true || result?.ok === true;
                if (ok) {
                  setErrores({});
                  setFotoError("");
                  setShowRegistro(false);
                } else if (
                  result?.fieldErrors &&
                  Object.keys(result.fieldErrors).length > 0
                ) {
                  setErrores((prev) => ({ ...prev, ...result.fieldErrors }));
                  requestAnimationFrame(() =>
                    focusFirstError(result.fieldErrors, regFormRef),
                  );
                }
              }}
              className="space-y-6"
            >
              {Object.values(errores).some(Boolean) && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>
                    Revisa los campos señalados (
                    {Object.values(errores).filter(Boolean).length}) antes de
                    registrar al especialista.
                  </span>
                </div>
              )}

              {/* Datos Personales */}
              <section>
                <div className="form-section-title">
                  <User className="form-section-title-icon" />
                  <h4 className="form-section-title-text">Datos Personales</h4>
                  <span className="form-section-title-line" />
                </div>
                <div className="mb-5">
                  <FotoPerfilZona
                    preview={newEsp.esp_foto}
                    onFileSelect={manejarFotoAlta}
                    uploading={fotoUploading}
                    progress={fotoProgress}
                    onRemove={quitarFoto}
                  />
                  {fotoError && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" /> {fotoError}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">
                      Tipo de Documento <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      data-field="esp_tdoc"
                      name="esp_tdoc"
                      value={newEsp.esp_tdoc || "V"}
                      onChange={(e) => {
                        const nextTdoc = e.target.value;
                        const nextCedu = sanitizeDocumento(
                          newEsp.esp_cedu,
                          nextTdoc,
                        );
                        setNewEsp({
                          ...newEsp,
                          esp_tdoc: nextTdoc,
                          esp_cedu: nextCedu,
                        });
                        if (nextCedu || errores.esp_cedu) {
                          setErrores((prev) => ({
                            ...prev,
                            esp_cedu: validarCampo(
                              "esp_cedu",
                              nextCedu,
                              nextTdoc,
                            ),
                          }));
                        }
                      }}
                      className="form-select"
                    >
                      <option value="V">Venezolano (V)</option>
                      <option value="E">Extranjero (E)</option>
                      <option value="P">Pasaporte (P)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">
                      Cédula / Documento de Identidad{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      data-field="esp_cedu"
                      name="esp_cedu"
                      maxLength={newEsp.esp_tdoc === "P" ? 11 : 8}
                      inputMode={newEsp.esp_tdoc === "P" ? "text" : "numeric"}
                      type="text"
                      value={newEsp.esp_cedu || ""}
                      onChange={(e) => {
                        const tdoc = newEsp.esp_tdoc || "V";
                        const nextVal = sanitizeDocumento(e.target.value, tdoc);
                        setNewEsp({ ...newEsp, esp_cedu: nextVal });
                        setErrores((prev) => ({
                          ...prev,
                          esp_cedu: validarCampo("esp_cedu", nextVal, tdoc),
                        }));
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          esp_cedu: validarCampo(
                            "esp_cedu",
                            newEsp.esp_cedu,
                            newEsp.esp_tdoc || "V",
                          ),
                        }))
                      }
                      aria-invalid={Boolean(errores.esp_cedu)}
                      className={`form-input ${errores.esp_cedu ? "form-input-invalid" : ""}`}
                      placeholder={
                        newEsp.esp_tdoc === "P"
                          ? "Ej. P1234567"
                          : "Ej. 12345678"
                      }
                    />
                    {errores.esp_cedu && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_cedu}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="form-label">
                      Nombres <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      data-field="esp_nomb"
                      name="esp_nomb"
                      maxLength={50}
                      type="text"
                      value={newEsp.esp_nomb || ""}
                      onChange={(e) => {
                        const nextVal = sanitizeNombrePersona(
                          e.target.value,
                          50,
                        );
                        setNewEsp({ ...newEsp, esp_nomb: nextVal });
                        if (errores.esp_nomb) {
                          setErrores((prev) => ({
                            ...prev,
                            esp_nomb: validarCampo("esp_nomb", nextVal),
                          }));
                        }
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          esp_nomb: validarCampo("esp_nomb", newEsp.esp_nomb),
                        }))
                      }
                      aria-invalid={Boolean(errores.esp_nomb)}
                      className={`form-input ${errores.esp_nomb ? "form-input-invalid" : ""}`}
                      placeholder="Ej. Roberto"
                    />
                    {errores.esp_nomb && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_nomb}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">
                      Apellidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      data-field="esp_apel"
                      name="esp_apel"
                      maxLength={50}
                      type="text"
                      value={newEsp.esp_apel || ""}
                      onChange={(e) => {
                        const nextVal = sanitizeNombrePersona(
                          e.target.value,
                          50,
                        );
                        setNewEsp({ ...newEsp, esp_apel: nextVal });
                        if (errores.esp_apel) {
                          setErrores((prev) => ({
                            ...prev,
                            esp_apel: validarCampo("esp_apel", nextVal),
                          }));
                        }
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          esp_apel: validarCampo("esp_apel", newEsp.esp_apel),
                        }))
                      }
                      aria-invalid={Boolean(errores.esp_apel)}
                      className={`form-input ${errores.esp_apel ? "form-input-invalid" : ""}`}
                      placeholder="Ej. Sánchez"
                    />
                    {errores.esp_apel && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_apel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="form-label">
                      Fecha de Nacimiento{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      data-field="esp_fnac"
                      name="esp_fnac"
                      type="date"
                      min={espDateBounds.min}
                      max={espDateBounds.max}
                      value={newEsp.esp_fnac || ""}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setNewEsp({ ...newEsp, esp_fnac: nextVal });
                        setErrores((prev) => ({
                          ...prev,
                          esp_fnac: validarCampo("esp_fnac", nextVal),
                        }));
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          esp_fnac: validarCampo("esp_fnac", newEsp.esp_fnac),
                        }))
                      }
                      aria-invalid={Boolean(errores.esp_fnac)}
                      className={`form-input ${errores.esp_fnac ? "form-input-invalid" : ""}`}
                    />
                    {errores.esp_fnac ? (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_fnac}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Edad permitida: 12 a 75 años
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">
                      Sexo <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      data-field="esp_gner"
                      name="esp_gner"
                      value={newEsp.esp_gner || "M"}
                      onChange={(e) =>
                        setNewEsp({ ...newEsp, esp_gner: e.target.value })
                      }
                      className="form-select"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Contacto y Acceso */}
              <section>
                <div className="form-section-title">
                  <Mail className="form-section-title-icon" />
                  <h4 className="form-section-title-text">Contacto y Acceso</h4>
                  <span className="form-section-title-line" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">
                      Correo Electrónico{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      data-field="usu_crro"
                      name="usu_crro"
                      maxLength={50}
                      type="email"
                      value={newEsp.usu_crro || ""}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setNewEsp({ ...newEsp, usu_crro: nextVal });
                        if (errores.usu_crro) {
                          setErrores((prev) => ({
                            ...prev,
                            usu_crro: validarCampo("usu_crro", nextVal),
                          }));
                        }
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          usu_crro: validarCampo("usu_crro", newEsp.usu_crro),
                        }))
                      }
                      aria-invalid={Boolean(errores.usu_crro)}
                      className={`form-input ${errores.usu_crro ? "form-input-invalid" : ""}`}
                      placeholder="dr@clinica.com"
                    />
                    {errores.usu_crro && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.usu_crro}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Teléfono de Contacto</label>
                    <input
                      data-field="esp_telf"
                      name="esp_telf"
                      maxLength={
                        (newEsp.esp_telf || "").startsWith("+") ? 13 : 11
                      }
                      type="tel"
                      inputMode="tel"
                      value={newEsp.esp_telf || ""}
                      onChange={(e) => {
                        const nextVal = sanitizeTelefonoVE(e.target.value);
                        setNewEsp({ ...newEsp, esp_telf: nextVal });
                        setErrores((prev) => ({
                          ...prev,
                          esp_telf: validarCampo("esp_telf", nextVal),
                        }));
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          esp_telf: validarCampo("esp_telf", newEsp.esp_telf),
                        }))
                      }
                      aria-invalid={Boolean(errores.esp_telf)}
                      className={`form-input ${errores.esp_telf ? "form-input-invalid" : ""}`}
                      placeholder="04120000000 o +584120000000"
                    />
                    {errores.esp_telf && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_telf}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Acreditación Profesional */}
              <section>
                <div className="form-section-title">
                  <BadgeCheck className="form-section-title-icon" />
                  <h4 className="form-section-title-text">
                    Acreditación Profesional
                  </h4>
                  <span className="form-section-title-line" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Licencia Médica / CM</label>
                    <input
                      data-field="esp_licencia"
                      name="esp_licencia"
                      maxLength={20}
                      type="text"
                      value={newEsp.esp_licencia || ""}
                      onChange={(e) => {
                        const nextVal = sanitizeLicencia(e.target.value, 20);
                        setNewEsp({ ...newEsp, esp_licencia: nextVal });
                        setErrores((prev) => ({
                          ...prev,
                          esp_licencia: validarCampo("esp_licencia", nextVal),
                        }));
                      }}
                      onBlur={() =>
                        setErrores((prev) => ({
                          ...prev,
                          esp_licencia: validarCampo(
                            "esp_licencia",
                            newEsp.esp_licencia,
                          ),
                        }))
                      }
                      aria-invalid={Boolean(errores.esp_licencia)}
                      className={`form-input ${errores.esp_licencia ? "form-input-invalid" : ""}`}
                      placeholder="Ej. CM-90800 o MPPS-123456"
                    />
                    {errores.esp_licencia && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_licencia}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">
                      Especialidad <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      data-field="esc_codi"
                      name="esc_codi"
                      value={newEsp.esc_codi || ""}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setNewEsp({ ...newEsp, esc_codi: nextVal });
                        setErrores((prev) => ({
                          ...prev,
                          esc_codi: validarCampo("esc_codi", nextVal),
                        }));
                      }}
                      aria-invalid={Boolean(errores.esc_codi)}
                      className={`form-select ${errores.esc_codi ? "form-input-invalid" : ""}`}
                    >
                      <option value="" disabled>
                        Seleccione especialidad...
                      </option>
                      {catalogos.especialidades
                        .filter((es) => es.esc_estd !== false)
                        .map((es) => (
                          <option key={es.esc_codi} value={es.esc_codi}>
                            {es.esc_nomb}
                          </option>
                        ))}
                    </select>
                    {errores.esc_codi && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esc_codi}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistro(false);
                    setErrores({});
                    setFotoError("");
                  }}
                  className="md:w-auto w-full px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading || fotoUploading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Registrar Especialista
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal Editar Especialista */}
          <AdminModal
            open={showEditEsp}
            onClose={() => {
              setShowEditEsp(false);
              setEditErrores({});
              setFotoError("");
            }}
            title="Editar Especialista"
            subtitle={[
              `${editingEsp?.esp_nomb || ""} ${editingEsp?.esp_apel || ""}`.trim(),
              editingEsp?.esp_codi
                ? `Cód. Interno: ${editingEsp.esp_codi}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ")}
            icon={Pencil}
            maxWidth="max-w-xl"
            hasUnsavedChanges={Boolean(
              showEditEsp &&
              editingEsp &&
              initialEditEspRef.current &&
              JSON.stringify(editingEsp) !== initialEditEspRef.current,
            )}
          >
            <form
              ref={editFormRef}
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (fotoUploading) return;
                if (!validarTodoEdit()) return;
                const result = await handleUpdateEsp(e);
                const ok = result === true || result?.ok === true;
                if (ok) {
                  setEditErrores({});
                  setFotoError("");
                  setShowEditEsp(false);
                } else if (
                  result?.fieldErrors &&
                  Object.keys(result.fieldErrors).length > 0
                ) {
                  setEditErrores((prev) => ({
                    ...prev,
                    ...result.fieldErrors,
                  }));
                  requestAnimationFrame(() =>
                    focusFirstError(result.fieldErrors, editFormRef),
                  );
                }
              }}
              className="space-y-6"
            >
              {Object.values(editErrores).some(Boolean) && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>
                    Revisa los campos señalados (
                    {Object.values(editErrores).filter(Boolean).length}) antes
                    de guardar los cambios.
                  </span>
                </div>
              )}

              <div className="mb-5">
                <FotoPerfilZona
                  preview={editingEsp?.esp_foto}
                  onFileSelect={manejarFotoEdit}
                  uploading={fotoUploading}
                  progress={fotoProgress}
                  onRemove={quitarFotoEdit}
                />
                {fotoError && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" /> {fotoError}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">
                    Tipo de Documento <span className="text-rose-500">*</span>
                  </label>
                  <select
                    data-field="esp_tdoc"
                    name="esp_tdoc"
                    value={editingEsp?.esp_tdoc || "V"}
                    onChange={(e) => {
                      const nextTdoc = e.target.value;
                      const nextCedu = sanitizeDocumento(
                        editingEsp?.esp_cedu,
                        nextTdoc,
                      );
                      setEditingEsp({
                        ...editingEsp,
                        esp_tdoc: nextTdoc,
                        esp_cedu: nextCedu,
                      });
                      if (nextCedu || editErrores.esp_cedu) {
                        setEditErrores((prev) => ({
                          ...prev,
                          esp_cedu: validarCampoEdit(
                            "esp_cedu",
                            nextCedu,
                            nextTdoc,
                          ),
                        }));
                      }
                    }}
                    className="form-select"
                  >
                    <option value="V">Venezolano (V)</option>
                    <option value="E">Extranjero (E)</option>
                    <option value="P">Pasaporte (P)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Cédula / Documento de Identidad{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    data-field="esp_cedu"
                    name="esp_cedu"
                    maxLength={editingEsp?.esp_tdoc === "P" ? 11 : 8}
                    inputMode={
                      editingEsp?.esp_tdoc === "P" ? "text" : "numeric"
                    }
                    type="text"
                    value={editingEsp?.esp_cedu || ""}
                    onChange={(e) => {
                      const tdoc = editingEsp?.esp_tdoc || "V";
                      const nextVal = sanitizeDocumento(e.target.value, tdoc);
                      setEditingEsp({
                        ...editingEsp,
                        esp_cedu: nextVal,
                      });
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_cedu: validarCampoEdit("esp_cedu", nextVal, tdoc),
                      }));
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_cedu: validarCampoEdit(
                          "esp_cedu",
                          editingEsp?.esp_cedu,
                          editingEsp?.esp_tdoc || "V",
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.esp_cedu)}
                    className={`form-input ${editErrores.esp_cedu ? "form-input-invalid" : ""}`}
                    placeholder={
                      editingEsp?.esp_tdoc === "P"
                        ? "Ej. P1234567"
                        : "Ej. 12345678"
                    }
                  />
                  {editErrores.esp_cedu && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_cedu}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">
                    Nombres <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    data-field="esp_nomb"
                    name="esp_nomb"
                    maxLength={50}
                    type="text"
                    value={editingEsp?.esp_nomb || ""}
                    onChange={(e) => {
                      const nextVal = sanitizeNombrePersona(e.target.value, 50);
                      setEditingEsp({ ...editingEsp, esp_nomb: nextVal });
                      if (editErrores.esp_nomb) {
                        setEditErrores((prev) => ({
                          ...prev,
                          esp_nomb: validarCampoEdit("esp_nomb", nextVal),
                        }));
                      }
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_nomb: validarCampoEdit(
                          "esp_nomb",
                          editingEsp?.esp_nomb,
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.esp_nomb)}
                    className={`form-input ${editErrores.esp_nomb ? "form-input-invalid" : ""}`}
                    placeholder="Ej. Roberto"
                  />
                  {editErrores.esp_nomb && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_nomb}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">
                    Apellidos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    data-field="esp_apel"
                    name="esp_apel"
                    maxLength={50}
                    type="text"
                    value={editingEsp?.esp_apel || ""}
                    onChange={(e) => {
                      const nextVal = sanitizeNombrePersona(e.target.value, 50);
                      setEditingEsp({ ...editingEsp, esp_apel: nextVal });
                      if (editErrores.esp_apel) {
                        setEditErrores((prev) => ({
                          ...prev,
                          esp_apel: validarCampoEdit("esp_apel", nextVal),
                        }));
                      }
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_apel: validarCampoEdit(
                          "esp_apel",
                          editingEsp?.esp_apel,
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.esp_apel)}
                    className={`form-input ${editErrores.esp_apel ? "form-input-invalid" : ""}`}
                    placeholder="Ej. Sánchez"
                  />
                  {editErrores.esp_apel && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_apel}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Fecha de Nacimiento</label>
                  <input
                    data-field="esp_fnac"
                    name="esp_fnac"
                    type="date"
                    min={espDateBounds.min}
                    max={espDateBounds.max}
                    value={editingEsp?.esp_fnac || ""}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setEditingEsp({ ...editingEsp, esp_fnac: nextVal });
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_fnac: validarCampoEdit("esp_fnac", nextVal),
                      }));
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_fnac: validarCampoEdit(
                          "esp_fnac",
                          editingEsp?.esp_fnac,
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.esp_fnac)}
                    className={`form-input ${editErrores.esp_fnac ? "form-input-invalid" : ""}`}
                  />
                  {editErrores.esp_fnac ? (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_fnac}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Edad permitida: 12 a 75 años
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">
                    Sexo <span className="text-rose-500">*</span>
                  </label>
                  <select
                    data-field="esp_gner"
                    name="esp_gner"
                    value={editingEsp?.esp_gner || "M"}
                    onChange={(e) =>
                      setEditingEsp({ ...editingEsp, esp_gner: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">
                    Correo Electrónico <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    data-field="usu_crro"
                    name="usu_crro"
                    maxLength={50}
                    type="email"
                    value={editingEsp?.usu_crro || ""}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setEditingEsp({ ...editingEsp, usu_crro: nextVal });
                      if (editErrores.usu_crro) {
                        setEditErrores((prev) => ({
                          ...prev,
                          usu_crro: validarCampoEdit("usu_crro", nextVal),
                        }));
                      }
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        usu_crro: validarCampoEdit(
                          "usu_crro",
                          editingEsp?.usu_crro,
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.usu_crro)}
                    className={`form-input ${editErrores.usu_crro ? "form-input-invalid" : ""}`}
                    placeholder="dr@clinica.com"
                  />
                  {editErrores.usu_crro && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.usu_crro}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Teléfono de Contacto</label>
                  <input
                    data-field="esp_telf"
                    name="esp_telf"
                    maxLength={
                      (editingEsp?.esp_telf || "").startsWith("+") ? 13 : 11
                    }
                    type="tel"
                    inputMode="tel"
                    value={editingEsp?.esp_telf || ""}
                    onChange={(e) => {
                      const nextVal = sanitizeTelefonoVE(e.target.value);
                      setEditingEsp({
                        ...editingEsp,
                        esp_telf: nextVal,
                      });
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_telf: validarCampoEdit("esp_telf", nextVal),
                      }));
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_telf: validarCampoEdit(
                          "esp_telf",
                          editingEsp?.esp_telf,
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.esp_telf)}
                    className={`form-input ${editErrores.esp_telf ? "form-input-invalid" : ""}`}
                    placeholder="04120000000 o +584120000000"
                  />
                  {editErrores.esp_telf && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_telf}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Licencia Médica / CM</label>
                  <input
                    data-field="esp_licencia"
                    name="esp_licencia"
                    maxLength={20}
                    type="text"
                    value={editingEsp?.esp_licencia || ""}
                    onChange={(e) => {
                      const nextVal = sanitizeLicencia(e.target.value, 20);
                      setEditingEsp({
                        ...editingEsp,
                        esp_licencia: nextVal,
                      });
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_licencia: validarCampoEdit("esp_licencia", nextVal),
                      }));
                    }}
                    onBlur={() =>
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_licencia: validarCampoEdit(
                          "esp_licencia",
                          editingEsp?.esp_licencia,
                        ),
                      }))
                    }
                    aria-invalid={Boolean(editErrores.esp_licencia)}
                    className={`form-input ${editErrores.esp_licencia ? "form-input-invalid" : ""}`}
                    placeholder="Ej. CM-90800 o MPPS-123456"
                  />
                  {editErrores.esp_licencia && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_licencia}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">
                    Especialidad <span className="text-rose-500">*</span>
                  </label>
                  <select
                    data-field="esc_codi"
                    name="esc_codi"
                    value={editingEsp?.esc_codi || ""}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setEditingEsp({ ...editingEsp, esc_codi: nextVal });
                      setEditErrores((prev) => ({
                        ...prev,
                        esc_codi: validarCampoEdit("esc_codi", nextVal),
                      }));
                    }}
                    aria-invalid={Boolean(editErrores.esc_codi)}
                    className={`form-select ${editErrores.esc_codi ? "form-input-invalid" : ""}`}
                  >
                    <option value="" disabled>
                      Seleccione especialidad...
                    </option>
                    {catalogos.especialidades
                      .filter((es) => es.esc_estd !== false)
                      .map((es) => (
                        <option key={es.esc_codi} value={es.esc_codi}>
                          {es.esc_nomb}
                        </option>
                      ))}
                  </select>
                  {editErrores.esc_codi && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esc_codi}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditEsp(false);
                    setEditErrores({});
                    setFotoError("");
                  }}
                  className="md:w-auto w-full px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading || fotoUploading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Barra de filtros */}
          <FilterBar
            searchValue={searchEsp}
            onSearch={(v) => {
              setSearchEsp(v);
              setPageEsp(0);
            }}
            searchPlaceholder="Buscar por nombre, correo o documento..."
            activeCount={
              (searchEsp ? 1 : 0) +
              (filterEspecialidad !== "TODAS" ? 1 : 0) +
              (filterEstado !== "TODOS" ? 1 : 0) +
              (filterGenero !== "TODOS" ? 1 : 0) +
              (dateFrom ? 1 : 0) +
              (dateTo ? 1 : 0)
            }
            onClearAll={clearEspFilters}
            chips={espFilterChips}
            className="mb-4"
          >
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Especialidad
              </label>
              <select
                value={filterEspecialidad}
                onChange={(e) => {
                  setFilterEspecialidad(e.target.value);
                  setPageEsp(0);
                }}
                className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value="TODAS">Todas las especialidades</option>
                {catalogos.especialidades
                  .filter((es) => es.esc_estd !== false)
                  .map((es) => (
                    <option key={es.esc_codi} value={es.esc_codi}>
                      {es.esc_nomb}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Estado
              </label>
              <select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setPageEsp(0);
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
                Género
              </label>
              <select
                value={filterGenero}
                onChange={(e) => {
                  setFilterGenero(e.target.value);
                  setPageEsp(0);
                }}
                className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value="TODOS">Todos los géneros</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
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
                  setPageEsp(0);
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
                  setPageEsp(0);
                }}
                className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
              />
            </div>
          </FilterBar>

          {/* Tabla de Nómina Médica / Especialistas */}
          <div
            data-tour="admin-esp-directory"
            className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Nómina Médica / Especialistas
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full whitespace-nowrap">
                  {filteredEspecialistas.length} registros
                </span>
                <button
                  type="button"
                  onClick={exportEspecialistasToPDF}
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
                  onClick={exportEspecialistasToExcel}
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
                <button
                  data-tour="admin-esp-register-btn"
                  onClick={() => {
                    setErrores({});
                    setFotoError("");
                    setShowRegistro(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Especialista
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse responsive-table">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Profesional Clínico</th>
                    <th className="px-6 py-3">Especialidad</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pagedEspecialistas.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-12 text-center text-slate-500"
                      >
                        <UserRound className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          No se encontraron especialistas
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          No hay especialistas registrados o no coinciden con
                          los criterios de búsqueda.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pagedEspecialistas.map((esp) => (
                      <tr
                        key={esp.esp_codi}
                        onClick={() => setPreviewEsp(esp)}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${expandedId === esp.esp_codi ? "mobile-expanded" : ""}`}
                      >
                        <td
                          className="px-6 py-4 mobile-summary"
                          data-label="Profesional"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {esp.esp_foto ? (
                              <img
                                src={esp.esp_foto}
                                alt={`Foto de ${esp.esp_nomb} ${esp.esp_apel}`}
                                className="w-9 h-9 rounded-full object-cover border-2 border-blue-200 dark:border-blue-800 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shrink-0 text-sm">
                                {esp.esp_nomb?.charAt(0) || "?"}
                                {esp.esp_apel?.charAt(0) || ""}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {esp.esp_gner === "M" ? "Dr." : "Dra."}{" "}
                                {esp.esp_nomb} {esp.esp_apel}
                              </div>
                              <div className="text-xs text-slate-400 font-mono truncate">
                                {esp.tm_usuar?.usu_crro}
                              </div>
                            </div>
                          </div>
                          <span className="mobile-summary-status">
                            <StatusBadge active={esp.tm_usuar?.usu_estd} />
                          </span>
                          <button
                            type="button"
                            className="mobile-expand-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(esp.esp_codi);
                            }}
                            aria-label={
                              expandedId === esp.esp_codi
                                ? "Ver menos"
                                : "Ver más"
                            }
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 mobile-detail"
                          data-label="Especialidad"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {esp.tm_especi?.esc_nomb || "Sin especialidad"}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {(() => {
                                  const n = esp._count?.tc_asign ?? 0;
                                  return `${n} paciente${n === 1 ? "" : "s"} asignado${n === 1 ? "" : "s"}`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 text-center mobile-detail"
                          data-label="Estado"
                        >
                          <StatusBadge active={esp.tm_usuar?.usu_estd} />
                        </td>
                        <td
                          className="px-6 py-4 text-right mobile-detail"
                          data-label="Acciones"
                        >
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditErrores({});
                                setFotoError("");
                                const nextEdit = {
                                  esp_codi: esp.esp_codi,
                                  esp_tdoc: esp.esp_tdoc || "V",
                                  esp_cedu: esp.esp_cedu || "",
                                  esp_nomb: esp.esp_nomb,
                                  esp_apel: esp.esp_apel,
                                  esp_fnac: formatYmdForInput(esp.esp_fnac),
                                  usu_crro: esp.tm_usuar?.usu_crro || "",
                                  esp_gner: esp.esp_gner || "M",
                                  esp_telf: esp.esp_telf || "",
                                  esp_licencia: esp.esp_licencia || "",
                                  esp_foto: esp.esp_foto || "",
                                  esc_codi: esp.tm_especi?.esc_codi || "",
                                };
                                initialEditEspRef.current =
                                  JSON.stringify(nextEdit);
                                setEditingEsp(nextEdit);
                                setShowEditEsp(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetPassword(
                                  esp.esp_codi,
                                  esp.tm_usuar?.usu_crro || "",
                                );
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                              title="Resetear contraseña"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActivo(
                                  esp.esp_codi,
                                  esp.tm_usuar?.usu_estd,
                                );
                              }}
                              title={
                                esp.tm_usuar?.usu_estd
                                  ? "Desactivar"
                                  : "Activar"
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                esp.tm_usuar?.usu_estd
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                              }`}
                            >
                              {esp.tm_usuar?.usu_estd ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60">
              <Pagination
                currentPage={pageEsp}
                totalPages={totalEspPages}
                onPageChange={setPageEsp}
              />
            </div>
          </div>

          {/* Vista previa del especialista — Ficha Integral */}
          {previewEsp && (
            <AdminModal
              open={!!previewEsp}
              onClose={() => setPreviewEsp(null)}
              title="Ficha del Especialista"
              subtitle={`${previewEsp.esp_nomb || ""} ${previewEsp.esp_apel || ""}`.trim()}
              icon={Stethoscope}
              maxWidth="max-w-xl"
            >
              <div className="space-y-4">
                {/* Header formal: avatar + titulación */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {previewEsp.esp_foto ? (
                      <img
                        src={previewEsp.esp_foto}
                        alt={`Foto de ${previewEsp.esp_nomb}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg">
                        {previewEsp.esp_nomb?.charAt(0) || "?"}
                        {previewEsp.esp_apel?.charAt(0) || ""}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {previewEsp.esp_gner === "M" ? "Dr." : "Dra."}{" "}
                        {previewEsp.esp_nomb} {previewEsp.esp_apel}
                      </h3>
                      <StatusBadge active={previewEsp.tm_usuar?.usu_estd} />
                    </div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      {previewEsp.tm_especi?.esc_nomb ||
                        "Sin especialidad asignada"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Cód. Interno: {previewEsp.esp_codi}
                      {previewEsp.esp_cedu
                        ? ` · Cédula: ${previewEsp.esp_tdoc || "V"}-${previewEsp.esp_cedu}`
                        : ""}
                      {previewEsp.esp_licencia
                        ? ` · Licencia: ${previewEsp.esp_licencia}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Lista formal de datos */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Información Profesional y de Contacto
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 divide-y divide-slate-200/60 dark:divide-slate-700/60 text-xs">
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Cédula / Documento
                      </span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {previewEsp.esp_cedu
                          ? `${previewEsp.esp_tdoc || "V"}-${previewEsp.esp_cedu}`
                          : "No registrada"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Correo Electrónico
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
                        {previewEsp.tm_usuar?.usu_crro || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Teléfono de Contacto
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {previewEsp.esp_telf || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Licencia Médica
                      </span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {previewEsp.esp_licencia || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Sexo
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {previewEsp.esp_gner === "M" ? "Masculino" : "Femenino"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Fecha de Nacimiento
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {previewEsp.esp_fnac
                          ? new Date(
                              `${formatYmdForInput(previewEsp.esp_fnac)}T12:00:00`,
                            ).toLocaleDateString("es-VE", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Pacientes Asignados
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {(() => {
                          const n = previewEsp._count?.tc_asign ?? 0;
                          return `${n} paciente${n === 1 ? "" : "s"} activo${n === 1 ? "" : "s"}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 flex justify-end border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewEsp(null)}
                    className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </AdminModal>
          )}
        </>
      )}

      {subView === "especialidades" && (
        <>
          {/* Modal Nueva Especialidad */}
          <AdminModal
            open={showCatRegistro}
            onClose={() => {
              setShowCatRegistro(false);
              setCatErrores({});
            }}
            title="Registrar Nueva Especialidad"
            icon={Plus}
            maxWidth="max-w-xl"
            hasUnsavedChanges={Boolean(
              newEspCat?.esc_nomb?.trim() || newEspCat?.esc_desc?.trim(),
            )}
          >
            <form
              ref={catRegFormRef}
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validarCatCreate()) return;
                const result = await handleCreateEspecialidad(e);
                const ok = result === true || result?.ok === true;
                if (ok) {
                  setCatErrores({});
                  setShowCatRegistro(false);
                } else if (
                  result?.fieldErrors &&
                  Object.keys(result.fieldErrors).length > 0
                ) {
                  setCatErrores((prev) => ({ ...prev, ...result.fieldErrors }));
                  requestAnimationFrame(() =>
                    focusFirstError(result.fieldErrors, catRegFormRef),
                  );
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label form-label-inline">
                      Denominación de la Especialidad{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-medium ${(newEspCat.esc_nomb || "").length >= 45 ? "text-rose-500" : "text-slate-400"}`}
                    >
                      {(newEspCat.esc_nomb || "").length}/50
                    </span>
                  </div>
                  <input
                    required
                    data-field="esc_nomb"
                    name="esc_nomb"
                    maxLength={50}
                    type="text"
                    value={newEspCat.esc_nomb || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewEspCat({ ...newEspCat, esc_nomb: val });
                      if (catErrores.esc_nomb) {
                        setCatErrores((prev) => ({
                          ...prev,
                          esc_nomb: validateRequiredText(
                            val,
                            "La denominación",
                            {
                              min: 2,
                              max: 50,
                            },
                          ),
                        }));
                      }
                    }}
                    aria-invalid={Boolean(catErrores.esc_nomb)}
                    className={`form-input ${catErrores.esc_nomb ? "form-input-invalid" : ""}`}
                    placeholder="Ej. Psicología Clínica Infantil"
                  />
                  {catErrores.esc_nomb && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {catErrores.esc_nomb}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Código de Clasificación</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      data-field="esc_codi"
                      name="esc_codi"
                      maxLength={10}
                      type="text"
                      value={newEspCat.esc_codi || ""}
                      onChange={(e) => {
                        const val = sanitizeEscCodi(e.target.value);
                        setNewEspCat({
                          ...newEspCat,
                          esc_codi: val,
                        });
                        if (catErrores.esc_codi) {
                          setCatErrores((prev) => ({
                            ...prev,
                            esc_codi:
                              !val || ESC_CODI_REGEX.test(val)
                                ? ""
                                : "Usa 2 a 10 caracteres (letras, números, - o _)",
                          }));
                        }
                      }}
                      aria-invalid={Boolean(catErrores.esc_codi)}
                      className={`form-input !pl-9 !pr-4 font-mono ${catErrores.esc_codi ? "form-input-invalid" : ""}`}
                      placeholder="PSIC-01"
                    />
                  </div>
                  {catErrores.esc_codi && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {catErrores.esc_codi}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label form-label-inline">
                    Perfil Clínico y Competencias
                  </label>
                  <span
                    className={`text-[11px] font-medium ${(newEspCat.esc_desc || "").length >= 450 ? "text-rose-500" : "text-slate-400"}`}
                  >
                    {(newEspCat.esc_desc || "").length}/500
                  </span>
                </div>
                <textarea
                  data-field="esc_desc"
                  name="esc_desc"
                  maxLength={500}
                  value={newEspCat.esc_desc || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewEspCat({ ...newEspCat, esc_desc: val });
                    if (catErrores.esc_desc) {
                      setCatErrores((prev) => ({
                        ...prev,
                        esc_desc:
                          val.trim().length > 500
                            ? "La descripción no puede exceder 500 caracteres"
                            : "",
                      }));
                    }
                  }}
                  aria-invalid={Boolean(catErrores.esc_desc)}
                  className={`form-textarea h-32 ${catErrores.esc_desc ? "form-input-invalid" : ""}`}
                  placeholder="Describa las competencias, población atendida y alcance clínico de la especialidad..."
                />
                {catErrores.esc_desc && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {catErrores.esc_desc}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCatRegistro(false);
                    setCatErrores({});
                  }}
                  className="md:w-auto w-full px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Registrar Especialidad
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal Editar Especialidad */}
          <AdminModal
            open={showEditEspCat}
            onClose={() => {
              setShowEditEspCat(false);
              setCatEditErrores({});
            }}
            title="Editar Especialidad"
            subtitle={editingEspCat?.esc_nomb || ""}
            icon={Pencil}
            maxWidth="max-w-xl"
            hasUnsavedChanges={Boolean(
              showEditEspCat &&
              editingEspCat &&
              initialEditEspCatRef.current &&
              JSON.stringify(editingEspCat) !== initialEditEspCatRef.current,
            )}
          >
            <form
              ref={catEditFormRef}
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validarCatEdit()) return;
                const result = await handleUpdateEspecialidad(e);
                const ok = result === true || result?.ok === true;
                if (ok) {
                  setCatEditErrores({});
                  setShowEditEspCat(false);
                } else if (
                  result?.fieldErrors &&
                  Object.keys(result.fieldErrors).length > 0
                ) {
                  setCatEditErrores((prev) => ({
                    ...prev,
                    ...result.fieldErrors,
                  }));
                  requestAnimationFrame(() =>
                    focusFirstError(result.fieldErrors, catEditFormRef),
                  );
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label form-label-inline">
                      Denominación de la Especialidad{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-medium ${(editingEspCat?.esc_nomb || "").length >= 45 ? "text-rose-500" : "text-slate-400"}`}
                    >
                      {(editingEspCat?.esc_nomb || "").length}/50
                    </span>
                  </div>
                  <input
                    required
                    data-field="esc_nomb"
                    name="esc_nomb"
                    maxLength={50}
                    type="text"
                    value={editingEspCat?.esc_nomb || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingEspCat({
                        ...editingEspCat,
                        esc_nomb: val,
                      });
                      if (catEditErrores.esc_nomb) {
                        setCatEditErrores((prev) => ({
                          ...prev,
                          esc_nomb: validateRequiredText(
                            val,
                            "La denominación",
                            {
                              min: 2,
                              max: 50,
                            },
                          ),
                        }));
                      }
                    }}
                    aria-invalid={Boolean(catEditErrores.esc_nomb)}
                    className={`form-input ${catEditErrores.esc_nomb ? "form-input-invalid" : ""}`}
                    placeholder="Ej. Psicología Clínica Infantil"
                  />
                  {catEditErrores.esc_nomb && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {catEditErrores.esc_nomb}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Código de Clasificación</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      disabled
                      maxLength={10}
                      type="text"
                      value={editingEspCat?.esc_codi || ""}
                      className="form-input !pl-9 !pr-4 font-mono opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label form-label-inline">
                    Perfil Clínico y Competencias
                  </label>
                  <span
                    className={`text-[11px] font-medium ${(editingEspCat?.esc_desc || "").length >= 450 ? "text-rose-500" : "text-slate-400"}`}
                  >
                    {(editingEspCat?.esc_desc || "").length}/500
                  </span>
                </div>
                <textarea
                  data-field="esc_desc"
                  name="esc_desc"
                  maxLength={500}
                  value={editingEspCat?.esc_desc || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingEspCat({
                      ...editingEspCat,
                      esc_desc: val,
                    });
                    if (catEditErrores.esc_desc) {
                      setCatEditErrores((prev) => ({
                        ...prev,
                        esc_desc:
                          val.trim().length > 500
                            ? "La descripción no puede exceder 500 caracteres"
                            : "",
                      }));
                    }
                  }}
                  aria-invalid={Boolean(catEditErrores.esc_desc)}
                  className={`form-textarea h-32 ${catEditErrores.esc_desc ? "form-input-invalid" : ""}`}
                  placeholder="Describa las competencias, población atendida y alcance clínico de la especialidad..."
                />
                {catEditErrores.esc_desc && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {catEditErrores.esc_desc}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditEspCat(false);
                    setCatEditErrores({});
                  }}
                  className="md:w-auto w-full px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Barra de Filtros Especialidades */}
          <FilterBar
            searchValue={searchEspCat}
            onSearch={(v) => {
              setSearchEspCat(v);
              setPageEspCat(0);
            }}
            searchPlaceholder="Buscar especialidad..."
            activeCount={
              (searchEspCat ? 1 : 0) + (filterEspCatEstado !== "TODOS" ? 1 : 0)
            }
            onClearAll={clearEspCatFilters}
            chips={espCatFilterChips}
            className="mb-4"
          >
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Estado
              </label>
              <select
                value={filterEspCatEstado}
                onChange={(e) => {
                  setFilterEspCatEstado(e.target.value);
                  setPageEspCat(0);
                }}
                className="w-full h-10 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactivo</option>
              </select>
            </div>
          </FilterBar>

          {/* Tabla de Especialidades */}
          <div
            data-tour="admin-esp-catalog"
            className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Especialidades Médicas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Catálogo institucional para asignación clínica
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full whitespace-nowrap">
                  {filteredEspecialidades.length} registros
                </span>
                <button
                  data-tour="admin-esp-cat-btn"
                  onClick={() => {
                    setCatErrores({});
                    setShowCatRegistro(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Especialidad
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse responsive-table">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Especialidad</th>
                    <th className="px-6 py-3">Descripción Técnica</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredEspecialidades.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-12 text-center text-slate-500"
                      >
                        <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          No se encontraron especialidades
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          No hay especialidades registradas o no coinciden con
                          los filtros aplicados.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pagedEspecialidades.map((esc) => (
                      <tr
                        key={esc.esc_codi}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${expandedId === esc.esc_codi ? "mobile-expanded" : ""}`}
                      >
                        <td
                          className="px-6 py-4 mobile-summary"
                          data-label="Especialidad"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {esc.esc_nomb}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              ID: {esc.esc_codi}
                            </div>
                          </div>
                          <span className="mobile-summary-status">
                            <StatusBadge
                              active={esc.esc_estd !== false}
                              activeLabel="Activa"
                              inactiveLabel="Inactivo"
                            />
                          </span>
                          <button
                            type="button"
                            className="mobile-expand-btn"
                            onClick={() => toggle(esc.esc_codi)}
                            aria-label={
                              expandedId === esc.esc_codi
                                ? "Ver menos"
                                : "Ver más"
                            }
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 text-slate-600 dark:text-slate-400 mobile-detail"
                          data-label="Descripción"
                        >
                          <div className="line-clamp-2 max-w-md text-sm">
                            {esc.esc_desc || "-"}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 text-center mobile-detail"
                          data-label="Estado"
                        >
                          <StatusBadge
                            active={esc.esc_estd !== false}
                            activeLabel="Activa"
                            inactiveLabel="Inactivo"
                          />
                        </td>
                        <td
                          className="px-6 py-4 text-right mobile-detail"
                          data-label="Acciones"
                        >
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCatEditErrores({});
                                initialEditEspCatRef.current =
                                  JSON.stringify(esc);
                                setEditingEspCat(esc);
                                setShowEditEspCat(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleEspecialidad(
                                  esc.esc_codi,
                                  esc.esc_estd,
                                )
                              }
                              title={
                                esc.esc_estd !== false
                                  ? "Archivar"
                                  : "Restaurar"
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                esc.esc_estd !== false
                                  ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                              }`}
                            >
                              {esc.esc_estd !== false ? (
                                <Archive className="w-4 h-4" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60">
              <Pagination
                currentPage={pageEspCat}
                totalPages={totalEspCatPages}
                onPageChange={setPageEspCat}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
