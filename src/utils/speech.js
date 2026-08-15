// Utilidad de síntesis de voz: selecciona la mejor voz en español disponible
// en el navegador y mejora la calidad sobre el speechSynthesis por defecto.

let cachedVoices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

// Suscribirse a la carga asíncrona de voces
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

// Prioridad: neural > Google > Microsoft/Edge > otras, siempre en español.
function scoreVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  const es = lang.startsWith("es");
  if (!es) return 0;
  let score = 10;
  if (name.includes("neural")) score += 50;
  if (name.includes("natural")) score += 40;
  if (name.includes("google")) score += 30;
  if (name.includes("microsoft") || name.includes("edge")) score += 20;
  if (lang === "es-es" || lang === "es_mx" || lang === "es-mx") score += 15;
  if (lang === "es-419") score += 12;
  if (
    name.includes("female") ||
    name.includes("mujer") ||
    name.includes("mónica")
  )
    score += 5;
  if (name.includes("online")) score += 8;
  return score;
}

export function getBestSpanishVoice() {
  loadVoices();
  const candidates = cachedVoices.filter((v) =>
    v.lang.toLowerCase().startsWith("es"),
  );
  if (!candidates.length) return null;
  return candidates.reduce((best, cur) =>
    scoreVoice(cur) > scoreVoice(best) ? cur : best,
  );
}

export function isSpeechAvailable() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

// Cancela cualquier voz en reproducción y habla el texto.
export function speak(text, { rate = 0.9, pitch = 1.0 } = {}) {
  if (!text || !isSpeechAvailable()) return;

  // Cancelar reproducciones previas para evitar voces superpuestas
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = rate;
  utterance.pitch = pitch;

  const best = getBestSpanishVoice();
  if (best) {
    utterance.voice = best;
    utterance.lang = best.lang;
  }

  window.speechSynthesis.speak(utterance);
}
