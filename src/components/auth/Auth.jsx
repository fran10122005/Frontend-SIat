import { useState, useEffect } from "react";
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
      {/* Mobile Layout: branded, polished */}
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
          className={`absolute top-0 w-1/2 h-full bg-[#003366] dark:bg-slate-950 text-white flex-col items-center justify-center p-8 lg:p-16 transition-transform duration-700 ease-in-out z-20 flex
            ${isLogin ? "left-0" : "left-1/2"}`}
        >
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
