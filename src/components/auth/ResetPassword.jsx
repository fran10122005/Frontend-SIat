import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import funautaLogo from "../../assets/Logo.png";
import { getErrorMessage, extractFieldErrors } from "../../utils/errorHandler";
import {
  getPasswordStrength,
  validatePasswordStrong,
  focusFirstError,
} from "../../utils/validators";
import FormAlert from "../shared/FormAlert";

function ResetPassword({ onNavigate }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Enlace inválido o expirado. Por favor solicita uno nuevo.");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setMessage("");

    if (!token) {
      setError("No hay token válido.");
      return;
    }

    const errs = {};
    const pwdErr = validatePasswordStrong(password);
    if (pwdErr) errs.password = pwdErr;

    if (!confirmPassword) {
      errs.confirmPassword = "Confirma la nueva contraseña";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Las contraseñas no coinciden";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(errs.password || errs.confirmPassword);
      requestAnimationFrame(() => focusFirstError(errs, formRef));
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword: password,
      });
      setMessage(res.data.message || "Contraseña actualizada correctamente.");
      // Redirigir al login despues de 3 segundos
      setTimeout(() => {
        onNavigate("login");
      }, 3000);
    } catch (err) {
      console.error(err);
      const fe = extractFieldErrors(err, { newPassword: "password" });
      if (Object.keys(fe).length > 0) {
        setFieldErrors(fe);
        requestAnimationFrame(() => focusFirstError(fe, formRef));
      }
      setError(getErrorMessage(err, "El enlace es inválido o ha expirado."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#F4F7F9] dark:bg-slate-900 flex flex-col justify-center items-center px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
        <div className="mb-8 text-center flex flex-col items-center">
          {/* Mobile Logo Badge */}
          <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <img
              src={funautaLogo}
              alt="Logo FUNAUTA"
              className="w-12 h-12 object-contain"
            />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-brand-700 dark:text-blue-400 tracking-wider">
                SIAT-TEA
              </span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
                FUNAUTA
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-700 dark:text-blue-400 mb-2 transition-colors">
            Crear Nueva Contraseña
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">
            Ingresa tu nueva contraseña para acceder al sistema SIAT.
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          <FormAlert variant="error" message={error} />
          <FormAlert variant="success" message={message} />

          <div className="space-y-1.5" data-field="password">
            <label
              htmlFor="reset-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nueva Contraseña <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                maxLength={60}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: "",
                      confirmPassword: "",
                    }));
                  }
                }}
                aria-invalid={!!fieldErrors.password || undefined}
                className={`w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${fieldErrors.password ? "form-input-invalid" : ""}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
              htmlFor="reset-confirm-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirmar Contraseña <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Repite tu contraseña"
                maxLength={60}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }
                }}
                aria-invalid={!!fieldErrors.confirmPassword || undefined}
                className={`w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${fieldErrors.confirmPassword ? "form-input-invalid" : ""}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
                aria-label={
                  showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-4 rounded-xl shadow-button dark:shadow-none transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
          >
            {isLoading ? "Actualizando..." : "Restablecer Contraseña"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={() => onNavigate("login")}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
