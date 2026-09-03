import { useState, useRef } from "react";
import {
  Building2,
  FileText,
  Users,
  Stethoscope,
  Clock,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  Plus,
  Save,
  Loader2,
  Tag,
  Camera,
} from "lucide-react";
import { uploadToCloudinary, isCloudinaryReady } from "../../config/cloudinary";

export default function CatalogosTab({
  catalogos = {},
  editingInst,
  setEditingInst,
  loading = false,
  handleUpdateInstitucion,
  ninosCount = 0,
  especialistasCount = 0,
  representantesCount = 0,
  usuariosCount = 0,
  onNavigateTab,
}) {
  const [activeSubTab, setActiveSubTab] = useState("info");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const fallbackInst = catalogos.instituciones?.[0] || {
    ins_codi: "J-50493821-0",
    ins_nomb: "Fundación SIAT",
    ins_dire: "Av. Principal, Edif. SIAT, Caracas",
    ins_telf: "+58 212-5550100",
    ins_emai: "contacto@fundacionsiat.org",
    ins_web: "https://fundacionsiat.org",
    ins_pers: "Dra. María Fernández",
    ins_logo: "",
  };

  const inst = editingInst || fallbackInst;

  const updateField = (field, value) => {
    setEditingInst({
      ...inst,
      [field]: value,
    });
  };

  // Local clinical state
  const [modalities, setModalities] = useState([
    "Terapia Ocupacional",
    "Integración Sensorial",
    "Terapia del Lenguaje",
    "Psicopedagogía Clínica",
    "Fisioterapia Infantil",
    "Psicología Infantil",
  ]);
  const [newModality, setNewModality] = useState("");
  const [schedule, setSchedule] = useState({
    weekday: inst.ins_horario_semana || "Lunes a Viernes 08:00 - 17:00",
    saturday: inst.ins_horario_sabado || "Sábados 08:00 - 12:00",
    emergency: "Bajo Cita Previa / Guardias Clínicas",
  });
  const [protocolNotes, setProtocolNotes] = useState(
    inst.ins_protocolo ||
      "Esta institución cumple con los protocolos de seguridad y estándares internacionales de terapia del neurodesarrollo infantil SIAT.",
  );

  const handleToggleModality = (mod) => {
    setModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  const handleAddModality = (e) => {
    e.preventDefault();
    if (!newModality.trim()) return;
    if (!modalities.includes(newModality.trim())) {
      setModalities((prev) => [...prev, newModality.trim()]);
    }
    setNewModality("");
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadProgress(10);

    try {
      if (isCloudinaryReady()) {
        const res = await uploadToCloudinary(
          file,
          "image",
          "siat/instituciones/logos",
          (p) => setUploadProgress(p),
        );
        updateField("ins_logo", res.url);
        updateField("ins_foto", res.url);
      } else {
        const reader = new window.FileReader();
        reader.onloadend = () => {
          updateField("ins_logo", reader.result);
          updateField("ins_foto", reader.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error uploading logo:", err);
      const reader = new window.FileReader();
      reader.onloadend = () => {
        updateField("ins_logo", reader.result);
        updateField("ins_foto", reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveLogo = () => {
    updateField("ins_logo", "");
    updateField("ins_foto", "");
  };

  const logoUrl = inst.ins_logo || inst.ins_foto || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* CABECERA INTEGRADA SOBRIA CON LOGO E INFORMACIÓN INSTITUCIONAL */}
      <div className="bg-[#0F172A] dark:bg-[#0F172A] text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-5">
            {/* Logo de la Fundación */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-800/90 border border-slate-700/80 p-1.5 shadow-md flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={inst.ins_nomb}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-center">
                    <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-0.5 opacity-80" />
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Sin Logo
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                title={logoUrl ? "Cambiar Logo" : "Subir Logo"}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Títulos y RIF */}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {inst.ins_nomb || "Fundación SIAT"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-700">
                  {inst.ins_codi || "RIF N/A"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Panel de Administración Institucional · Identidad y
                Configuración
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sistema 100% Operativo
                </span>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors underline"
                  >
                    Eliminar logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Botón de Guardado Primario */}
          <div className="shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleUpdateInstitucion}
              disabled={loading}
              className="w-full md:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS NAVEGABLES SOBRIAS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("info")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === "info"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/10 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4" /> Información General y Contacto
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("clinica")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === "clinica"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/10 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Clock className="w-4 h-4" /> Configuración Clínica & Operativa
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("equipo")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === "equipo"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/10 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Users className="w-4 h-4" /> Usuarios y Equipo Institucional
        </button>
      </div>

      {/* FORMULARIO Y CONTENIDO DE PESTAÑAS */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdateInstitucion(e);
        }}
      >
        {/* PESTAÑA 1: INFORMACIÓN GENERAL */}
        {activeSubTab === "info" && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-8 animate-in fade-in duration-200">
            {/* SECCIÓN: IDENTIFICACIÓN LEGAL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Identificación Legal y Fiscal
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    RIF / Código Fiscal
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={15}
                    value={inst.ins_codi || ""}
                    onChange={(e) => updateField("ins_codi", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="J-50000000-0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Nombre Oficial de la Fundación
                  </label>
                  <input
                    required
                    type="text"
                    value={inst.ins_nomb || ""}
                    onChange={(e) => updateField("ins_nomb", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Ej: Fundación SIAT para el Neurodesarrollo"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Representante Legal / Contacto Principal
                  </label>
                  <input
                    type="text"
                    value={inst.ins_pers || ""}
                    onChange={(e) => updateField("ins_pers", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Nombre completo del director o responsable institucional"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN: CONTACTO Y UBICACIÓN */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Contacto Institucional y Ubicación
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono
                    Principal
                  </label>
                  <input
                    required
                    type="text"
                    value={inst.ins_telf || ""}
                    onChange={(e) => updateField("ins_telf", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="+58 212-0000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo
                    Electrónico
                  </label>
                  <input
                    type="email"
                    value={inst.ins_emai || ""}
                    onChange={(e) => updateField("ins_emai", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="admin@fundacion.org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Sitio Web
                    Institucional
                  </label>
                  <input
                    type="text"
                    value={inst.ins_web || ""}
                    onChange={(e) => updateField("ins_web", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="https://fundacion.org"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Dirección
                    Física Completa
                  </label>
                  <input
                    required
                    type="text"
                    value={inst.ins_dire || ""}
                    onChange={(e) => updateField("ins_dire", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Calle, Edificio, Sector, Ciudad, Estado"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: CONFIGURACIÓN CLÍNICA & OPERATIVA */}
        {activeSubTab === "clinica" && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-8 animate-in fade-in duration-200">
            {/* HORARIOS DE ATENCIÓN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Horarios de Atención y Servicio
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Jornada Semanal (Lunes - Viernes)
                  </label>
                  <input
                    type="text"
                    value={schedule.weekday}
                    onChange={(e) =>
                      setSchedule({ ...schedule, weekday: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Jornada Sábados
                  </label>
                  <input
                    type="text"
                    value={schedule.saturday}
                    onChange={(e) =>
                      setSchedule({ ...schedule, saturday: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Atención de Emergencias / Guardias
                  </label>
                  <input
                    type="text"
                    value={schedule.emergency}
                    onChange={(e) =>
                      setSchedule({ ...schedule, emergency: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* MODALIDADES Y ESPECIALIDADES */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Modalidades y Especialidades Atendidas
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {modalities.length} activas
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {modalities.map((mod) => (
                  <button
                    type="button"
                    key={mod}
                    onClick={() => handleToggleModality(mod)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {mod}
                    <span className="text-xs">×</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Agregar nueva especialidad clínica..."
                  value={newModality}
                  onChange={(e) => setNewModality(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddModality(e);
                  }}
                  className="flex-1 max-w-md rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddModality}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Añadir
                </button>
              </div>
            </div>

            {/* PROTOCOLO Y DESCARGO CLINICO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Nota Protocolar en Informes Exportados (PDF)
                </h3>
              </div>

              <textarea
                rows="3"
                value={protocolNotes}
                onChange={(e) => setProtocolNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Texto legal o de confidencialidad que aparecerá al pie de los reportes en PDF..."
              />
            </div>
          </div>
        )}

        {/* PESTAÑA 3: USUARIOS Y EQUIPO (DIRECTORIO INTEGRADO) */}
        {activeSubTab === "equipo" && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Directorio y Accesos Directos de Personal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acceso rápido a la administración del personal médico, familias
                y matriz de asignación
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* FILA ESPECIALISTAS */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Equipo de Especialistas Clínicos
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {especialistasCount || 8} terapeutas registrados y activos
                      en sistema
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.("especialistas")}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  Gestionar Especialistas{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* FILA REPRESENTANTES */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Padres y Representantes Vinculados
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {representantesCount || 12} familias registradas para
                      seguimiento domiciliario
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.("representantes")}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  Gestionar Representantes{" "}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* FILA ASIGNACIONES */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Matriz Terapeuta-Paciente
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Control de asignaciones clínicas activas e historiales
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.("asignaciones")}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  Ver Asignaciones <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* FILA CUENTAS Y PERMISOS */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cuentas y Permisos de Usuario
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {usuariosCount || 20} usuarios con acceso al sistema SIAT
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.("usuarios")}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 hover:text-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  Administrar Cuentas <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTONERA DE GUARDADO INFERIOR FLOTANTE */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            Los cambios guardados se reflejarán de inmediato en la plataforma e
            informes PDF.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto ml-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando
                Cambios...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Configuración Institucional
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
