/**
 * Dictado por voz con la Web Speech API del navegador.
 *
 * Corre EN EL NAVEGADOR: no gasta cuota de OpenRouter ni toca el VPS. Coste $0.
 *
 * Solo la soportan los navegadores basados en Chromium (y Safari con prefijo).
 * En Firefox no existe: por eso `soportado` se exporta, para poder ESCONDER el
 * microfono en vez de mostrar un boton que no hace nada.
 */
const Reconocimiento =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const soportado = Boolean(Reconocimiento);

export function crearDictado({ onTexto, onFin, onError }) {
  if (!Reconocimiento) return null;

  const r = new Reconocimiento();
  r.lang = 'es-EC';
  r.continuous = false;
  r.interimResults = true; // el texto aparece mientras se habla

  r.onresult = (e) => {
    const texto = Array.from(e.results)
      .map((res) => res[0].transcript)
      .join('');
    onTexto(texto, e.results[e.results.length - 1].isFinal);
  };

  r.onerror = (e) => onError?.(e.error);
  r.onend = () => onFin?.();

  return r;
}
