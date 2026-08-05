import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import AdminSidebar from "../components/layout/AdminSidebar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import {
  UserCircle,
  ShieldCheck,
  Mail,
  Phone,
  Hash,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  X,
  Fingerprint,
  Trash2,
  Info,
} from "lucide-react";
import LoadingState from "../components/dashboard/LoadingState";
import {
  registerFingerprint,
  listPasskeys,
  deletePasskey,
} from "../api/passkey";

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

  // Profile state
  const [profile, setProfile] = useState({
    nomb: "",
    apel: "",
    telf: "",
    licencia: "",
    rela: "",
    email: "",
    rol_nomb: "",
    gner: "",
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Show password flags
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Passkey (acceso rápido con huella) state
  const [passkeys, setPasskeys] = useState([]);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg, setFpMsg] = useState("");

  useEffect(() => {
    const loadPasskeys = async () => {
      try {
        const keys = await listPasskeys();
        setPasskeys(keys);
      } catch {
        // si la sesión caducó, el interceptor redirige al login
      }
    };
    loadPasskeys();
  }, []);

  const handleRegisterFingerprint = async () => {
    setFpLoading(true);
    setFpMsg("");
    try {
      await registerFingerprint("Dispositivo");
      setPasskeys(await listPasskeys());
      setFpMsg("Tu huella fue registrada correctamente.");
      showToast("Acceso rápido con huella configurado");
    } catch (err) {
      console.error(err);
      setFpMsg(
        err?.name === "NotAllowedError"
          ? "Registro cancelado o huella no disponible."
          : err.response?.data?.error || "No se pudo registrar la huella.",
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
      showToast(
        err.response?.data?.error || "No se pudo eliminar el acceso rápido",
      );
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        const userData = res.data.data;

        let nomb = "",
          apel = "",
          telf = "",
          licencia = "",
          rela = "",
          gner = "";

        if (userData.rol_codi === "ROL_ESP" && userData.tm_espec) {
          nomb = userData.tm_espec.esp_nomb;
          apel = userData.tm_espec.esp_apel;
          telf = userData.tm_espec.esp_telf || "";
          licencia = userData.tm_espec.esp_licencia || "";
          gner = userData.tm_espec.esp_gner || "F";
        } else if (userData.rol_codi === "ROL_REP" && userData.tm_repre) {
          nomb = userData.tm_repre.rep_nomb;
          apel = userData.tm_repre.rep_apel;
          telf = userData.tm_repre.rep_telf || "";
          rela = userData.tm_repre.rep_rela || "";
        } else if (userData.rol_codi === "ROL_ADM" && userData.tm_admin) {
          nomb = userData.tm_admin.adm_nomb;
          apel = userData.tm_admin.adm_apel;
          telf = userData.tm_admin.adm_telf || "";
        }

        setProfile({
          nomb,
          apel,
          telf,
          licencia,
          rela,
          gner,
          email: userData.usu_crro,
          rol_nomb: userData.tm_roles?.rol_nomb || "Usuario",
        });
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (pwd) => {
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
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nomb: profile.nomb,
        apel: profile.apel,
        telf: profile.telf,
      };
      if (userRole === "ESPECIALISTA") {
        payload.licencia = profile.licencia;
      } else if (userRole !== "ADMIN_INSTITUCION") {
        payload.rela = profile.rela;
      }
      await api.put("/auth/me", payload);
      let updatedName = `${profile.nomb} ${profile.apel}`;
      if (userRole === "ESPECIALISTA") {
        updatedName = `${profile.gner === "M" ? "Dr." : "Dra."} ${profile.nomb} ${profile.apel}`;
      }
      setUserName(updatedName);
      showToast("✅ Perfil actualizado correctamente");
    } catch (error) {
      let errorMsg = "⚠️ Ocurrió un error al actualizar el perfil";
      if (error.response?.data) {
        if (error.response.data.detalles) {
          errorMsg = `⚠️ ${error.response.data.detalles.map((d) => d.mensaje).join(", ")}`;
        } else if (error.response.data.error) {
          errorMsg = `⚠️ ${error.response.data.error}`;
        }
      }
      showToast(errorMsg);
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
      let errorMsg = "⚠️ Ocurrió un error al actualizar la contraseña";
      if (error.response?.data) {
        if (error.response.data.detalles) {
          errorMsg = `⚠️ ${error.response.data.detalles.map((d) => d.mensaje).join(", ")}`;
        } else if (error.response.data.error) {
          errorMsg = `⚠️ ${error.response.data.error}`;
        }
      }
      showToast(errorMsg);
    } finally {
      setSaving(false);
    }
  };

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
          <div className="max-w-5xl mx-auto p-6 md:p-8 lg:p-10 flex flex-col gap-8 pb-12">
            <header>
              <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                <UserCircle className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                Mi Perfil
              </h1>
              <p className="text-sm text-slate-500 mt-1 pl-11">
                Gestiona tu información personal y opciones de seguridad.
              </p>
            </header>

            {loading ? (
              <LoadingState variant="profile" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel Izquierdo: Resumen */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md">
                    <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl font-black mb-4 select-none">
                      {profile.nomb
                        ? profile.nomb.charAt(0) + profile.apel.charAt(0)
                        : "US"}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {profile.nomb} {profile.apel}
                    </h2>
                    <span className="mt-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full uppercase tracking-wider">
                      {profile.rol_nomb}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Seguridad de Cuenta
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">
                          Correo Electrónico
                        </p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2 break-all">
                          <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          {profile.email}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          El correo está bloqueado. Contacta a un administrador
                          para modificarlo.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 uppercase">
                          Acceso rápido con huella
                        </p>
                        <div className="mt-3 space-y-2">
                          {passkeys.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Aún no has configurado acceso rápido. Podrás
                              entrar con tu huella o reconocimiento facial.
                            </p>
                          ) : (
                            passkeys.map((k) => (
                              <div
                                key={k.pk_id}
                                className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Fingerprint className="w-4 h-4 text-blue-500 flex-shrink-0" />
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
                                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                                  aria-label={`Eliminar acceso rápido ${k.pk_nomb}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}

                          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mt-2 mb-2">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                              SIAT{" "}
                              <strong>no almacena tu huella dactilar</strong> ni
                              datos biométricos. Solo se guarda una clave
                              criptográfica pública en nuestros servidores. Tu
                              huella permanece en tu dispositivo de forma
                              segura.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleRegisterFingerprint}
                            disabled={fpLoading}
                            className="w-full mt-1 flex items-center justify-center gap-2 border border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {fpLoading ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <Fingerprint className="w-4 h-4" />
                            )}
                            {fpLoading ? "Configurando..." : "Registrar huella"}
                          </button>

                          {fpMsg && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {fpMsg}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Derecho: Formularios */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Formulario de Datos Personales */}
                  <form
                    onSubmit={submitProfile}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        Datos Personales
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Nombres
                          </label>
                          <input
                            type="text"
                            name="nomb"
                            value={profile.nomb}
                            onChange={handleProfileChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Apellidos
                          </label>
                          <input
                            type="text"
                            name="apel"
                            value={profile.apel}
                            onChange={handleProfileChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Teléfono
                          </label>
                          <input
                            type="tel"
                            name="telf"
                            value={profile.telf}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                          />
                        </div>

                        {userRole === "ESPECIALISTA" && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <Hash className="w-3 h-3" /> Licencia Médica
                            </label>
                            <input
                              type="text"
                              name="licencia"
                              value={profile.licencia}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                            />
                          </div>
                        )}

                        {userRole === "REPRESENTANTE" && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Parentesco
                            </label>
                            <select
                              name="rela"
                              value={profile.rela}
                              onChange={handleProfileChange}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                            >
                              <option value="Padre">Padre</option>
                              <option value="Madre">Madre</option>
                              <option value="Tutor Legal">Tutor Legal</option>
                              <option value="Familiar">Familiar</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </div>
                  </form>

                  {/* Formulario de Contraseña */}
                  <form
                    onSubmit={submitPassword}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-slate-400" />
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        Cambiar Contraseña
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Contraseña Actual */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Contraseña Actual
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? "text" : "password"}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            placeholder="Ingresa tu contraseña actual"
                            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("current")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            {showPassword.current ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nueva Contraseña */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Nueva Contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword.new ? "text" : "password"}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Mínimo 8 caracteres"
                              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("new")}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              {showPassword.new ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirmar Contraseña */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Confirmar Nueva Contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword.confirm ? "text" : "password"}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              required
                              placeholder="Repite la contraseña nueva"
                              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility("confirm")
                              }
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              {showPassword.confirm ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Medidor visual de fuerza de contraseña */}
                      {passwordData.newPassword && (
                        <div className="space-y-3 mt-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                              <span>Complejidad de contraseña:</span>
                              <span
                                className={
                                  getPasswordStrength(passwordData.newPassword)
                                    .score <= 1
                                    ? "text-red-500 font-bold"
                                    : getPasswordStrength(
                                          passwordData.newPassword,
                                        ).score === 2
                                      ? "text-orange-500 font-bold"
                                      : getPasswordStrength(
                                            passwordData.newPassword,
                                          ).score === 3
                                        ? "text-yellow-600 dark:text-yellow-400 font-bold"
                                        : "text-emerald-500 font-bold animate-pulse"
                                }
                              >
                                {
                                  getPasswordStrength(passwordData.newPassword)
                                    .label
                                }
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${getPasswordStrength(passwordData.newPassword).color}`}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                            <div className="flex items-center gap-1.5">
                              {getPasswordStrength(passwordData.newPassword)
                                .criteria.minLength ? (
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                              )}
                              <span
                                className={
                                  getPasswordStrength(passwordData.newPassword)
                                    .criteria.minLength
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : ""
                                }
                              >
                                Mínimo 8 caracteres
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getPasswordStrength(passwordData.newPassword)
                                .criteria.lowercase ? (
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                              )}
                              <span
                                className={
                                  getPasswordStrength(passwordData.newPassword)
                                    .criteria.lowercase
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : ""
                                }
                              >
                                Letra minúscula (a-z)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getPasswordStrength(passwordData.newPassword)
                                .criteria.uppercase ? (
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                              )}
                              <span
                                className={
                                  getPasswordStrength(passwordData.newPassword)
                                    .criteria.uppercase
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : ""
                                }
                              >
                                Letra mayúscula (A-Z)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {getPasswordStrength(passwordData.newPassword)
                                .criteria.number ? (
                                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                              )}
                              <span
                                className={
                                  getPasswordStrength(passwordData.newPassword)
                                    .criteria.number
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : ""
                                }
                              >
                                Al menos un número (0-9)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          saving ||
                          !passwordData.currentPassword ||
                          passwordData.newPassword !==
                            passwordData.confirmPassword ||
                          getPasswordStrength(passwordData.newPassword).score <
                            4
                        }
                        className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Guardando..." : "Actualizar Contraseña"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
