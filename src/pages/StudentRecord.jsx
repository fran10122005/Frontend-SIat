import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  UserCircle,
  Hash,
  Calendar,
  Users,
  Brain,
  Activity,
  ClipboardList,
  Building2,
  Stethoscope,
  UserRound,
  Phone,
  AlertCircle,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import { exportManualPDFEspecialista } from "../utils/exportManualPdfEspecialista";
import { toastError, extractFieldErrors } from "../utils/errorHandler";
import {
  getChildDateBounds,
  validateFechaPaciente,
  formatYmdForInput,
  focusFirstError,
} from "../utils/validators";
import FotoUpload from "../components/shared/FotoUpload";
import DocumentosClinicos from "../components/shared/DocumentosClinicos";

import PageTitle from "../components/ui/PageTitle";

export default function StudentRecord({ onNavigate }) {
  const { showToast, selectedChildId, fetchNinos } = useGlobalContext();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);
  const childDateBounds = getChildDateBounds(25);

  const normalizeNivel = (val) => {
    const raw = String(val || "").trim();
    if (!raw) return "";
    if (raw === "nivel-1") return "Nivel 1";
    if (raw === "nivel-2") return "Nivel 2";
    if (raw === "nivel-3") return "Nivel 3";
    return raw;
  };
  const [formData, setFormData] = useState({
    id_ninos: "",
    nom_nino: "",
    ape_nino: "",
    fec_naci: "",
    gen_nino: "",
    niv_desa: "",
    Id_sensi: "",
    nin_foto: "",
    nin_diag: "",
  });
  const [extraInfo, setExtraInfo] = useState({
    nin_edad: "",
    nin_ingr: "",
    institucion: null,
    especialista: "",
    representante: null,
  });
  const [docsClinicos, setDocsClinicos] = useState([]);

  // Poblar los datos del niño seleccionado desde la API
  useEffect(() => {
    const fetchFicha = async () => {
      if (!selectedChildId) {
        setFormData({
          id_ninos: "",
          nom_nino: "",
          ape_nino: "",
          fec_naci: "",
          gen_nino: "",
          niv_desa: "",
          Id_sensi: "",
          nin_foto: "",
          nin_diag: "",
        });
        setExtraInfo({
          nin_edad: "",
          nin_ingr: "",
          institucion: null,
          especialista: "",
          representante: null,
        });
        setIsEditing(false);
        setDocsClinicos([]);
        return;
      }

      try {
        const res = await api.get(`/ninos/${selectedChildId}/ficha`);
        const data = res.data.data;

        const formattedDate = formatYmdForInput(data.nin_fnac);

        setFormData({
          id_ninos: data.nin_codi || "",
          nom_nino: data.nin_nomb || "",
          ape_nino: data.nin_apel || "",
          fec_naci: formattedDate,
          gen_nino: data.nin_gner || "",
          niv_desa: normalizeNivel(data.nin_nivd),
          Id_sensi: data.sensibilidad?.sen_tipo || "",
          nin_foto: data.nin_foto || "",
          nin_diag: data.nin_diag || "",
        });
        setFieldErrors({});
        setExtraInfo({
          nin_edad: data.nin_edad || "",
          nin_ingr: data.nin_ingr || "",
          institucion: data.institucion || null,
          especialista: data.especialista || "",
          representante: data.representante || null,
        });
        setDocsClinicos(Array.isArray(data.nin_docs) ? data.nin_docs : []);
      } catch (err) {
        console.error("Error fetching child clinical record:", err);
        toastError(err, showToast, "Error al cargar la ficha clínica.");
      }
    };

    fetchFicha();
  }, [selectedChildId]);

  const registroTimestamp = extraInfo.nin_ingr
    ? new Date(extraInfo.nin_ingr).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      let msg = "";
      if (name === "fec_naci") {
        msg = validateFechaPaciente(value, { required: true, maxAge: 25 });
      } else if (name === "gen_nino") {
        msg = value ? "" : "Selecciona el género del paciente";
      } else if (name === "niv_desa") {
        msg = value ? "" : "Selecciona el nivel de soporte";
      } else if (name === "nin_diag") {
        msg =
          String(value || "").trim().length > 255
            ? "El diagnóstico no puede exceder 255 caracteres"
            : "";
      }
      setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChildId) {
      showToast("⚠️ Debe seleccionar un paciente primero.");
      return;
    }

    const errs = {};
    const fnacErr = validateFechaPaciente(formData.fec_naci, {
      required: true,
      maxAge: 25,
    });
    if (fnacErr) errs.fec_naci = fnacErr;
    if (!["M", "F"].includes(formData.gen_nino)) {
      errs.gen_nino = "Selecciona el género del paciente";
    }
    if (!String(formData.niv_desa || "").trim()) {
      errs.niv_desa = "Selecciona el nivel de desarrollo";
    }
    if (String(formData.nin_diag || "").trim().length > 255) {
      errs.nin_diag = "El diagnóstico no puede exceder 255 caracteres";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs, formRef));
      return;
    }

    setSaving(true);
    try {
      await api.put(`/ninos/${selectedChildId}/ficha`, {
        nin_nomb: String(formData.nom_nino || "").trim(),
        nin_apel: String(formData.ape_nino || "").trim(),
        nin_fnac: formData.fec_naci,
        nin_gner: formData.gen_nino,
        nin_nivd: formData.niv_desa,
        sen_tipo: formData.Id_sensi || "",
        nin_diag: String(formData.nin_diag || "").trim(),
        nin_foto: formData.nin_foto || "",
      });
      setFieldErrors({});
      setIsEditing(false);
      showToast("✅ Ficha clínica actualizada correctamente");
      fetchNinos(); // Refrescar nombres y detalles en el menú contextual
    } catch (err) {
      console.error("Error updating child clinical record:", err);
      const srvErrors = extractFieldErrors(err, {
        nin_fnac: "fec_naci",
        nin_gner: "gen_nino",
        nin_nivd: "niv_desa",
      });
      if (Object.keys(srvErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...srvErrors }));
        requestAnimationFrame(() => focusFirstError(srvErrors, formRef));
      }
      toastError(err, showToast, "Error al guardar la ficha clínica.");
    } finally {
      setSaving(false);
    }
  };

  const getTeaLevelBadge = (level) => {
    const lvl = String(level || "").toLowerCase();
    if (lvl.includes("1") || lvl === "nivel-1")
      return "Nivel 1 - Necesita Ayuda";
    if (lvl.includes("2") || lvl === "nivel-2")
      return "Nivel 2 - Necesita Ayuda Notable";
    if (lvl.includes("3") || lvl === "nivel-3")
      return "Nivel 3 - Necesita Ayuda Muy Notable";
    return level || "No especificado";
  };

  const getTeaLevelColor = (level) => {
    const lvl = String(level || "").toLowerCase();
    if (lvl.includes("1") || lvl === "nivel-1")
      return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    if (lvl.includes("2") || lvl === "nivel-2")
      return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    if (lvl.includes("3") || lvl === "nivel-3")
      return "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  };

  const formatIngreso = (val) => {
    if (!val) return "";
    return new Date(val).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatGenero = (gen) =>
    gen === "M" ? "Masculino" : gen === "F" ? "Femenino" : "No especificado";

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      {/* Menú Lateral Izquierdo */}
      <Sidebar />

      {/* Lienzo Derecho (Main Canvas) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior */}
        <Topbar />

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-5 md:gap-6">
            <header>
              <PageTitle icon={UserCircle} data-tour="sr-header">
                Ficha del Paciente
              </PageTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                Datos maestros, parámetros de sensibilidad e información clínica
                del paciente.
              </p>
            </header>

            {!selectedChildId && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-center">
                <UserCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un paciente en el menú superior para ver su ficha.
                </p>
              </div>
            )}

            {selectedChildId && (
              <form
                ref={formRef}
                noValidate
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-200"
              >
                {/* Cabecera con foto y badges */}
                <div className="p-5 md:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-gray-100 dark:border-slate-700">
                  {isEditing ? (
                    <FotoUpload
                      value={formData.nin_foto}
                      onChange={(url) =>
                        setFormData((prev) => ({ ...prev, nin_foto: url }))
                      }
                      label="Foto del Paciente"
                      alt={formData.nom_nino}
                      size="w-20 h-20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 bg-gray-50 dark:bg-slate-900">
                      {formData.nin_foto ? (
                        <img
                          src={formData.nin_foto}
                          alt={formData.nom_nino}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="w-11 h-11 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                      {formData.nom_nino} {formData.ape_nino}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap justify-center sm:justify-start gap-1.5">
                      {extraInfo.nin_edad && (
                        <span className="text-xs font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                          {extraInfo.nin_edad}
                        </span>
                      )}
                      {formData.gen_nino && (
                        <span className="text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                          {formatGenero(formData.gen_nino)}
                        </span>
                      )}
                      {formData.niv_desa && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getTeaLevelColor(formData.niv_desa)}`}
                        >
                          {getTeaLevelBadge(formData.niv_desa)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                      {extraInfo.nin_ingr && (
                        <>Ingreso: {formatIngreso(extraInfo.nin_ingr)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Datos en celdas compactas */}
                <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Hash className="w-3.5 h-3.5" /> Código del Sistema
                    </div>
                    <p className="text-sm font-medium font-mono text-slate-800 dark:text-slate-200">
                      {formData.id_ninos || "-"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Fecha de Nacimiento
                      {isEditing && (
                        <span className="text-rose-500 font-bold">*</span>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <input
                          type="date"
                          name="fec_naci"
                          data-field="fec_naci"
                          data-tour="sr-birth"
                          min={childDateBounds.min}
                          max={childDateBounds.max}
                          value={formData.fec_naci}
                          onChange={handleChange}
                          className={`form-input text-sm ${fieldErrors.fec_naci ? "form-input-invalid" : ""}`}
                        />
                        {fieldErrors.fec_naci && (
                          <p className="form-error mt-1" role="alert">
                            <AlertCircle className="w-3.5 h-3.5" />{" "}
                            {fieldErrors.fec_naci}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formData.fec_naci
                          ? new Date(formData.fec_naci).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Users className="w-3.5 h-3.5" /> Género
                      {isEditing && (
                        <span className="text-rose-500 font-bold">*</span>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <div
                          className="flex gap-2"
                          data-field="gen_nino"
                          data-tour="sr-gender"
                        >
                          {["M", "F"].map((g) => (
                            <label
                              key={g}
                              className={`flex-1 flex items-center gap-2 px-2.5 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${formData.gen_nino === g ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-blue-300" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300"}`}
                            >
                              <input
                                type="radio"
                                name="gen_nino"
                                value={g}
                                checked={formData.gen_nino === g}
                                onChange={handleChange}
                                className="w-3.5 h-3.5 text-brand-500 focus:ring-brand-500"
                              />
                              {g === "M" ? "Masculino" : "Femenino"}
                            </label>
                          ))}
                        </div>
                        {fieldErrors.gen_nino && (
                          <p className="form-error mt-1" role="alert">
                            <AlertCircle className="w-3.5 h-3.5" />{" "}
                            {fieldErrors.gen_nino}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatGenero(formData.gen_nino)}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Brain className="w-3.5 h-3.5" /> Nivel de Desarrollo
                      {isEditing && (
                        <span className="text-rose-500 font-bold">*</span>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <select
                          name="niv_desa"
                          data-field="niv_desa"
                          data-tour="sr-level"
                          value={formData.niv_desa}
                          onChange={handleChange}
                          className={`form-select text-sm ${fieldErrors.niv_desa ? "form-input-invalid" : ""}`}
                        >
                          <option value="" disabled>
                            Seleccionar nivel...
                          </option>
                          <option value="Por evaluar">Por evaluar</option>
                          <option value="Nivel 1">
                            Nivel 1 - Necesita Ayuda
                          </option>
                          <option value="Nivel 2">
                            Nivel 2 - Necesita Ayuda Notable
                          </option>
                          <option value="Nivel 3">
                            Nivel 3 - Necesita Ayuda Muy Notable
                          </option>
                        </select>
                        {fieldErrors.niv_desa && (
                          <p className="form-error mt-1" role="alert">
                            <AlertCircle className="w-3.5 h-3.5" />{" "}
                            {fieldErrors.niv_desa}
                          </p>
                        )}
                      </>
                    ) : (
                      <p
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getTeaLevelColor(formData.niv_desa)}`}
                      >
                        {getTeaLevelBadge(formData.niv_desa)}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Activity className="w-3.5 h-3.5" /> Perfil Sensorial
                    </div>
                    {isEditing ? (
                      <select
                        name="Id_sensi"
                        data-field="Id_sensi"
                        data-tour="sr-sensitivity"
                        value={formData.Id_sensi}
                        onChange={handleChange}
                        className="form-select text-sm"
                      >
                        <option value="">No reportado / Sin perfil</option>
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
                        <option value="hipo-auditiva">
                          S1 - Hipo-reactividad Auditiva
                        </option>
                        <option value="hiper-tactil">
                          S2 - Hiper-reactividad Táctil
                        </option>
                        <option value="mixto">
                          S3 - Perfil Sensorial Mixto
                        </option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formData.Id_sensi || "-"}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Stethoscope className="w-3.5 h-3.5" /> Especialista
                      Asignado
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {extraInfo.especialista || "No asignado"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Institución
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {extraInfo.institucion?.ins_nomb || "No registrada"}
                    </p>
                    {extraInfo.institucion?.ins_telf && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {extraInfo.institucion.ins_telf}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1.5">
                      <UserRound className="w-3.5 h-3.5" /> Representante Legal
                    </div>
                    {extraInfo.representante ? (
                      <>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {extraInfo.representante.rep_nomb}{" "}
                          {extraInfo.representante.rep_apel}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {extraInfo.representante.rep_rela} · Tel:{" "}
                          {extraInfo.representante.rep_telf}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Sin representante vinculado
                      </p>
                    )}
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className="px-4 md:px-5 pb-4">
                  <div className="p-4 rounded-xl border border-brand-200 dark:border-blue-800/60 bg-brand-50 dark:bg-blue-950/40">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-brand-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                        <ClipboardList className="w-3.5 h-3.5" /> Diagnóstico
                        Clínico
                      </div>
                      {isEditing && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {(formData.nin_diag || "").length}/255
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <textarea
                          name="nin_diag"
                          data-field="nin_diag"
                          data-tour="sr-diagnosis"
                          maxLength={255}
                          value={formData.nin_diag}
                          onChange={handleChange}
                          rows={2}
                          placeholder="Ej. Trastorno del Espectro Autista (TEA) — Nivel 2"
                          className={`form-textarea text-sm resize-none ${fieldErrors.nin_diag ? "form-input-invalid" : ""}`}
                        />
                        {fieldErrors.nin_diag && (
                          <p className="form-error mt-1" role="alert">
                            <AlertCircle className="w-3.5 h-3.5" />{" "}
                            {fieldErrors.nin_diag}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formData.nin_diag || "Sin diagnóstico registrado"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pie de la Tarjeta y Botones */}
                <div className="px-4 md:px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium dark:text-gray-300">
                      Registro en sistema:
                    </span>{" "}
                    {registroTimestamp || "Sin registrar"}
                  </div>
                  <div className="flex w-full md:w-auto items-center gap-2">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        data-tour="sr-edit"
                        className="flex-1 md:flex-none px-5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        ✏️ Editar Perfil
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFieldErrors({});
                          }}
                          data-tour="sr-cancel"
                          className="flex-1 md:flex-none px-5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          data-tour="sr-save"
                          className="flex-1 md:flex-none px-5 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm shadow-[#007BFF]/40"
                        >
                          {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </form>
            )}

            {selectedChildId && (
              <div className="animate-in fade-in duration-300">
                <DocumentosClinicos docs={docsClinicos} />
              </div>
            )}

            <div
              data-tour="sr-links"
              className="flex flex-col sm:flex-row gap-4 sm:gap-8 pl-1"
            >
              <button
                onClick={() => onNavigate && onNavigate("historial")}
                className="flex items-center text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-1.5 opacity-70 group-hover:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Ver historial de sensibilidades vinculadas
              </button>
              <button
                onClick={() => {
                  showToast("📖 Generando manual de niveles TEA en PDF...");
                  exportManualPDFEspecialista();
                }}
                className="flex items-center text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-1.5 opacity-70 group-hover:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  ></path>
                </svg>
                Consultar manual de niveles TEA
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
