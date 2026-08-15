import { useState, useRef, useCallback } from "react";
import { useGlobalContext } from "../../context/GlobalState";
import api from "../../api/axios";
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
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
} from "lucide-react";
import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../../config/cloudinary";
import { toastError } from "../../utils/errorHandler";

// ─── Helpers ───────────────────────────────────────────────────────────────

function calcEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let años = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) años--;
  return años;
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

function InputField({ ...props }) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`form-input ${className}`} />;
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

function PhotoUploadZone({ preview, onFileSelect, uploading, progress }) {
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
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative w-36 h-36 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 group
          ${dragging ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-105" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50"}
          ${uploading ? "cursor-wait" : "hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10"}`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Foto del paciente"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
              <Camera className="w-6 h-6 text-white" />
              <span className="text-white text-[10px] font-semibold">
                Cambiar foto
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors gap-2 px-3 text-center">
            <UploadCloud className="w-8 h-8" />
            <span className="text-[10px] font-semibold leading-tight">
              {dragging ? "Suelta aquí" : "Foto de perfil"}
            </span>
          </div>
        )}

        {/* Progress ring */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-1"></div>
              <span className="text-xs font-bold">{progress}%</span>
            </div>
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
      <p className="text-[10px] text-slate-400 text-center max-w-[130px] leading-relaxed">
        Foto de identificación del paciente.
        <br />
        JPG, PNG o WebP · Máx. 5 MB
      </p>
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
  rep_rela: "Madre",
  rep_telf: "",
  rep_cedu: "",
  usu_crro: "",
  // Consentimiento
  acepta_lopnna: false,
};

export default function RegisterChildModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useGlobalContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  // Representante existente detectado por correo (se reutiliza automáticamente)
  const [repExistente, setRepExistente] = useState(null);
  const [buscandoRep, setBuscandoRep] = useState(false);

  // Upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [docFiles, setDocFiles] = useState([]);

  if (!isOpen) return null;

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Búsqueda de representante existente por cédula (identificador único) ──
  const buscarRep = async (cedula) => {
    const digits = String(cedula || "").replace(/\D/g, "");
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
        set("rep_rela", data.rep_rela || form.rep_rela);
        set("rep_telf", data.rep_telf || "");
        set("usu_crro", data.usu_crro || form.usu_crro);
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

  const handleDocRemove = (idx) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validaciones por paso ──
  const v1 = () =>
    form.nin_nomb.trim() &&
    form.nin_apel.trim() &&
    form.nin_fnac &&
    form.nin_gner;
  const v2 = () => !form.sen_tipo || (form.sen_tipo && form.sen_nvli);

  const handleNext = () => {
    if (step === 1 && !v1()) {
      showToast("⚠️ Completa los datos básicos del paciente");
      return;
    }
    if (step === 2 && !v2()) {
      showToast("⚠️ Selecciona la severidad de la condición clínica");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!v1() || !v2()) {
      showToast("⚠️ Hay campos requeridos sin completar");
      return;
    }

    // Si la cédula ya está escrita pero aún no se resolvió el representante,
    // buscarlo antes de validar para permitir la reutilización automática.
    let rep = repExistente;
    const ceduDigits = form.rep_cedu.replace(/\D/g, "");
    if (ceduDigits.length >= 6 && !rep && !buscandoRep) {
      rep = await buscarRep(form.rep_cedu);
    }

    if (
      !form.acepta_lopnna ||
      ceduDigits.length < 6 ||
      !form.usu_crro.includes("@") ||
      (!rep?.encontrado &&
        !(
          form.rep_nomb.trim() &&
          form.rep_apel.trim() &&
          form.rep_rela &&
          form.rep_telf.trim().length >= 7
        ))
    ) {
      showToast("⚠️ Hay campos requeridos sin completar");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nin_nomb: form.nin_nomb,
        nin_apel: form.nin_apel,
        nin_fnac: form.nin_fnac,
        nin_gner: form.nin_gner,
        nin_nivd: form.nin_nivd,
        rep_nomb: rep?.rep_nomb || form.rep_nomb,
        rep_apel: rep?.rep_apel || form.rep_apel,
        rep_rela: rep?.rep_rela || form.rep_rela,
        rep_telf: rep?.rep_telf || form.rep_telf,
        rep_cedu: rep?.rep_cedu || ceduDigits,
        usu_crro: rep?.usu_crro || form.usu_crro,
        ...(form.sen_tipo && {
          sen_tipo: form.sen_tipo,
          sen_nvli: form.sen_nvli,
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
      setRepExistente(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setDocFiles([]);
      setStep(1);
      onClose();
    } catch (err) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 px-7 py-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Registro de Nuevo Paciente
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Formulario de ingreso al Sistema Integrado de Asignación y
              Seguimiento de Terapia
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className="px-7 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
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
        <div className="overflow-y-auto flex-1 px-7 py-6">
          {/* ════════════ PASO 1: IDENTIDAD DEL PACIENTE ════════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Foto */}
                <div className="md:border-r md:border-slate-200 md:dark:border-slate-700 md:pr-6 flex-shrink-0">
                  <PhotoUploadZone
                    preview={photoPreview}
                    onFileSelect={handlePhotoSelect}
                    uploading={photoUploading}
                    progress={photoProgress}
                  />
                </div>

                {/* Datos personales */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel
                        required
                        tooltip="Nombre(s) completo(s) según partida de nacimiento o cédula escolar."
                      >
                        Nombre(s) del Paciente
                      </FieldLabel>
                      <InputField
                        type="text"
                        value={form.nin_nomb}
                        onChange={(e) => set("nin_nomb", e.target.value)}
                        placeholder="Ej. José Andrés"
                      />
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
                        value={form.nin_apel}
                        onChange={(e) => set("nin_apel", e.target.value)}
                        placeholder="Ej. Rodríguez Pérez"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel
                        required
                        tooltip="Fecha de nacimiento exacta. Se usa para calcular la edad y adaptar los protocolos de seguimiento."
                      >
                        Fecha de Nacimiento
                      </FieldLabel>
                      <InputField
                        type="date"
                        value={form.nin_fnac}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => set("nin_fnac", e.target.value)}
                      />
                      {edad !== null && (
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 font-semibold">
                          → {edad} año{edad !== 1 ? "s" : ""} de edad
                        </p>
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
                        value={form.nin_gner}
                        onChange={(e) => set("nin_gner", e.target.value)}
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </SelectField>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nivel TEA */}
              <div>
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
                {form.nin_nivd && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-[10px] leading-relaxed ${nivelInfo.color}`}
                  >
                    <strong>Criterio DSM-5:</strong> {nivelInfo.desc}
                  </div>
                )}
              </div>

              <div>
                <FieldLabel tooltip="Descripción breve del diagnóstico (ej. 'TEA con Retraso del Lenguaje', 'TEA + TDAH'). Se mostrará en el expediente clínico del paciente.">
                  Descripción del Diagnóstico{" "}
                  <span className="text-slate-400 font-normal">(Opcional)</span>
                </FieldLabel>
                <InputField
                  type="text"
                  value={form.nin_diag}
                  onChange={(e) => set("nin_diag", e.target.value)}
                  placeholder="Ej. TEA Nivel 2 con retraso en el lenguaje expresivo"
                />
              </div>
            </div>
          )}

          {/* ════════════ PASO 2: HISTORIAL CLÍNICO ════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    ¿Por qué es importante esta información?
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    El algoritmo de detección de SIAT utiliza el perfil
                    sensorial del paciente para
                    <strong> calibrar los umbrales de alerta</strong> de los
                    sensores IoT y reducir falsos positivos desde el primer día
                    de monitoreo.
                  </p>
                </div>
              </div>

              <div>
                <FieldLabel tooltip="La sensibilidad o comorbilidad principal que el equipo clínico debe conocer para el manejo de alertas en tiempo real.">
                  Condición Sensorial o Comorbilidad Principal
                </FieldLabel>
                <SelectField
                  value={form.sen_tipo}
                  onChange={(e) => {
                    set("sen_tipo", e.target.value);
                    if (!e.target.value) set("sen_nvli", "");
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
                    <option value="Olfativa">Hipersensibilidad Olfativa</option>
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
                  <div>
                    <FieldLabel
                      required
                      tooltip="Nivel de impacto en el funcionamiento diario del paciente, según la evaluación del especialista."
                    >
                      Nivel de Impacto en el Funcionamiento
                    </FieldLabel>
                    <div className="grid grid-cols-3 gap-3">
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
                  </div>

                  <div>
                    <FieldLabel tooltip="Observaciones adicionales del clínico sobre la condición. Por ejemplo, desencadenantes conocidos, estrategias que funcionan, etc.">
                      Notas Clínicas Adicionales{" "}
                      <span className="text-slate-400 font-normal">
                        (Opcional)
                      </span>
                    </FieldLabel>
                    <textarea
                      value={form.sen_nota}
                      onChange={(e) => set("sen_nota", e.target.value)}
                      rows={3}
                      placeholder="Ej. Reactivo a sonidos agudos en frecuencias >2kHz. Se calma con música instrumental suave. Estrategia: auriculares de reducción de ruido."
                      className="form-textarea !py-3 resize-none"
                    />
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
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  Según el <strong>Artículo 65 LOPNNA</strong>, el representante
                  legal deberá completar el consentimiento informado
                  digitalizado al activar su cuenta mediante el enlace que SIAT
                  generará al finalizar este registro.
                </p>
              </div>

              {/* Cédula: identificador único del representante (primer campo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    required
                    tooltip="Cédula de identidad del representante. Es única en el sistema: si ya está registrado, el nuevo paciente se vinculará automáticamente a su cuenta."
                  >
                    <IdCard className="w-3 h-3" /> Cédula de Identidad
                  </FieldLabel>
                  <InputField
                    type="text"
                    inputMode="numeric"
                    value={form.rep_cedu}
                    onChange={(e) => {
                      set("rep_cedu", e.target.value.replace(/\D/g, ""));
                      setRepExistente(null);
                    }}
                    onBlur={(e) => buscarRep(e.target.value)}
                    placeholder="Ej. 12345678"
                    className="border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Al salir del campo se consultará si ya existe un
                    representante registrado con esta cédula.
                  </p>
                </div>
                <div>
                  <FieldLabel
                    required
                    tooltip="Correo electrónico al que se enviará el enlace de activación de la cuenta del representante en SIAT."
                  >
                    <Mail className="w-3 h-3" /> Correo Electrónico de Acceso
                  </FieldLabel>
                  <InputField
                    type="email"
                    value={form.usu_crro}
                    onChange={(e) => set("usu_crro", e.target.value)}
                    placeholder="correo@ejemplo.com"
                    disabled={!!repExistente}
                    className={
                      repExistente
                        ? "opacity-70"
                        : "border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10"
                    }
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                    {repExistente
                      ? "Se usará el correo ya registrado del representante."
                      : "SIAT generará credenciales seguras y las enviará cifradas a este correo."}
                  </p>
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
                      paciente se vinculará automáticamente a este representante
                      existente (no se enviará una nueva invitación).
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    required
                    tooltip="Nombre(s) del padre, madre o tutor legal responsable del paciente."
                  >
                    <User className="w-3 h-3" /> Nombre(s) del Representante
                  </FieldLabel>
                  <InputField
                    type="text"
                    value={form.rep_nomb}
                    onChange={(e) => set("rep_nomb", e.target.value)}
                    placeholder="Ej. María Elena"
                    disabled={!!repExistente}
                    className={repExistente ? "opacity-70" : ""}
                  />
                </div>
                <div>
                  <FieldLabel required>Apellido(s)</FieldLabel>
                  <InputField
                    type="text"
                    value={form.rep_apel}
                    onChange={(e) => set("rep_apel", e.target.value)}
                    placeholder="Ej. Rodríguez"
                    disabled={!!repExistente}
                    className={repExistente ? "opacity-70" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    required
                    tooltip="Vínculo legal con el paciente. Determina el nivel de acceso y responsabilidad en el sistema."
                  >
                    <IdCard className="w-3 h-3" /> Parentesco / Vínculo Legal
                  </FieldLabel>
                  <SelectField
                    value={form.rep_rela}
                    onChange={(e) => set("rep_rela", e.target.value)}
                    disabled={!!repExistente}
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
                    <option value="Otro Familiar">Otro Familiar Directo</option>
                  </SelectField>
                </div>
                <div>
                  <FieldLabel
                    required
                    tooltip="Número de contacto principal. Se usará para notificaciones de emergencia."
                  >
                    <Phone className="w-3 h-3" /> Teléfono Móvil de Contacto
                  </FieldLabel>
                  <InputField
                    type="tel"
                    value={form.rep_telf}
                    onChange={(e) => set("rep_telf", e.target.value)}
                    placeholder="Ej. +58 424 1234567"
                    disabled={!!repExistente}
                    className={`border-slate-200 dark:border-slate-700 focus:ring-emerald-500 ${repExistente ? "opacity-70" : ""}`}
                  />
                </div>
              </div>

              {/* Consentimiento del especialista */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
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
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 rounded-b-3xl flex items-center justify-between gap-4">
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
                className="px-4 py-2.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-slate-500 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold rounded-xl flex items-center gap-2 text-sm transition-all shadow-md shadow-brand-600/20 hover:-translate-y-0.5"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !form.acepta_lopnna || docsUploading}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-md shadow-brand-600/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
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
  );
}
