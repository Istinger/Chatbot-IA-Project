/**
 * Cliente de la API.
 *
 * Todas las respuestas del backend usan el mismo envelope { ok, data, error },
 * asi que se desenvuelve aqui una sola vez: el resto de la app trabaja con los
 * datos limpios y captura errores con try/catch.
 */
const BASE = '/api';
const CLAVE_TOKEN = 'jobia_token';

export const getToken = () => localStorage.getItem(CLAVE_TOKEN);
export const setToken = (t) => localStorage.setItem(CLAVE_TOKEN, t);
export const clearToken = () => localStorage.removeItem(CLAVE_TOKEN);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: formData ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    // Fallo de red: el servidor no respondio siquiera.
    throw new ApiError('No hay conexion con el servidor', 0);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.ok) {
    throw new ApiError(json?.error || `Error ${res.status}`, res.status);
  }

  return json.data;
}

export const api = {
  registro: (email, password) =>
    request('/auth/register', { method: 'POST', body: { email, password } }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  perfil: () => request('/profile'),

  subirCv: (file) => {
    const fd = new FormData();
    fd.append('cv', file);
    return request('/profile/cv', { method: 'POST', formData: fd });
  },

  guardarSkills: (skills) =>
    request('/profile/skills', { method: 'PUT', body: { skills } }),

  /** Ofertas afines a mi perfil (requiere sesion). */
  recomendadas: (limit = 12) => request(`/matching/jobs?limit=${limit}`),

  /** Busqueda en lenguaje natural. No requiere sesion. */
  buscar: (texto, limit = 12) =>
    request(`/matching/jobs?text=${encodeURIComponent(texto)}&limit=${limit}`),

  /**
   * Chatbot. Funciona SIN sesion (un visitante puede conversar mientras ojea la
   * web); si hay token, el cliente lo adjunta solo y el asistente conoce el perfil.
   */
  chat: (mensaje, sessionId, jobId, contexto) =>
    request('/chat', { method: 'POST', body: { mensaje, sessionId, jobId, contexto } }),

  historialChat: (sessionId) => request(`/chat/${sessionId}`),

  /** Estado de las ofertas: cuantas hay y cuando se refrescaron. */
  estadoOfertas: () => request('/jobs/stats'),

  /** Refrescar ofertas ahora. Encola el trabajo: responde al instante. */
  refrescarOfertas: () => request('/jobs/ingest', { method: 'POST' }),

  /** Skill gap + cursos. Cero IA: diferencia de conjuntos y catalogo estatico. */
  certificados: () => request('/certs/suggestions'),

  estadoAvisos: () => request('/notifications'),

  /** Devuelve { codigo, enlace, bot }: el enlace ya lleva el codigo dentro. */
  vincularTelegram: () => request('/notifications/telegram/code', { method: 'POST' }),

  desvincularTelegram: () => request('/notifications/telegram', { method: 'DELETE' }),

  umbralAvisos: (minScore) =>
    request('/notifications/umbral', { method: 'PUT', body: { minScore } }),

  pitch: (jobId) => request('/cv/pitch', { method: 'POST', body: { jobId } }),

  resumenCv: () => request('/cv/summary', { method: 'POST' }),

  /** Listado plano. scope: 'local' | 'foreign'. */
  ofertas: ({ scope, limit = 12 } = {}) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (scope) qs.set('scope', scope);
    return request(`/jobs?${qs}`);
  },
};
