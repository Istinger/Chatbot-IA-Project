/**
 * Dictado por voz con la Web Speech API del navegador.
 *
 * Corre EN EL NAVEGADOR: no gasta cuota de OpenRouter ni toca el VPS. Coste $0.
 *
 * Solo la soportan los navegadores basados en Chromium (y Safari con prefijo).
 * En Firefox no existe: por eso `soportado` se exporta, para poder ESCONDER el
 * microfono en vez de mostrar un boton que no hace nada.
 *
 * OJO con Brave: `soportado` da true (la API EXISTE), pero no funciona. La API
 * no transcribe en el navegador: manda el audio a los servidores de Google con
 * una clave que trae el navegador, y Brave quito esa clave por privacidad. El
 * resultado es un error `network` aunque el microfono se encienda. No se puede
 * detectar de antemano de forma sincrona, asi que se maneja en el onError.
 */
const Reconocimiento =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const soportado = Boolean(Reconocimiento);

/**
 * Detecta Brave. Es la via oficial (navigator.brave.isBrave()) y es asincrona,
 * por eso se resuelve al montar la pantalla y no en caliente.
 */
export async function esBrave() {
  try {
    return Boolean(navigator.brave && (await navigator.brave.isBrave()));
  } catch {
    return false;
  }
}

/**
 * Traduce el codigo de error de la Web Speech API a un mensaje util.
 *
 * Devolver el codigo crudo ("network", "not-allowed") no le dice nada al
 * usuario; el mensaje generico anterior ("no se pudo acceder al microfono")
 * MENTIA, porque en Brave el micro si se accede: lo que falla es la
 * transcripcion. Devuelve null cuando no hay nada que mostrar (el usuario lo
 * detuvo a proposito).
 */
const MENSAJE_BRAVE =
  'El dictado por voz no funciona en Brave: bloquea el servicio de Google que transcribe la voz. Abre Jobia en Chrome o Edge para dictar (o simplemente escribe tu mensaje).';

// Errores que en Brave NO significan "denegaste el permiso", sino "el servicio
// esta bloqueado". El codigo exacto varia entre versiones (network en Brave,
// not-allowed en algunos Chromium sin clave), por eso se agrupan.
const FALLOS_DE_SERVICIO = new Set(['network', 'not-allowed', 'service-not-allowed']);

export function mensajeDeError(codigo, { brave = false } = {}) {
  // En Brave el diagnostico es siempre el mismo, gane el codigo que gane: el
  // servicio de transcripcion no existe. Decir "revisa los permisos" mandaria
  // al usuario a pelear con un candado que no arregla nada.
  if (brave && FALLOS_DE_SERVICIO.has(codigo)) return MENSAJE_BRAVE;

  switch (codigo) {
    case 'no-speech':
      return 'No te escuche nada. Vuelve a intentarlo.';
    case 'audio-capture':
      return 'No encontramos ningun microfono conectado.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'El navegador bloqueo el microfono. Revisa los permisos en el candado de la barra de direcciones.';
    case 'network':
      return 'No se pudo contactar con el servicio de transcripcion. Revisa tu conexion.';
    case 'aborted':
      return null; // lo detuvo el propio usuario: no es un error
    default:
      return 'No se pudo usar el microfono.';
  }
}

/**
 * Lee un texto en voz alta con el sintetizador del navegador (SpeechSynthesis).
 *
 * Corre en el navegador: $0, sin tocar el VPS ni OpenRouter. Se usa para que la
 * entrevista "hable" la pregunta. Cancela lo que estuviera diciendo antes; no-op
 * si el navegador no lo soporta.
 */
export const ttsSoportado =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function leerEnVozAlta(texto) {
  if (!ttsSoportado || !texto) return;
  try {
    window.speechSynthesis.cancel(); // corta la pregunta anterior
    const u = new SpeechSynthesisUtterance(String(texto));
    u.lang = 'es-ES';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* algunos navegadores lo bloquean sin gesto del usuario: no es critico */
  }
}

/** Corta cualquier lectura en curso (al cerrar la sesion o cambiar de pregunta). */
export function callarVoz() {
  if (ttsSoportado) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* no-op */
    }
  }
}

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
