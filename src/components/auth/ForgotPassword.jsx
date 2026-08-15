import { useState } from "react";
import api from "../../api/axios";
import funautaLogo from "../../assets/Logo.png";
import { getErrorMessage } from "../../utils/errorHandler";
import FormAlert from "../shared/FormAlert";

function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Ingrese un correo electrónico válido.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(
        res.data.message ||
          "Si el correo existe, se enviará un enlace de recuperación.",
      );
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Error al conectar con el servidor."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 overflow-hidden font-sans">
      {/* Mobile Layout: branded, polished (igual que el login) */}
      <div className="relative flex flex-col md:hidden h-[100dvh] w-full overflow-y-auto bg-gradient-to-br from-brand-600 via-blue-700 to-indigo-800 dark:from-slate-950 dark:via-[#0a1633] dark:to-[#0d1f45]">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-20 w-80 h-80 bg-white/15 dark:bg-brand-500/25 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-28 w-80 h-80 bg-white/10 dark:bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-16 w-72 h-72 bg-white/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        {/* Brand mark */}
        <div className="relative z-10 flex flex-col items-center pt-8 pb-3 shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-white/15 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700 flex items-center justify-center shadow-lg shadow-black/10">
            <img
              src={funautaLogo}
              alt="Logo SIAT-TEA"
              className="w-10 h-10 object-contain brightness-0 invert"
            />
          </div>
          <h2 className="mt-2.5 text-lg font-bold text-white tracking-tight">
            SIAT-TEA
          </h2>
          <p className="text-[11px] text-white/70 dark:text-white/50">
            Sistema Inteligente de Acompañamiento Terapéutico
          </p>
        </div>

        {/* Form card */}
        <div className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-md mx-auto p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/50 ring-1 ring-white/20 dark:ring-slate-700/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-brand-500 via-blue-500 to-indigo-500"></div>
            <div className="w-full flex flex-col justify-center px-4 sm:px-8 py-5 sm:py-8 bg-white dark:bg-slate-900 transition-colors duration-200">
              <div className="w-full">
                <h1 className="text-lg font-bold text-brand-700 dark:text-blue-400 text-center">
                  Recuperar Contraseña
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  Ingresa tu correo y te enviaremos instrucciones para
                  restablecer tu contraseña.
                </p>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4 mt-5"
                >
                  <FormAlert variant="error" message={error} />
                  <FormAlert variant="success" message={message} />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                    ) : (
                      "Enviar enlace"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  <button
                    type="button"
                    className="font-semibold text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 transition-colors"
                    onClick={() => onNavigate("login")}
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout: split with brand panel (igual que el login) */}
      <div className="hidden md:flex relative w-full h-full min-h-[100dvh]">
        {/* Forms Container */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white dark:bg-slate-900 shadow-2xl z-10">
          <div className="w-full h-full overflow-y-auto flex flex-col">
            <div className="w-full flex flex-col justify-center flex-1 px-8 lg:px-16 py-8">
              <div className="max-w-md w-full mx-auto">
                <h1 className="text-2xl font-semibold tracking-tight text-brand-700 dark:text-blue-400 mb-2 transition-colors">
                  Recuperar Contraseña
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 transition-colors">
                  Ingresa tu correo y te enviaremos instrucciones para
                  restablecer tu contraseña.
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <FormAlert variant="error" message={error} />
                  <FormAlert variant="success" message={message} />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                    ) : (
                      "Enviar enlace"
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                  <button
                    type="button"
                    className="font-semibold text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 transition-colors"
                    onClick={() => onNavigate("login")}
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Panel */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[#003366] dark:bg-slate-950 text-white flex-col items-center justify-center p-8 lg:p-16 flex">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="z-10 flex flex-col items-center text-center">
            <img
              src={funautaLogo}
              alt="Logo SIAT-TEA"
              className="w-32 h-32 md:w-48 md:h-48 mb-8 drop-shadow-xl object-contain transition-transform duration-700 hover:scale-105"
            />
            <h2 className="text-3xl font-semibold tracking-tight mb-3">
              SIAT-TEA
            </h2>
            <p className="text-white/80 text-lg md:text-xl max-w-md">
              Sistema Inteligente de Acompañamiento Terapéutico
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
