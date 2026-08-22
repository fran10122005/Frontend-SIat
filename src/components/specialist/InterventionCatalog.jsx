import { useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  Hand,
  EyeOff,
} from "lucide-react";
import Button from "../ui/Button";

const INTERVENTIONES = {
  Berrinche: {
    icon: Zap,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    items: [
      {
        name: "Respiraci\u00f3n Tortuga",
        desc: "T\u00e9cnica de autorregulaci\u00f3n que combina respiraci\u00f3n profunda con movimiento de retracci\u00f3n.",
        steps: [
          "Instruir al paciente para que se siente c\u00f3modamente",
          "Guiar respiraci\u00f3n lenta: inhalar 4 seg, sostener 2 seg, exhalar 6 seg",
          "Invitar a encoger hombros y entrar en su caparaz\u00f3n",
          "Repetir 5-8 ciclos hasta lograr calma",
        ],
      },
      {
        name: "Presi\u00f3n Profunda",
        desc: "Estimulaci\u00f3n propioceptiva aplicando presi\u00f3n firme y constante en zonas clave del cuerpo.",
        steps: [
          "Identificar zona de mayor tolerancia (espalda, brazos, piernas)",
          "Aplicar presi\u00f3n firme con ambas manos durante 10-15 segundos",
          "Mantener ritmo constante, sin presionar articulaciones",
          "Evaluar respuesta: si relaja, mantener 2-3 minutos",
        ],
      },
      {
        name: "Espacio Seguro",
        desc: "Delimitar un \u00e1rea f\u00edsica reducida donde el paciente pueda calmarse sin est\u00edmulos externos.",
        steps: [
          "Se\u00f1alar o preparar un rinc\u00f3n con cojines y manta",
          "Invitar al paciente a pasar al espacio seguro",
          "Reducir luces y sonidos en esa zona",
          "Permanecer cerca sin invadir su espacio, ofreciendo presencia calmada",
        ],
      },
    ],
  },
  Ansiedad: {
    icon: Brain,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    items: [
      {
        name: "Respiraci\u00f3n 4-7-8",
        desc: "T\u00e9cnica de respiraci\u00f3n activadora del sistema nervioso parasimp\u00e1tico para reducir ansiedad.",
        steps: [
          "Inhalar por la nariz contando hasta 4",
          "Retener el aire contando hasta 7",
          "Exhalar lentamente por la boca contando hasta 8",
          "Repetir 4 ciclos; ideal antes de situaciones estresantes",
        ],
      },
      {
        name: "Visualizaci\u00f3n Guiada",
        desc: "Ejercicio de imaginaci\u00f3n dirigida que transporta al paciente a un lugar tranquilo y personal.",
        steps: [
          "Pedir al paciente que cierre los ojos (si es tolerable)",
          "Describir un escenario tranquilizador (playa, bosque, nube)",
          "Invocar los 5 sentidos: qu\u00e9 ve, escucha, siente",
          "Mantener 3-5 minutos, despertar lentamente",
        ],
      },
      {
        name: "Grounding 5-4-3-2-1",
        desc: "T\u00e9cnica de anclaje al presente mediante la identificaci\u00f3n de est\u00edmulos sensoriales.",
        steps: [
          "Nombrar 5 cosas que pueda VER",
          "Nombrar 4 cosas que pueda TOCAR",
          "Nombrar 3 cosas que pueda ESCUCHAR",
          "Nombrar 2 cosas que pueda OLER",
          "Nombrar 1 cosa que pueda SABOREAR",
        ],
      },
    ],
  },
  "Agresi\u00f3n": {
    icon: Hand,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    items: [
      {
        name: "T\u00e9cnica del Sem\u00e1foro",
        desc: "Sistema visual de tres niveles para autorregular la intensidad de la respuesta emocional.",
        steps: [
          "ROJO: Alto inmediato. Detener, respirar, identificar la emoci\u00f3n",
          "AMARILLO: Pausa. Pensar opciones antes de actuar",
          "VERDE: Acci\u00f3n. Elegir una respuesta adecuada y ejecutarla",
          "Practicar con historias sociales y role-playing en calma",
        ],
      },
      {
        name: "Di\u00e1logo Interno",
        desc: "Ense\u00f1ar al paciente a usar frases de autoinstrucci\u00f3n para manejar la frustraci\u00f3n.",
        steps: [
          "Modelar frases clave: Estoy molesto, pero puedo calmarme",
          "Practicar con tarjetas de texto grande y colores",
          "Usar en situaciones de baja intensidad primero",
          "Refuerzo inmediato cuando el paciente use la frase espont\u00e1neamente",
        ],
      },
      {
        name: "Pausa Activa",
        desc: "Interrupci\u00f3n f\u00edsica controlada del conflicto para reorientar la conducta.",
        steps: [
          "Se\u00f1alar visualmente (tarjeta PAUSA) o decir la palabra clave",
          "Guiar al paciente a un espacio de re-orientaci\u00f3n",
          "Esperar 1-2 minutos sin interacci\u00f3n",
          "Retomar la actividad con un inicio m\u00e1s simple y exitoso",
        ],
      },
    ],
  },
  Retiro: {
    icon: EyeOff,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-700/30",
    border: "border-slate-200 dark:border-slate-600",
    items: [
      {
        name: "Inter\u00e9s Compartido",
        desc: "Aprovechar un objeto o actividad favorita del paciente como puente para la interacci\u00f3n social.",
        steps: [
          "Identificar el objeto o actividad de alto inter\u00e9s del paciente",
          "Sentarse cerca sin forzar contacto",
          "Mostrar inter\u00e9s genuino por el mismo objeto",
          "Invitar a una actividad paralela que luego se convierta en conjunta",
        ],
      },
      {
        name: "Juego Estructurado",
        desc: "Actividades con reglas claras y predecibles que facilitan la participaci\u00f3n social.",
        steps: [
          "Elegir actividades con pasos visuales (im\u00e1genes o tarjetas)",
          "Comenzar con juego uno a uno con el terapeuta",
          "Incorporar un segundo jugador gradualmente",
          "Usar sistema de turnos con apoyo visual",
        ],
      },
      {
        name: "Refuerzo Social",
        desc: "Sistema de reconocimiento positivo que motiva la interacci\u00f3n y la participaci\u00f3n.",
        steps: [
          "Definir conductas objetivo espec\u00edficas (mirar, sonre\u00edr, decir hola)",
          "Usar refuerzo inmediato: elogio y ficha o estrella",
          "Sistema de canje simple y visible (tablero de progreso)",
          "Aumentar gradualmente los criterios para obtener refuerzo",
        ],
      },
    ],
  },
};

export default function InterventionCatalog({ showModal, setShowModal }) {
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  if (!showModal) return null;

  const filteredGroups = Object.entries(INTERVENTIONES).filter(
    ([grupo, data]) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      if (grupo.toLowerCase().includes(q)) return true;
      return data.items.some(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q),
      );
    },
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            Cat\u00e1logo de Intervenciones
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Busqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar intervenci\u00f3n por nombre, descripci\u00f3n o tipo..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Grupos */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron intervenciones.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map(([grupo, data]) => {
                const Icon = data.icon;
                const isGroupExpanded = expandedGroup === grupo;

                const filteredItems = data.items.filter((item) => {
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  return (
                    item.name.toLowerCase().includes(q) ||
                    item.desc.toLowerCase().includes(q) ||
                    grupo.toLowerCase().includes(q)
                  );
                });

                if (filteredItems.length === 0) return null;

                return (
                  <div
                    key={grupo}
                    className={`rounded-xl border ${data.border} overflow-hidden`}
                  >
                    <button
                      onClick={() =>
                        setExpandedGroup(isGroupExpanded ? null : grupo)
                      }
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${data.bg}`}
                    >
                      <Icon className={`w-5 h-5 ${data.color} shrink-0`} />
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex-1">
                        {grupo}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mr-2">
                        {filteredItems.length}{" "}
                        {filteredItems.length === 1
                          ? "intervenci\u00f3n"
                          : "intervenciones"}
                      </span>
                      {isGroupExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isGroupExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredItems.map((item) => {
                          const itemKey = `${grupo}-${item.name}`;
                          const isItemExpanded = expandedItem === itemKey;
                          return (
                            <div key={item.name} className="px-4 py-3">
                              <button
                                onClick={() =>
                                  setExpandedItem(
                                    isItemExpanded ? null : itemKey,
                                  )
                                }
                                className="w-full flex items-start gap-3 text-left"
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${data.bg} ${data.color}`}
                                >
                                  {item.name[0]}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {item.desc}
                                  </p>
                                </div>
                                {isItemExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                )}
                              </button>

                              {isItemExpanded && (
                                <div className="mt-3 ml-9 space-y-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Pasos
                                  </p>
                                  <ol className="space-y-1.5">
                                    {item.steps.map((step, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2"
                                      >
                                        <span
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${data.bg} ${data.color}`}
                                        >
                                          {idx + 1}
                                        </span>
                                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {step}
                                        </span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
