import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Camara del usuario para la entrevista en video.
 *
 * AQUI NO SE GRABA NADA, y es a proposito:
 *   - El stream solo se enchufa a un <video> local (srcObject) para que el usuario
 *     se vea, como en cualquier videollamada.
 *   - No se usa MediaRecorder, ni canvas.toBlob, ni captureStream, ni se sube
 *     ningun byte de imagen a ningun sitio. La practica es del usuario y se queda
 *     en su dispositivo.
 *   - Al colgar o desmontar se paran los tracks: eso apaga el LED de la camara.
 *
 * `audio: false` tambien es deliberado: el microfono lo gestiona la Web Speech API
 * (lib/voz.js). Abrir un segundo stream de audio que no usamos solo sumaria un
 * permiso y un indicador de "te estan escuchando" sin ninguna razon.
 *
 * OJO: getUserMedia exige contexto seguro (HTTPS o localhost). En produccion el
 * VPS ya sirve por HTTPS.
 */
export function useCamara() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [activa, setActiva] = useState(false);
  const [error, setError] = useState(null);

  const apagar = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActiva(false);
  }, []);

  const encender = useCallback(async () => {
    if (streamRef.current) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite usar la camara.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // play() puede rechazar si el elemento se desmonta a mitad: no es un fallo
        // que deba ver el usuario.
        videoRef.current.play?.().catch(() => {});
      }
      setError(null);
      setActiva(true);
      return true;
    } catch (err) {
      // Permiso denegado, sin camara conectada o en uso por otra app. La llamada
      // sigue: el recuadro muestra las iniciales.
      setError(
        err?.name === 'NotAllowedError'
          ? 'No diste permiso para la camara. Puedes seguir sin video.'
          : 'No pudimos encender la camara. Puedes seguir sin video.',
      );
      setActiva(false);
      return false;
    }
  }, []);

  const alternar = useCallback(() => {
    if (activa) {
      apagar();
      return Promise.resolve(false);
    }
    return encender();
  }, [activa, apagar, encender]);

  // Red de seguridad: si el componente muere sin llamar a apagar (navegacion,
  // recarga en caliente), los tracks se paran igual.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  return { videoRef, activa, error, encender, apagar, alternar };
}
