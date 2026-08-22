import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  ListChecks,
  UserCircle2,
  Play,
} from "lucide-react";
import Button from "../ui/Button";

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              i + 1 <= step
                ? "bg-white text-blue-600"
                : "bg-white/30 text-white/60"
            }`}
          >
            {i + 1 < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`w-6 h-1 rounded-full transition-colors ${i + 1 < step ? "bg-white" : "bg-white/30"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepPatient({ selectedPatient, setSelectedPatient, patients }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Seleccionar Paciente
      </p>
      {patients.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
          No hay pacientes asignados disponibles.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {patients.map((p) => {
            const id = p.nin_codi || p.id;
            const nombre = p.nom_nino
              ? `${p.nom_nino} ${p.ape_nino}`
              : p.name || "Sin nombre";
            const selected =
              selectedPatient?.nin_codi === id || selectedPatient?.id === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-slate-800"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {nombre}
                </p>
                {p.edad && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Edad: {p.edad}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepActivities({ selectedActivities, toggleActivity, routines }) {
  const categorias = useMemo(() => {
    const map = {};
    (routines || []).forEach((r) => {
      const cat = r.category || "Sin categoría";
      if (!map[cat]) map[cat] = [];
      map[cat].push(r);
    });
    return map;
  }, [routines]);

  const catNames = Object.keys(categorias);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Seleccionar Actividades
      </p>
      {catNames.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
          No hay actividades asignadas para este paciente.
        </p>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {catNames.map((cat) => (
            <div
              key={cat}
              className="border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-800"
            >
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {cat}
                </p>
              </div>
              <div className="p-2 space-y-1">
                {categorias[cat].map((act) => {
                  const checked = selectedActivities.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        checked
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleActivity(act.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {act.title || act.act_nomb || "Actividad"}
                        </p>
                        {act.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {act.description}
                          </p>
                        )}
                      </div>
                      {act.act_time && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {act.act_time} min
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepConfirm({ patient, selectedActivities, routines }) {
  const nombre = patient?.nom_nino
    ? `${patient.nom_nino} ${patient.ape_nino}`
    : patient?.name || "Sin paciente";
  const count = selectedActivities.length;
  const selectedActs = (routines || []).filter((r) =>
    selectedActivities.includes(r.id),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Confirmar Inicio
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-600 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            {nombre.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Paciente
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {nombre}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
            Actividades: {count}
          </p>
          {count === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Sin actividades seleccionadas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedActs.map((a) => (
                <span
                  key={a.id}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {a.title || "Actividad"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionWizard({
  showModal,
  setShowModal,
  activeChild,
  patients = [],
  routines = [],
  onStartSession,
}) {
  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);

  const currentPatient = activeChild || selectedPatient;
  const effectiveStep = activeChild ? step + 1 : step;
  const totalSteps = activeChild ? 2 : 3;

  const canNext = useMemo(() => {
    if (effectiveStep === 1 && !activeChild) return !!selectedPatient;
    return true;
  }, [effectiveStep, activeChild, selectedPatient]);

  const toggleActivity = (id) =>
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };
  const handleNext = () => {
    if (step < (activeChild ? 2 : 3)) setStep((s) => s + 1);
  };

  const handleStart = () => {
    onStartSession?.({
      patient: currentPatient,
      activities: selectedActivities,
    });
    setStep(1);
    setSelectedPatient(null);
    setSelectedActivities([]);
    setShowModal(false);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedActivities([]);
    setShowModal(false);
  };

  if (!showModal) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold">Nueva Sesión</h3>
              <StepIndicator step={effectiveStep} total={totalSteps} />
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!activeChild && step === 1 && (
            <StepPatient
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              patients={patients}
            />
          )}
          {((!activeChild && step === 2) || (activeChild && step === 1)) && (
            <StepActivities
              selectedActivities={selectedActivities}
              toggleActivity={toggleActivity}
              routines={routines}
            />
          )}
          {((!activeChild && step === 3) || (activeChild && step === 2)) && (
            <StepConfirm
              patient={currentPatient}
              selectedActivities={selectedActivities}
              routines={routines}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={handleBack}
            disabled={effectiveStep <= 1}
          >
            Atrás{" "}
          </Button>
          {effectiveStep < totalSteps ? (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={!currentPatient}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" /> Iniciar Sesión
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
