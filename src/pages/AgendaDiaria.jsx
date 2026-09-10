import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  Play,
  Square,
  Clock,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Star,
  MessageSquare,
  GripVertical,
  CheckSquare,
  Moon,
  Sun,
  Smile,
  ShieldCheck,
  Trash2,
  ListTodo,
  Award,
  Pencil,
  X,
  Sparkles,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";

import PageTitle from "../components/ui/PageTitle";
import TherapySessionPlayer from "../components/shared/TherapySessionPlayer";

const TASK_CATEGORIES = [
  { id: "food", label: "Alimentación", icon: Award, defaultTime: "08:00" },
  { id: "wash", label: "Higiene / Baño", icon: Smile, defaultTime: "08:30" },
  {
    id: "study",
    label: "Escuela / Tarea",
    icon: FileText,
    defaultTime: "10:00",
  },
  {
    id: "puzzle",
    label: "Terapia / Rutina",
    icon: Activity,
    defaultTime: "15:00",
  },
  {
    id: "cleanup",
    label: "Orden en Casa",
    icon: ShieldCheck,
    defaultTime: "17:00",
  },
  { id: "moon", label: "Descanso / Noche", icon: Moon, defaultTime: "20:00" },
];

export default function AgendaDiaria() {
  const {
    nomNino,
    userRole,
    weeklyGoal,
    reportGoalProgress,
    showToast,
    selectedChildId,
    routines,
    createRoutine,
  } = useGlobalContext();
  const [goalProgressReported, setGoalProgressReported] = useState(false);

  // 1. Visual Agenda State — inicializada desde almacenamiento local por niño y fecha
  const today = new Date().toLocaleDateString("es-ES");
  const agendaStorageKey = `agenda_${selectedChildId || "default"}_${today}`;

  const [agenda, setAgenda] = useState(() => {
    try {
      const saved = localStorage.getItem(agendaStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved agenda:", e);
    }
    return [
      {
        id: "default-1",
        task: "Cepillado de dientes matutino",
        time: "08:00 AM",
        done: false,
        icon: "wash",
      },
      {
        id: "default-2",
        task: "Desayuno estructurado",
        time: "08:30 AM",
        done: false,
        icon: "food",
      },
      {
        id: "default-3",
        task: "Rutina sensorial o juego guiado",
        time: "03:00 PM",
        done: false,
        icon: "puzzle",
      },
    ];
  });

  // Recargar agenda cuando cambia el niño seleccionado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(agendaStorageKey);
      if (saved) {
        setAgenda(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reloading agenda for child:", e);
    }
  }, [agendaStorageKey]);

  // Persistir agenda en localStorage al cambiar
  useEffect(() => {
    try {
      localStorage.setItem(agendaStorageKey, JSON.stringify(agenda));
    } catch (e) {
      console.error("Error saving agenda:", e);
    }
  }, [agenda, agendaStorageKey]);

  // Modal de Tarea Personalizada (Crear / Editar)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState("create"); // 'create' | 'edit'
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    time: "",
    icon: "food",
  });

  const handleOpenCreateTask = () => {
    const defaultTime = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setTaskModalMode("create");
    setEditingTaskId(null);
    setTaskForm({
      title: "",
      time: defaultTime,
      icon: "food",
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (taskItem, e) => {
    if (e) e.stopPropagation();
    setTaskModalMode("edit");
    setEditingTaskId(taskItem.id);
    setTaskForm({
      title: taskItem.task,
      time: taskItem.time,
      icon: taskItem.icon || "food",
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    const title = (taskForm.title || "").trim();
    if (!title) {
      showToast("⚠️ Ingresa el nombre de la tarea.");
      return;
    }

    if (taskModalMode === "create") {
      const newTask = {
        id: `custom_${Date.now()}`,
        task: title,
        time: taskForm.time || "09:00 AM",
        done: false,
        icon: taskForm.icon || "food",
      };
      setAgenda((prev) => [...prev, newTask]);
      showToast(`✅ Tarea "${title}" añadida a la agenda.`);
    } else {
      setAgenda((prev) =>
        prev.map((item) =>
          item.id === editingTaskId
            ? {
                ...item,
                task: title,
                time: taskForm.time || item.time,
                icon: taskForm.icon || item.icon,
              }
            : item,
        ),
      );
      showToast(`✏️ Tarea "${title}" actualizada.`);
    }

    setShowTaskModal(false);
  };

  const handleDeleteTask = (id, e) => {
    if (e) e.stopPropagation();
    setAgenda((prev) => prev.filter((item) => item.id !== id));
    showToast("🗑️ Tarea eliminada de la agenda.");
  };

  // 3. Active Session Player States
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(0); // en segundos
  const [isFinishing, setIsFinishing] = useState(false);
  const [cooperation, setCooperation] = useState(0);
  const [notes, setNotes] = useState("");

  // 4. Advanced Routine Builder Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // 'general', 'steps', 'media'
  const [formData, setFormData] = useState({
    title: "",
    category: "Higiene",
    durationStr: "15 min",
    difficulty: "Baja",
    materials: "",
    steps: [{ id: Date.now(), text: "", time: "5 min" }],
    mediaType: "none",
    mediaUrl: "",
  });

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (activeSession && !isFinishing) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSession, isFinishing]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Visual Agenda Handlers
  const toggleAgendaTask = (id) => {
    setAgenda((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextDone = !t.done;
          if (nextDone) {
            showToast(`✨ Tarea "${t.task}" completada.`);
          }
          return { ...t, done: nextDone };
        }
        return t;
      }),
    );
  };

  const handleReportGoalProgress = () => {
    setGoalProgressReported(true);
    reportGoalProgress();
  };

  // Active Session Handlers
  const startSession = async (routine) => {
    try {
      const res = await api.post("/sesiones/iniciar", {
        nin_codi: selectedChildId || "NIN_1",
        act_codi: routine.id,
        dis_codi: "D001",
      });
      const sesion = res.data.data;

      setActiveSession({
        ...routine,
        ses_codi: sesion.ses_codi,
      });
      setSessionTime(0);
      setIsFinishing(false);
      setCooperation(0);
      setNotes("");
    } catch (err) {
      console.error("Error starting session on backend:", err);
      showToast("⚠️ No se pudo iniciar la sesión en el servidor.");

      setActiveSession({
        ...routine,
        ses_codi: "S_FALLBACK_" + Date.now().toString().slice(-4),
      });
      setSessionTime(0);
      setIsFinishing(false);
      setCooperation(0);
      setNotes("");
    }
  };

  const endSession = () => {
    setIsFinishing(true);
  };

  const saveSession = async ({
    sessionTime,
    cooperation,
    notes,
    stepsDone,
    sessionSteps,
  }) => {
    try {
      const sesCodi = activeSession.ses_codi;
      const parsedNota = `[Cooperación: ${cooperation}/5 · Pasos: ${Math.min(
        stepsDone,
        sessionSteps.length,
      )}/${sessionSteps.length}] ${notes}`;
      await api.put(`/sesiones/${sesCodi}/cerrar`, {
        ses_nota: parsedNota,
      });
      showToast(
        `✅ Sesión guardada en base de datos. Tiempo: ${formatTime(sessionTime)}. Cooperación: ${cooperation}/5.`,
      );
    } catch (err) {
      console.error("Error closing session on backend:", err);
      showToast(
        "⚠️ Error al registrar el cierre de la sesión en la base de datos.",
      );
    }

    // Tildar la actividad automáticamente en la agenda de hoy
    setAgenda((prev) => {
      const exists = prev.some(
        (t) =>
          t.id === activeSession.id ||
          t.task?.toLowerCase() === activeSession.title?.toLowerCase(),
      );
      if (exists) {
        return prev.map((t) =>
          t.id === activeSession.id ||
          t.task?.toLowerCase() === activeSession.title?.toLowerCase()
            ? { ...t, done: true }
            : t,
        );
      }
      return [
        ...prev,
        {
          id: activeSession.id || Date.now(),
          task: activeSession.title,
          time: new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          done: true,
          icon: "puzzle",
        },
      ];
    });

    setActiveSession(null);
    setIsFinishing(false);
  };

  const addToAgenda = (routine) => {
    if (agenda.some((t) => t.id === routine.id || t.task === routine.title)) {
      showToast("ℹ️ Esta rutina ya está en la agenda de hoy.");
      return;
    }
    const newTask = {
      id: routine.id,
      task: routine.title,
      time: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      done: false,
      icon: routine.category?.toLowerCase().includes("higiene")
        ? "wash"
        : routine.category?.toLowerCase().includes("aliment")
          ? "food"
          : routine.category?.toLowerCase().includes("sensorial")
            ? "puzzle"
            : "study",
    };
    setAgenda((prev) => [...prev, newTask]);
    showToast(`📅 "${routine.title}" agregada a la agenda de hoy.`);
  };

  // Builder Drawer Handlers
  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { id: Date.now(), text: "", time: "5 min" }],
    });
  };

  const handleRemoveStep = (idToRemove) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((s) => s.id !== idToRemove),
    });
  };

  const handleStepChange = (id, field, value) => {
    setFormData({
      ...formData,
      steps: formData.steps.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    });
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (userRole === "REPRESENTANTE") {
      showToast("⚠️ Solo el especialista puede crear nuevas terapias.");
      return;
    }
    await createRoutine(formData);
    setIsModalOpen(false);
    setFormData({
      title: "",
      category: "Higiene",
      durationStr: "15 min",
      difficulty: "Baja",
      materials: "",
      steps: [{ id: Date.now(), text: "", time: "5 min" }],
      mediaType: "none",
      mediaUrl: "",
    });
    setActiveTab("general");
  };

  // Persistir agenda en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem(
      `agenda_${new Date().toLocaleDateString("es-ES")}`,
      JSON.stringify(agenda),
    );
  }, [agenda]);

  const completedTasksCount = agenda.filter((t) => t.done).length;
  const progressPercent =
    agenda.length > 0
      ? Math.round((completedTasksCount / agenda.length) * 100)
      : 0;

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12">
            {/* Si no hay sesión activa, muestra el panel Día a Día completo */}
            {!activeSession && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                {/* Header del Módulo */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <PageTitle icon={CheckSquare} data-tour="ag-header">
                      Día a Día (Agenda y Terapias)
                    </PageTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Gestiona el cronograma de {nomNino || "el niño"} y lanza
                      las guías clínicas en casa en un solo lugar.
                    </p>
                  </div>
                  {userRole !== "REPRESENTANTE" && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition-transform hover:scale-102 shrink-0"
                    >
                      <Plus className="w-5 h-5" /> Crear Nueva Terapia
                    </button>
                  )}
                </div>

                {/* Grid principal de dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Columna Izquierda: Agenda y Foco Semanal (5/12) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Foco Clínico */}
                    <div
                      data-tour="ag-focus"
                      className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60"
                    >
                      <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                        Foco Clínico Semanal
                      </span>
                      <h4 className="text-sm font-bold text-slate-850 dark:text-white tracking-tight mt-2.5 leading-snug">
                        "{weeklyGoal}"
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 pb-4">
                        Asignado por: Especialista
                      </p>

                      <button
                        data-tour="ag-report"
                        onClick={handleReportGoalProgress}
                        disabled={goalProgressReported}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                          goalProgressReported
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/20"
                            : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {goalProgressReported
                          ? "Progreso Reportado Hoy"
                          : "Reportar Avance de Hoy"}
                      </button>
                    </div>

                    {/* Agenda Checklist */}
                    <div
                      data-tour="ag-checklist"
                      className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[250px] md:min-h-[350px]"
                    >
                      <div className="mb-4">
                        <div className="flex justify-between items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-blue-500" />
                            Agenda Visual de Hoy
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleOpenCreateTask}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Nueva Tarea
                            </button>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg">
                              {progressPercent}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar max-h-[380px]">
                        {agenda.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500">
                            <ListTodo className="w-8 h-8 mb-2 opacity-30 stroke-1" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              Sin tareas programadas para hoy
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                              Usa el botón "+ Nueva Tarea" para planificar las
                              actividades y rutinas del día.
                            </p>
                            <button
                              onClick={handleOpenCreateTask}
                              className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar Primera
                              Tarea
                            </button>
                          </div>
                        ) : (
                          agenda.map((task) => (
                            <div
                              key={task.id}
                              data-tour="ag-task"
                              onClick={() => toggleAgendaTask(task.id)}
                              className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:border-blue-400/50 hover:bg-blue-50/10 ${
                                task.done
                                  ? "border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/20 dark:bg-emerald-900/10"
                                  : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`p-2 rounded-lg shrink-0 ${
                                    task.done
                                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {task.icon === "wash" ? (
                                    <Smile className="w-4 h-4" />
                                  ) : task.icon === "food" ? (
                                    <Award className="w-4 h-4" />
                                  ) : task.icon === "puzzle" ? (
                                    <Activity className="w-4 h-4" />
                                  ) : task.icon === "study" ? (
                                    <FileText className="w-4 h-4" />
                                  ) : task.icon === "cleanup" ? (
                                    <ShieldCheck className="w-4 h-4" />
                                  ) : (
                                    <Moon className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 pr-2">
                                  <span
                                    className={`text-xs font-semibold tracking-wide transition-all truncate ${
                                      task.done
                                        ? "line-through text-slate-400 dark:text-slate-500"
                                        : "text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {task.task}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                    {task.time}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Botones de edición rápida */}
                                <button
                                  type="button"
                                  title="Editar tarea"
                                  onClick={(e) => handleOpenEditTask(task, e)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Eliminar tarea"
                                  onClick={(e) => handleDeleteTask(task.id, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    task.done
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-slate-300 dark:border-slate-700 bg-transparent"
                                  }`}
                                >
                                  {task.done && (
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Catálogo de Terapias (7/12) */}
                  <div
                    data-tour="ag-catalog"
                    className="lg:col-span-7 bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[350px] md:min-h-[500px]"
                  >
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Catálogo de Terapias y Rutinas
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Inicia una sesión interactiva guiada para registrar la
                        evolución en vivo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar max-h-[460px]">
                      {routines.map((routine) => (
                        <div
                          key={routine.id}
                          className="group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="px-2 py-1 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200/60 dark:border-slate-750">
                                {routine.category}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{" "}
                                {routine.durationStr}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-2 leading-tight">
                              {routine.title}
                            </h3>
                            <p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">
                              {routine.inst}
                            </p>
                          </div>

                          <div className="mt-5 flex gap-2">
                            <button
                              data-tour="ag-live"
                              onClick={() => startSession(routine)}
                              className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />{" "}
                              Iniciar Sesión
                            </button>
                            <button
                              type="button"
                              onClick={() => addToAgenda(routine)}
                              className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-xs transition-all border border-blue-200 dark:border-blue-800/40 cursor-pointer"
                              title="Programar esta terapia en la agenda de hoy"
                            >
                              + Agenda
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Si hay sesión activa: Mostrar Live Monitor (TherapySessionPlayer) */}
            <TherapySessionPlayer
              activeSession={activeSession}
              onClose={() => setActiveSession(null)}
              onSaveSession={saveSession}
            />

            {/* Modal / Drawer para Constructor Avanzado de Rutinas */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                <div className="w-full max-w-xl h-full bg-white dark:bg-[#0F172A] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-850">
                  {/* Drawer Header */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-[#1E293B]">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        Constructor de Terapias
                      </h2>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                        Configura parámetros y pasos terapéuticos.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1.5 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Tabs Nav */}
                  <div className="flex px-6 pt-3 bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-850 gap-4">
                    <button
                      onClick={() => setActiveTab("general")}
                      className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${activeTab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
                    >
                      Detalles Clínicos
                    </button>
                    <button
                      onClick={() => setActiveTab("steps")}
                      className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${activeTab === "steps" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
                    >
                      Paso a Paso
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#0F172A]">
                    <form
                      id="create-routine-form"
                      onSubmit={handleCreateRoutine}
                      className="space-y-6"
                    >
                      {activeTab === "general" && (
                        <div className="space-y-5 animate-in fade-in">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Nombre de la Terapia
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.title}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white"
                              placeholder="Ej. Terapia Sensorial con Espuma"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Categoría
                              </label>
                              <select
                                value={formData.category}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    category: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white"
                              >
                                <option value="Higiene">Higiene</option>
                                <option value="Terapéutico">Terapéutico</option>
                                <option value="Alimentación">
                                  Alimentación
                                </option>
                                <option value="Educativo">Educativo</option>
                                <option value="Regulación">
                                  Regulación Sensorial
                                </option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Duración Estimada
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.durationStr}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    durationStr: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white"
                                placeholder="Ej. 15 min"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Dificultad
                            </label>
                            <div className="flex gap-3">
                              {["Baja", "Media", "Alta"].map((diff) => (
                                <button
                                  type="button"
                                  key={diff}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      difficulty: diff,
                                    })
                                  }
                                  className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${formData.difficulty === diff ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30" : "bg-white border-slate-200 text-slate-550 dark:bg-[#1E293B]"}`}
                                >
                                  {diff}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === "steps" && (
                        <div className="space-y-5 animate-in fade-in">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Instrucciones Estructuradas
                            </label>
                            <button
                              type="button"
                              onClick={handleAddStep}
                              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar Paso
                            </button>
                          </div>

                          <div className="space-y-3">
                            {formData.steps.map((step, index) => (
                              <div
                                key={step.id}
                                className="group flex items-start gap-3 p-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl"
                              >
                                <div className="mt-2.5 cursor-grab text-slate-400">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 text-xs flex items-center justify-center font-black shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Ej. Colocar el material en la mesa"
                                    value={step.text}
                                    onChange={(e) =>
                                      handleStepChange(
                                        step.id,
                                        "text",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent border-b border-slate-350 dark:border-slate-650 px-1 py-1 outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white"
                                    required
                                  />
                                  <div className="flex items-center gap-1.5 px-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="5 min"
                                      value={step.time}
                                      onChange={(e) =>
                                        handleStepChange(
                                          step.id,
                                          "time",
                                          e.target.value,
                                        )
                                      }
                                      className="bg-transparent text-[10px] font-semibold text-slate-500 outline-none w-20"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(step.id)}
                                  className="mt-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-[#0F172A] flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-[1] py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="create-routine-form"
                      className="flex-[2] py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex justify-center items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Guardar Terapia
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Tarea Personalizada para la Agenda Visual */}
            {showTaskModal && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setShowTaskModal(false)}
              >
                <div
                  className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-5 py-4 bg-blue-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <ListTodo className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold">
                        {taskModalMode === "create"
                          ? "Nueva Tarea para la Agenda"
                          : "Editar Tarea de la Agenda"}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowTaskModal(false)}
                      className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTask} className="p-5 space-y-4">
                    {/* Nombre de la tarea */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Nombre de la Tarea o Actividad
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Ej. Tomar medicamento, Tarea de matemáticas, Merienda..."
                        value={taskForm.title}
                        onChange={(e) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors"
                      />
                    </div>

                    {/* Hora programada */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Hora Sugerida
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 08:30 AM o 15:00"
                        value={taskForm.time}
                        onChange={(e) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            time: e.target.value,
                          }))
                        }
                        className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors"
                      />
                    </div>

                    {/* Categoría / Icono */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Categoría
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TASK_CATEGORIES.map((cat) => {
                          const IconComp = cat.icon;
                          const isSelected = taskForm.icon === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() =>
                                setTaskForm((prev) => ({
                                  ...prev,
                                  icon: cat.id,
                                }))
                              }
                              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/50"
                              }`}
                            >
                              <IconComp className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setShowTaskModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {taskModalMode === "create"
                          ? "Agregar a la Agenda"
                          : "Guardar Cambios"}
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
