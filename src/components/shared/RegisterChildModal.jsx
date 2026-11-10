import { useState, useRef, useCallback, useEffect } from "react";
import { useGlobalContext } from "../../context/GlobalState";
import api from "../../api/axios";
import ConfirmDialog from "./ConfirmDialog";
import useUnsavedChanges from "../../hooks/useUnsavedChanges";
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  FileText,
  Trash2,
  Eye,
  Info,
  HelpCircle,
  Baby,
  Phone,
  Mail,
  IdCard,
  Camera,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../../config/cloudinary";
import { toastError, extractFieldErrors } from "../../utils/errorHandler";
import {
  getAdultOrYouthDateBounds,
  getChildDateBounds,
  formatYmdForInput,
  calcAgeYears,
  sanitizeNombrePersona,
  sanitizeDocumento,
  sanitizeTelefonoVE,
  validateNombrePersona,
  validateFechaPaciente,
  validateFechaRangoEdad,
  validateDocumento,
  validateEmail,
  validateTelefonoMovilVE,
  focusFirstError,
} from "../../utils/validators";

// ─── Helpers ───────────────────────────────────────────────────────────────

function calcEdad(fechaNac) {
  return calcAgeYears(fechaNac);
}

const NIVEL_INFO = {
  "Nivel 1": {
    label: "Nivel 1 — Necesita Apoyo",
    desc: "Sin apoyos, los déficits en comunicación causan impedimentos notables. Dificultad para iniciar interacciones sociales. Inflexibilidad de comportamiento causa interferencia significativa. (DSM-5)",
    color:
      "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
  },
  "Nivel 2": {
    label: "Nivel 2 — Necesita Apoyo Sustancial",
    desc: "Déficits marcados en habilidades de comunicación social verbal y no verbal. Los déficits sociales son aparentes incluso con apoyos en marcha. (DSM-5)",
    color:
      "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  },
  "Nivel 3": {
    label: "Nivel 3 — Necesita Apoyo Muy Sustancial",
    desc: "Déficits severos en habilidades de comunicación social que causan impedimentos graves en el funcionamiento. Inflexibilidad de comportamiento, dificultad extrema para hacer frente a los cambios. (DSM-5)",
    color:
      "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  },
};

// ─── Componentes internos ───────────────────────────────────────────────────

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center ml-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white text-[10px] rounded-lg p-2.5 leading-relaxed z-50 shadow-xl">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
        </span>
      )}
    </span>
  );
}

function FieldLabel({ children, required, tooltip }) {
  return (
    <label className="form-label form-label-row">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
  );
}

function InfoCollapse({ tone = "amber", title, children }) {
  const tones = {
    amber:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300",
  };
  return (
    <details
      className={`group rounded-xl border ${tones[tone]} overflow-hidden`}
    >
      <summary className="flex items-center gap-2 px-4 py-3 text-xs font-bold cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <Info className="w-4 h-4 shrink-0" />
        <span className="flex-1">{title}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4 shrink-0 opacity-60 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-4 pb-3 pt-1 text-[11px] leading-relaxed">
        {children}
      </div>
    </details>
  );
}

function InputField({ ...props }) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 p-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-600 transition-colors ${className}`}
    />
  );
}

function SelectField({ children, ...props }) {
  const { className = "", ...rest } = props;
  return (
    <select {...rest} className={`form-select ${className}`}>
      {children}
    </select>
  );
}

// ─── Zona de subida de foto circular ───────────────────────────────────────

function PhotoUploadZone({
  preview,
  onFileSelect,
  uploading,
  progress,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative rounded-xl border border-dashed p-2.5 transition-all duration-200 ${
        dragging
          ? "border-brand-500 bg-brand-50/60 dark:bg-brand-900/20 scale-[1.01]"
          : "border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-brand-400 dark:hover:border-brand-500"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Compact Avatar Circle */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          title="Subir / cambiar foto"
          className={`relative w-14 h-14 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group transition-all ${
            uploading
              ? "opacity-60 cursor-wait"
              : "hover:ring-2 hover:ring-brand-500/30 hover:border-brand-500"
          }`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Foto del paciente"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mb-0.5" />
              <span className="text-[9px] font-bold">{progress}%</span>
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                Foto de Perfil
              </span>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                (Opcional)
              </span>
            </div>
          </div>

          {preview ? (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Cambiar foto
              </button>
              {onRemove && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 text-[11px]">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={onRemove}
                    disabled={uploading}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Quitar
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => !uploading && inputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Subir foto
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                JPG, PNG o WebP · Máx. 5 MB
              </p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onFileSelect(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}

// ─── Zona de subida de documentos (PDF) ────────────────────────────────────

function DocUploadZone({ files, onFilesAdd, onFileRemove, uploading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf",
      );
      if (dropped.length) onFilesAdd(dropped);
    },
    [onFilesAdd],
  );

  return (
    <div className="space-y-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200
          ${dragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30"}
          ${uploading ? "cursor-wait opacity-60" : "hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"}`}
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {dragging
              ? "Suelta los documentos aquí"
              : "Arrastrar o hacer click para adjuntar"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluación diagnóstica, informes médicos · Solo PDF · Máx. 10 MB c/u
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => onFilesAdd(Array.from(e.target.files))}
          className="hidden"
        />
      </div>

      {/* Lista de archivos añadidos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {f.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {f.uploadedUrl ? (
                <a
                  href={f.uploadedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  <Eye className="w-4 h-4" />
                </a>
              ) : f.uploading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin shrink-0"></div>
              ) : (
                <button
                  type="button"
                  onClick={() => onFileRemove(i)}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

const INITIAL_FORM = {
  // Paciente
  nin_nomb: "",
  nin_apel: "",
  nin_fnac: "",
  nin_gner: "M",
  nin_nivd: "Nivel 1",
  nin_diag: "",
  // Archivos (se llenan post-upload con URLs de Cloudinary)
  nin_foto: "",
  nin_docs: [],
  // Clínica
  sen_tipo: "",
  sen_nvli: "",
  sen_nota: "",
  // Representante
  rep_nomb: "",
  rep_apel: "",
  rep_fnac: "",
  rep_rela: "Madre",
  rep_telf: "",
  rep_cedu: "",
  usu_crro: "",
  rep_foto: "",
  // Consentimiento
  acepta_lopnna: false,
};

export default function RegisterChildModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useGlobalContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [stepErrors, setStepErrors] = useState({});
  const modalBodyRef = useRef(null);
  const childDateBounds = getChildDateBounds(25);
  const repDateBounds = getAdultOrYouthDateBounds(12, 75);

  // Representante existente detectado por cédula (se reutiliza automáticamente)
  const [repExistente, setRepExistente] = useState(null);
  const [buscandoRep, setBuscandoRep] = useState(false);

  // Upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [docFiles, setDocFiles] = useState([]);
  const [repPhotoPreview, setRepPhotoPreview] = useState(null);
  const [repPhotoUploading, setRepPhotoUploading] = useState(false);

  const isDirty = Boolean(
    form.nin_nomb?.trim() ||
    form.nin_apel?.trim() ||
    form.nin_fnac ||
    form.nin_diag?.trim() ||
    form.sen_tipo ||
    form.rep_cedu?.trim() ||
    form.rep_nomb?.trim() ||
    form.rep_apel?.trim() ||
    form.rep_fnac ||
    form.usu_crro?.trim() ||
    form.rep_telf?.trim() ||
    photoPreview ||
    repPhotoPreview ||
    docFiles.length > 0,
  );

  const {
    showDiscardConfirm,
    setShowDiscardConfirm,
    handleAttemptClose,
    confirmDiscard,
  } = useUnsavedChanges(isDirty, onClose);

  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleAttemptClose]);

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStepErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  // ── Búsqueda de representante existente por cédula (identificador único) ──
  const buscarRep = async (cedula) => {
    const digits = sanitizeDocumento(cedula, "V");
    if (digits.length < 6) return null;
    setBuscandoRep(true);
    try {
      const res = await api.get("/ninos/representante", {
        params: { cedula: digits },
      });
      const data = res.data?.data;
      if (data?.encontrado) {
        setRepExistente(data);
        set("rep_nomb", data.rep_nomb || "");
        set("rep_apel", data.rep_apel || "");
        set("rep_fnac", formatYmdForInput(data.rep_fnac));
        set("rep_rela", data.rep_rela || form.rep_rela);
        set("rep_telf", data.rep_telf || "");
        set("usu_crro", data.usu_crro || form.usu_crro);
        setStepErrors((prev) => ({
          ...prev,
          rep_nomb: "",
          rep_apel: "",
          rep_fnac: "",
          rep_rela: "",
          rep_telf: "",
          usu_crro: "",
        }));
        return data;
      }
      setRepExistente(null);
      return null;
    } catch {
      setRepExistente(null);
      return null;
    } finally {
      setBuscandoRep(false);
    }
  };

  // ── Handlers de foto ──
  const handlePhotoSelect = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ La foto no puede superar 5 MB");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFile(file);

    if (!isCloudinaryReady()) {
      // Si Cloudinary no está configurado, guardamos localmente (solo preview)
      set("nin_foto", "__local__");
      return;
    }

    setPhotoUploading(true);
    try {
      const { url } = await uploadToCloudinary(
        file,
        "image",
        FOLDERS.patientPhotos,
        setPhotoProgress,
      );
      set("nin_foto", url);
      showToast("✅ Foto de perfil subida correctamente");
    } catch {
      showToast("❌ Error al subir la foto. Se continuará sin ella.");
    } finally {
      setPhotoUploading(false);
      setPhotoProgress(0);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    set("nin_foto", "");
  };

  // ── Handlers de documentos ──
  const handleDocsAdd = async (newFiles) => {
    const oversized = newFiles.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      showToast(
        `❌ ${oversized.length} archivo(s) superan 10 MB y fueron omitidos`,
      );
      return;
    }

    const entries = newFiles.map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
      uploading: false,
      uploadedUrl: null,
    }));
    setDocFiles((prev) => [...prev, ...entries]);

    if (!isCloudinaryReady()) return; // Preview local únicamente

    for (let i = 0; i < newFiles.length; i++) {
      setDocFiles((prev) =>
        prev.map((d, idx) =>
          idx === docFiles.length + i ? { ...d, uploading: true } : d,
        ),
      );
      try {
        const { url } = await uploadToCloudinary(
          newFiles[i],
          "raw",
          FOLDERS.medicalDocs,
        );
        setDocFiles((prev) => {
          const updated = [...prev];
          const targetIdx = docFiles.length + i;
          updated[targetIdx] = {
            ...updated[targetIdx],
            uploading: false,
            uploadedUrl: url,
          };
          return updated;
        });
        set("nin_docs", [...(form.nin_docs || []), url]);
      } catch {
        showToast(`❌ No se pudo subir "${newFiles[i].name}"`);
        setDocFiles((prev) => {
          const updated = [...prev];
          updated[docFiles.length + i] = {
            ...updated[docFiles.length + i],
            uploading: false,
          };
          return updated;
        });
      }
    }
  };

  // ── Handler foto del representante ──
  const handleRepPhotoSelect = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ La foto no puede superar 5 MB");
      return;
    }
    setRepPhotoPreview(URL.createObjectURL(file));
    if (!isCloudinaryReady()) return;

    setRepPhotoUploading(true);
    try {
      const { url } = await uploadToCloudinary(
        file,
        "image",
        "siat/representantes/fotos",
      );
      set("rep_foto", url);
      showToast("✅ Foto del representante subida correctamente");
    } catch {
      showToast("❌ Error al subir la foto del representante.");
    } finally {
      setRepPhotoUploading(false);
    }
  };

  const handleDocRemove = (idx) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validaciones por paso ──
  const validateStep1 = () => {
    const errs = {};
    const nomErr = validateNombrePersona(form.nin_nomb, "El nombre", {
      required: true,
      max: 50,
    });
    if (nomErr) errs.nin_nomb = nomErr;

    const apelErr = validateNombrePersona(form.nin_apel, "El apellido", {
      required: true,
      max: 50,
    });
    if (apelErr) errs.nin_apel = apelErr;

    const fnacErr = validateFechaPaciente(form.nin_fnac, {
      required: true,
      maxAge: 25,
    });
    if (fnacErr) errs.nin_fnac = fnacErr;

    if (!form.nin_gner) errs.nin_gner = "Selecciona el sexo biológico";
    if (!form.nin_nivd) errs.nin_nivd = "Selecciona el nivel de soporte DSM-5";
    if (String(form.nin_diag || "").trim().length > 255) {
      errs.nin_diag = "El diagnóstico no puede exceder 255 caracteres";
    }
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (form.sen_tipo && !form.sen_nvli) {
      errs.sen_nvli = "Selecciona el nivel de impacto en el funcionamiento";
    }
    if (String(form.sen_nota || "").trim().length > 255) {
      errs.sen_nota = "Las notas clínicas no pueden exceder 255 caracteres";
    }
    return errs;
  };

  const validateStep3 = (repOverride) => {
    const rep = repOverride !== undefined ? repOverride : repExistente;
    const errs = {};
    const ceduDigits = sanitizeDocumento(form.rep_cedu, "V");

    const ceduErr = validateDocumento(ceduDigits, "V", { required: true });
    if (ceduErr) errs.rep_cedu = ceduErr;

    const correoVal = rep?.encontrado
      ? rep.usu_crro || form.usu_crro
      : form.usu_crro;
    const mailErr = validateEmail(correoVal, { required: true, max: 50 });
    if (mailErr) errs.usu_crro = mailErr;

    if (!rep?.encontrado) {
      const repNomErr = validateNombrePersona(form.rep_nomb, "El nombre", {
        required: true,
        max: 50,
      });
      if (repNomErr) errs.rep_nomb = repNomErr;

      const repApelErr = validateNombrePersona(form.rep_apel, "El apellido", {
        required: true,
        max: 50,
      });
      if (repApelErr) errs.rep_apel = repApelErr;

      const repFnacErr = validateFechaRangoEdad(form.rep_fnac, {
        minAge: 12,
        maxAge: 75,
        required: true,
        label: "La fecha de nacimiento",
      });
      if (repFnacErr) errs.rep_fnac = repFnacErr;

      if (!form.rep_rela) {
        errs.rep_rela = "Selecciona el vínculo legal con el paciente";
      }

      const repTelfErr = validateTelefonoMovilVE(form.rep_telf, {
        required: true,
      });
      if (repTelfErr) errs.rep_telf = repTelfErr;
    } else if (form.rep_fnac) {
      const repFnacErr = validateFechaRangoEdad(form.rep_fnac, {
        minAge: 12,
        maxAge: 75,
        required: false,
        label: "La fecha de nacimiento",
      });
      if (repFnacErr) errs.rep_fnac = repFnacErr;
    }

    if (!form.acepta_lopnna) {
      errs.acepta_lopnna =
        "Debes confirmar la autorización verbal conforme al Art. 65 LOPNNA";
    }
    return errs;
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        requestAnimationFrame(() => focusFirstError(errs, modalBodyRef));
        return;
      }
    }
    if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) {
        setStepErrors(errs);
        requestAnimationFrame(() => focusFirstError(errs, modalBodyRef));
        return;
      }
    }
    setStepErrors({});
    setStep((s) => s + 1);
    modalBodyRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const e1 = validateStep1();
    if (Object.keys(e1).length > 0) {
      setStep(1);
      setStepErrors(e1);
      requestAnimationFrame(() => focusFirstError(e1, modalBodyRef));
      return;
    }

    const e2 = validateStep2();
    if (Object.keys(e2).length > 0) {
      setStep(2);
      setStepErrors(e2);
      requestAnimationFrame(() => focusFirstError(e2, modalBodyRef));
      return;
    }

    // Si la cédula ya está escrita pero aún no se resolvió el representante,
    // buscarlo antes de validar para permitir la reutilización automática.
    let rep = repExistente;
    const ceduDigits = sanitizeDocumento(form.rep_cedu, "V");
    if (ceduDigits.length >= 6 && !rep && !buscandoRep) {
      rep = await buscarRep(form.rep_cedu);
    }

    const e3 = validateStep3(rep);
    if (Object.keys(e3).length > 0) {
      setStep(3);
      setStepErrors(e3);
      requestAnimationFrame(() => focusFirstError(e3, modalBodyRef));
      return;
    }

    setStepErrors({});
    setLoading(true);
    try {
      const payload = {
        nin_nomb: String(form.nin_nomb || "").trim(),
        nin_apel: String(form.nin_apel || "").trim(),
        nin_fnac: form.nin_fnac,
        nin_gner: form.nin_gner,
        nin_nivd: form.nin_nivd,
        ...(form.nin_diag &&
          form.nin_diag.trim() && { nin_diag: form.nin_diag.trim() }),
        ...((form.nin_docs?.length > 0 || docFiles.length > 0) && {
          nin_docs: [
            ...(Array.isArray(form.nin_docs) ? form.nin_docs : []),
            ...docFiles.map((d) => d.uploadedUrl || d.url).filter(Boolean),
          ].filter((url, index, self) => self.indexOf(url) === index),
        }),
        rep_nomb: rep?.rep_nomb || String(form.rep_nomb || "").trim(),
        rep_apel: rep?.rep_apel || String(form.rep_apel || "").trim(),
        ...(form.rep_fnac && { rep_fnac: form.rep_fnac }),
        rep_rela: rep?.rep_rela || form.rep_rela,
        rep_telf: rep?.rep_telf || String(form.rep_telf || "").trim(),
        rep_cedu: rep?.rep_cedu || ceduDigits,
        usu_crro: rep?.usu_crro || String(form.usu_crro || "").trim(),
        ...(!rep && form.rep_foto && { rep_foto: form.rep_foto }),
        ...(form.sen_tipo && {
          sen_tipo: form.sen_tipo,
          sen_nvli: form.sen_nvli,
          ...(form.sen_nota.trim() && { sen_nota: form.sen_nota.trim() }),
        }),
        ...(form.nin_foto &&
          form.nin_foto !== "__local__" && { nin_foto: form.nin_foto }),
      };
      const res = await api.post("/ninos/invite-representative", payload);
      const data = res.data?.data || {};
      onSuccess(data);
      if (data.reutilizado) {
        const r = data.representante;
        showToast(
          `✅ Paciente vinculado al representante ${r?.rep_nomb || ""} ${r?.rep_apel || ""}`.trim(),
        );
      } else {
        showToast("✅ Registro clínico completado exitosamente");
      }
      setForm(INITIAL_FORM);
      setStepErrors({});
      setRepExistente(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setDocFiles([]);
      setRepPhotoPreview(null);
      setStep(1);
      onClose();
    } catch (err) {
      const serverErrs = extractFieldErrors(err, { email: "usu_crro" });
      if (Object.keys(serverErrs).length > 0) {
        const keys = Object.keys(serverErrs);
        const targetStep = keys.some((k) => k.startsWith("nin_"))
          ? 1
          : keys.some((k) => k.startsWith("sen_"))
            ? 2
            : 3;
        setStep(targetStep);
        setStepErrors(serverErrs);
        requestAnimationFrame(() => focusFirstError(serverErrs, modalBodyRef));
      }
      toastError(err, showToast, "No se pudo completar el registro clínico.");
    } finally {
      setLoading(false);
    }
  };

  const edad = calcEdad(form.nin_fnac);
  const nivelInfo = NIVEL_INFO[form.nin_nivd];
  const docsUploading = docFiles.some((d) => d.uploading);

  const STEPS = [
    { num: 1, label: "Identidad", icon: Baby },
    { num: 2, label: "Clínica", icon: Activity },
    { num: 3, label: "Representante", icon: ShieldCheck },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 300);
          }
        }}
      >
        <div
          className={`bg-[#f8fafc] dark:bg-[#1a2332] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl flex flex-col border-t border-slate-200 dark:border-slate-700/80 sm:border max-h-[95dvh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 transition-transform ${
            isShaking ? "scale-[1.01] ring-2 ring-blue-500/30" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-700/60 dark:border-slate-800 shrink-0">
            <div className="sm:hidden absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/30" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl shrink-0 border border-blue-400/20">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Registro de Nuevo Paciente
                  </h3>
                </div>
              </div>
              <button
                onClick={handleAttemptClose}
                aria-label="Cerrar"
                className="text-slate-300 hover:text-white p-2.5 -m-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Stepper ── */}
          <div className="px-4 sm:px-7 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm
                    ${step > s.num ? "bg-brand-500 text-white" : step === s.num ? "bg-brand-600 text-white ring-4 ring-brand-200 dark:ring-brand-900" : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400"}`}
                    >
                      {step > s.num ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <s.icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold whitespace-nowrap ${step >= s.num ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full bg-brand-500 rounded-full transition-all duration-500 ${step > s.num ? "w-full" : "w-0"}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div
            ref={modalBodyRef}
            className="overflow-y-auto flex-1 px-4 sm:px-7 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6"
          >
            {Object.values(stepErrors).some(Boolean) && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>
                  Completa o corrige los{" "}
                  <strong>
                    {Object.values(stepErrors).filter(Boolean).length}
                  </strong>{" "}
                  campo(s) señalados para continuar.
                </span>
              </div>
            )}

            {/* ════════════ PASO 1: IDENTIDAD DEL PACIENTE ════════════ */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Foto de perfil compacta */}
                <PhotoUploadZone
                  preview={photoPreview}
                  onFileSelect={handlePhotoSelect}
                  uploading={photoUploading}
                  progress={photoProgress}
                  onRemove={handlePhotoRemove}
                />

                {/* Datos personales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      required
                      tooltip="Nombre(s) completo(s) según partida de nacimiento o cédula escolar."
                    >
                      Nombre(s) del Paciente
                    </FieldLabel>
                    <InputField
                      type="text"
                      data-field="nin_nomb"
                      name="nin_nomb"
                      maxLength={50}
                      value={form.nin_nomb}
                      onChange={(e) =>
                        set(
                          "nin_nomb",
                          sanitizeNombrePersona(e.target.value, 50),
                        )
                      }
                      aria-invalid={Boolean(stepErrors.nin_nomb)}
                      className={
                        stepErrors.nin_nomb ? "form-input-invalid" : ""
                      }
                      placeholder="Ej. José Andrés"
                    />
                    {stepErrors.nin_nomb && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.nin_nomb}
                      </p>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      required
                      tooltip="Apellido(s) completo(s) según documento de identidad."
                    >
                      Apellido(s)
                    </FieldLabel>
                    <InputField
                      type="text"
                      data-field="nin_apel"
                      name="nin_apel"
                      maxLength={50}
                      value={form.nin_apel}
                      onChange={(e) =>
                        set(
                          "nin_apel",
                          sanitizeNombrePersona(e.target.value, 50),
                        )
                      }
                      aria-invalid={Boolean(stepErrors.nin_apel)}
                      className={
                        stepErrors.nin_apel ? "form-input-invalid" : ""
                      }
                      placeholder="Ej. Rodríguez Pérez"
                    />
                    {stepErrors.nin_apel && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.nin_apel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      required
                      tooltip="Fecha de nacimiento exacta. Se usa para calcular la edad y adaptar los protocolos de seguimiento."
                    >
                      Fecha de Nacimiento
                    </FieldLabel>
                    <InputField
                      type="date"
                      data-field="nin_fnac"
                      name="nin_fnac"
                      value={form.nin_fnac}
                      min={childDateBounds.min}
                      max={childDateBounds.max}
                      onChange={(e) => set("nin_fnac", e.target.value)}
                      aria-invalid={Boolean(stepErrors.nin_fnac)}
                      className={
                        stepErrors.nin_fnac ? "form-input-invalid" : ""
                      }
                    />
                    {stepErrors.nin_fnac ? (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.nin_fnac}
                      </p>
                    ) : (
                      edad !== null && (
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 font-semibold">
                          → {edad} año{edad !== 1 ? "s" : ""} de edad
                        </p>
                      )
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      required
                      tooltip="Sexo biológico del paciente, relevante para el protocolo clínico y estadísticas de la institución."
                    >
                      Sexo Biológico
                    </FieldLabel>
                    <SelectField
                      data-field="nin_gner"
                      name="nin_gner"
                      value={form.nin_gner}
                      onChange={(e) => set("nin_gner", e.target.value)}
                      aria-invalid={Boolean(stepErrors.nin_gner)}
                      className={
                        stepErrors.nin_gner ? "form-input-invalid" : ""
                      }
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </SelectField>
                    {stepErrors.nin_gner && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.nin_gner}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nivel TEA */}
                <div data-field="nin_nivd">
                  <FieldLabel
                    required
                    tooltip="Nivel de soporte según la evaluación diagnóstica más reciente. Se recomienda seleccionar el nivel indicado en el informe del neuropediatra o psicólogo clínico."
                  >
                    Nivel de Soporte Requerido (Clasificación DSM-5)
                  </FieldLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(NIVEL_INFO).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("nin_nivd", key)}
                        className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${form.nin_nivd === key ? info.color + " border-current" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"}`}
                      >
                        <p
                          className={`text-xs font-bold mb-1 ${form.nin_nivd === key ? "" : "text-slate-600 dark:text-slate-400"}`}
                        >
                          {key}
                        </p>
                        <p
                          className={`text-[10px] leading-relaxed ${form.nin_nivd === key ? "" : "text-slate-400"}`}
                        >
                          {info.label.split("—")[1].trim()}
                        </p>
                      </button>
                    ))}
                  </div>
                  {stepErrors.nin_nivd && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {stepErrors.nin_nivd}
                    </p>
                  )}
                  {form.nin_nivd && (
                    <div
                      className={`mt-2 p-3 rounded-xl border text-[10px] leading-relaxed ${nivelInfo.color}`}
                    >
                      <strong>Criterio DSM-5:</strong> {nivelInfo.desc}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <FieldLabel tooltip="Descripción breve del diagnóstico (ej. 'TEA con Retraso del Lenguaje', 'TEA + TDAH'). Se mostrará en el expediente clínico del paciente.">
                      Descripción del Diagnóstico{" "}
                      <span className="text-slate-400 font-normal">
                        (Opcional)
                      </span>
                    </FieldLabel>
                    <span
                      className={`text-[11px] font-medium ${(form.nin_diag || "").length >= 230 ? "text-rose-500" : "text-slate-400"}`}
                    >
                      {(form.nin_diag || "").length}/255
                    </span>
                  </div>
                  <InputField
                    type="text"
                    data-field="nin_diag"
                    name="nin_diag"
                    maxLength={255}
                    value={form.nin_diag}
                    onChange={(e) => set("nin_diag", e.target.value)}
                    aria-invalid={Boolean(stepErrors.nin_diag)}
                    className={stepErrors.nin_diag ? "form-input-invalid" : ""}
                    placeholder="Ej. TEA Nivel 2 con retraso en el lenguaje expresivo"
                  />
                  {stepErrors.nin_diag && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {stepErrors.nin_diag}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ════════════ PASO 2: HISTORIAL CLÍNICO ════════════ */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <InfoCollapse
                  tone="amber"
                  title="¿Por qué pedimos esta información?"
                >
                  El algoritmo de detección de SIAT utiliza el perfil sensorial
                  del paciente para{" "}
                  <strong>calibrar los umbrales de alerta</strong> de los
                  sensores IoT y evitar falsos positivos desde el primer día de
                  monitoreo.
                </InfoCollapse>

                <div>
                  <FieldLabel tooltip="La sensibilidad o comorbilidad principal que el equipo clínico debe conocer para el manejo de alertas en tiempo real.">
                    Condición Sensorial o Comorbilidad Principal
                  </FieldLabel>
                  <SelectField
                    data-field="sen_tipo"
                    name="sen_tipo"
                    value={form.sen_tipo}
                    onChange={(e) => {
                      set("sen_tipo", e.target.value);
                      if (!e.target.value) {
                        set("sen_nvli", "");
                        setStepErrors((prev) => ({ ...prev, sen_nvli: "" }));
                      }
                    }}
                  >
                    <option value="">No reportada actualmente</option>
                    <optgroup label="Sensorialidades">
                      <option value="Auditiva">
                        Hipersensibilidad Auditiva (Hiperacusia)
                      </option>
                      <option value="Táctil">
                        Hipersensibilidad Táctil (Táctil Defensiva)
                      </option>
                      <option value="Visual">
                        Hipersensibilidad Visual (Fotofobia)
                      </option>
                      <option value="Olfativa">
                        Hipersensibilidad Olfativa
                      </option>
                      <option value="Vestibular">
                        Procesamiento Vestibular Atípico
                      </option>
                      <option value="Propioceptiva">
                        Procesamiento Propioceptivo Atípico
                      </option>
                    </optgroup>
                    <optgroup label="Comorbilidades">
                      <option value="TDAH">
                        Trastorno por Déficit de Atención (TDAH)
                      </option>
                      <option value="Ansiedad">
                        Trastorno de Ansiedad Generalizada
                      </option>
                      <option value="Epilepsia">
                        Epilepsia / Trastorno Convulsivo
                      </option>
                      <option value="TOC">
                        Trastorno Obsesivo Compulsivo (TOC)
                      </option>
                      <option value="DI">
                        Discapacidad Intelectual Concurrente
                      </option>
                    </optgroup>
                    <option value="Otro">Otra condición no listada</option>
                  </SelectField>
                </div>

                {form.sen_tipo && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                    <div data-field="sen_nvli">
                      <FieldLabel
                        required
                        tooltip="Nivel de impacto en el funcionamiento diario del paciente, según la evaluación del especialista."
                      >
                        Nivel de Impacto en el Funcionamiento
                      </FieldLabel>
                      <div
                        className={`grid grid-cols-3 gap-3 rounded-xl ${
                          stepErrors.sen_nvli
                            ? "p-1.5 ring-2 ring-rose-500/80 bg-rose-50/40 dark:bg-rose-950/20"
                            : ""
                        }`}
                      >
                        {[
                          {
                            val: "Leve",
                            desc: "Manejable con rutinas y anticipación.",
                            color:
                              "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20",
                          },
                          {
                            val: "Moderado",
                            desc: "Requiere contención activa con frecuencia.",
                            color:
                              "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20",
                          },
                          {
                            val: "Severo",
                            desc: "Desencadena crisis agudas. Requiere protocolo de emergencia.",
                            color:
                              "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20",
                          },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => set("sen_nvli", opt.val)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${form.sen_nvli === opt.val ? opt.color : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}
                          >
                            <p
                              className={`text-xs font-bold mb-1 ${form.sen_nvli === opt.val ? "" : "text-slate-600 dark:text-slate-400"}`}
                            >
                              {opt.val}
                            </p>
                            <p
                              className={`text-[10px] leading-relaxed ${form.sen_nvli === opt.val ? "" : "text-slate-400"}`}
                            >
                              {opt.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                      {stepErrors.sen_nvli && (
                        <p className="form-error" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" />{" "}
                          {stepErrors.sen_nvli}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <FieldLabel tooltip="Observaciones adicionales del clínico sobre la condición. Por ejemplo, desencadenantes conocidos, estrategias que funcionan, etc.">
                          Notas Clínicas Adicionales{" "}
                          <span className="text-slate-400 font-normal">
                            (Opcional)
                          </span>
                        </FieldLabel>
                        <span
                          className={`text-[11px] font-medium ${(form.sen_nota || "").length >= 230 ? "text-rose-500" : "text-slate-400"}`}
                        >
                          {(form.sen_nota || "").length}/255
                        </span>
                      </div>
                      <textarea
                        data-field="sen_nota"
                        name="sen_nota"
                        maxLength={255}
                        value={form.sen_nota}
                        onChange={(e) => set("sen_nota", e.target.value)}
                        rows={3}
                        placeholder="Ej. Reactivo a sonidos agudos en frecuencias >2kHz. Se calma con música instrumental suave. Estrategia: auriculares de reducción de ruido."
                        className={`form-textarea !py-3 resize-none ${stepErrors.sen_nota ? "form-input-invalid" : ""}`}
                      />
                      {stepErrors.sen_nota && (
                        <p className="form-error" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" />{" "}
                          {stepErrors.sen_nota}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Documentos médicos */}
                <div>
                  <FieldLabel tooltip="Adjunta la evaluación diagnóstica, informes de neuropediatría, psicología, fonoaudiología u otros especialistas. Se almacenarán de forma segura y encriptada.">
                    Documentos Clínicos{" "}
                    <span className="text-slate-400 font-normal">
                      (Opcional, pero recomendado)
                    </span>
                  </FieldLabel>
                  {!isCloudinaryReady() && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl mb-3">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                        Cloudinary aún no está configurado. Los documentos se
                        listarán localmente. Cuando configures las credenciales
                        mañana se subirán automáticamente.
                      </p>
                    </div>
                  )}
                  <DocUploadZone
                    files={docFiles}
                    onFilesAdd={handleDocsAdd}
                    onFileRemove={handleDocRemove}
                    uploading={docsUploading}
                  />
                </div>
              </div>
            )}

            {/* ════════════ PASO 3: REPRESENTANTE LEGAL ════════════ */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <InfoCollapse tone="blue" title="Protección legal (LOPNNA)">
                  Según el <strong>Artículo 65 LOPNNA</strong>, el representante
                  legal deberá completar el consentimiento informado
                  digitalizado al activar su cuenta mediante el enlace que SIAT
                  generará al finalizar este registro.
                </InfoCollapse>

                {/* Cédula: identificador único del representante (primer campo) */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Foto del representante */}
                  <div className="shrink-0">
                    <FieldLabel tooltip="JPG, PNG o WebP · Máx. 5 MB. Foto de identificación del representante legal.">
                      Foto del Representante{" "}
                      <span className="text-slate-400 font-normal">
                        (Opcional)
                      </span>
                    </FieldLabel>
                    <div
                      onClick={() =>
                        !repPhotoUploading &&
                        document.getElementById("rep-photo-input")?.click()
                      }
                      className={`relative w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 group mt-2
                      ${repPhotoUploading ? "cursor-wait opacity-60" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-brand-500"}`}
                    >
                      {repPhotoPreview ? (
                        <>
                          <img
                            src={repPhotoPreview}
                            alt="Foto del representante"
                            className="w-full h-full object-cover"
                          />
                          {form.rep_foto && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </>
                      ) : (
                        <User className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                      )}
                      {repPhotoUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <input
                      id="rep-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleRepPhotoSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 flex-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel
                        required
                        tooltip="Identificador único en el sistema. Al salir del campo se verifica automáticamente si ya está registrado: en ese caso el nuevo paciente se vinculará a su cuenta existente."
                      >
                        <IdCard className="w-3 h-3" /> Cédula de Identidad
                      </FieldLabel>
                      <InputField
                        type="text"
                        data-field="rep_cedu"
                        name="rep_cedu"
                        inputMode="numeric"
                        maxLength={8}
                        value={form.rep_cedu}
                        onChange={(e) => {
                          set(
                            "rep_cedu",
                            sanitizeDocumento(e.target.value, "V"),
                          );
                          setRepExistente(null);
                        }}
                        onBlur={(e) => buscarRep(e.target.value)}
                        aria-invalid={Boolean(stepErrors.rep_cedu)}
                        placeholder="Ej. 12345678"
                        className={`border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 ${stepErrors.rep_cedu ? "form-input-invalid" : ""}`}
                      />
                      {stepErrors.rep_cedu && (
                        <p className="form-error" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" />{" "}
                          {stepErrors.rep_cedu}
                        </p>
                      )}
                    </div>
                    <div>
                      <FieldLabel
                        required
                        tooltip="SIAT generará credenciales seguras y enviará a este correo el enlace de activación de la cuenta del representante, cifrado de extremo a extremo."
                      >
                        <Mail className="w-3 h-3" /> Correo Electrónico de
                        Acceso
                      </FieldLabel>
                      <InputField
                        type="email"
                        data-field="usu_crro"
                        name="usu_crro"
                        maxLength={50}
                        value={form.usu_crro}
                        onChange={(e) => set("usu_crro", e.target.value)}
                        disabled={!!repExistente}
                        aria-invalid={Boolean(stepErrors.usu_crro)}
                        placeholder="correo@ejemplo.com"
                        className={`${
                          repExistente
                            ? "opacity-70"
                            : "border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10"
                        } ${stepErrors.usu_crro ? "form-input-invalid" : ""}`}
                      />
                      {stepErrors.usu_crro && (
                        <p className="form-error" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" />{" "}
                          {stepErrors.usu_crro}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {buscandoRep && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                    Verificando si el representante ya está registrado...
                  </div>
                )}

                {repExistente && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Representante ya registrado en SIAT
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                        {repExistente.rep_nomb} {repExistente.rep_apel} ·{" "}
                        {repExistente.rep_rela} · Tiene {repExistente.ninos}{" "}
                        paciente{repExistente.ninos !== 1 ? "s" : ""}. El nuevo
                        paciente se vinculará automáticamente a este
                        representante existente (no se enviará una nueva
                        invitación).
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      required={!repExistente}
                      tooltip="Nombre(s) del padre, madre o tutor legal responsable del paciente."
                    >
                      <User className="w-3 h-3" /> Nombre(s) del Representante
                    </FieldLabel>
                    <InputField
                      type="text"
                      data-field="rep_nomb"
                      name="rep_nomb"
                      maxLength={50}
                      value={form.rep_nomb}
                      onChange={(e) =>
                        set(
                          "rep_nomb",
                          sanitizeNombrePersona(e.target.value, 50),
                        )
                      }
                      placeholder="Ej. María Elena"
                      disabled={!!repExistente}
                      aria-invalid={Boolean(stepErrors.rep_nomb)}
                      className={`${repExistente ? "opacity-70" : ""} ${stepErrors.rep_nomb ? "form-input-invalid" : ""}`}
                    />
                    {stepErrors.rep_nomb && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.rep_nomb}
                      </p>
                    )}
                  </div>
                  <div>
                    <FieldLabel required={!repExistente}>
                      Apellido(s)
                    </FieldLabel>
                    <InputField
                      type="text"
                      data-field="rep_apel"
                      name="rep_apel"
                      maxLength={50}
                      value={form.rep_apel}
                      onChange={(e) =>
                        set(
                          "rep_apel",
                          sanitizeNombrePersona(e.target.value, 50),
                        )
                      }
                      placeholder="Ej. Rodríguez"
                      disabled={!!repExistente}
                      aria-invalid={Boolean(stepErrors.rep_apel)}
                      className={`${repExistente ? "opacity-70" : ""} ${stepErrors.rep_apel ? "form-input-invalid" : ""}`}
                    />
                    {stepErrors.rep_apel && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.rep_apel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel
                      required={!repExistente}
                      tooltip="Fecha de nacimiento del representante (edad entre 12 y 75 años)."
                    >
                      <Calendar className="w-3 h-3" /> Fecha de Nacimiento
                    </FieldLabel>
                    <InputField
                      type="date"
                      data-field="rep_fnac"
                      name="rep_fnac"
                      min={repDateBounds.min}
                      max={repDateBounds.max}
                      value={form.rep_fnac || ""}
                      onChange={(e) => set("rep_fnac", e.target.value)}
                      disabled={Boolean(repExistente && repExistente.rep_fnac)}
                      aria-invalid={Boolean(stepErrors.rep_fnac)}
                      className={`${repExistente && repExistente.rep_fnac ? "opacity-70" : ""} ${stepErrors.rep_fnac ? "form-input-invalid" : ""}`}
                    />
                    {stepErrors.rep_fnac ? (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.rep_fnac}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        12 a 75 años
                      </p>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      required={!repExistente}
                      tooltip="Vínculo legal con el paciente. Determina el nivel de acceso y responsabilidad en el sistema."
                    >
                      <IdCard className="w-3 h-3" /> Parentesco / Vínculo
                    </FieldLabel>
                    <SelectField
                      data-field="rep_rela"
                      name="rep_rela"
                      value={form.rep_rela}
                      onChange={(e) => set("rep_rela", e.target.value)}
                      disabled={!!repExistente}
                      aria-invalid={Boolean(stepErrors.rep_rela)}
                      className={
                        stepErrors.rep_rela ? "form-input-invalid" : ""
                      }
                    >
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Tutor Legal">
                        Tutor Legal (designado por tribunal)
                      </option>
                      <option value="Abuelo/a">Abuelo/a</option>
                      <option value="Hermano/a Mayor">
                        Hermano/a Mayor de edad
                      </option>
                      <option value="Otro Familiar">
                        Otro Familiar Directo
                      </option>
                    </SelectField>
                    {stepErrors.rep_rela && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.rep_rela}
                      </p>
                    )}
                  </div>
                  <div>
                    <FieldLabel
                      required={!repExistente}
                      tooltip="Número de contacto principal en formato 04120000000 o +584120000000."
                    >
                      <Phone className="w-3 h-3" /> Teléfono Móvil
                    </FieldLabel>
                    <InputField
                      type="tel"
                      data-field="rep_telf"
                      name="rep_telf"
                      inputMode="tel"
                      maxLength={
                        (form.rep_telf || "").startsWith("+") ? 13 : 11
                      }
                      value={form.rep_telf}
                      onChange={(e) =>
                        set("rep_telf", sanitizeTelefonoVE(e.target.value))
                      }
                      placeholder="04120000000 o +584120000000"
                      disabled={!!repExistente}
                      aria-invalid={Boolean(stepErrors.rep_telf)}
                      className={`border-slate-200 dark:border-slate-700 focus:ring-emerald-500 ${repExistente ? "opacity-70" : ""} ${stepErrors.rep_telf ? "form-input-invalid" : ""}`}
                    />
                    {stepErrors.rep_telf && (
                      <p className="form-error" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" />{" "}
                        {stepErrors.rep_telf}
                      </p>
                    )}
                  </div>
                </div>

                {/* Consentimiento del especialista */}
                <div
                  data-field="acepta_lopnna"
                  className={`p-4 rounded-xl border transition-colors ${
                    stepErrors.acepta_lopnna
                      ? "bg-rose-50/70 dark:bg-rose-950/25 border-rose-500 ring-2 ring-rose-500/20"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acepta_lopnna"
                      checked={form.acepta_lopnna}
                      onChange={(e) => set("acepta_lopnna", e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Confirmo que cuento con autorización verbal del
                      representante legal para registrar al paciente en el
                      sistema, y que el representante será notificado y deberá
                      aceptar el consentimiento informado digital conforme al
                      <strong className="text-slate-800 dark:text-slate-200">
                        {" "}
                        Artículo 65 de la LOPNNA{" "}
                      </strong>
                      y la{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        Ley de Infogobierno Art. 79
                      </strong>
                      .
                    </span>
                  </label>
                  {stepErrors.acepta_lopnna && (
                    <p className="form-error mt-2" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {stepErrors.acepta_lopnna}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-4 sm:px-7 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 rounded-b-3xl flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] sm:[padding-bottom:1rem]">
            <div className="text-[10px] text-slate-400">
              Paso {step} de {STEPS.length} ·{" "}
              {step === 1
                ? "Datos del paciente"
                : step === 2
                  ? "Perfil clínico"
                  : "Representante legal"}
            </div>
            <div className="flex items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm text-slate-500 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-sm shadow-blue-600/20"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    photoUploading ||
                    repPhotoUploading ||
                    docsUploading
                  }
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Completar Registro
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para evitar pérdida accidental de datos clínicos */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={confirmDiscard}
        title="¿Descartar registro del paciente?"
        message="Tienes información ingresada en la ficha de este paciente. Si sales ahora, se perderán todos los datos y archivos cargados."
        type="danger"
        confirmLabel="Descartar y salir"
        cancelLabel="Continuar completando"
      />
    </>
  );
}
