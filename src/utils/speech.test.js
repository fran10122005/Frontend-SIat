import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBestSpanishVoice,
  isSpeechAvailable,
  speak,
  stopSpeech,
} from "./speech";

describe("speech utility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("detecta si la API de síntesis de voz está disponible", () => {
    // En jsdom mockeamos los objetos del navegador
    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: vi.fn(),
      speak: vi.fn(),
    };
    window.SpeechSynthesisUtterance = vi.fn();

    expect(isSpeechAvailable()).toBe(true);
  });

  it("selecciona la mejor voz en español según la prioridad neuronal", () => {
    const mockVoices = [
      { name: "English Voice", lang: "en-US" },
      { name: "Voz Estándar", lang: "es-ES" },
      { name: "Google Español Neural", lang: "es-419" },
    ];

    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      cancel: vi.fn(),
      speak: vi.fn(),
    };

    const bestVoice = getBestSpanishVoice();
    expect(bestVoice).toBeDefined();
    expect(bestVoice.name).toBe("Google Español Neural");
  });

  it("detiene la voz en reproducción al llamar a stopSpeech", () => {
    const mockCancel = vi.fn();
    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: mockCancel,
      speak: vi.fn(),
    };

    stopSpeech();
    expect(mockCancel).toHaveBeenCalled();
  });
});
