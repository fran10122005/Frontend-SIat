import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ActivityBuilderModal, {
  parseStepsForBuilder,
  serializeBuilderSteps,
  calculateStepsTotalSeconds,
  formatStepsDurationSummary,
  isVideoUrl,
} from "./ActivityBuilderModal";

const BASE_CATEGORIES = [
  { cat_codi: "CAT_SEN", cat_nomb: "Sensorial", cat_estd: true },
  { cat_codi: "CAT_MOT", cat_nomb: "Motricidad", cat_estd: true },
  { cat_codi: "CAT_OLD", cat_nomb: "Antigua", cat_estd: false },
];

const renderModal = (overrideProps = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    editingRoutine: null,
    categories: BASE_CATEGORIES,
    selectedChildId: "NIN01",
    childName: "Mateo Pérez",
    globalPeiGoals: [
      { met_codi: "MET01", met_desc: "Tolerar texturas suaves", met_prog: 40 },
    ],
    createRoutine: vi.fn().mockResolvedValue({ ok: true, fieldErrors: {} }),
    updateRoutine: vi.fn().mockResolvedValue({ ok: true, fieldErrors: {} }),
    crearPeiGoal: vi.fn().mockResolvedValue({ ok: true }),
    showToast: vi.fn(),
    ...overrideProps,
  };
  return { ...render(<ActivityBuilderModal {...props} />), props };
};

describe("ActivityBuilderModal — Helpers puros", () => {
  it("parsea y serializa pasos con minutos y segundos y calcula su duración total", () => {
    const raw = "1. Saludo inicial (45 seg)\n2. Juego con arena (2 min)";
    const parsed = parseStepsForBuilder(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      text: "Saludo inicial",
      durationValue: "45",
      durationUnit: "seg",
    });
    expect(parsed[1]).toMatchObject({
      text: "Juego con arena",
      durationValue: "2",
      durationUnit: "min",
    });

    const totalSec = calculateStepsTotalSeconds(parsed);
    expect(totalSec).toBe(165);
    expect(formatStepsDurationSummary(totalSec)).toBe("2 min 45 seg");
    expect(serializeBuilderSteps(parsed)).toBe(raw);
  });

  it("distingue URLs de video frente a imágenes", () => {
    expect(isVideoUrl("https://www.youtube.com/watch?v=abc123")).toBe(true);
    expect(isVideoUrl("https://cdn.siat.org/demo.mp4")).toBe(true);
    expect(
      isVideoUrl("https://res.cloudinary.com/demo/image/upload/v1/picto.png"),
    ).toBe(false);
  });
});

describe("ActivityBuilderModal — Flujo de 3 pasos, validaciones y alcance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia en el paso 1, valida con Siguiente antes de avanzar y salta al paso con errores al pulsar Generar Terapia", async () => {
    const { props } = renderModal();

    expect(screen.getByText(/Constructor de Terapias/i)).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 3/i)).toBeInTheDocument();

    // Intentar avanzar con título vacío permanece en Paso 1 y marca error
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    expect(
      screen.getByText(/El nombre de la terapia es obligatorio/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 3/i)).toBeInTheDocument();

    // Llenar título válido pero mantener Paso 2 vacío y pulsar Generar Terapia directo desde Paso 1
    fireEvent.change(screen.getByLabelText(/Nombre de la Terapia/i), {
      target: { value: "Circuito Sensorial" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generar Terapia/i }));

    expect(props.createRoutine).not.toHaveBeenCalled();
    // Debe saltar automáticamente al Paso 2 mostrando el error del paso 1 vacío
    expect(screen.getByText(/Paso 2 de 3/i)).toBeInTheDocument();
    expect(
      screen.getByText(/La instrucción del paso 1 es obligatoria/i),
    ).toBeInTheDocument();
  });

  it("permite seleccionar alcance Catálogo general (GLOBAL) vs Solo este paciente (CHILD) y crear meta PEI opcional", async () => {
    const { props } = renderModal();

    // Paso 1: título y cambio a Catálogo general
    fireEvent.change(screen.getByLabelText(/Nombre de la Terapia/i), {
      target: { value: "Respiración Guiada" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Catálogo general/i }));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));

    // Paso 2: llenar instrucción
    expect(screen.getByText(/Paso 2 de 3/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Instrucción del paso 1/i), {
      target: { value: "Inhalar lento contando hasta cuatro" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));

    // Paso 3: meta PEI opcional
    expect(screen.getByText(/Paso 3 de 3/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Descripción de la Meta/i), {
      target: { value: "Autorregular respiración 3 veces" },
    });
    fireEvent.change(screen.getByLabelText(/Criterio de Maestría/i), {
      target: { value: "10" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Generar Terapia/i }));

    await waitFor(() => {
      expect(props.createRoutine).toHaveBeenCalledTimes(1);
    });

    expect(props.createRoutine).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Respiración Guiada",
        categoryCode: "CAT_SEN",
        category: "Sensorial",
        scope: "GLOBAL",
        nin_codi: null,
        visibility: "AMBOS",
        status: "Activa",
        steps: [
          expect.objectContaining({
            text: "Inhalar lento contando hasta cuatro",
            durationValue: 5,
            durationUnit: "min",
          }),
        ],
      }),
    );

    expect(props.crearPeiGoal).toHaveBeenCalledWith("NIN01", {
      met_desc: "Autorregular respiración 3 veces",
      met_ttria: 10,
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calcula suma de pasos (min/seg), sincroniza duración total y reordena pasos", async () => {
    const { props } = renderModal();

    fireEvent.change(screen.getByLabelText(/Nombre de la Terapia/i), {
      target: { value: "Secuencia Motora" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));

    // Paso 1 = 90 seg
    fireEvent.change(screen.getByLabelText(/Instrucción del paso 1/i), {
      target: { value: "Paso A" },
    });
    fireEvent.change(screen.getByLabelText(/Unidad del paso 1/i), {
      target: { value: "seg" },
    });
    fireEvent.change(screen.getByLabelText(/Duración del paso 1/i), {
      target: { value: "90" },
    });

    // Agregar Paso 2 = 3 min
    fireEvent.click(screen.getByRole("button", { name: /Agregar Paso/i }));
    fireEvent.change(screen.getByLabelText(/Instrucción del paso 2/i), {
      target: { value: "Paso B" },
    });
    fireEvent.change(screen.getByLabelText(/Duración del paso 2/i), {
      target: { value: "3" },
    });

    expect(screen.getByText("4 min 30 seg")).toBeInTheDocument();

    // Aplicar duración sugerida al total (ceil(270/60) = 5 min)
    fireEvent.click(
      screen.getByRole("button", { name: /Aplicar al total \(5 min\)/i }),
    );
    expect(props.showToast).toHaveBeenCalledWith(
      expect.stringContaining("5 min"),
    );

    // Subir paso 2 a posición 1
    fireEvent.click(screen.getByRole("button", { name: /Subir paso 2/i }));

    fireEvent.click(screen.getByRole("button", { name: /Generar Terapia/i }));

    await waitFor(() => {
      expect(props.createRoutine).toHaveBeenCalledTimes(1);
    });

    const payload = props.createRoutine.mock.calls[0][0];
    expect(payload.durationMinutes).toBe(5);
    expect(payload.steps.map((s) => s.text)).toEqual(["Paso B", "Paso A"]);
    expect(payload.steps.map((s) => s.durationUnit)).toEqual(["min", "seg"]);
  });

  it("bloquea el envío cuando la guía combinada de pasos supera los 2000 caracteres", () => {
    const { props } = renderModal();

    fireEvent.change(screen.getByLabelText(/Nombre de la Terapia/i), {
      target: { value: "Terapia Larga" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));

    // 7 pasos de 300 caracteres superan 2000 caracteres al serializarse
    const textoLargo = "A".repeat(300);
    for (let i = 0; i < 7; i += 1) {
      if (i > 0) {
        fireEvent.click(screen.getByRole("button", { name: /Agregar Paso/i }));
      }
      fireEvent.change(screen.getByLabelText(`Instrucción del paso ${i + 1}`), {
        target: { value: textoLargo },
      });
    }

    fireEvent.click(screen.getByRole("button", { name: /Generar Terapia/i }));

    expect(props.createRoutine).not.toHaveBeenCalled();
    expect(
      screen.getByText(/La guía combinada .* supera el límite permitido/i),
    ).toBeInTheDocument();
  });

  it("aísla estado de imagen y video al cambiar de modo multimedia y limpia mediaUrl con Sin soporte", async () => {
    const editingRoutine = {
      id: "ACT99",
      title: "Actividad con Imagen",
      description: "Desc inicial",
      categoryCode: "CAT_SEN",
      category: "Sensorial",
      act_time: 10,
      difficulty: "Media",
      nin_codi: "NIN01",
      visibility: "AMBOS",
      status: "Activa",
      inst: "1. Paso único (10 min)",
      materials: "Pelota",
      media: "https://res.cloudinary.com/siat/image/upload/v1/picto.png",
    };

    const { props } = renderModal({ editingRoutine });

    // Ir directo al Paso 3 usando pill del stepper
    fireEvent.click(screen.getByRole("button", { name: /Recursos y PEI/i }));

    // Aviso PEI en modo edición (no editable aquí)
    expect(screen.getByText(/se editan desde su/i)).toBeInTheDocument();
    expect(screen.getByText("Tolerar texturas suaves")).toBeInTheDocument();

    // Imagen cargada visible
    expect(screen.getByText(/Imagen adjunta/i)).toBeInTheDocument();

    // Cambiar a Video: NO debe arrastrar la URL de imagen y debe exigir URL de video válida
    fireEvent.click(
      screen.getByRole("button", { name: /Video de Referencia/i }),
    );
    const videoInput = screen.getByLabelText(/URL del video de referencia/i);
    expect(videoInput.value).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/i }));
    expect(props.updateRoutine).not.toHaveBeenCalled();
    expect(screen.getByText(/La URL es obligatoria/i)).toBeInTheDocument();

    // Cambiar a Sin soporte limpia error y guarda sin media
    fireEvent.click(screen.getByRole("button", { name: /Sin soporte/i }));
    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/i }));

    await waitFor(() => {
      expect(props.updateRoutine).toHaveBeenCalledTimes(1);
    });

    expect(props.updateRoutine).toHaveBeenCalledWith(
      "ACT99",
      expect.objectContaining({
        mediaType: "none",
        mediaUrl: "",
        nin_codi: "NIN01",
        scope: "CHILD",
      }),
    );
    expect(props.crearPeiGoal).not.toHaveBeenCalled();
  });

  it("en modo edición bloquea categoría inactiva hasta cambiarla y permite alternar estado Activa/Inactiva", async () => {
    const editingRoutine = {
      id: "ACT77",
      title: "Actividad Antigua",
      description: "",
      categoryCode: "CAT_OLD",
      category: "Antigua",
      act_time: 15,
      difficulty: "Baja",
      nin_codi: null,
      visibility: "ESPECIALISTA",
      status: "Activa",
      inst: "1. Paso inicial (5 min)",
      materials: "",
      media: "",
    };

    const { props } = renderModal({ editingRoutine });

    expect(
      screen.getByText(/La categoría actual fue desactivada/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/i }));
    expect(props.updateRoutine).not.toHaveBeenCalled();
    expect(
      screen.getByText(/La categoría actual está inactiva/i),
    ).toBeInTheDocument();

    // Seleccionar categoría activa y cambiar estado a Inactiva
    fireEvent.change(screen.getByLabelText(/Categoría/i), {
      target: { value: "CAT_MOT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Inactiva/i }));
    fireEvent.click(screen.getByRole("button", { name: /Guardar Cambios/i }));

    await waitFor(() => {
      expect(props.updateRoutine).toHaveBeenCalledTimes(1);
    });
    expect(props.updateRoutine).toHaveBeenCalledWith(
      "ACT77",
      expect.objectContaining({
        categoryCode: "CAT_MOT",
        status: "Inactiva",
        scope: "GLOBAL",
        nin_codi: null,
      }),
    );
  });

  it("muestra confirmación de descarte al cerrar con cambios y mapea errores de servidor en duración", async () => {
    const createRoutine = vi.fn().mockResolvedValue({
      ok: false,
      fieldErrors: { durationStr: "La duración excede el máximo permitido" },
    });
    const { props } = renderModal({ createRoutine });

    // Si está limpio, cerrar llama onClose directamente
    fireEvent.click(
      screen.getByRole("button", { name: /Cerrar constructor de terapias/i }),
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
    props.onClose.mockClear();

    // Llenar Paso 1 y Paso 2 y provocar error del servidor en durationStr
    fireEvent.change(screen.getByLabelText(/Nombre de la Terapia/i), {
      target: { value: "Terapia Prueba Error" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/i }));
    fireEvent.change(screen.getByLabelText(/Instrucción del paso 1/i), {
      target: { value: "Paso válido" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Generar Terapia/i }));
    await waitFor(() => {
      expect(createRoutine).toHaveBeenCalledTimes(1);
    });

    // Debe haber saltado al Paso 1 y mostrado el error mapeado desde durationStr
    expect(screen.getByText(/Paso 1 de 3/i)).toBeInTheDocument();
    expect(
      screen.getByText(/La duración excede el máximo permitido/i),
    ).toBeInTheDocument();

    // Ahora intentar cerrar con cambios -> abre ConfirmDialog
    fireEvent.click(
      screen.getByRole("button", { name: /Cerrar constructor de terapias/i }),
    );
    expect(
      screen.getByText(/¿Descartar cambios de la terapia\?/i),
    ).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Descartar y salir/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
