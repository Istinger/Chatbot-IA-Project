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

async function suggestJobs({ profileId, text, limit = 10 }) {
  // Se piden mas candidatos de los que se devuelven: el excedente alimenta la
  // exploracion.
  const candidates = await fetchCandidates({
    profile_id: profileId,
    text,
    limit: limit * 3,
  });

  return epsilonGreedy(candidates, limit, env.epsilon);
}

module.exports = { suggestJobs };
