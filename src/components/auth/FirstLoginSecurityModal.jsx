import { useState, useMemo } from "react";
import {
  KeyRound,
  Fingerprint,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";
import { registerFingerprint } from "../../api/passkey";
import { getErrorMessage } from "../../utils/errorHandler";

export default function FirstLoginSecurityModal({ open, user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Password, 2: Passkey, 3: Done
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [registeringFp, setRegisteringFp] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState(false);

  // Verificación de soporte de biometría/Passkey en el dispositivo actual
  const isWebAuthnSupported =
    typeof window !== "undefined" && Boolean(window.PublicKeyCredential);

  // Análisis de fortaleza de la contraseña
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  if (!open) return null;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Ingresa tu contraseña actual.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden.");
      return;
    }

    if (passwordStrength < 3) {
      setPasswordError(
        "Por seguridad, la contraseña debe incluir mayúsculas, minúsculas y números o símbolos.",
      );
      return;
    }

    setSavingPassword(true);
    try {
      await api.put("/auth/me", {
        currentPassword,
        password: newPassword,
      });
      setPasswordSuccess(true);
      setTimeout(() => {
        setCurrentStep(2);
      }, 1000);
    } catch (err) {
      console.error(err);
      setPasswordError(
        getErrorMessage(
          err,
          "No se pudo actualizar la contraseña. Verifica tu contraseña actual.",
        ),
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setFpError("");
    setRegisteringFp(true);
    try {
      await registerFingerprint("Dispositivo Principal");
      setFpSuccess(true);
      setTimeout(() => {
        setCurrentStep(3);
      }, 1200);
    } catch (err) {
      console.error(err);
      const name = err?.name;
      if (name === "NotAllowedError" || name === "AbortError") {
        setFpError(
          "Configuración cancelada o no se reconoció el sensor biométrico.",
        );
      } else {
        setFpError(
          getErrorMessage(
            err,
            "No se pudo vincular la passkey en este dispositivo.",
          ),
        );
      }
    } finally {
      setRegisteringFp(false);
    }
  };

  const strengthColor =
    passwordStrength <= 2
      ? "bg-rose-500"
      : passwordStrength <= 3
        ? "bg-amber-500"
        : "bg-emerald-500";

  const strengthText =
    passwordStrength <= 2
      ? "Débil"
      : passwordStrength <= 3
        ? "Moderada"
        : "Segura";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera de Seguridad Institucional */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/20">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Seguridad de tu Cuenta
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                    Paso {currentStep} de 3
                  </span>
                </h3>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Primer inicio de sesión en SIAT
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido según el paso */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {/* PASO 1: CAMBIO DE CONTRASEÑA */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <p className="font-semibold mb-1">
                    Actualiza tu contraseña inicial
                  </p>
                  <p className="text-blue-700/90 dark:text-blue-300/80">
                    Por políticas de confidencialidad médica y seguridad de la
                    fundación, te recomendamos cambiar la contraseña asignada
                    por el administrador por una personal.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>
                    ¡Contraseña actualizada con éxito! Pasando al siguiente
                    paso...
                  </span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contraseña actual (provisional)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Medidor visual de fortaleza */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Seguridad:</span>
                        <span className="font-semibold">{strengthText}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-full flex-1 transition-all duration-300 ${
                              passwordStrength >= lvl
                                ? strengthColor
                                : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-2 transition-colors"
                  >
                    Mantener actual y continuar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm shadow-blue-600/30 disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Guardar Contraseña{" "}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASO 2: VINCULACIÓN DE PASSKEY / BIOMETRÍA */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
                <Fingerprint className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Acceso Rápido con Biometría (Passkey)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Activa tu huella dactilar, Face ID o Windows Hello para entrar
                  al instante a SIAT sin escribir contraseñas.
                </p>
              </div>

              {fpError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 text-left flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{fpError}</span>
                </div>
              )}

              {fpSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-200 text-left flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>¡Huella vinculada con éxito en este dispositivo!</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Máxima privacidad y seguridad</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  SIAT <strong>jamás almacena tus datos biométricos</strong>. La
                  comprobación se realiza exclusivamente en tu propio
                  dispositivo a través del estándar WebAuthn / FIDO2.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {isWebAuthnSupported ? (
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={registeringFp || fpSuccess}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50"
                  >
                    {registeringFp ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Detectando sensor biométrico...
                      </>
                    ) : fpSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Huella Configurada
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" /> Vincular Huella /
                        Biometría Ahora
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Este dispositivo no soporta autenticación biométrica
                    WebAuthn.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Omitir y continuar
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: CONFIRMACIÓN Y FINALIZACIÓN */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-500/20 shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Cuenta Configurada con Éxito!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Tu perfil ahora cuenta con los estándares de seguridad
                  requeridos. Ya puedes ingresar a gestionar tus actividades en
                  SIAT.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Contraseña:{" "}
                    <strong>
                      {passwordSuccess ? "Actualizada" : "Configurada"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      fpSuccess ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />
                  <span>
                    Acceso Biométrico:{" "}
                    <strong>{fpSuccess ? "Activado" : "Pendiente"}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onComplete}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30"
              >
                Comenzar a usar SIAT <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
