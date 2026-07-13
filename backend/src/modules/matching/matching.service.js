const env = require('../../config/env');

/**
 * Pide candidatos al microservicio Python (cosine sobre pgvector).
 * Node no toca vectores: solo consume el resultado.
 */
async function fetchCandidates(body) {
  const res = await fetch(`${env.matchingUrl}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`matching-service respondio ${res.status}: ${detail}`);
    err.status = res.status === 404 || res.status === 409 ? res.status : 502;
    throw err;
  }

  return (await res.json()).results;
}

/**
 * epsilon-greedy: evita el sobreajuste del ranking.
 *
 * Con probabilidad (1 - epsilon) se explota: se muestra el mejor match restante.
 * Con probabilidad epsilon se explora: se inyecta una oferta peor rankeada pero
 * bien pagada, de un area adyacente. Sin esto, el usuario solo veria variaciones
 * de lo que ya sabe hacer y nunca descubriria ofertas mejores.
 *
 * Cada resultado se marca con `explored` para poder demostrar el efecto.
 */
function epsilonGreedy(candidates, limit, epsilon) {
  const exploit = candidates.slice(0, limit);

  // Pozo de exploracion: los que NO entraron al top, priorizando salario alto.
  // Se ordena por salaryUsdMax, NUNCA por salaryMax: este ultimo esta en la
  // moneda de cada pais, y ordenar por el pondria las ofertas en pesos o rupias
  // por delante de las que pagan mas de verdad.
  const explore = candidates
    .slice(limit)
    .sort((a, b) => (b.salaryUsdMax ?? 0) - (a.salaryUsdMax ?? 0));

  const out = [];
  for (let i = 0; i < limit; i += 1) {
    const explorar = Math.random() < epsilon && explore.length > 0;
    const pick = explorar ? explore.shift() : exploit.shift();
    if (!pick) break;
    out.push({ ...pick, explored: explorar });
  }
  return out;
}

/**
 * Umbral de confianza: la defensa contra el FALLO SILENCIOSO.
 *
 * La similitud de coseno NUNCA devuelve vacio: siempre entrega las N ofertas
 * "menos lejanas", por absurda que sea la consulta. Buscar "recetas de ceviche"
 * devolvia Soporte Tecnico Nivel 1 con score 0.498, presentado como si fuera un
 * resultado legitimo. El sistema no fallaba: mentia con confianza.
 *
 * Calibrado con datos reales:
 *   - consultas legitimas   -> el mejor score cae entre 0.57 y 0.69
 *   - consultas sin sentido -> el mejor score no pasa de 0.50
 *
 * Por eso hay dos umbrales:
 *   MIN_TOP  si NI SIQUIERA el mejor resultado lo alcanza, no hay match: se
 *            devuelve vacio y la UI dice honestamente que no encontro nada.
 *   MIN_ITEM descarta los resultados flojos de una consulta por lo demas buena
 *            (evita rellenar el carrusel con ruido para cuadrar el `limit`).
 *
 * LIMITACION CONOCIDA: los embeddings NO entienden la negacion. "remoto junior
 * backend sin ingles" se parece vectorialmente a "...con ingles", y el ranking
 * se degrada. Resolverlo bien exige busqueda hibrida (palabras clave + vector),
 * que queda fuera del alcance actual.
 */
function filtrarPorConfianza(candidates) {
  if (!candidates.length) return [];

  const mejor = candidates[0].score ?? 0;
  if (mejor < env.minTopScore) return [];

  return candidates.filter((c) => (c.score ?? 0) >= env.minItemScore);
}

async function suggestJobs({ profileId, text, limit = 10 }) {
  // Se piden mas candidatos de los que se devuelven: el excedente alimenta la
  // exploracion.
  const candidates = await fetchCandidates({
    profile_id: profileId,
    text,
    limit: limit * 3,
  });

  const fiables = filtrarPorConfianza(candidates);
  return epsilonGreedy(fiables, limit, env.epsilon);
}

module.exports = { suggestJobs };
