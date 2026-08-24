import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import Login from "./Login";
import Register from "./Register";
import funautaLogo from "../../assets/Logo.png";

export default function Auth({ currentView, onNavigate }) {
  const [isLogin, setIsLogin] = useState(currentView === "login");

  useEffect(() => {
    setIsLogin(currentView === "login" || currentView !== "register");
  }, [currentView]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 overflow-hidden font-sans">
      {/* Mobile Layout: limpio, aireado, sin ruido visual */}
      <div className="relative flex flex-col md:hidden h-[100dvh] w-full overflow-y-auto bg-[#F4F7F9] dark:bg-slate-950">
        {/* Brand mark mínimo */}
        <div className="relative z-10 flex flex-col items-center pt-5 pb-2 px-6 text-center shrink-0">
          <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-40 bg-blue-200/50 dark:bg-blue-500/10 rounded-full blur-3xl" />
          <img
            src={funautaLogo}
            alt="Logo SIAT-TEA"
            className="auth-rise auth-d0 w-12 h-12 object-contain drop-shadow-sm"
          />
          <h2 className="auth-rise auth-d1 mt-1.5 text-lg font-bold text-brand-700 dark:text-blue-400 tracking-tight">
            SIAT-TEA
          </h2>
          <p className="auth-rise auth-d1 mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500 max-w-[16rem]">
            Sistema Inteligente de Acompañamiento Terapéutico
          </p>
          <div className="auth-rise auth-d2 mt-2 flex items-center gap-1.5 rounded-full border border-brand-500/15 dark:border-blue-400/15 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-500 dark:text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Plataforma clínica segura
          </div>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-6">
          <div className="auth-fade bg-white dark:bg-slate-900 rounded-2xl shadow-md shadow-slate-200/60 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden">
            {isLogin ? (
              <Login onNavigate={onNavigate} />
            ) : (
              <Register onNavigate={onNavigate} />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout: split with brand panel */}
      <div className="hidden md:flex relative w-full h-full min-h-[100dvh]">
        {/* Forms Container */}
        <div
          className={`absolute top-0 w-1/2 h-full transition-transform duration-700 ease-in-out z-10 bg-white dark:bg-slate-900 shadow-2xl
            ${isLogin ? "left-1/2" : "left-0"}`}
        >
          <div className="relative w-full h-full overflow-hidden">
            {/* Login Form */}
            <div
              className={`absolute top-0 left-0 w-full h-full overflow-y-auto flex flex-col transition-all duration-700 ease-in-out bg-white dark:bg-slate-900
                ${isLogin ? "opacity-100 z-20 translate-x-0" : "opacity-0 z-0 -translate-x-1/2 pointer-events-none"}`}
            >
              <Login onNavigate={onNavigate} />
            </div>
            {/* Register Form */}
            <div
              className={`absolute top-0 left-0 w-full h-full overflow-y-auto flex flex-col transition-all duration-700 ease-in-out bg-white dark:bg-slate-900
                ${!isLogin ? "opacity-100 z-20 translate-x-0" : "opacity-0 z-0 translate-x-1/2 pointer-events-none"}`}
            >
              <Register onNavigate={onNavigate} />
            </div>
          </div>
        </div>

        {/* Branding Panel */}
        <div
          className={`absolute top-0 w-1/2 h-full bg-gradient-to-br from-brand-700 via-brand-800 to-indigo-950 dark:from-slate-950 dark:via-[#081226] dark:to-[#0a1830] text-white flex-col items-center justify-center p-8 lg:p-16 transition-transform duration-700 ease-in-out z-20 flex
            ${isLogin ? "left-0" : "left-1/2"}`}
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-400/10 rounded-full blur-3xl auth-orb"></div>
          <div
            className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl auth-orb"
            style={{ animationDelay: "-8s" }}
          ></div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="z-10 flex flex-col items-center text-center auth-fade">
            <img
              src={funautaLogo}
              alt="Logo SIAT-TEA"
              className="auth-rise auth-d0 w-28 h-28 md:w-40 md:h-40 mb-7 drop-shadow-xl object-contain transition-transform duration-700 hover:scale-105"
            />
            <h2 className="auth-rise auth-d1 text-3xl font-semibold tracking-tight mb-2.5">
              SIAT-TEA
            </h2>
            <p className="auth-rise auth-d2 text-white/75 text-base md:text-lg max-w-sm leading-relaxed">
              Sistema Inteligente de Acompañamiento Terapéutico
            </p>
            <div className="auth-rise auth-d3 mt-6 w-12 h-[2px] rounded-full bg-gradient-to-r from-blue-300/70 to-transparent"></div>
            <div className="auth-rise auth-d4 mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
              <ShieldCheck className="w-4 h-4" />
              Plataforma clínica segura
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
