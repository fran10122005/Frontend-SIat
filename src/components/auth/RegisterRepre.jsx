import { useState, useEffect, useRef } from "react";
import funautaLogo from "../../assets/Logo.png";
import { useGlobalContext } from "../../context/GlobalState";
import api from "../../api/axios";
import {
  KeyRound,
  Phone,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import LoadingState from "../dashboard/LoadingState";
import { getErrorMessage, extractFieldErrors } from "../../utils/errorHandler";
import {
  sanitizeTelefonoVE,
  validateTelefonoMovilVE,
  getPasswordStrength,
  validatePasswordStrong,
  focusFirstError,
} from "../../utils/validators";
import { setAuthSession } from "../../utils/authStorage";
import FormAlert from "../shared/FormAlert";

export default function RegisterRepre({ onNavigate }) {
  const { setUserRole, setUserName, showToast } = useGlobalContext();
  const [token, setToken] = useState("");
  const [invData, setInvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);

  // Form Fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [relation, setRelation] = useState("Madre");
  const [phone, setPhone] = useState("");

  const strength = getPasswordStrength(password);

  useEffect(() => {
    // Obtener token del query string de la URL
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token");
    if (!tok) {
      setTokenError(
        "Enlace inválido. Se requiere un token de invitación válido para completar el registro.",
      );
      setLoading(false);
      return;
    }
    setToken(tok);
    validateToken(tok);
  }, []);

  const validateToken = async (tok) => {
    try {
      const res = await api.get(`/auth/invitation-details?token=${tok}`);
      const details = res.data?.data || {};
      setInvData(details);
      if (details.rep_rela) setRelation(details.rep_rela);
      if (details.rep_telf && details.rep_telf !== "No especificado") {
        setPhone(sanitizeTelefonoVE(details.rep_telf));
      }
    } catch (err) {
      console.error(err);
      setTokenError(
        getErrorMessage(
          err,
          "El token de invitación es inválido, ha expirado o ya ha sido completado.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setFieldErrors({});

    const errs = {};
    const pwdErr = validatePasswordStrong(password);
    if (pwdErr) errs.password = pwdErr;

    if (!confirmPassword) {
      errs.confirmPassword = "Confirma tu contraseña";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Las contraseñas no coinciden";
    }

    const phoneErr = validateTelefonoMovilVE(phone, { required: true });
    if (phoneErr) errs.phone = phoneErr;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setSubmitError("Corrige los campos señalados en rojo para continuar.");
      requestAnimationFrame(() => focusFirstError(errs, formRef));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/complete-invitation", {
        token,
        usu_clve: password,
        rep_rela: relation,
        rep_telf: phone.trim(),
      });

      const { token: sessionToken, user } = res.data.data;
      setAuthSession({ token: sessionToken, user });

      // Establecer estados globales
      setUserName(user.nombre || "Representante");
      setUserRole("REPRESENTANTE");

      // Intentar refrescar la información del niño en el contexto
      showToast("🎉 Cuenta activada correctamente. ¡Bienvenido a SIAT!");

      // Redirigir al portal familiar
      window.location.href = "/portal/overview";
    } catch (err) {
      console.error(err);
      const fe = extractFieldErrors(err, {
        usu_clve: "password",
        rep_telf: "phone",
        rep_rela: "relation",
      });
      if (Object.keys(fe).length > 0) {
        setFieldErrors(fe);
        requestAnimationFrame(() => focusFirstError(fe, formRef));
      }
      setSubmitError(
        getErrorMessage(
          err,
          "Error al completar el registro. Intente nuevamente.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#F4F7F9] dark:bg-slate-900 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center py-12">
          <LoadingState
            variant="spinner"
            message="Validando invitación clínica..."
          />
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#F4F7F9] dark:bg-slate-900 flex flex-col justify-center items-center px-4 py-8 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
            <img
              src={funautaLogo}
              alt="Logo FUNAUTA"
              className="w-11 h-11 object-contain"
            />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-brand-700 dark:text-blue-400 tracking-wider">
                SIAT-TEA
              </span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
                Fundación Una Luz Para El Autismo
              </span>
            </div>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 text-rose-700 dark:text-rose-300 rounded-xl flex gap-3 text-sm leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <strong className="font-bold">
                Enlace de Invitación Inválido
              </strong>
              <p className="mt-1 text-xs">{tokenError}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#F4F7F9] dark:bg-slate-900 flex flex-col justify-center items-center px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700">
        {/* Brand Header */}
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="flex items-center gap-3 mb-5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <img
              src={funautaLogo}
              alt="Logo FUNAUTA"
              className="w-11 h-11 object-contain"
            />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-brand-700 dark:text-blue-400 tracking-wider">
                SIAT-TEA
              </span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
                Invitación Clínica
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-700 dark:text-blue-400">
            Completar Registro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            Hola{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {invData?.rep_nomb} {invData?.rep_apel}
            </strong>
            . Has sido invitado por la Fundación para monitorear el progreso
            terapéutico de{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {invData?.nin_nomb} {invData?.nin_apel}
            </strong>
            .
          </p>
        </div>

        {/* Complete Registration Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          <FormAlert variant="error" message={submitError} />

          <div className="space-y-1.5" data-field="password">
            <label
              htmlFor="repre-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              Contraseña de Acceso <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="repre-password"
                name="password"
                required
                type={showPassword ? "text" : "password"}
                maxLength={60}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: "",
                      confirmPassword: "",
                    }));
                  }
                }}
                aria-invalid={!!fieldErrors.password || undefined}
                className={`w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-sm text-gray-800 dark:text-white placeholder-gray-400 ${fieldErrors.password ? "form-input-invalid" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p role="alert" className="form-error">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}

            {password && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>Seguridad:</span>
                  <span
                    className={
                      strength.score <= 1
                        ? "text-rose-500 font-bold"
                        : strength.score === 2
                          ? "text-orange-500 font-bold"
                          : strength.score === 3
                            ? "text-amber-500 font-bold"
                            : "text-emerald-500 font-bold"
                    }
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${strength.color}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  {[
                    { ok: strength.criteria.minLength, texto: "8+ caracteres" },
                    {
                      ok: strength.criteria.lowercase,
                      texto: "Minúscula (a-z)",
                    },
                    {
                      ok: strength.criteria.uppercase,
                      texto: "Mayúscula (A-Z)",
                    },
                    { ok: strength.criteria.number, texto: "Número (0-9)" },
                  ].map((c) => (
                    <div key={c.texto} className="flex items-center gap-1">
                      {c.ok ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
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

          <div className="space-y-1.5" data-field="confirmPassword">
            <label
              htmlFor="repre-confirm-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              Confirmar Contraseña <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="repre-confirm-password"
                name="confirmPassword"
                required
                type={showConfirm ? "text" : "password"}
                maxLength={60}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }
                }}
                aria-invalid={!!fieldErrors.confirmPassword || undefined}
                className={`w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-sm text-gray-800 dark:text-white placeholder-gray-400 ${fieldErrors.confirmPassword ? "form-input-invalid" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
                aria-label={
                  showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p role="alert" className="form-error">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.confirmPassword}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5" data-field="relation">
              <label
                htmlFor="repre-relation"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Parentesco <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  id="repre-relation"
                  name="relation"
                  value={relation}
                  onChange={(e) => {
                    setRelation(e.target.value);
                    if (fieldErrors.relation) {
                      setFieldErrors((prev) => ({ ...prev, relation: "" }));
                    }
                  }}
                  aria-invalid={!!fieldErrors.relation || undefined}
                  className={`w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-sm text-gray-800 dark:text-white cursor-pointer ${fieldErrors.relation ? "form-input-invalid" : ""}`}
                >
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Tutor Legal">Tutor Legal</option>
                  <option value="Representante Legal">
                    Representante Legal
                  </option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Otro Familiar">Otro Familiar</option>
                </select>
              </div>
              {fieldErrors.relation && (
                <p role="alert" className="form-error">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.relation}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5" data-field="phone">
              <label
                htmlFor="repre-phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Teléfono <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="repre-phone"
                  name="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  maxLength={13}
                  placeholder="04120000000 o +584120000000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(sanitizeTelefonoVE(e.target.value));
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }
                  }}
                  aria-invalid={!!fieldErrors.phone || undefined}
                  className={`w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-sm text-gray-800 dark:text-white placeholder-gray-400 ${fieldErrors.phone ? "form-input-invalid" : ""}`}
                />
              </div>
              {fieldErrors.phone && (
                <p role="alert" className="form-error">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-button dark:shadow-none transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {submitting
              ? "Guardando Registro..."
              : "Completar Registro e Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
