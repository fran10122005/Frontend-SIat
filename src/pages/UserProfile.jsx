import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import AdminSidebar from "../components/layout/AdminSidebar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import { jsPDF } from "jspdf";
import {
  UserCircle,
  ShieldCheck,
  Mail,
  Phone,
  Hash,
  Save,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Fingerprint,
  Trash2,
  Info,
  User,
  IdCard,
  CalendarDays,
  Bell,
  FileText,
  AlertTriangle,
  Download,
  LogOut,
  Monitor,
  Smartphone,
  Clock,
  ShieldAlert,
} from "lucide-react";
import Button from "../components/ui/Button";
import LoadingState from "../components/dashboard/LoadingState";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import EmptyState from "../components/shared/EmptyState";
import {
  registerFingerprint,
  listPasskeys,
  deletePasskey,
} from "../api/passkey";
import { getErrorMessage } from "../utils/errorHandler";
import FotoUpload from "../components/shared/FotoUpload";

const TEXTO_CONSENTIMIENTO = `Al aceptar este documento, usted, en su condición de representante legal, autoriza de forma expresa, libre e inequívoca al Sistema Inteligente de Asistencia Terapéutica (SIAT) y a la institución vinculada a:

1. Recopilar y procesar datos personales y de salud del menor bajo su representación (incluyendo, pero no limitado a: frecuencia cardíaca, niveles de estrés, movimiento, registros de sueño, apetito y crisis) mediante el uso de dispositivos wearables y bitácoras manuales.
2. Almacenar dichos datos en expedientes clínicos digitales de alta seguridad.
3. Compartir la información exclusivamente con los especialistas terapéuticos asignados al menor y con los administradores de la institución, con el único fin de monitorear y mejorar su desarrollo.

Privacidad y Biometría:
• SIAT protege la confidencialidad de la información médica. No divulgaremos estos datos a terceros ajenos a la institución sin su previo consentimiento por escrito, salvo requerimiento judicial.
• Si decide utilizar biometría (huella dactilar/passkeys) para acceder al sistema, SIAT NO almacenará su huella. Solo almacenaremos una credencial criptográfica pública.

Este consentimiento se fundamenta en el Artículo 79 de la Ley de Infogobierno y el Artículo 65 de la LOPNNA de la República Bolivariana de Venezuela. Usted tiene el derecho de solicitar el acceso, rectificación o eliminación de estos datos comunicándose con la administración de la institución.`;

const NOTIF_DEFAULTS = {
  crisis_correo: true,
  crisis_push: true,
  resumen_diario: true,
  recordatorios: true,
  novedades: false,
};

function getPasswordStrength(pwd) {
  let score = 0;
  if (!pwd) return { score, label: "Muy débil", color: "bg-slate-200 w-0" };

  const hasMinLength = pwd.length >= 8;
  const hasLowercase = /[a-z]/.test(pwd);
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);

  if (hasMinLength) score += 1;
  if (hasLowercase) score += 1;
  if (hasUppercase) score += 1;
  if (hasNumber) score += 1;

  let label = "Débil";
  let color = "bg-red-500 w-1/4";

  if (score === 2) {
    label = "Regular";
    color = "bg-orange-500 w-2/4";
  } else if (score === 3) {
    label = "Buena";
    color = "bg-yellow-500 w-3/4";
  } else if (score === 4) {
    label = "Excelente";
    color = "bg-emerald-500 w-full";
  }

  return {
    score,
    label,
    color,
    criteria: {
      minLength: hasMinLength,
      lowercase: hasLowercase,
      uppercase: hasUppercase,
      number: hasNumber,
    },
  };
}

function detectarDispositivo() {
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Navegador";
  const so = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Desconocido";
  return `${navegador} · ${so}`;
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function CollapsibleNote({
  icon: Icon = Info,
  tone = "blue",
  title,
  children,
}) {
  const tones = {
    blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-blue-300",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300",
  };
  return (
    <details
      className={`group rounded-xl border ${tones[tone]} overflow-hidden`}
    >
      <summary className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold cursor-pointer list-none select-none min-h-[40px] [&::-webkit-details-marker]:hidden">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 leading-snug">{title}</span>
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
      <div className="px-3 pb-3 pt-1 text-xs leading-relaxed">{children}</div>
    </details>
  );
}

function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  autoComplete = "current-password",
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-4 pr-12 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-normal"
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {visible ? (
          <EyeOff className="w-5 h-5 sm:w-4 sm:h-4" />
        ) : (
          <Eye className="w-5 h-5 sm:w-4 sm:h-4" />
        )}
      </button>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, tone = "slate" }) {
  const tones = {
    slate: "text-slate-400",
    rose: "text-rose-500",
    emerald: "text-emerald-500",
  };
  return (
    <div className="px-4 sm:px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
      <Icon className={`w-5 h-5 ${tones[tone]}`} />
      <div>
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

import PageTitle from "../components/ui/PageTitle";

export default function UserProfile() {
  const {
    userRole,
    showToast,
    setCurrentView,
    setAdminActiveTab,
    setUserName,
  } = useGlobalContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const [profile, setProfile] = useState({
    nomb: "",
    apel: "",
    telf: "",
    tdoc: "V",
    fecnac: "",
    cedu: "",
    licencia: "",
    rela: "",
    email: "",
    rol_nomb: "",
    gner: "",
    foto: "",
  });
  const savedProfileRef = useRef(profile);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passkeys, setPasskeys] = useState([]);
  const [fpLoading, setFpLoading] = useState(false);

  const [twoFA, setTwoFA] = useState(
    () => localStorage.getItem("siat_2fa") === "true",
  );
  const [dialog, setDialog] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [revokingSession, setRevokingSession] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      return {
        ...NOTIF_DEFAULTS,
        ...JSON.parse(localStorage.getItem("siat_notif_prefs") || "{}"),
      };
    } catch {
      return { ...NOTIF_DEFAULTS };
    }
  });
  const [pushPermiso, setPushPermiso] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const [consentHistorial, setConsentHistorial] = useState([]);
  const [solicitudEliminacion, setSolicitudEliminacion] = useState(
    () => localStorage.getItem("siat_solicitud_eliminacion") || "",
  );

  useEffect(() => {
    const loadPasskeys = async () => {
      try {
        const keys = await listPasskeys();
        setPasskeys(keys);
      } catch {}
    };
    loadPasskeys();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("siat_sessions_v1");
      if (raw) {
        setSessions(JSON.parse(raw));
      } else {
        const seed = [
          {
            id: "ses-movil",
            dispositivo: "Safari · iOS",
            ubicacion: "Caracas, VE",
            fecha: new Date(Date.now() - 5 * 86400000).toISOString(),
            actual: false,
          },
          {
            id: "ses-web",
            dispositivo: "Firefox · Windows",
            ubicacion: "Valencia, VE",
            fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
            actual: false,
          },
          {
            id: "actual",
            dispositivo: detectarDispositivo(),
            ubicacion: "Esta sesión",
            fecha: new Date().toISOString(),
            actual: true,
          },
        ];
        localStorage.setItem("siat_sessions_v1", JSON.stringify(seed));
        setSessions(seed);
      }
    } catch {
      setSessions([
        {
          id: "actual",
          dispositivo: detectarDispositivo(),
          ubicacion: "Esta sesión",
          fecha: new Date().toISOString(),
          actual: true,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        const userData = res.data.data;

        let nomb = "",
          apel = "",
          telf = "",
          tdoc = "V",
          fecnac = "",
          cedu = "",
          licencia = "",
          rela = "",
          gner = "",
          foto = "";

        if (userData.rol_codi === "ROL_ESP" && userData.tm_espec) {
          nomb = userData.tm_espec.esp_nomb;
          apel = userData.tm_espec.esp_apel;
          telf = userData.tm_espec.esp_telf || "";
          tdoc = userData.tm_espec.esp_tdoc || "V";
          fecnac = userData.tm_espec.esp_fnac
            ? String(userData.tm_espec.esp_fnac).slice(0, 10)
            : "";
          licencia = userData.tm_espec.esp_licencia || "";
          gner = userData.tm_espec.esp_gner || "F";
          foto = userData.tm_espec.esp_foto || "";
        } else if (userData.rol_codi === "ROL_REP" && userData.tm_repre) {
          nomb = userData.tm_repre.rep_nomb;
          apel = userData.tm_repre.rep_apel;
          telf = userData.tm_repre.rep_telf || "";
          cedu = userData.tm_repre.rep_cedu || "";
          rela = userData.tm_repre.rep_rela || "";
          foto = userData.tm_repre.rep_foto || "";
        } else if (userData.rol_codi === "ROL_ADM" && userData.tm_admin) {
          nomb = userData.tm_admin.adm_nomb;
          apel = userData.tm_admin.adm_apel;
          foto = userData.tm_admin.adm_foto || "";
        }

        const loaded = {
          nomb,
          apel,
          telf,
          tdoc,
          fecnac,
          cedu,
          licencia,
          rela,
          gner,
          foto,
          email: userData.usu_crro,
          rol_nomb: userData.tm_roles?.rol_nomb || "Usuario",
        };
        setProfile(loaded);
        savedProfileRef.current = loaded;

        try {
          const hist = await api.get("/consentimiento/historial");
          setConsentHistorial(hist.data?.data || []);
        } catch {
          const aceptado = localStorage.getItem("siat_consentimiento_aceptado");
          setConsentHistorial(
            aceptado
              ? [{ version: "1.0", fecha: aceptado, origen: "local" }]
              : [],
          );
        }
      } catch (error) {
        console.error(error);
        showToast("⚠️ No se pudo cargar la información del perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const cancelProfile = () => {
    setProfile(savedProfileRef.current);
    showToast("Cambios descartados");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleRegisterFingerprint = async () => {
    setFpLoading(true);
    try {
      await registerFingerprint("Dispositivo");
      setPasskeys(await listPasskeys());
      showToast("Acceso rápido con huella configurado");
    } catch (err) {
      console.error(err);
      showToast(
        err?.name === "NotAllowedError"
          ? "Registro cancelado o huella no disponible."
          : err?.isAxiosError || err?.response
            ? getErrorMessage(err, "No se pudo registrar la huella.")
            : "No se pudo registrar la huella.",
      );
    } finally {
      setFpLoading(false);
    }
  };

  const handleDeleteFingerprint = async (pk_id) => {
    try {
      await deletePasskey(pk_id);
      setPasskeys((prev) => prev.filter((k) => k.pk_id !== pk_id));
      showToast("Acceso rápido eliminado");
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, "No se pudo eliminar el acceso rápido"));
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nomb: profile.nomb,
        apel: profile.apel,
        telf: profile.telf,
        foto: profile.foto || null,
      };
      if (userRole === "ESPECIALISTA") {
        payload.licencia = profile.licencia;
        payload.tdoc = profile.tdoc;
        payload.fnac = profile.fecnac || null;
      } else if (userRole !== "ADMIN_INSTITUCION") {
        payload.rela = profile.rela;
      }
      await api.put("/auth/me", payload);
      let updatedName = `${profile.nomb} ${profile.apel}`;
      if (userRole === "ESPECIALISTA") {
        updatedName = `${profile.gner === "M" ? "Dr." : "Dra."} ${profile.nomb} ${profile.apel}`;
      }
      setUserName(updatedName);
      savedProfileRef.current = profile;
      showToast("✅ Perfil actualizado correctamente");
    } catch (error) {
      showToast(
        getErrorMessage(error, "⚠️ Ocurrió un error al actualizar el perfil"),
      );
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      showToast("⚠️ La contraseña actual es requerida");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("⚠️ Las contraseñas nuevas no coinciden");
      return;
    }

    const strength = getPasswordStrength(passwordData.newPassword);
    if (strength.score < 4) {
      showToast(
        "⚠️ La nueva contraseña debe cumplir con todos los requisitos de seguridad",
      );
      return;
    }

    setSaving(true);
    try {
      await api.put("/auth/me/password", {
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
      });
      showToast("🔐 Contraseña actualizada correctamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          "⚠️ Ocurrió un error al actualizar la contraseña",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleTwoFA = (next) => {
    setTwoFA(next);
    localStorage.setItem("siat_2fa", String(next));
    showToast(
      next
        ? "🛡️ Autenticación en Dos Factores activada"
        : "Autenticación en Dos Factores desactivada",
    );
  };

  const cerrarOtrasSesiones = () => {
    const restantes = sessions.filter((s) => s.actual);
    setRevokingSession(true);
    setTimeout(() => {
      setSessions(restantes);
      localStorage.setItem("siat_sessions_v1", JSON.stringify(restantes));
      setRevokingSession(false);
      showToast("🔒 Se cerraron las demás sesiones activas");
    }, 600);
  };

  const revocarSesion = (id) => {
    const restantes = sessions.filter((s) => s.id !== id);
    setSessions(restantes);
    localStorage.setItem("siat_sessions_v1", JSON.stringify(restantes));
    showToast("Sesión cerrada en ese dispositivo");
  };

  const actualizarPref = (key, value) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    localStorage.setItem("siat_notif_prefs", JSON.stringify(next));
  };

  const solicitarPermisoPush = async () => {
    if (typeof Notification === "undefined") {
      showToast("⚠️ Tu navegador no soporta notificaciones push");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermiso(perm);
      if (perm === "granted")
        showToast("🔔 Notificaciones push activadas en este navegador");
      else if (perm === "denied")
        showToast("🔕 Permiso de notificaciones bloqueado en el navegador");
      else showToast("Permiso de notificaciones pendiente");
    } catch {
      showToast("No se pudo solicitar el permiso de notificaciones");
    }
  };

  const descargarConsentimiento = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const ancho = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("SIAT · Sistema Integrado de Asistencia Terapéutica", margin, y);
    y += 22;
    doc.setFontSize(12);
    doc.text("Consentimiento Informado Legal — Versión 1.0", margin, y);
    y += 8;
    doc.setDrawColor(180);
    doc.line(margin, y, margin + ancho, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(TEXTO_CONSENTIMIENTO, ancho);
    lineas.forEach((linea) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(linea, margin, y);
      y += 14;
    });

    if (y > doc.internal.pageSize.getHeight() - margin - 60) {
      doc.addPage();
      y = margin;
    }
    y += 36;
    doc.setFontSize(10);
    doc.text("Firma del representante legal:", margin, y);
    y += 40;
    doc.setDrawColor(120);
    doc.line(margin, y, margin + 220, y);

    doc.save("SIAT-Consentimiento-Informado-v1.0.pdf");
    showToast("📄 Consentimiento descargado correctamente");
  };

  const exportarMisDatos = () => {
    const data = {
      exportado: new Date().toISOString(),
      aplicacion: "SIAT",
      version: "1.0",
      perfil: {
        nombre: `${profile.nomb} ${profile.apel}`.trim(),
        correo: profile.email,
        rol: profile.rol_nomb,
        telefono: profile.telf,
        cedula: profile.cedu,
        fechaNacimiento: profile.fecnac,
        direccion: profile.dire,
      },
      seguridad: {
        autenticacionDosFactores: twoFA,
        passkeysRegistradas: passkeys.length,
      },
      preferenciasNotificaciones: notifPrefs,
      sesionesRegistradas: sessions.length,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "siat-mis-datos.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("📦 Exportación de datos generada");
  };

  const solicitarEliminacion = () => {
    const fecha = new Date().toISOString();
    localStorage.setItem("siat_solicitud_eliminacion", fecha);
    setSolicitudEliminacion(fecha);
    showToast("🗑️ Solicitud de eliminación registrada");
  };

  const cancelarEliminacion = () => {
    localStorage.removeItem("siat_solicitud_eliminacion");
    setSolicitudEliminacion("");
    showToast("Solicitud de eliminación cancelada");
  };

  const TABS = [
    { id: "personal", label: "Información Personal", icon: User },
    { id: "seguridad", label: "Seguridad y Acceso", icon: ShieldCheck },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "consentimiento", label: "Consentimiento", icon: FileText },
    { id: "peligro", label: "Zona de Peligro", icon: AlertTriangle },
  ];

  const inputClass =
    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-normal";

  const labelClass =
    "text-xs font-bold uppercase tracking-wider text-slate-500";

  const strength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      {userRole === "ADMIN_INSTITUCION" ? (
        <AdminSidebar
          activeTab=""
          setActiveTab={(tab) => {
            setAdminActiveTab(tab);
            setCurrentView("admin");
          }}
        />
      ) : (
        <Sidebar />
      )}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto p-4 md:p-6 flex flex-col gap-6 pb-[max(3rem,env(safe-area-inset-bottom))] sm:pb-12">
            <header>
              <PageTitle icon={UserCircle}>Centro de Cuenta</PageTitle>
              <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 mt-1">
                Gestiona tu identidad, seguridad, notificaciones y privacidad en
                SIAT.
              </p>
            </header>

            {loading ? (
              <LoadingState variant="profile" />
            ) : (
              <>
                {/* Resumen de cuenta */}
                <Card className="hover:shadow-md">
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <FotoUpload
                      value={profile.foto}
                      onChange={(url) =>
                        setProfile((prev) => ({ ...prev, foto: url }))
                      }
                      label="Tu foto de perfil"
                      alt="Foto de perfil"
                      size="w-20 h-20 sm:w-24 sm:h-24"
                    />
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {profile.nomb} {profile.apel}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full uppercase tracking-wider">
                          {profile.rol_nomb}
                        </span>
                        {twoFA && (
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> 2FA
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{profile.email}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Navegación de pestañas */}
                <nav
                  className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Secciones del perfil"
                >
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={activeTab === tab.id ? "page" : undefined}
                      className={`flex items-center gap-2 px-4 py-3 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        activeTab === tab.id
                          ? tab.id === "peligro"
                            ? "bg-rose-600 text-white shadow-sm shadow-rose-600/25"
                            : "bg-white dark:bg-slate-800 text-brand-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                          : tab.id === "peligro"
                            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <tab.icon className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                      {tab.label}
                    </button>
                  ))}
                </nav>

                {/* ═══ PESTAÑA: INFORMACIÓN PERSONAL ═══ */}
                {activeTab === "personal" && (
                  <form onSubmit={submitProfile}>
                    <Card>
                      <CardHeader
                        icon={User}
                        title="Información Personal"
                        subtitle="Datos de identificación visibles para tu institución"
                      />
                      <div className="p-4 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-2">
                            <label className={labelClass}>Nombres</label>
                            <input
                              type="text"
                              name="nomb"
                              value={profile.nomb}
                              onChange={handleProfileChange}
                              required
                              className={inputClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Apellidos</label>
                            <input
                              type="text"
                              name="apel"
                              value={profile.apel}
                              onChange={handleProfileChange}
                              required
                              className={inputClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <label
                              className={`${labelClass} flex items-center gap-1`}
                            >
                              <Phone className="w-3 h-3" /> Teléfono
                            </label>
                            <input
                              type="tel"
                              name="telf"
                              value={profile.telf}
                              onChange={handleProfileChange}
                              className={inputClass}
                            />
                          </div>

                          {userRole === "ESPECIALISTA" && (
                            <>
                              <div className="space-y-2">
                                <label
                                  className={`${labelClass} flex items-center gap-1`}
                                >
                                  <IdCard className="w-3 h-3" /> Tipo de
                                  Documento
                                </label>
                                <select
                                  name="tdoc"
                                  value={profile.tdoc}
                                  onChange={handleProfileChange}
                                  className={inputClass}
                                >
                                  <option value="V">Venezolano (V)</option>
                                  <option value="E">Extranjero (E)</option>
                                  <option value="P">Pasaporte (P)</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label
                                  className={`${labelClass} flex items-center gap-1`}
                                >
                                  <CalendarDays className="w-3 h-3" /> Fecha de
                                  Nacimiento
                                </label>
                                <input
                                  type="date"
                                  name="fecnac"
                                  max={new Date().toISOString().split("T")[0]}
                                  value={profile.fecnac}
                                  onChange={handleProfileChange}
                                  className={inputClass}
                                />
                              </div>
                            </>
                          )}

                          {userRole === "REPRESENTANTE" && (
                            <>
                              <div className="space-y-2">
                                <label
                                  className={`${labelClass} flex items-center gap-1`}
                                >
                                  <IdCard className="w-3 h-3" /> Cédula de
                                  Identidad
                                </label>
                                <input
                                  type="text"
                                  value={profile.cedu || "No registrada"}
                                  readOnly
                                  disabled
                                  className={`${inputClass} opacity-70 cursor-not-allowed`}
                                />
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                  La cédula es tu identificador único en SIAT.
                                  Para modificarla contacta al administrador de
                                  tu institución.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <label className={labelClass}>Parentesco</label>
                                <select
                                  name="rela"
                                  value={profile.rela}
                                  onChange={handleProfileChange}
                                  className={inputClass}
                                >
                                  <option value="Padre">Padre</option>
                                  <option value="Madre">Madre</option>
                                  <option value="Tutor Legal">
                                    Tutor Legal
                                  </option>
                                  <option value="Abuelo/a">Abuelo/a</option>
                                  <option value="Otro Familiar">
                                    Otro Familiar Directo
                                  </option>
                                </select>
                              </div>
                            </>
                          )}

                          {userRole === "ESPECIALISTA" && (
                            <div className="space-y-2">
                              <label
                                className={`${labelClass} flex items-center gap-1`}
                              >
                                <Hash className="w-3 h-3" /> Licencia Médica
                              </label>
                              <input
                                type="text"
                                name="licencia"
                                value={profile.licencia}
                                onChange={handleProfileChange}
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>

                        <CollapsibleNote
                          icon={Info}
                          tone="blue"
                          title="Correo electrónico bloqueado"
                        >
                          El correo <strong>{profile.email}</strong> está
                          vinculado a tu cuenta y no puede modificarse. Contacta
                          a un administrador si necesitas cambiarlo.
                        </CollapsibleNote>
                      </div>
                      <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="w-full sm:w-auto"
                          onClick={cancelProfile}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          leftIcon={<Save className="w-4 h-4" />}
                          loading={saving}
                          className="w-full sm:w-auto"
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    </Card>
                  </form>
                )}

                {/* ═══ PESTAÑA: SEGURIDAD Y ACCESO ═══ */}
                {activeTab === "seguridad" && (
                  <div className="space-y-6">
                    {/* Passkeys */}
                    <Card>
                      <CardHeader
                        icon={Fingerprint}
                        title="Passkeys (WebAuthn)"
                        subtitle="Accede con tu huella, rostro o PIN del dispositivo"
                        tone="emerald"
                      />
                      <div className="p-4 sm:p-6 space-y-4">
                        {passkeys.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Aún no has configurado acceso rápido.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {passkeys.map((k) => (
                              <div
                                key={k.pk_id}
                                className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Fingerprint className="w-4 h-4 text-blue-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                      {k.pk_nomb}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {k.pk_last_used
                                        ? `Último uso: ${new Date(k.pk_last_used).toLocaleDateString()}`
                                        : "Creado recientemente"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteFingerprint(k.pk_id)
                                  }
                                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                  aria-label={`Eliminar acceso rápido ${k.pk_nomb}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <CollapsibleNote
                          icon={Info}
                          tone="blue"
                          title="¿Cómo funciona el acceso con huella?"
                        >
                          SIAT <strong>no almacena tu huella dactilar</strong>{" "}
                          ni datos biométricos. Solo se guarda una clave
                          criptográfica pública en nuestros servidores. Tu
                          huella permanece en tu dispositivo de forma segura.
                        </CollapsibleNote>

                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          fullWidth
                          leftIcon={<Fingerprint className="w-4 h-4" />}
                          loading={fpLoading}
                          onClick={handleRegisterFingerprint}
                        >
                          Registrar nueva passkey
                        </Button>
                      </div>
                    </Card>

                    {/* Contraseña */}
                    <form onSubmit={submitPassword}>
                      <Card>
                        <CardHeader
                          icon={KeyRound}
                          title="Contraseña"
                          subtitle="Actualiza tu clave de acceso periódicamente"
                        />
                        <div className="p-4 sm:p-6 space-y-6">
                          <div className="space-y-2">
                            <label className={labelClass}>
                              Contraseña Actual
                            </label>
                            <PasswordInput
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              placeholder="Ingresa tu contraseña actual"
                              visible={showPassword.current}
                              onToggle={() =>
                                togglePasswordVisibility("current")
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                              <label className={labelClass}>
                                Nueva Contraseña
                              </label>
                              <PasswordInput
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Mínimo 8 caracteres"
                                visible={showPassword.new}
                                onToggle={() => togglePasswordVisibility("new")}
                                autoComplete="new-password"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className={labelClass}>
                                Confirmar Nueva Contraseña
                              </label>
                              <PasswordInput
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Repite la contraseña nueva"
                                visible={showPassword.confirm}
                                onToggle={() =>
                                  togglePasswordVisibility("confirm")
                                }
                                autoComplete="new-password"
                              />
                            </div>
                          </div>

                          {passwordData.newPassword && (
                            <div className="space-y-3 mt-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                  <span>Complejidad de contraseña:</span>
                                  <span
                                    className={
                                      strength.score <= 1
                                        ? "text-red-500 font-bold"
                                        : strength.score === 2
                                          ? "text-orange-500 font-bold"
                                          : strength.score === 3
                                            ? "text-yellow-600 dark:text-yellow-400 font-bold"
                                            : "text-emerald-500 font-bold animate-pulse"
                                    }
                                  >
                                    {strength.label}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 rounded-full ${strength.color}`}
                                  ></div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                                {[
                                  {
                                    ok: strength.criteria.minLength,
                                    texto: "Mínimo 8 caracteres",
                                  },
                                  {
                                    ok: strength.criteria.lowercase,
                                    texto: "Letra minúscula (a-z)",
                                  },
                                  {
                                    ok: strength.criteria.uppercase,
                                    texto: "Letra mayúscula (A-Z)",
                                  },
                                  {
                                    ok: strength.criteria.number,
                                    texto: "Al menos un número (0-9)",
                                  },
                                ].map((c) => (
                                  <div
                                    key={c.texto}
                                    className="flex items-center gap-1.5"
                                  >
                                    {c.ok ? (
                                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                    )}
                                    <span
                                      className={
                                        c.ok
                                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                          : ""
                                      }
                                    >
                                      {c.texto}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            leftIcon={<Lock className="w-4 h-4" />}
                            loading={saving}
                            disabled={
                              !passwordData.currentPassword ||
                              passwordData.newPassword !==
                                passwordData.confirmPassword ||
                              strength.score < 4
                            }
                            className="w-full sm:w-auto"
                          >
                            Actualizar Contraseña
                          </Button>
                        </div>
                      </Card>
                    </form>

                    {/* 2FA */}
                    <Card>
                      <CardHeader
                        icon={ShieldCheck}
                        title="Autenticación en Dos Factores (2FA)"
                        subtitle="Una capa extra de protección al iniciar sesión"
                        tone="emerald"
                      />
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                              Protección con segundo factor
                              {twoFA ? (
                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Activada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Desactivada
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Código temporal (TOTP) en cada inicio de sesión.
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={twoFA}
                            onChange={(next) => {
                              if (!next) {
                                setDialog({
                                  title: "Desactivar 2FA",
                                  message:
                                    "Tu cuenta quedará protegida únicamente por tu contraseña y passkeys. ¿Deseas continuar?",
                                  type: "danger",
                                  confirmLabel: "Desactivar",
                                  onConfirm: () => toggleTwoFA(false),
                                });
                              } else {
                                setDialog({
                                  title:
                                    "Activar Autenticación en Dos Factores",
                                  message:
                                    "Vincularás una app autenticadora (Google Authenticator, Authy, etc.) que generará códigos temporales en cada inicio de sesión. ¿Continuar?",
                                  type: "default",
                                  confirmLabel: "Activar",
                                  onConfirm: () => toggleTwoFA(true),
                                });
                              }
                            }}
                          />
                        </div>
                        {twoFA && (
                          <CollapsibleNote
                            icon={ShieldAlert}
                            tone="emerald"
                            title="Códigos de recuperación y pérdida de acceso"
                          >
                            Guarda tus códigos de recuperación en un lugar
                            seguro. Si pierdes el acceso a tu app autenticadora,
                            un administrador podrá restablecer tu segundo
                            factor.
                          </CollapsibleNote>
                        )}
                      </div>
                    </Card>

                    {/* Sesiones activas */}
                    <Card>
                      <CardHeader
                        icon={Monitor}
                        title="Sesiones Activas"
                        subtitle="Dispositivos con acceso a tu cuenta"
                      />
                      <div className="p-4 sm:p-6 space-y-3">
                        {sessions.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                {/iOS|Android/.test(s.dispositivo) ? (
                                  <Smartphone className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <Monitor className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                  {s.dispositivo}
                                  {s.actual && (
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                      Esta sesión
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  {new Date(s.fecha).toLocaleString("es-VE", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                  {!s.actual && ` · ${s.ubicacion}`}
                                </p>
                              </div>
                            </div>
                            {!s.actual && (
                              <button
                                type="button"
                                onClick={() => revocarSesion(s.id)}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg px-3 py-2 transition-colors shrink-0"
                              >
                                Cerrar
                              </button>
                            )}
                          </div>
                        ))}

                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={<LogOut className="w-3.5 h-3.5" />}
                            loading={revokingSession}
                            disabled={
                              sessions.filter((s) => !s.actual).length === 0
                            }
                            onClick={() =>
                              setDialog({
                                title: "Cerrar otras sesiones",
                                message:
                                  "Se cerrará la sesión en todos los dispositivos excepto en el actual. Deberás volver a iniciar sesión en ellos.",
                                type: "danger",
                                confirmLabel: "Cerrar sesiones",
                                onConfirm: cerrarOtrasSesiones,
                              })
                            }
                            className="w-full sm:w-auto"
                          >
                            Cerrar otras sesiones
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ═══ PESTAÑA: NOTIFICACIONES ═══ */}
                {activeTab === "notificaciones" && (
                  <Card>
                    <CardHeader
                      icon={Bell}
                      title="Preferencias de Notificaciones"
                      subtitle="Elige cómo y cuándo quieres recibir avisos"
                    />
                    <div className="p-4 sm:p-6 space-y-2">
                      {[
                        {
                          key: "crisis_correo",
                          titulo: "Alertas de crisis por correo electrónico",
                          desc: "Correo inmediato al detectar una crisis.",
                        },
                        {
                          key: "crisis_push",
                          titulo: "Alertas de crisis push (navegador)",
                          desc: "Notificación instantánea en pantalla.",
                        },
                        {
                          key: "resumen_diario",
                          titulo: "Resumen diario de actividad",
                          desc: "Informe cada mañana del día anterior.",
                        },
                        {
                          key: "recordatorios",
                          titulo: "Recordatorios de sesiones y terapia",
                          desc: "Avisos previos a citas y actividades.",
                        },
                        {
                          key: "novedades",
                          titulo: "Novedades y anuncios de SIAT",
                          desc: "Comunicados y nuevas funcionalidades.",
                        },
                      ].map((pref) => (
                        <div
                          key={pref.key}
                          className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {pref.titulo}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {pref.desc}
                            </p>
                          </div>
                          <div className="pt-0.5">
                            <ToggleSwitch
                              checked={!!notifPrefs[pref.key]}
                              onChange={(v) => actualizarPref(pref.key, v)}
                            />
                          </div>
                        </div>
                      ))}

                      {pushPermiso !== "granted" && notifPrefs.crisis_push && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3.5 rounded-xl">
                          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex-1">
                            Requiere permiso del navegador.
                          </p>
                          <Button
                            type="button"
                            variant="warning"
                            size="sm"
                            onClick={solicitarPermisoPush}
                            className="shrink-0"
                          >
                            Activar permiso
                          </Button>
                        </div>
                      )}

                      <CollapsibleNote
                        icon={Info}
                        tone="blue"
                        title="Sobre las alertas críticas de emergencia"
                      >
                        Las alertas críticas de emergencia médica siempre se
                        enviarán por correo, independientemente de estas
                        preferencias, conforme a las políticas de seguridad
                        clínica de SIAT.
                      </CollapsibleNote>
                    </div>
                  </Card>
                )}

                {/* ═══ PESTAÑA: CONSENTIMIENTO ═══ */}
                {activeTab === "consentimiento" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader
                        icon={FileText}
                        title="Consentimiento Informado"
                        subtitle="Marco legal: Ley de Infogobierno (Art. 79) y LOPNNA (Art. 65)"
                      />
                      <div className="p-4 sm:p-6 space-y-4">
                        <CollapsibleNote
                          icon={FileText}
                          tone="blue"
                          title="¿Qué es este documento?"
                        >
                          Como representante legal, este documento ampara el
                          tratamiento de datos personales y de salud del menor
                          dentro de la plataforma. Puedes descargar una copia en
                          PDF con espacio para firma en cualquier momento.
                        </CollapsibleNote>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            leftIcon={<Download className="w-4 h-4" />}
                            onClick={descargarConsentimiento}
                            className="w-full sm:w-auto"
                          >
                            Descargar copia (PDF)
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader
                        icon={Clock}
                        title="Historial de Consentimientos"
                        subtitle="Versiones aceptadas de este documento"
                      />
                      <div className="p-4 sm:p-6">
                        {consentHistorial.length === 0 ? (
                          <EmptyState
                            icon={FileText}
                            title="Sin registros aún"
                            description="Cuando aceptes o se registre una versión del consentimiento informado, aparecerá aquí con su fecha."
                          />
                        ) : (
                          <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-5">
                            {consentHistorial.map((h, i) => (
                              <li key={i} className="pl-5">
                                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-800"></span>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                  Versión {h.version}
                                  {i === 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                      Vigente
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {h.fecha
                                    ? new Date(h.fecha).toLocaleString(
                                        "es-VE",
                                        {
                                          dateStyle: "long",
                                          timeStyle: "short",
                                        },
                                      )
                                    : "Fecha no disponible"}
                                </p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* ═══ PESTAÑA: ZONA DE PELIGRO ═══ */}
                {activeTab === "peligro" && (
                  <div className="space-y-6">
                    <Card className="!border-rose-200 dark:!border-rose-900/50">
                      <CardHeader
                        icon={AlertTriangle}
                        title="Zona de Peligro"
                        subtitle="Acciones irreversibles sobre tu cuenta y datos"
                        tone="rose"
                      />
                      <div className="p-4 sm:p-6 space-y-4">
                        {solicitudEliminacion && (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl">
                            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                                Solicitud de eliminación registrada
                              </p>
                              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                                Registrada el{" "}
                                {new Date(solicitudEliminacion).toLocaleString(
                                  "es-VE",
                                  {
                                    dateStyle: "long",
                                    timeStyle: "short",
                                  },
                                )}
                                . El equipo administrativo procesará tu
                                solicitud en un máximo de 30 días hábiles
                                conforme a la LOPNNA. Mientras tanto, tu cuenta
                                permanece activa.
                              </p>
                              <button
                                type="button"
                                onClick={cancelarEliminacion}
                                className="mt-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:text-rose-700 dark:hover:text-rose-300"
                              >
                                Cancelar solicitud
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              Exportar mis datos
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Copia JSON de tu perfil y configuración (Art. 79).
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            leftIcon={<Download className="w-4 h-4" />}
                            onClick={exportarMisDatos}
                            className="w-full sm:w-auto shrink-0"
                          >
                            Exportar
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              Solicitar eliminación de cuenta
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Eliminación permanente vía administrador (máx. 30
                              días hábiles).
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="danger"
                            size="md"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            disabled={!!solicitudEliminacion}
                            onClick={() =>
                              setDialog({
                                title: "Solicitar eliminación de cuenta",
                                message:
                                  "<strong>Esta acción es permanente.</strong><br/><br/>Se notificará al administrador de tu institución para que procese la eliminación de tu cuenta, expedientes vinculados y historial clínico asociado en un plazo máximo de 30 días hábiles.<br/><br/>¿Deseas continuar?",
                                type: "danger",
                                confirmLabel: "Enviar solicitud",
                                onConfirm: solicitarEliminacion,
                              })
                            }
                            className="w-full sm:w-auto shrink-0"
                          >
                            Solicitar eliminación
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {dialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDialog(null)}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          confirmLabel={dialog.confirmLabel}
        />
      )}
    </div>
  );
}
