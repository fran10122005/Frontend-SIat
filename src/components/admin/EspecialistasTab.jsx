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
  UploadCloud,
  Camera,
  AlertCircle,
  Phone,
  IdCard,
  Cake,
  Users,
} from "lucide-react";
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

const VALIDACIONES = {
  documento: (value, tdoc) => {
    if (!value) return "";
    const doc = String(value).trim();
    if (tdoc === "P") {
      return /^[A-Za-z]{1,3}\d{4,8}$/.test(doc)
        ? ""
        : "Formato de pasaporte: 1-3 letras + 4-8 dígitos (Ej. P123456)";
    }
    return /^\d{6,8}$/.test(doc)
      ? ""
      : "La cédula debe contener entre 6 y 8 dígitos (Ej. 12345678)";
  },
  telefono: (value) => {
    if (!value) return "";
    return /^(\+58|0058|0)?4\d{2}[- ]?\d{3}[- ]?\d{4}$/.test(
      String(value).trim(),
    )
      ? ""
      : "Formato venezolano: +584121234567";
  },
  licencia: (value) => {
    if (!value) return "";
    return /^(CM|MPPS|MPP|\d{4,6})[- ]?\d{3,6}$/i.test(String(value).trim())
      ? ""
      : "Formato: CM-90800 o MPPS-123456";
  },
  fecha: (value) => {
    if (!value) return "";
    return new Date(value) <= new Date()
      ? ""
      : "La fecha de nacimiento no puede ser futura";
  },
};

function FotoPerfilZona({
  preview,
  onFileSelect,
  uploading,
  progress,
  onRemove,
}) {
  const inputRef = useRef(null);
  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 shrink-0
          ${uploading ? "cursor-wait" : "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"}`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Foto del especialista"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 gap-0.5">
            <UploadCloud className="w-6 h-6" />
            <span className="text-[9px] font-semibold">Foto</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-xs font-bold">{progress}%</span>
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
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Foto de Perfil
        </p>
        <p className="text-[11px] text-slate-400">
          JPG, PNG o WebP · Máx. 5 MB
        </p>
        {preview && !uploading && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold mt-1"
          >
            Quitar foto
          </button>
        )}
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
      const nombre =
        `${esp.esp_nomb} ${esp.esp_apel} ${esp.tm_usuar?.usu_crro || ""}`.toLowerCase();
      const q = searchEsp.toLowerCase();
      if (searchEsp && !nombre.includes(q)) return false;
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

  const validarCampo = (campo) => {
    const valor = newEsp[campo];
    if (campo === "esp_codi")
      return VALIDACIONES.documento(valor, newEsp.esp_tdoc);
    if (campo === "esp_telf") return VALIDACIONES.telefono(valor);
    if (campo === "esp_licencia") return VALIDACIONES.licencia(valor);
    if (campo === "esp_fnac") return VALIDACIONES.fecha(valor);
    return "";
  };

  const validarCampoEdit = (campo) => {
    const valor = editingEsp?.[campo];
    if (campo === "esp_telf") return VALIDACIONES.telefono(valor);
    if (campo === "esp_licencia") return VALIDACIONES.licencia(valor);
    return "";
  };

  const validarTodo = () => {
    const nuevos = {};
    if (!newEsp.esp_codi)
      nuevos.esp_codi = "El número de documento es requerido";
    else {
      const doc = VALIDACIONES.documento(newEsp.esp_codi, newEsp.esp_tdoc);
      if (doc) nuevos.esp_codi = doc;
    }
    const telf = VALIDACIONES.telefono(newEsp.esp_telf);
    if (telf) nuevos.esp_telf = telf;
    const lic = VALIDACIONES.licencia(newEsp.esp_licencia);
    if (lic) nuevos.esp_licencia = lic;
    const fec = VALIDACIONES.fecha(newEsp.esp_fnac);
    if (fec) nuevos.esp_fnac = fec;
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const validarTodoEdit = () => {
    const nuevos = {};
    const telf = VALIDACIONES.telefono(editingEsp?.esp_telf);
    if (telf) nuevos.esp_telf = telf;
    const lic = VALIDACIONES.licencia(editingEsp?.esp_licencia);
    if (lic) nuevos.esp_licencia = lic;
    setEditErrores(nuevos);
    return Object.keys(nuevos).length === 0;
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
    <div className="space-y-6 animate-in fade-in duration-300">
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
            onClose={() => setShowRegistro(false)}
            title="Acreditación de Nuevo Especialista"
            subtitle="Registrar un nuevo profesional clínico en la nómina médica"
            maxWidth="max-w-3xl"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (fotoUploading) return;
                if (!validarTodo()) return;
                const ok = await handleCreateEspecialista(e);
                if (ok) setShowRegistro(false);
              }}
              className="space-y-6"
            >
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
                    <p className="form-error">
                      <AlertCircle className="w-3.5 h-3.5" /> {fotoError}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Tipo de Documento</label>
                    <select
                      required
                      value={newEsp.esp_tdoc}
                      onChange={(e) =>
                        setNewEsp({ ...newEsp, esp_tdoc: e.target.value })
                      }
                      className="form-select"
                    >
                      <option value="V">Venezolano (V)</option>
                      <option value="E">Extranjero (E)</option>
                      <option value="P">Pasaporte (P)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Número de Documento</label>
                    <input
                      required
                      maxLength={11}
                      type="text"
                      value={newEsp.esp_codi}
                      onChange={(e) => {
                        setNewEsp({ ...newEsp, esp_codi: e.target.value });
                        setErrores((prev) => ({
                          ...prev,
                          esp_codi: validarCampo("esp_codi"),
                        }));
                      }}
                      className={`form-input ${errores.esp_codi ? "form-input-invalid" : ""}`}
                      placeholder="Ej. 12345678"
                    />
                    {errores.esp_codi && (
                      <p className="form-error">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_codi}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="form-label">Nombres</label>
                    <input
                      required
                      maxLength={50}
                      type="text"
                      value={newEsp.esp_nomb}
                      onChange={(e) =>
                        setNewEsp({ ...newEsp, esp_nomb: e.target.value })
                      }
                      className="form-input"
                      placeholder="Ej. Roberto"
                    />
                  </div>
                  <div>
                    <label className="form-label">Apellidos</label>
                    <input
                      required
                      maxLength={50}
                      type="text"
                      value={newEsp.esp_apel}
                      onChange={(e) =>
                        setNewEsp({ ...newEsp, esp_apel: e.target.value })
                      }
                      className="form-input"
                      placeholder="Ej. Sánchez"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <div>
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input
                      required
                      type="date"
                      value={newEsp.esp_fnac}
                      onChange={(e) => {
                        setNewEsp({ ...newEsp, esp_fnac: e.target.value });
                        setErrores((prev) => ({
                          ...prev,
                          esp_fnac: validarCampo("esp_fnac"),
                        }));
                      }}
                      className={`form-input ${errores.esp_fnac ? "form-input-invalid" : ""}`}
                    />
                    {errores.esp_fnac && (
                      <p className="form-error">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_fnac}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Sexo</label>
                    <select
                      required
                      value={newEsp.esp_gner}
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
                      Correo Electrónico Corporativo
                    </label>
                    <input
                      required
                      maxLength={50}
                      type="email"
                      value={newEsp.usu_crro}
                      onChange={(e) =>
                        setNewEsp({ ...newEsp, usu_crro: e.target.value })
                      }
                      className="form-input"
                      placeholder="dr@clinica.com"
                    />
                  </div>
                  <div>
                    <label className="form-label">Teléfono de Contacto</label>
                    <input
                      maxLength={15}
                      type="text"
                      value={newEsp.esp_telf}
                      onChange={(e) => {
                        setNewEsp({ ...newEsp, esp_telf: e.target.value });
                        setErrores((prev) => ({
                          ...prev,
                          esp_telf: validarCampo("esp_telf"),
                        }));
                      }}
                      className={`form-input ${errores.esp_telf ? "form-input-invalid" : ""}`}
                      placeholder="+58 412 0000000"
                    />
                    {errores.esp_telf && (
                      <p className="form-error">
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
                      maxLength={50}
                      type="text"
                      value={newEsp.esp_licencia}
                      onChange={(e) => {
                        setNewEsp({ ...newEsp, esp_licencia: e.target.value });
                        setErrores((prev) => ({
                          ...prev,
                          esp_licencia: validarCampo("esp_licencia"),
                        }));
                      }}
                      className={`form-input ${errores.esp_licencia ? "form-input-invalid" : ""}`}
                      placeholder="Ej. CM-90800"
                    />
                    {errores.esp_licencia && (
                      <p className="form-error">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {errores.esp_licencia}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Especialidad</label>
                    <select
                      required
                      value={newEsp.esc_codi}
                      onChange={(e) =>
                        setNewEsp({ ...newEsp, esc_codi: e.target.value })
                      }
                      className="form-select"
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
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowRegistro(false)}
                  className="md:w-auto w-full px-6 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Registrar Especialista
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal Editar Especialista */}
          <AdminModal
            open={showEditEsp}
            onClose={() => setShowEditEsp(false)}
            title="Editar Especialista"
            subtitle={`${editingEsp?.esp_nomb || ""} ${editingEsp?.esp_apel || ""}`.trim()}
            maxWidth="max-w-3xl"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (fotoUploading) return;
                if (!validarTodoEdit()) return;
                const ok = await handleUpdateEsp(e);
                if (ok) setShowEditEsp(false);
              }}
              className="space-y-6"
            >
              <div className="mb-5">
                <FotoPerfilZona
                  preview={editingEsp?.esp_foto}
                  onFileSelect={manejarFotoEdit}
                  uploading={fotoUploading}
                  progress={fotoProgress}
                  onRemove={quitarFotoEdit}
                />
                {fotoError && (
                  <p className="form-error">
                    <AlertCircle className="w-3.5 h-3.5" /> {fotoError}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Nombres</label>
                  <input
                    required
                    maxLength={50}
                    type="text"
                    value={editingEsp?.esp_nomb || ""}
                    onChange={(e) =>
                      setEditingEsp({ ...editingEsp, esp_nomb: e.target.value })
                    }
                    className="form-input"
                    placeholder="Ej. Roberto"
                  />
                </div>
                <div>
                  <label className="form-label">Apellidos</label>
                  <input
                    required
                    maxLength={50}
                    type="text"
                    value={editingEsp?.esp_apel || ""}
                    onChange={(e) =>
                      setEditingEsp({ ...editingEsp, esp_apel: e.target.value })
                    }
                    className="form-input"
                    placeholder="Ej. Sánchez"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">
                    Correo Electrónico Corporativo
                  </label>
                  <input
                    required
                    maxLength={50}
                    type="email"
                    value={editingEsp?.usu_crro || ""}
                    onChange={(e) =>
                      setEditingEsp({ ...editingEsp, usu_crro: e.target.value })
                    }
                    className="form-input"
                    placeholder="dr@clinica.com"
                  />
                </div>
                <div>
                  <label className="form-label">Teléfono de Contacto</label>
                  <input
                    maxLength={15}
                    type="text"
                    value={editingEsp?.esp_telf || ""}
                    onChange={(e) => {
                      setEditingEsp({
                        ...editingEsp,
                        esp_telf: e.target.value,
                      });
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_telf: validarCampoEdit("esp_telf"),
                      }));
                    }}
                    className={`form-input ${editErrores.esp_telf ? "form-input-invalid" : ""}`}
                    placeholder="+58 412 0000000"
                  />
                  {editErrores.esp_telf && (
                    <p className="form-error">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_telf}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="form-label">Licencia Médica / CM</label>
                  <input
                    maxLength={50}
                    type="text"
                    value={editingEsp?.esp_licencia || ""}
                    onChange={(e) => {
                      setEditingEsp({
                        ...editingEsp,
                        esp_licencia: e.target.value,
                      });
                      setEditErrores((prev) => ({
                        ...prev,
                        esp_licencia: validarCampoEdit("esp_licencia"),
                      }));
                    }}
                    className={`form-input ${editErrores.esp_licencia ? "form-input-invalid" : ""}`}
                    placeholder="Ej. CM-90800"
                  />
                  {editErrores.esp_licencia && (
                    <p className="form-error">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {editErrores.esp_licencia}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Sexo</label>
                  <select
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
                <div>
                  <label className="form-label">Especialidad</label>
                  <select
                    value={editingEsp?.esc_codi || ""}
                    onChange={(e) =>
                      setEditingEsp({ ...editingEsp, esc_codi: e.target.value })
                    }
                    className="form-select"
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
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowEditEsp(false)}
                  className="md:w-auto w-full px-6 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Directorio de Especialistas */}
          <div
            data-tour="admin-esp-directory"
            className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Nómina Médica / Especialistas
              </h2>
              <div className="flex gap-2">
                <button
                  data-tour="admin-esp-register-btn"
                  onClick={() => setShowRegistro(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Especialista
                </button>
                <button
                  onClick={exportEspecialistasToPDF}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  PDF
                </button>
                <button
                  onClick={exportEspecialistasToExcel}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                >
                  Excel
                </button>
              </div>
            </div>

            {/* Filtros */}
            <FilterBar
              embedded
              searchValue={searchEsp}
              onSearch={setSearchEsp}
              searchPlaceholder="Buscar por nombre o correo..."
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
            >
              <select
                value={filterEspecialidad}
                onChange={(e) => setFilterEspecialidad(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
              <select
                value={filterGenero}
                onChange={(e) => setFilterGenero(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="TODOS">Todos los géneros</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                title="Fecha desde"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                title="Fecha hasta"
              />
            </FilterBar>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm responsive-table">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase">
                      Profesional Clínico
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase">
                      Especialidad
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase">
                      Estado
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {pagedEspecialistas.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-500"
                      >
                        No se encontraron especialistas.
                      </td>
                    </tr>
                  ) : (
                    pagedEspecialistas.map((esp) => (
                      <tr
                        key={esp.esp_codi}
                        onClick={() => setPreviewEsp(esp)}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${expandedId === esp.esp_codi ? "mobile-expanded" : ""}`}
                      >
                        <>
                          <td
                            className="py-4 px-4 mobile-summary"
                            data-label="Profesional"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm">
                                {esp.esp_foto ? (
                                  <img
                                    src={esp.esp_foto}
                                    alt={`Foto de ${esp.esp_nomb} ${esp.esp_apel}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm">
                                    {esp.esp_nomb.charAt(0)}
                                    {esp.esp_apel.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {esp.esp_gner === "M" ? "Dr." : "Dra."}{" "}
                                  {esp.esp_nomb} {esp.esp_apel}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                            className="py-4 px-4 mobile-detail"
                            data-label="Especialidad"
                          >
                            <div className="min-w-0">
                              <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                {esp.tm_especi?.esc_nomb}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <Users className="w-3.5 h-3.5" />
                                {(() => {
                                  const n = esp._count?.tc_asign ?? 0;
                                  return `${n} paciente${n === 1 ? "" : "s"} asignado${n === 1 ? "" : "s"}`;
                                })()}
                              </div>
                            </div>
                          </td>
                          <td
                            className="py-4 px-4 mobile-detail"
                            data-label="Estado"
                          >
                            <StatusBadge active={esp.tm_usuar?.usu_estd} />
                          </td>
                          <td
                            className="py-4 px-4 text-right mobile-detail"
                            data-label="Acciones"
                          >
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingEsp({
                                    esp_codi: esp.esp_codi,
                                    esp_nomb: esp.esp_nomb,
                                    esp_apel: esp.esp_apel,
                                    usu_crro: esp.tm_usuar?.usu_crro || "",
                                    esp_gner: esp.esp_gner || "M",
                                    esp_telf: esp.esp_telf || "",
                                    esp_licencia: esp.esp_licencia || "",
                                    esp_foto: esp.esp_foto || "",
                                    esc_codi: esp.tm_especi?.esc_codi || "",
                                  });
                                  setShowEditEsp(true);
                                }}
                                className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetPassword(
                                    esp.esp_codi,
                                    esp.tm_usuar?.usu_crro || "",
                                  );
                                }}
                                className="action-icon-btn text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                title="Resetear contraseña"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
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
                                className={
                                  esp.tm_usuar?.usu_estd
                                    ? "action-icon-btn text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                    : "action-icon-btn text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                }
                              >
                                {esp.tm_usuar?.usu_estd ? (
                                  <Ban className="w-4 h-4" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pageEsp}
              totalPages={totalEspPages}
              onPageChange={setPageEsp}
            />
          </div>

          {/* Vista previa del especialista */}
          {previewEsp && (
            <AdminModal
              open={!!previewEsp}
              onClose={() => setPreviewEsp(null)}
              title="Vista previa del Especialista"
              subtitle={`${previewEsp.esp_nomb || ""} ${previewEsp.esp_apel || ""}`.trim()}
              maxWidth="max-w-xl"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm">
                    {previewEsp.esp_foto ? (
                      <img
                        src={previewEsp.esp_foto}
                        alt={`Foto de ${previewEsp.esp_nomb} ${previewEsp.esp_apel}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg">
                        {previewEsp.esp_nomb?.charAt(0) || "?"}
                        {previewEsp.esp_apel?.charAt(0) || ""}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {previewEsp.esp_gner === "M" ? "Dr." : "Dra."}{" "}
                      {previewEsp.esp_nomb} {previewEsp.esp_apel}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      ID: {previewEsp.esp_codi}
                    </div>
                    <div className="mt-1.5">
                      <StatusBadge active={previewEsp.tm_usuar?.usu_estd} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <Mail className="w-3.5 h-3.5" /> Correo Electrónico
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all">
                      {previewEsp.tm_usuar?.usu_crro || "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <Phone className="w-3.5 h-3.5" /> Teléfono de Contacto
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {previewEsp.esp_telf || "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <Stethoscope className="w-3.5 h-3.5" /> Especialidad
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {previewEsp.tm_especi?.esc_nomb || "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <IdCard className="w-3.5 h-3.5" /> Licencia Médica
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">
                      {previewEsp.esp_licencia || "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <User className="w-3.5 h-3.5" /> Sexo
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {previewEsp.esp_gner === "M" ? "Masculino" : "Femenino"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <Users className="w-3.5 h-3.5" /> Pacientes Asignados
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {(() => {
                        const n = previewEsp._count?.tc_asign ?? 0;
                        return `${n} paciente${n === 1 ? "" : "s"} activo${n === 1 ? "" : "s"}`;
                      })()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <Cake className="w-3.5 h-3.5" /> Fecha de Nacimiento
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {previewEsp.esp_fnac
                        ? new Date(previewEsp.esp_fnac).toLocaleDateString(
                            "es-VE",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="form-section-title">
                    <ShieldCheck className="form-section-title-icon" />
                    <h4 className="form-section-title-text">
                      Acreditación Clínica
                    </h4>
                    <span className="form-section-title-line" />
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
                      <BadgeCheck className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {previewEsp.tm_especi?.esc_nomb || "Sin especialidad"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {previewEsp.tm_usuar?.usu_estd
                          ? "Especialista activo"
                          : "Especialista inactivo"}
                      </div>
                    </div>
                  </div>
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
            onClose={() => setShowCatRegistro(false)}
            title="Registrar Nueva Especialidad"
            subtitle="Añadir una especialidad médica al catálogo oficial de la institución"
            maxWidth="max-w-3xl"
          >
            <form
              onSubmit={async (e) => {
                const ok = await handleCreateEspecialidad(e);
                if (ok) setShowCatRegistro(false);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label form-label-inline">
                      Denominación de la Especialidad
                    </label>
                    <span
                      className={`text-[11px] font-medium ${newEspCat.esc_nomb.length >= 45 ? "text-rose-500" : "text-slate-400"}`}
                    >
                      {newEspCat.esc_nomb.length}/50
                    </span>
                  </div>
                  <input
                    required
                    maxLength={50}
                    type="text"
                    value={newEspCat.esc_nomb}
                    onChange={(e) =>
                      setNewEspCat({ ...newEspCat, esc_nomb: e.target.value })
                    }
                    className="form-input"
                    placeholder="Ej. Psicología Clínica Infantil"
                  />
                </div>
                <div>
                  <label className="form-label">Código de Clasificación</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      maxLength={20}
                      type="text"
                      value={newEspCat.esc_codi}
                      onChange={(e) =>
                        setNewEspCat({
                          ...newEspCat,
                          esc_codi: e.target.value.toUpperCase(),
                        })
                      }
                      className="form-input !pl-9 !pr-4 font-mono"
                      placeholder="PSIC-01"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label form-label-inline">
                    Perfil Clínico y Competencias
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {newEspCat.esc_desc.length}/1000
                  </span>
                </div>
                <textarea
                  maxLength={1000}
                  value={newEspCat.esc_desc}
                  onChange={(e) =>
                    setNewEspCat({ ...newEspCat, esc_desc: e.target.value })
                  }
                  className="form-textarea h-32"
                  placeholder="Describa las competencias, población atendida y alcance clínico de la especialidad..."
                />
              </div>

              <div className="flex justify-end pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  disabled={loading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Registrar Especialidad
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal Editar Especialidad */}
          <AdminModal
            open={showEditEspCat}
            onClose={() => setShowEditEspCat(false)}
            title="Editar Especialidad"
            subtitle={editingEspCat?.esc_nomb || ""}
            maxWidth="max-w-3xl"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await handleUpdateEspecialidad(e);
                if (ok) setShowEditEspCat(false);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="form-label">
                    Denominación de la Especialidad
                  </label>
                  <input
                    required
                    maxLength={50}
                    type="text"
                    value={editingEspCat?.esc_nomb || ""}
                    onChange={(e) =>
                      setEditingEspCat({
                        ...editingEspCat,
                        esc_nomb: e.target.value,
                      })
                    }
                    className="form-input"
                    placeholder="Ej. Psicología Clínica Infantil"
                  />
                </div>
                <div>
                  <label className="form-label">Código de Clasificación</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      disabled
                      maxLength={20}
                      type="text"
                      value={editingEspCat?.esc_codi || ""}
                      className="form-input !pl-9 !pr-4 font-mono opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label">
                  Perfil Clínico y Competencias
                </label>
                <textarea
                  maxLength={1000}
                  value={editingEspCat?.esc_desc || ""}
                  onChange={(e) =>
                    setEditingEspCat({
                      ...editingEspCat,
                      esc_desc: e.target.value,
                    })
                  }
                  className="form-textarea h-32"
                  placeholder="Describa las competencias, población atendida y alcance clínico de la especialidad..."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowEditEspCat(false)}
                  className="md:w-auto w-full px-6 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </AdminModal>

          <div
            data-tour="admin-esp-catalog"
            className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Especialidades Médicas
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Catálogo oficial de la institución para el alta de
                  especialistas y la gestión clínica.
                </p>
              </div>
              <button
                data-tour="admin-esp-cat-btn"
                onClick={() => setShowCatRegistro(true)}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Añadir Especialidad
              </button>
            </div>

            <FilterBar
              embedded
              searchValue={searchEspCat}
              onSearch={setSearchEspCat}
              searchPlaceholder="Buscar especialidad..."
              activeCount={
                (searchEspCat ? 1 : 0) +
                (filterEspCatEstado !== "TODOS" ? 1 : 0)
              }
              onClearAll={clearEspCatFilters}
              chips={espCatFilterChips}
            >
              <select
                value={filterEspCatEstado}
                onChange={(e) => setFilterEspCatEstado(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactivo</option>
              </select>
            </FilterBar>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm responsive-table">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase">
                      Especialidad
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase">
                      Descripción Técnica
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase">
                      Estado
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredEspecialidades.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        No se encontraron especialidades con los filtros
                        aplicados.
                      </td>
                    </tr>
                  ) : (
                    pagedEspecialidades.map((esc) => (
                      <tr
                        key={esc.esc_codi}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 group ${expandedId === esc.esc_codi ? "mobile-expanded" : ""}`}
                      >
                        <>
                          <td
                            className="py-4 px-4 mobile-summary"
                            data-label="Especialidad"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {esc.esc_nomb}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
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
                            className="py-4 px-4 text-slate-600 dark:text-slate-400 mobile-detail"
                            data-label="Descripción"
                          >
                            <div className="line-clamp-2 max-w-md">
                              {esc.esc_desc || "-"}
                            </div>
                          </td>
                          <td
                            className="py-4 px-4 mobile-detail"
                            data-label="Estado"
                          >
                            <StatusBadge
                              active={esc.esc_estd !== false}
                              activeLabel="Activa"
                              inactiveLabel="Inactivo"
                            />
                          </td>
                          <td
                            className="py-4 px-4 text-right mobile-detail"
                            data-label="Acciones"
                          >
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingEspCat(esc);
                                  setShowEditEspCat(true);
                                }}
                                className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
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
                                className={`action-icon-btn text-slate-500 ${esc.esc_estd !== false ? "hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" : "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                              >
                                {esc.esc_estd !== false ? (
                                  <Archive className="w-4 h-4" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pageEspCat}
              totalPages={totalEspCatPages}
              onPageChange={setPageEspCat}
            />
          </div>
        </>
      )}
    </div>
  );
}
