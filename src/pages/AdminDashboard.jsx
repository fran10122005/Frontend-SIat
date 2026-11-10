import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import {
  useGlobalContext,
  adminTabPaths,
  legacyAliases,
} from "../context/GlobalState";
import { useTourContext } from "../context/TourContext";
import { toastError, extractFieldErrors } from "../utils/errorHandler";
import {
  validateEmail,
  validateEmailList,
  focusFirstError,
} from "../utils/validators";
import { getValidSession } from "../utils/authStorage";
import AdminSidebar from "../components/layout/AdminSidebar";
import * as XLSX from "xlsx";
import {
  exportEspecialistasToPDF as expEspPDF,
  exportAsignacionesToPDF as expAsigPDF,
  exportEspecialidadesToPDF as expCatPDF,
} from "../utils/pdfExporter";
import {
  Building2,
  Users,
  Stethoscope,
  Link2,
  Clock,
  CheckCircle2,
  X,
  Send,
  Mail,
  CheckSquare,
  Sparkles,
  AlertCircle,
  Copy,
  KeyRound,
} from "lucide-react";
import pdfIcon from "../assets/pdf.png";

import AdminKPIs from "../components/admin/AdminKPIs";
import AdminCharts from "../components/admin/AdminCharts";
import AdminActivityLog from "../components/admin/AdminActivityLog";
import InfraestructuraTab from "../components/admin/InfraestructuraTab";

import EspecialistasTab from "../components/admin/EspecialistasTab";
import RepresentantesTab from "../components/admin/RepresentantesTab";
import AsignacionesTab from "../components/admin/AsignacionesTab";
import CatalogosTab from "../components/admin/CatalogosTab";
import UsuariosTab from "../components/admin/UsuariosTab";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import RegisterChildModal from "../components/shared/RegisterChildModal";
import AdminModal from "../components/shared/AdminModal";
import Topbar from "../components/layout/Topbar";
import Footer from "../components/layout/Footer";
import LoadingState from "../components/dashboard/LoadingState";
import PageTitle from "../components/ui/PageTitle";

function AdminDashboard({ onNavigate }) {
  const {
    userRole,
    userName,
    adminActiveTab: activeTab,
    setAdminActiveTab: setActiveTab,
    isDark,
    showToast,
  } = useGlobalContext();

  const { setModuleContext, clearModuleContext } = useTourContext();

  const routerNavigate = useNavigate();
  const location = useLocation();

  // Deriva la pestaña activa desde la URL canónica (/admin/specialists => "especialistas")
  const tabFromPath = () => {
    for (const [tab, tabPath] of Object.entries(adminTabPaths)) {
      if (location.pathname === tabPath) return tab;
    }
    const canonical = legacyAliases?.[location.pathname];
    if (canonical) {
      for (const [tab, tabPath] of Object.entries(adminTabPaths)) {
        if (canonical === tabPath) return tab;
      }
    }
    return "dashboard";
  };

  // Cambiar de pestaña navega a su URL canónica internacional
  const changeTab = (tab) => {
    routerNavigate(adminTabPaths[tab] || "/admin/overview");
  };

  // Registra el tab activo como contexto del tour contextual, para que el
  // icono del header lance la guía del módulo actual del panel admin.
  useEffect(() => {
    if (activeTab && activeTab !== "dashboard") {
      setModuleContext(activeTab);
    }
    return () => clearModuleContext();
  }, [activeTab, setModuleContext, clearModuleContext]);

  const [especialistas, setEspecialistas] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [catalogos, setCatalogos] = useState({
    especialidades: [],
    instituciones: [],
  });
  const [usuarios, setUsuarios] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [editingRep, setEditingRep] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // UX State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger",
  });

  // Forms state
  const [newEsp, setNewEsp] = useState({
    esp_cedu: "",
    esp_nomb: "",
    esp_apel: "",
    usu_crro: "",
    usu_clve: "",
    esp_licencia: "",
    esp_telf: "",
    esc_codi: "",
    esp_gner: "M",
    esp_tdoc: "V",
    esp_fnac: "",
    esp_foto: "",
    ins_codi: "",
  });
  const [asignacion, setAsignacion] = useState({
    nin_codi: "",
    esp_codi: "",
    asi_inic: "",
    asi_stdo: "Activo",
  });
  const [editingEsp, setEditingEsp] = useState(null);

  const [editingInst, setEditingInst] = useState(null);

  // Especialidades state
  const [newEspCat, setNewEspCat] = useState({
    esc_codi: "",
    esc_nomb: "",
    esc_desc: "",
  });
  const [editingEspCat, setEditingEspCat] = useState(null);

  const [loading, setLoading] = useState(false);

  // Clinical Invitation States
  const [showRegModal, setShowRegModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: false,
    frequency: "weekly",
    day: "lunes",
    time: "08:00",
    email: "",
    additionalEmails: "",
    subject: "Reporte Ejecutivo de Gestión Clínica — SIAT",
    modules: {
      metricas: true,
      pacientes: true,
      especialistas: true,
      auditoria: true,
    },
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState({});
  const scheduleFormRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState({
    link: "",
    usu_crro: "",
    passwordGenerada: "",
    emailSent: false,
  });
  const [showEspCredModal, setShowEspCredModal] = useState(false);
  const [generatedEspCreds, setGeneratedEspCreds] = useState({
    nombre: "",
    email: "",
    password: "",
    isReset: false,
  });

  const handleOpenScheduleModal = async () => {
    setScheduleErrors({});
    setShowScheduleModal(true);
    try {
      const res = await api.get("/admin/reportes/programados");
      if (res.data?.data) {
        setScheduleConfig(res.data.data);
        localStorage.setItem("reportSchedule", JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.warn("Error cargando programación de reportes:", err);
    }
  };

  const validateScheduleForm = (requireModulesIfEnabled = true) => {
    const errs = {};
    const emailErr = validateEmail(scheduleConfig.email, {
      required: true,
      max: 120,
    });
    if (emailErr) errs.email = emailErr;

    const addErr = validateEmailList(scheduleConfig.additionalEmails || "");
    if (addErr) errs.additionalEmails = addErr;

    if (!String(scheduleConfig.subject || "").trim()) {
      errs.subject = "El asunto del correo es obligatorio";
    } else if (String(scheduleConfig.subject).trim().length > 150) {
      errs.subject = "El asunto no puede exceder 150 caracteres";
    }

    if (requireModulesIfEnabled && scheduleConfig.enabled) {
      const hasAnyModule = Object.values(scheduleConfig.modules || {}).some(
        Boolean,
      );
      if (!hasAnyModule) {
        errs.modules = "Selecciona al menos un módulo para el envío programado";
      }
    }

    setScheduleErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs, scheduleFormRef));
      return false;
    }
    return true;
  };

  window.__navigate = onNavigate;

  const mountedRef = useRef(true);

  const session = getValidSession();
  const isAdmin =
    session.isValid &&
    (session.role === "ADMIN_INSTITUCION" || userRole === "ADMIN_INSTITUCION");

  useEffect(() => {
    if (!isAdmin) {
      onNavigate("login");
      return;
    }
    mountedRef.current = true;
    const tab = tabFromPath();
    setActiveTab(tab);
    fetchData(tab);

    // Sincronizar programación de reportes persistida en BD
    api
      .get("/admin/reportes/programados")
      .then((res) => {
        if (res.data?.data) {
          setScheduleConfig(res.data.data);
          localStorage.setItem("reportSchedule", JSON.stringify(res.data.data));
        }
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, location.pathname]);

  const deriveRepresentantes = (users) =>
    users
      .filter((u) => u.rol_codi === "ROL_REP")
      .map((u) => {
        const rep = u.tm_repre || {};
        const vinculos = rep.tm_repre_ninos || [];
        const ninos = vinculos.map((v) => v.tm_ninos).filter(Boolean);
        return {
          ...rep,
          rep_codi: rep.rep_cod || rep.rep_codi || u.usu_codi,
          usu_codi: u.usu_codi,
          usu_crro: u.usu_crro,
          usu_estd: u.usu_estd,
          rep_nomb: rep.rep_nomb || "Representante",
          rep_apel: rep.rep_apel || "",
          tm_ninos: ninos[0] || null,
          ninos: ninos,
        };
      });

  const seedInstitucion = (catData) => {
    if (catData.instituciones && catData.instituciones.length > 0) {
      setNewEsp((prev) => ({
        ...prev,
        ins_codi: catData.instituciones[0].ins_codi,
      }));
      setEditingInst(catData.instituciones[0]);
    }
  };

  // Carga SOLO los datos que necesita la pestaña activa (ya no todos los endpoints de golpe)
  const fetchData = async (tab = activeTab) => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const loaders = {
        dashboard: async () => {
          const [esp, ninos, asign, metricas, cat, users, audit] =
            await Promise.all([
              api.get("/admin/especialistas"),
              api.get("/admin/ninos"),
              api.get("/admin/asignaciones"),
              api.get("/admin/metricas"),
              api.get("/admin/catalogos"),
              api.get("/admin/users"),
              api.get("/admin/auditoria"),
            ]);
          if (!mountedRef.current) return;
          setEspecialistas(esp.data.data);
          setNinos(ninos.data.data);
          setAsignaciones(asign.data.data);
          setMetricas(metricas.data.data);
          setUsuarios(users.data.data);
          setAuditLogs(audit.data.data || []);
          setRepresentantes(deriveRepresentantes(users.data.data));
          setCatalogos(cat.data.data);
          seedInstitucion(cat.data.data);
        },
        especialistas: async () => {
          const [esp, cat] = await Promise.all([
            api.get("/admin/especialistas"),
            api.get("/admin/catalogos"),
          ]);
          if (!mountedRef.current) return;
          setEspecialistas(esp.data.data);
          setCatalogos(cat.data.data);
          seedInstitucion(cat.data.data);
        },
        representantes: async () => {
          const users = await api.get("/admin/users");
          if (!mountedRef.current) return;
          setUsuarios(users.data.data);
          setRepresentantes(deriveRepresentantes(users.data.data));
        },
        asignaciones: async () => {
          const [asign, ninos, esp] = await Promise.all([
            api.get("/admin/asignaciones"),
            api.get("/admin/ninos"),
            api.get("/admin/especialistas"),
          ]);
          if (!mountedRef.current) return;
          setAsignaciones(asign.data.data);
          setNinos(ninos.data.data);
          setEspecialistas(esp.data.data);
        },
        catalogos: async () => {
          const cat = await api.get("/admin/catalogos");
          if (!mountedRef.current) return;
          setCatalogos(cat.data.data);
          seedInstitucion(cat.data.data);
        },
        usuarios: async () => {
          const users = await api.get("/admin/users");
          if (!mountedRef.current) return;
          setUsuarios(users.data.data);
        },
        infraestructura: async () => {},
      };
      await (loaders[tab] || loaders.dashboard)();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("API Error:", err.response || err);
      toastError(err, showToast, "Error cargando los datos del panel.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleCreateEspecialista = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullName =
        `${newEsp.esp_gner === "F" ? "Dra." : "Dr."} ${String(newEsp.esp_nomb || "").trim()} ${String(newEsp.esp_apel || "").trim()}`.trim();
      const emailClean = String(newEsp.usu_crro || "").trim();

      // Mapear los campos del formulario a los que espera el backend
      const payload = {
        esp_cedu: newEsp.esp_cedu
          ? String(newEsp.esp_cedu).trim().toUpperCase()
          : undefined,
        nombre: String(newEsp.esp_nomb || "").trim(),
        apellido: String(newEsp.esp_apel || "").trim(),
        email: emailClean,
        password: newEsp.usu_clve || undefined,
        esp_licencia: newEsp.esp_licencia
          ? String(newEsp.esp_licencia).trim().toUpperCase()
          : undefined,
        esp_telf: newEsp.esp_telf ? String(newEsp.esp_telf).trim() : undefined,
        esc_codi: newEsp.esc_codi,
        esp_gner: newEsp.esp_gner || "M",
        esp_tdoc: newEsp.esp_tdoc || "V",
        esp_fnac: newEsp.esp_fnac || undefined,
        esp_foto: newEsp.esp_foto || undefined,
        ins_codi: newEsp.ins_codi || undefined,
      };
      const res = await api.post("/admin/especialistas", payload);
      const nuevaClave = res.data?.data?.password_generada;
      showToast("✅ Especialista creado exitosamente.");
      if (nuevaClave) {
        setGeneratedEspCreds({
          nombre: fullName,
          email: emailClean,
          password: nuevaClave,
          isReset: false,
        });
        setShowEspCredModal(true);
      }
      setNewEsp({
        usu_crro: "",
        esp_nomb: "",
        esp_apel: "",
        usu_clve: "",
        esp_cedu: "",
        esp_licencia: "",
        esp_telf: "",
        esc_codi: "",
        esp_gner: "M",
        esp_tdoc: "V",
        esp_fnac: "",
        esp_foto: "",
        ins_codi:
          catalogos.instituciones && catalogos.instituciones.length > 0
            ? catalogos.instituciones[0].ins_codi
            : "",
      });
      fetchData();
      return { ok: true };
    } catch (err) {
      const fieldErrors = extractFieldErrors(err, {
        email: "usu_crro",
        nombre: "esp_nomb",
        apellido: "esp_apel",
      });
      toastError(err, showToast, "No se pudo registrar el especialista.");
      return { ok: false, fieldErrors };
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/admin/asignar", {
        nin_codi: asignacion.nin_codi,
        esp_codi: asignacion.esp_codi,
        asi_inic: asignacion.asi_inic || undefined,
        asi_stdo: asignacion.asi_stdo || "Activo",
      });
      showToast("✅ Paciente asignado al especialista exitosamente.");
      setAsignacion({
        nin_codi: "",
        esp_codi: "",
        asi_inic: "",
        asi_stdo: "Activo",
      });
      fetchData();
      return true;
    } catch (err) {
      toastError(err, showToast, "No se pudo crear la asignación.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = (data = {}) => {
    if (data.reutilizado) {
      fetchData();
      return;
    }
    const fallbackLogin =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/login`
        : "";
    setGeneratedInvite({
      link: data.invitationUrl || data.loginUrl || fallbackLogin,
      usu_crro: data.usu_crro || "",
      passwordGenerada: data.passwordGenerada || "",
      emailSent: Boolean(data.emailSent),
    });
    setShowLinkModal(true);
    fetchData();
  };

  const handleToggleActivo = (esp_codi, currentState) => {
    let warningMsg = `¿Estás seguro de que deseas ${currentState ? "desactivar" : "activar"} a este especialista?`;

    if (currentState) {
      const activeAssignments = asignaciones.filter(
        (a) =>
          (String(a.esp_codi) === String(esp_codi) ||
            String(a.tm_espec?.esp_codi) === String(esp_codi)) &&
          a.asi_stdo === "Activo",
      );
      if (activeAssignments.length > 0) {
        warningMsg = `⚠️ Este especialista tiene ${activeAssignments.length} paciente(s) con asignación clínica activa. Al desactivarlo, sus pacientes quedarán sin terapeuta habilitado para registrar sesiones. Te recomendamos reasignar los casos. ¿Deseas desactivarlo de todas formas?`;
      }
    }

    setModalConfig({
      isOpen: true,
      title: currentState ? "Desactivar Especialista" : "Activar Especialista",
      message: warningMsg,
      type: currentState ? "danger" : "success",
      onConfirm: async () => {
        try {
          await api.patch(`/admin/especialistas/${esp_codi}/estado`, {
            activo: !currentState,
          });
          showToast(
            `✅ Especialista ${!currentState ? "activado" : "desactivado"} exitosamente.`,
          );
          fetchData();
        } catch (err) {
          toastError(
            err,
            showToast,
            "Error al cambiar el estado del especialista.",
          );
        }
      },
    });
  };

  const handleResetPassword = async (esp_codi, email) => {
    try {
      const res = await api.post(
        `/admin/especialistas/${esp_codi}/password`,
        {},
      );
      const nuevaClave = res.data?.data?.password_generada;
      showToast(`✅ Contraseña restablecida para ${email}.`);
      if (nuevaClave) {
        setGeneratedEspCreds({
          nombre: email,
          email,
          password: nuevaClave,
          isReset: true,
        });
        setShowEspCredModal(true);
      }
    } catch (err) {
      toastError(err, showToast, "Error al restablecer la contraseña.");
    }
  };

  const handleUpdateRepresentante = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/representantes/${editingRep.usu_codi}`, {
        rep_nomb: String(editingRep.rep_nomb || "").trim(),
        rep_apel: String(editingRep.rep_apel || "").trim(),
        rep_telf: editingRep.rep_telf ? String(editingRep.rep_telf).trim() : "",
        rep_rela: editingRep.rep_rela,
        ...(editingRep.rep_fnac !== undefined && {
          rep_fnac: editingRep.rep_fnac || null,
        }),
        ...(editingRep.rep_foto !== undefined && {
          rep_foto: editingRep.rep_foto || null,
        }),
        ...(editingRep.rep_cedu && {
          rep_cedu: String(editingRep.rep_cedu).trim(),
        }),
        ...(editingRep.usu_crro && {
          usu_crro: String(editingRep.usu_crro).trim(),
        }),
      });
      showToast("✅ Representante actualizado con éxito.");
      setEditingRep(null);
      fetchData();
      return { ok: true };
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      toastError(err, showToast, "Error al actualizar el representante.");
      return { ok: false, fieldErrors };
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAsignacion = (asi_codi, currentState) => {
    const nextState = currentState === "Activo" ? "Inactivo" : "Activo";
    setModalConfig({
      isOpen: true,
      title:
        currentState === "Activo"
          ? "Desvincular Paciente"
          : "Reactivar Asignación",
      message: `¿Deseas cambiar el estado de esta asignación a ${nextState}?`,
      type: currentState === "Activo" ? "danger" : "success",
      onConfirm: async () => {
        try {
          await api.patch(`/admin/asignaciones/${asi_codi}/estado`, {
            estado: nextState,
          });
          showToast(`✅ Asignación marcada como ${nextState}.`);
          fetchData();
        } catch (err) {
          toastError(err, showToast, "Error al modificar la asignación.");
        }
      },
    });
  };

  const handleUpdateEsp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/especialistas/${editingEsp.esp_codi}`, {
        esp_tdoc: editingEsp.esp_tdoc || "V",
        esp_cedu: editingEsp.esp_cedu
          ? String(editingEsp.esp_cedu).trim().toUpperCase()
          : undefined,
        esp_nomb: String(editingEsp.esp_nomb || "").trim(),
        esp_apel: String(editingEsp.esp_apel || "").trim(),
        usu_crro: String(editingEsp.usu_crro || "").trim(),
        esp_fnac: editingEsp.esp_fnac || undefined,
        esp_gner: editingEsp.esp_gner,
        esp_telf: editingEsp.esp_telf ? String(editingEsp.esp_telf).trim() : "",
        esp_licencia: editingEsp.esp_licencia
          ? String(editingEsp.esp_licencia).trim().toUpperCase()
          : "",
        esp_foto: editingEsp.esp_foto,
        esc_codi: editingEsp.esc_codi,
      });
      showToast("✅ Especialista actualizado con éxito.");
      setEditingEsp(null);
      fetchData();
      return { ok: true };
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      toastError(err, showToast, "Error al actualizar el especialista.");
      return { ok: false, fieldErrors };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstitucion = async (e, extraConf = undefined) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      // El RIF se puede editar (es el ID fiscal, no se genera). La URL lleva el
      // código ORIGINAL; el nuevo valor viaja en el body y el backend lo propaga.
      const originalCodi =
        catalogos.instituciones?.[0]?.ins_codi || editingInst?.ins_codi;
      const body = {
        ins_codi: (editingInst.ins_codi || originalCodi || "").trim(),
        ins_nomb: String(editingInst.ins_nomb || "").trim(),
        ins_dire: String(editingInst.ins_dire || "").trim(),
        ins_telf: String(editingInst.ins_telf || "").trim(),
        ins_pers: editingInst.ins_pers
          ? String(editingInst.ins_pers).trim()
          : "",
        ins_emai: editingInst.ins_emai
          ? String(editingInst.ins_emai).trim()
          : "",
        ins_web: editingInst.ins_web ? String(editingInst.ins_web).trim() : "",
        ...(editingInst.ins_logo !== undefined && {
          ins_logo: editingInst.ins_logo || "",
        }),
        ...(extraConf !== undefined
          ? { ins_conf: extraConf }
          : editingInst.ins_conf !== undefined
            ? { ins_conf: editingInst.ins_conf }
            : {}),
      };
      await api.put(`/admin/instituciones/${originalCodi}`, body);
      showToast("✅ Institución actualizada con éxito.");
      setEditingInst(null);
      fetchData();
      return { ok: true };
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      toastError(err, showToast, "Error al actualizar la institución.");
      return { ok: false, fieldErrors };
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEspecialidad = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const esc_codi = (
        (newEspCat.esc_codi || "").trim() ||
        `E${Date.now().toString(36).toUpperCase()}`
      )
        .toUpperCase()
        .slice(0, 10);
      await api.post("/admin/especialidades", {
        esc_codi,
        esc_nomb: String(newEspCat.esc_nomb || "").trim(),
        esc_desc: String(newEspCat.esc_desc || "").trim(),
      });
      showToast(`✅ Especialidad registrada con éxito. Código: ${esc_codi}`);
      setNewEspCat({ esc_codi: "", esc_nomb: "", esc_desc: "" });
      fetchData();
      return { ok: true };
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      toastError(err, showToast, "No se pudo registrar la especialidad.");
      return { ok: false, fieldErrors };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEspecialidad = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/especialidades/${editingEspCat.esc_codi}`, {
        esc_nomb: String(editingEspCat.esc_nomb || "").trim(),
        esc_desc: String(editingEspCat.esc_desc || "").trim(),
      });
      showToast("✅ Especialidad actualizada con éxito.");
      setEditingEspCat(null);
      fetchData();
      return { ok: true };
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      toastError(err, showToast, "Error al actualizar la especialidad.");
      return { ok: false, fieldErrors };
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEspecialidad = (esc_codi, currentState) => {
    const nextState = currentState !== false;
    setModalConfig({
      isOpen: true,
      title: nextState ? "Desactivar Especialidad" : "Activar Especialidad",
      message: `¿Estás seguro de que deseas ${nextState ? "desactivar" : "activar"} esta especialidad?`,
      type: nextState ? "danger" : "success",
      onConfirm: async () => {
        try {
          await api.patch(`/admin/especialidades/${esc_codi}/estado`, {
            activo: !nextState,
          });
          showToast(
            `✅ Especialidad ${!nextState ? "activada" : "desactivada"} exitosamente.`,
          );
          fetchData();
        } catch (err) {
          toastError(
            err,
            showToast,
            "Error al cambiar el estado de la especialidad.",
          );
        }
      },
    });
  };

  // Export Functions
  const exportEspecialistasToPDF = () => expEspPDF(especialistas);
  const exportEspecialistasToExcel = () => {
    const data = especialistas.map((esp) => ({
      Código: esp.esp_codi,
      Cédula: esp.esp_cedu ? `${esp.esp_tdoc || "V"}-${esp.esp_cedu}` : "-",
      Nombre: `${esp.esp_gner === "M" ? "Dr." : "Dra."} ${esp.esp_nomb} ${esp.esp_apel}`,
      Especialidad: esp.tm_especi?.esc_nomb || "General",
      Clínica: esp.tm_insti?.ins_nomb || "-",
      Teléfono: esp.esp_telf || "-",
      Licencia: esp.esp_licencia || "-",
      Email: esp.tm_usuar?.usu_crro || "-",
      Estado: esp.tm_usuar?.usu_estd !== false ? "Activo" : "Inactivo",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Especialistas");
    XLSX.writeFile(workbook, "especialistas_siat.xlsx");
  };

  const exportAsignacionesToPDF = () => expAsigPDF(asignaciones);
  const exportAsignacionesToExcel = () => {
    const data = asignaciones.map((asi) => ({
      "ID Paciente": asi.tm_ninos?.nin_codi || "N/A",
      Paciente:
        `${asi.tm_ninos?.nin_nomb || ""} ${asi.tm_ninos?.nin_apel || ""}`.trim() ||
        "Desconocido",
      "ID Especialista": asi.tm_espec?.esp_codi || "N/A",
      Especialista:
        `${asi.tm_espec?.esp_gner === "M" ? "Dr." : "Dra."} ${asi.tm_espec?.esp_nomb || ""} ${asi.tm_espec?.esp_apel || ""}`.trim() ||
        "Desconocido",
      Fecha: new Date(asi.asi_inic).toLocaleDateString(),
      Estado: asi.asi_stdo,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asignaciones");
    XLSX.writeFile(workbook, "asignaciones_siat.xlsx");
  };

  const exportEspecialidadesToPDF = () => expCatPDF(catalogos.especialidades);

  const exportEspecialidadesToExcel = () => {
    const data = catalogos.especialidades.map((esc) => ({
      Código: esc.esc_codi,
      Nombre: esc.esc_nomb,
      Descripción: esc.esc_desc || "-",
      Estado: esc.esc_estd !== false ? "Activo" : "Inactivo",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Especialidades");
    XLSX.writeFile(workbook, "especialidades_siat.xlsx");
  };

  const exportUsuariosToPDF = async () => {
    const { createStyledPdf } = await import("../utils/pdfExporter");
    const getName = (user) => {
      if (user.rol_codi === "ROL_ESP" && user.tm_espec)
        return `${user.tm_espec.esp_gner === "M" ? "Dr." : "Dra."} ${user.tm_espec.esp_nomb} ${user.tm_espec.esp_apel}`;
      if (user.rol_codi === "ROL_REP" && user.tm_repre)
        return `${user.tm_repre.rep_nomb} ${user.tm_repre.rep_apel}`;
      if (user.rol_codi === "ROL_ADM" && user.tm_admin)
        return `${user.tm_admin.adm_nomb} ${user.tm_admin.adm_apel}`;
      return "Administrador Global / Director";
    };
    const getRol = (codi) =>
      codi === "ROL_ADM"
        ? "Administrador"
        : codi === "ROL_ESP"
          ? "Especialista"
          : codi === "ROL_REP"
            ? "Representante"
            : "Otro";
    const columns = [
      "Nombre",
      "Correo",
      "Rol",
      "Creación",
      "Último Acceso",
      "Estado",
    ];
    const rows = usuarios.map((u) => [
      getName(u),
      u.usu_crro || "-",
      getRol(u.rol_codi),
      u.usu_crea ? new Date(u.usu_crea).toLocaleDateString("es-ES") : "-",
      u.usu_logi ? new Date(u.usu_logi).toLocaleDateString("es-ES") : "Nunca",
      {
        content: u.usu_estd !== false ? "Activo" : "Inactivo",
        styles: {
          textColor: u.usu_estd !== false ? [16, 185, 129] : [239, 68, 68],
          fontStyle: "bold",
        },
      },
    ]);
    await createStyledPdf(
      "Usuarios del Sistema",
      "usuarios_siat.pdf",
      columns,
      rows,
      { pageTitle: "Usuarios del Sistema — SIAT" },
    );
  };

  const exportUsuariosToExcel = () => {
    const getName = (user) => {
      if (user.rol_codi === "ROL_ESP" && user.tm_espec)
        return `${user.tm_espec.esp_gner === "M" ? "Dr." : "Dra."} ${user.tm_espec.esp_nomb} ${user.tm_espec.esp_apel}`;
      if (user.rol_codi === "ROL_REP" && user.tm_repre)
        return `${user.tm_repre.rep_nomb} ${user.tm_repre.rep_apel}`;
      if (user.rol_codi === "ROL_ADM" && user.tm_admin)
        return `${user.tm_admin.adm_nomb} ${user.tm_admin.adm_apel}`;
      return "Administrador Global / Director";
    };
    const getRol = (codi) =>
      codi === "ROL_ADM"
        ? "Administrador"
        : codi === "ROL_ESP"
          ? "Especialista"
          : codi === "ROL_REP"
            ? "Representante"
            : "Otro";
    const data = usuarios.map((u) => ({
      Nombre: getName(u),
      Correo: u.usu_crro || "-",
      Rol: getRol(u.rol_codi),
      Creación: u.usu_crea
        ? new Date(u.usu_crea).toLocaleDateString("es-ES")
        : "-",
      "Último Acceso": u.usu_logi
        ? new Date(u.usu_logi).toLocaleDateString("es-ES")
        : "Nunca",
      Estado: u.usu_estd !== false ? "Activo" : "Inactivo",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    XLSX.writeFile(workbook, "usuarios_siat.xlsx");
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={changeTab}
        counts={{
          especialistas: especialistas.length,
          representantes: representantes.length,
          asignaciones: asignaciones.filter((a) => a.asi_stdo === "Activo")
            .length,
          usuarios: usuarios.length,
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col gap-3.5 pb-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <PageTitle icon={Building2} className="text-base sm:text-lg">
                  {activeTab === "dashboard" && "Panel Clínico Institucional"}
                  {activeTab === "especialistas" &&
                    "Directorio de Especialistas"}
                  {activeTab === "representantes" &&
                    "Gestión de Representantes Legales"}
                  {activeTab === "asignaciones" &&
                    "Control de Casos y Asignaciones"}
                  {activeTab === "catalogos" && "Configuración de Mi Fundación"}
                  {activeTab === "infraestructura" &&
                    "Monitoreo de Infraestructura"}
                  {activeTab === "usuarios" &&
                    "Control de Acceso y Cuentas de Usuario"}
                </PageTitle>
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <p
                  title={
                    activeTab === "dashboard"
                      ? "Resumen de la operación clínica."
                      : undefined
                  }
                  className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 font-normal truncate"
                >
                  {activeTab === "dashboard" &&
                    "Resumen de la operación clínica."}
                  {activeTab === "especialistas" &&
                    "Personal clínico y especialidades."}
                  {activeTab === "representantes" &&
                    "Listado de padres y tutores legales."}
                  {activeTab === "asignaciones" &&
                    "Pacientes asignados por especialista."}
                  {activeTab === "catalogos" && "Datos de la institución."}
                  {activeTab === "infraestructura" &&
                    "Servicios, base de datos y red."}
                  {activeTab === "usuarios" && "Cuentas, roles y estados."}
                </p>
              </div>
              {activeTab === "dashboard" && (
                <div className="flex gap-2">
                  <button
                    data-tour="admin-dash-export"
                    onClick={async () => {
                      try {
                        const { exportDashboardReport } =
                          await import("../utils/pdfExporter");
                        const alertsFromLogs = auditLogs
                          .filter(
                            (log) =>
                              log.aud_tipo === "INCIDENTE" ||
                              log.aud_tipo === "WARN",
                          )
                          .slice(0, 20)
                          .map((log) => ({
                            time: new Date(log.aud_time).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" },
                            ),
                            message: log.aud_desc,
                          }));
                        const totalCrisis = metricas?.totalCrisis || 0;
                        await exportDashboardReport({
                          userName,
                          userRole,
                          kpis: [
                            {
                              label: "Especialistas",
                              value: especialistas.length.toString(),
                            },
                            {
                              label: "Pacientes",
                              value: ninos.length.toString(),
                            },
                            {
                              label: "Asignaciones Activas",
                              value: asignaciones
                                .filter((a) => a.asi_stdo === "Activo")
                                .length.toString(),
                            },
                            {
                              label: "Usuarios del Sistema",
                              value: usuarios.length.toString(),
                            },
                            ...(totalCrisis > 0
                              ? [
                                  {
                                    label: "Incidentes (Mes)",
                                    value: totalCrisis.toString(),
                                  },
                                ]
                              : []),
                          ],
                          alerts: alertsFromLogs,
                          titulo: "Reporte del Dashboard — Administración",
                        });
                      } catch (err) {
                        console.error("Error al exportar:", err);
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold rounded-lg shadow-sm border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all flex items-center gap-2 text-sm shrink-0"
                  >
                    <img
                      src={pdfIcon}
                      alt="PDF"
                      className="w-4 h-4 object-contain shrink-0"
                    />{" "}
                    Exportar
                  </button>
                  <button
                    data-tour="admin-dash-schedule"
                    onClick={handleOpenScheduleModal}
                    className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-lg shadow-sm border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-2 text-sm shrink-0"
                  >
                    <Clock className="w-4 h-4" /> Programar
                  </button>
                </div>
              )}
            </header>

            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" &&
              (metricas ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div data-tour="admin-dash-kpis">
                    <AdminKPIs metricas={metricas} />
                  </div>

                  {/* Quick Actions */}
                  <div
                    data-tour="admin-dash-actions"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    <button
                      id="tour-admin-tab-especialistas"
                      onClick={() => changeTab("especialistas")}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50/70 via-slate-50/80 to-blue-50/20 dark:bg-none dark:bg-[#162032] rounded-xl border border-blue-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 hover:-translate-y-0.5 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-xl border border-blue-200/50 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
                        <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Gestionar
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Especialistas
                        </p>
                      </div>
                    </button>
                    <button
                      id="tour-admin-tab-asignaciones"
                      onClick={() => changeTab("asignaciones")}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50/70 via-slate-50/80 to-purple-50/20 dark:bg-none dark:bg-[#162032] rounded-xl border border-purple-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500/50 hover:-translate-y-0.5 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 rounded-xl border border-purple-200/50 dark:border-purple-900/40 group-hover:scale-105 transition-transform">
                        <Link2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Crear
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Asignaciones
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => changeTab("usuarios")}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50/70 via-slate-50/80 to-emerald-50/20 dark:bg-none dark:bg-[#162032] rounded-xl border border-emerald-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Administrar
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Usuarios
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => changeTab("catalogos")}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50/70 via-slate-50/80 to-amber-50/20 dark:bg-none dark:bg-[#162032] rounded-xl border border-amber-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500/50 hover:-translate-y-0.5 transition-all text-left group"
                    >
                      <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 rounded-xl border border-amber-200/50 dark:border-amber-900/40 group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Configurar
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Institución
                        </p>
                      </div>
                    </button>
                  </div>

                  <div data-tour="admin-dash-charts">
                    <AdminCharts metricas={metricas} isDark={isDark} />
                  </div>
                  <div data-tour="admin-dash-audit">
                    <AdminActivityLog userName={userName} logs={auditLogs} />
                  </div>
                </div>
              ) : (
                <LoadingState variant="dashboard" role="ADMIN_INSTITUCION" />
              ))}

            {/* ESPECIALISTAS TAB */}
            {activeTab === "especialistas" && (
              <div data-tour="admin-especialistas">
                <EspecialistasTab
                  especialistas={especialistas}
                  catalogos={catalogos}
                  newEsp={newEsp}
                  setNewEsp={setNewEsp}
                  editingEsp={editingEsp}
                  setEditingEsp={setEditingEsp}
                  loading={loading}
                  handleCreateEspecialista={handleCreateEspecialista}
                  handleUpdateEsp={handleUpdateEsp}
                  handleToggleActivo={handleToggleActivo}
                  handleResetPassword={handleResetPassword}
                  exportEspecialistasToPDF={exportEspecialistasToPDF}
                  exportEspecialistasToExcel={exportEspecialistasToExcel}
                  newEspCat={newEspCat}
                  setNewEspCat={setNewEspCat}
                  editingEspCat={editingEspCat}
                  setEditingEspCat={setEditingEspCat}
                  handleCreateEspecialidad={handleCreateEspecialidad}
                  handleUpdateEspecialidad={handleUpdateEspecialidad}
                  handleToggleEspecialidad={handleToggleEspecialidad}
                />
              </div>
            )}

            {/* REPRESENTANTES TAB */}
            {activeTab === "representantes" && (
              <div data-tour="admin-representantes">
                <RepresentantesTab
                  representantes={representantes}
                  loading={loading}
                  onRefresh={fetchData}
                  onRegisterClick={() => setShowRegModal(true)}
                  editingRep={editingRep}
                  setEditingRep={setEditingRep}
                  handleUpdateRepresentante={handleUpdateRepresentante}
                />
              </div>
            )}

            {/* ASIGNACIONES TAB */}
            {activeTab === "asignaciones" && (
              <div data-tour="admin-asignaciones">
                <AsignacionesTab
                  asignacion={asignacion}
                  setAsignacion={setAsignacion}
                  ninos={ninos}
                  especialistas={especialistas}
                  asignaciones={asignaciones}
                  loading={loading}
                  handleAssign={handleAssign}
                  handleToggleAsignacion={handleToggleAsignacion}
                  exportAsignacionesToPDF={exportAsignacionesToPDF}
                  exportAsignacionesToExcel={exportAsignacionesToExcel}
                />
              </div>
            )}

            {/* CATALOGOS TAB */}
            {activeTab === "catalogos" && (
              <div data-tour="admin-catalogos">
                <CatalogosTab
                  catalogos={catalogos}
                  editingInst={editingInst}
                  setEditingInst={setEditingInst}
                  loading={loading}
                  handleUpdateInstitucion={handleUpdateInstitucion}
                  exportEspecialidadesToPDF={exportEspecialidadesToPDF}
                  exportEspecialidadesToExcel={exportEspecialidadesToExcel}
                  ninosCount={ninos.length}
                  especialistasCount={especialistas.length}
                  representantesCount={representantes.length}
                  usuariosCount={usuarios.length}
                  onNavigateTab={changeTab}
                />
              </div>
            )}

            {/* USUARIOS TAB */}
            {activeTab === "usuarios" && (
              <div data-tour="admin-usuarios">
                <UsuariosTab
                  usuarios={usuarios}
                  loading={loading}
                  onRefresh={fetchData}
                  exportUsuariosToPDF={exportUsuariosToPDF}
                  exportUsuariosToExcel={exportUsuariosToExcel}
                />
              </div>
            )}

            {/* INFRAESTRUCTURA TAB */}
            {activeTab === "infraestructura" && (
              <div data-tour="admin-infraestructura">
                <InfraestructuraTab isDark={isDark} />
              </div>
            )}
          </div>
          <Footer />
        </div>
      </main>

      <ConfirmDialog
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm || (() => {})}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {/* MODAL: Registrar Niño & Invitar Representante - Componente Compartido */}
      <RegisterChildModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* MODAL: Enlace de Activación Generado */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-700/60 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl shrink-0 border border-blue-400/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    ¡Invitación Clínica Creada!
                  </h3>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Se ha generado el enlace de activación clínico. Cópielo y
                envíelo al representante para que configure su cuenta:
              </p>

              <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 font-mono text-xs text-slate-900 dark:text-slate-100 select-all break-all text-left max-h-[96px] overflow-y-auto">
                {generatedInvite.link || "Enlace no disponible"}
              </div>

              {generatedInvite.passwordGenerada && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-200 space-y-1">
                  <p className="font-semibold text-blue-800 dark:text-blue-300">
                    Credenciales provisionales
                  </p>
                  {generatedInvite.usu_crro && (
                    <p>
                      Correo:{" "}
                      <span className="font-mono font-semibold select-all">
                        {generatedInvite.usu_crro}
                      </span>
                    </p>
                  )}
                  <p>
                    Contraseña:{" "}
                    <span className="font-mono font-semibold select-all">
                      {generatedInvite.passwordGenerada}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    {generatedInvite.emailSent
                      ? "También se envió el enlace por correo electrónico."
                      : "Comparte este enlace manualmente con el representante."}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    if (generatedInvite.link) {
                      navigator.clipboard.writeText(generatedInvite.link);
                      showToast("📋 Enlace copiado al portapapeles");
                    }
                  }}
                  disabled={!generatedInvite.link}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/25 transition-all"
                >
                  Copiar Enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Credenciales Provisionales de Especialista */}
      {showEspCredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-700/60 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl shrink-0 border border-blue-400/20">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {generatedEspCreds.isReset
                      ? "Contraseña Restablecida"
                      : "¡Especialista Registrado!"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEspCredModal(false)}
                  className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {generatedEspCreds.isReset
                  ? "Se generó una nueva contraseña provisional para el especialista. Compártela de forma segura:"
                  : "El especialista fue acreditado correctamente. Guarda o comparte sus credenciales provisionales de acceso:"}
              </p>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-slate-700 dark:text-slate-200 space-y-2">
                {generatedEspCreds.nombre && !generatedEspCreds.isReset && (
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">
                      Profesional:{" "}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {generatedEspCreds.nombre}
                    </span>
                  </p>
                )}
                {generatedEspCreds.email && (
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">
                      Correo:{" "}
                    </span>
                    <span className="font-mono font-semibold select-all">
                      {generatedEspCreds.email}
                    </span>
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/70 dark:border-blue-800/50">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                      Contraseña provisional
                    </span>
                    <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300 select-all">
                      {generatedEspCreds.password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        generatedEspCreds.password,
                      );
                      showToast("📋 Contraseña copiada al portapapeles");
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100/60 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar clave
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEspCredModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const summary = [
                      generatedEspCreds.nombre && !generatedEspCreds.isReset
                        ? `Especialista: ${generatedEspCreds.nombre}`
                        : null,
                      `Correo: ${generatedEspCreds.email}`,
                      `Contraseña provisional: ${generatedEspCreds.password}`,
                    ]
                      .filter(Boolean)
                      .join("\n");
                    navigator.clipboard?.writeText(summary);
                    showToast("📋 Credenciales copiadas al portapapeles");
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/25 transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Programar Reporte Profesional */}
      {showScheduleModal && (
        <AdminModal
          open={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduleErrors({});
          }}
          title="Programador de Reportes Ejecutivos"
          subtitle="Configura el envío automático periódico y el contenido por correo electrónico"
          icon={Clock}
          maxWidth="max-w-xl"
        >
          <div ref={scheduleFormRef} className="space-y-5">
            {/* Activar/Desactivar */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Envío Automático Programado
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  El servidor enviará el correo según la frecuencia configurada.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={scheduleConfig.enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setScheduleConfig({
                      ...scheduleConfig,
                      enabled,
                    });
                    if (!enabled && scheduleErrors.modules) {
                      setScheduleErrors((prev) => ({ ...prev, modules: "" }));
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {scheduleConfig.last_sent && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Último reporte automático ejecutado con éxito:{" "}
                  <strong>
                    {new Date(scheduleConfig.last_sent).toLocaleDateString(
                      "es-VE",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}{" "}
                    {new Date(scheduleConfig.last_sent).toLocaleTimeString(
                      "es-VE",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </strong>
                </span>
              </div>
            )}

            {/* Módulos / Contenido del Reporte */}
            <div data-field="modules">
              <label className="form-label mb-2 block">
                Módulos e Información a Incluir en el Correo
              </label>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl p-1 ${
                  scheduleErrors.modules
                    ? "ring-2 ring-rose-500/70 bg-rose-50/40 dark:bg-rose-950/20"
                    : ""
                }`}
              >
                {[
                  { key: "metricas", label: "Indicadores Generales (KPIs)" },
                  {
                    key: "pacientes",
                    label: "Resumen Clínico de Pacientes",
                  },
                  {
                    key: "especialistas",
                    label: "Estado de Personal Médico",
                  },
                  {
                    key: "auditoria",
                    label: "Bitácora de Alertas del Sistema",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/30 cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!scheduleConfig.modules?.[item.key]}
                      onChange={(e) => {
                        const nextModules = {
                          ...scheduleConfig.modules,
                          [item.key]: e.target.checked,
                        };
                        setScheduleConfig({
                          ...scheduleConfig,
                          modules: nextModules,
                        });
                        if (Object.values(nextModules).some(Boolean)) {
                          setScheduleErrors((prev) => ({
                            ...prev,
                            modules: "",
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              {scheduleErrors.modules && (
                <p className="form-error" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" />{" "}
                  {scheduleErrors.modules}
                </p>
              )}
            </div>

            {/* Frecuencia y Horarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label">Frecuencia</label>
                <select
                  value={scheduleConfig.frequency}
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      frequency: e.target.value,
                    })
                  }
                  className="form-select text-xs"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              {scheduleConfig.frequency === "weekly" && (
                <div>
                  <label className="form-label">Día preferido</label>
                  <select
                    value={scheduleConfig.day}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        day: e.target.value,
                      })
                    }
                    className="form-select text-xs"
                  >
                    {[
                      "lunes",
                      "martes",
                      "miércoles",
                      "jueves",
                      "viernes",
                      "sábado",
                      "domingo",
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Hora de envío</label>
                <input
                  type="time"
                  data-field="time"
                  name="time"
                  value={scheduleConfig.time || "08:00"}
                  onChange={(e) =>
                    setScheduleConfig({
                      ...scheduleConfig,
                      time: e.target.value,
                    })
                  }
                  className="form-input text-xs"
                />
              </div>
            </div>

            {/* Destinatarios y Asunto */}
            <div className="space-y-3">
              <div>
                <label className="form-label">
                  Asunto del Correo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  data-field="subject"
                  name="subject"
                  maxLength={150}
                  value={scheduleConfig.subject ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScheduleConfig({
                      ...scheduleConfig,
                      subject: val,
                    });
                    if (scheduleErrors.subject) {
                      setScheduleErrors((prev) => ({
                        ...prev,
                        subject: val.trim()
                          ? ""
                          : "El asunto del correo es obligatorio",
                      }));
                    }
                  }}
                  className={`form-input text-xs ${scheduleErrors.subject ? "form-input-invalid" : ""}`}
                  placeholder="Ej. Reporte Semanal de la Clínica SIAT"
                />
                {scheduleErrors.subject && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {scheduleErrors.subject}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">
                    Correo Principal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    data-field="email"
                    name="email"
                    maxLength={120}
                    value={scheduleConfig.email || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScheduleConfig({
                        ...scheduleConfig,
                        email: val,
                      });
                      if (scheduleErrors.email) {
                        setScheduleErrors((prev) => ({
                          ...prev,
                          email: validateEmail(val, {
                            required: true,
                            max: 120,
                          }),
                        }));
                      }
                    }}
                    className={`form-input text-xs ${scheduleErrors.email ? "form-input-invalid" : ""}`}
                    placeholder="admin@fundacion.org"
                  />
                  {scheduleErrors.email && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {scheduleErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">
                    Correos adicionales (opcional)
                  </label>
                  <input
                    type="text"
                    data-field="additionalEmails"
                    name="additionalEmails"
                    maxLength={500}
                    value={scheduleConfig.additionalEmails || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScheduleConfig({
                        ...scheduleConfig,
                        additionalEmails: val,
                      });
                      if (scheduleErrors.additionalEmails) {
                        setScheduleErrors((prev) => ({
                          ...prev,
                          additionalEmails: validateEmailList(val),
                        }));
                      }
                    }}
                    className={`form-input text-xs ${scheduleErrors.additionalEmails ? "form-input-invalid" : ""}`}
                    placeholder="director@fundacion.org, gerencia@fundacion.org"
                  />
                  {scheduleErrors.additionalEmails && (
                    <p className="form-error" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {scheduleErrors.additionalEmails}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3">
              <button
                type="button"
                disabled={sendingTest}
                onClick={async () => {
                  if (!validateScheduleForm(false)) return;
                  setSendingTest(true);
                  try {
                    await api.post(
                      "/admin/reportes/enviar-ahora",
                      scheduleConfig,
                    );
                    showToast(
                      `✅ Reporte de prueba enviado exitosamente a ${scheduleConfig.email.trim()}`,
                    );
                  } catch (err) {
                    const fErr = extractFieldErrors(err);
                    if (Object.keys(fErr).length > 0) {
                      setScheduleErrors((prev) => ({ ...prev, ...fErr }));
                      requestAnimationFrame(() =>
                        focusFirstError(fErr, scheduleFormRef),
                      );
                    }
                    toastError(
                      err,
                      showToast,
                      "No se pudo enviar el reporte por correo.",
                    );
                  } finally {
                    setSendingTest(false);
                  }
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {sendingTest ? (
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Enviar Prueba Ahora
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleErrors({});
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingSchedule}
                  onClick={async () => {
                    if (!validateScheduleForm(true)) return;
                    setSavingSchedule(true);
                    try {
                      await api.post(
                        "/admin/reportes/programados",
                        scheduleConfig,
                      );
                      localStorage.setItem(
                        "reportSchedule",
                        JSON.stringify(scheduleConfig),
                      );
                      showToast(
                        scheduleConfig.enabled
                          ? `✅ Programación activada (${scheduleConfig.frequency}) para ${scheduleConfig.email.trim()}`
                          : "📋 Programación guardada en estado inactivo.",
                      );
                      setShowScheduleModal(false);
                    } catch (err) {
                      const fErr = extractFieldErrors(err);
                      if (Object.keys(fErr).length > 0) {
                        setScheduleErrors((prev) => ({ ...prev, ...fErr }));
                        requestAnimationFrame(() =>
                          focusFirstError(fErr, scheduleFormRef),
                        );
                      }
                      toastError(
                        err,
                        showToast,
                        "Error al guardar la programación.",
                      );
                    } finally {
                      setSavingSchedule(false);
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingSchedule && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Guardar Programación
                </button>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default AdminDashboard;
