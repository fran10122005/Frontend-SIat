import { useState, useEffect } from "react";
import funautaLogo from "../../assets/Logo.png";
import { useGlobalContext } from "../../context/GlobalState";
import api from "../../api/axios";
import { loginWithFingerprint } from "../../api/passkey";
import { getErrorMessage } from "../../utils/errorHandler";
import { setAuthSession } from "../../utils/authStorage";
import FormAlert from "../shared/FormAlert";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SEC = 60;

function Login({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFp, setIsFp] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const saved = sessionStorage.getItem("siat_login_failed_attempts");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockoutSeconds, setLockoutSeconds] = useState(() => {
    const lockoutUntil = sessionStorage.getItem("siat_login_lockout_until");
    if (lockoutUntil) {
      const remaining = Math.ceil(
        (parseInt(lockoutUntil, 10) - Date.now()) / 1000,
      );
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });

  const { setUserRole, setUserName } = useGlobalContext();

  // Handle countdown for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem("siat_login_lockout_until");
          sessionStorage.removeItem("siat_login_failed_attempts");
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (lockoutSeconds > 0) {
      setError(
        `Acceso bloqueado temporalmente. Espera ${lockoutSeconds} segundos para reintentar.`,
      );
      return;
    }
    setError("");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Ingrese un correo electrónico válido.");
      return;
    }

    if (password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/login", {
        usu_crro: email,
        usu_clve: password,
      });

      // Reset failed attempts on success
      sessionStorage.removeItem("siat_login_failed_attempts");
      sessionStorage.removeItem("siat_login_lockout_until");
      setFailedAttempts(0);

      const { token, user } = res.data.data;
      finalizeSession(user, token);
    } catch (err) {
      console.error(err);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      sessionStorage.setItem(
        "siat_login_failed_attempts",
        newAttempts.toString(),
      );

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntilTime = Date.now() + LOCKOUT_DURATION_SEC * 1000;
        sessionStorage.setItem(
          "siat_login_lockout_until",
          lockoutUntilTime.toString(),
        );
        setLockoutSeconds(LOCKOUT_DURATION_SEC);
        setError(
          `Demasiados intentos fallidos (${newAttempts}/${MAX_FAILED_ATTEMPTS}). Acceso bloqueado por ${LOCKOUT_DURATION_SEC} segundos por seguridad.`,
        );
      } else {
        const baseMsg = getErrorMessage(err, "Credenciales incorrectas.");
        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        setError(
          `${baseMsg} (Intento ${newAttempts}/${MAX_FAILED_ATTEMPTS} - ${remaining} intento${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} antes del bloqueo temporal)`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeSession = (user, token) => {
    setAuthSession({ token, user });

    const displayName = user.nombre || user.usu_nomb || "Usuario";
    setUserName(displayName);

    if (user.rol_codi === "ROL_REP") {
      setUserRole("REPRESENTANTE");
      onNavigate("dashboard");
    } else if (user.rol_codi === "ROL_ESP") {
      setUserRole("ESPECIALISTA");
      onNavigate("dashboard");
    } else if (user.rol_codi === "ROL_ADM") {
      setUserRole("ADMIN_INSTITUCION");
      onNavigate("admin");
    } else {
      setError("Rol de usuario no reconocido.");
    }
  };

  const webAuthnSupported = () =>
    typeof window !== "undefined" && !!window.PublicKeyCredential;

  // La opción de huella solo se muestra en dispositivos compatibles
  const fpSupported = webAuthnSupported();

  const handleFingerprint = async () => {
    setError("");
    if (!webAuthnSupported()) {
      setError(
        "Tu navegador o dispositivo no soporta el acceso por huella. Inicia sesión con tu contraseña.",
      );
      return;
    }
    setIsFp(true);
    try {
      const { token, user } = await loginWithFingerprint();
      finalizeSession(user, token);
    } catch (err) {
      console.error(err);
      const name = err?.name;
      const serverMsg =
        err?.isAxiosError || err?.response ? getErrorMessage(err) : "";
      if (name === "NotAllowedError" || name === "AbortError") {
        setError(
          serverMsg ||
            "Autenticación cancelada o no se encontró la huella en este dispositivo. Si aún no la has configurado, inicia sesión con tu contraseña y regístrala en Mi Perfil → Acceso rápido con huella.",
        );
      } else {
        setError(serverMsg || "No se pudo completar el acceso con huella.");
      }
    } finally {
      setIsFp(false);
    }
  };

  return (
    <div className="w-full m-auto flex flex-col justify-center px-6 sm:px-10 pt-5 sm:pt-6 pb-8 sm:pb-10 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="w-full">
        {/* Header (solo en desktop; en móvil el brand lo muestra Auth.jsx) */}
        <div className="mb-5 text-center hidden md:block">
          <img
            src={funautaLogo}
            alt="Logo"
            className="w-10 h-10 object-contain mx-auto mb-2"
          />
          <h1 className="text-lg sm:text-xl font-bold text-brand-700 dark:text-blue-400">
            SIAT-TEA
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ingresa a tu portal de acompañamiento terapéutico
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:space-y-5"
        >
          <FormAlert variant="error" message={error} />

          <div className="auth-rise auth-d1 space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Correo Electrónico
            </label>
            <div className="relative group">
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-4 pr-10 py-3.5 sm:py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base sm:text-sm"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="auth-rise auth-d2 space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => onNavigate("forgot")}
                className="text-xs sm:text-sm font-medium text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 transition-colors py-1 px-1 -mr-1"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative group">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-4 pr-12 py-3.5 sm:py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute inset-y-0 right-0 px-3.5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none min-w-[44px] min-h-[44px]"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || lockoutSeconds > 0}
            className="w-full min-h-[48px] bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-blue-700 text-white font-semibold py-3.5 sm:py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 auth-rise auth-d3 text-base sm:text-sm"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : lockoutSeconds > 0 ? (
              `Bloqueado (${lockoutSeconds}s)`
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {fpSupported && (
          <div className="auth-rise auth-d4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleFingerprint}
              disabled={isLoading || isFp}
              className="w-full min-h-[46px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-brand-50/50 dark:hover:bg-slate-800 hover:border-brand-300 dark:hover:border-blue-500/40 hover:text-brand-600 dark:hover:text-blue-400 active:scale-[0.98] transition-all duration-200 group text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isFp ? (
                <svg
                  className="animate-spin h-5 w-5 text-brand-500 dark:text-blue-400"
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
                <div className="p-1 rounded-lg bg-brand-50 dark:bg-blue-500/10 text-brand-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                    <path d="M2 12a10 10 0 0 1 18-6" />
                    <path d="M2 16h.01" />
                    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                  </svg>
                </div>
              )}
              <span>
                {isFp ? "Verificando huella…" : "Ingresar con huella"}
              </span>
            </button>
          </div>
        )}

        <div className="auth-rise auth-d5 mt-6 pb-1 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            className="font-semibold text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 transition-colors py-1"
            onClick={() => onNavigate("register")}
          >
            Cómo obtener acceso
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
