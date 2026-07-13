const env = require('./env');

/**
 * Unico punto por el que el proyecto habla con un LLM.
 *
 * Centralizarlo aqui permite: contar tokens, poner topes, cambiar de modelo
 * desde el .env y traducir los errores del proveedor a algo accionable.
 *
 * IMPORTANTE: el matching NO pasa por aqui. Filtrar y rankear ofertas se hace
 * con similitud de coseno (gratis). El LLM solo GENERA TEXTO.
 */
const URL = 'https://openrouter.ai/api/v1/chat/completions';

// Contador de la vida del proceso. Sirve para saber cuanto se esta gastando.
const consumo = { peticiones: 0, tokensEntrada: 0, tokensSalida: 0, porModelo: {} };

class LlmError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Traduce los errores de OpenRouter a mensajes que digan QUE HACER.
 * El de 404 es el mas traicionero: no significa "no existe", sino que los
 * modelos gratuitos exigen aceptar la politica de datos en Settings -> Privacy.
 */
function traducirError(status, cuerpo) {
  const detalle = cuerpo?.error?.message || '';

  if (status === 401) return new LlmError('OPENROUTER_API_KEY invalida o ausente', 502);
  if (status === 402) return new LlmError('OpenRouter: sin saldo suficiente', 502);
  if (status === 429) {
    return new LlmError(
      'Todos los modelos gratuitos estan saturados ahora mismo. Vuelve a intentarlo ' +
        'en unos minutos, o carga $10 en OpenRouter (sube la cuota diaria de 50 a 1000).',
      429,
    );
  }
  if (status === 404 && /data policy/i.test(detalle)) {
    return new LlmError(
      'Los modelos gratuitos requieren aceptar la politica de datos en ' +
        'openrouter.ai -> Settings -> Privacy.',
      502,
    );
  }
  return new LlmError(`OpenRouter respondio ${status}: ${detalle}`, 502);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Una sola llamada, sin reintentos ni relevos. */
async function intentar(model, payload) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openrouter.apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter usa estas cabeceras para atribuir el trafico.
      'HTTP-Referer': env.openrouter.referer,
      'X-Title': 'Jobia',
    },
    body: JSON.stringify({ ...payload, model }),
    signal: AbortSignal.timeout(45000),
  });

  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

/**
 * @param {object}   opts
 * @param {string}   opts.system    Instrucciones. NUNCA debe contener secretos.
 * @param {object[]} opts.messages  [{ role: 'user'|'assistant', content }]
 * @param {number}   opts.maxTokens Tope de la respuesta: acota coste y corta en
 *                                  seco las respuestas desbocadas.
 *
 * CADENA DE RELEVO ENTRE MODELOS. Los endpoints :free se saturan y devuelven 429
 * ("Provider returned error") de forma INTERMITENTE: no es que se agote tu cuota,
 * es que miles de personas comparten ese endpoint gratuito. Medido en una misma
 * tanda de pruebas: gemma-4-31b y gpt-oss-120b caidos, mientras gemma-4-26b y
 * gpt-oss-20b respondian sin problema. Y minutos antes era al reves.
 *
 * Por eso no se apuesta por un modelo: se configuran varios. Si el primero esta
 * saturado, se reintenta con espera; si sigue caido, entra el siguiente. Es la
 * diferencia entre una demo que funciona y una que se cae delante del tribunal.
 */
async function chat({ system, messages, maxTokens = 500, temperature = 0.7 }) {
  if (!env.openrouter.apiKey) {
    throw new LlmError('Falta OPENROUTER_API_KEY en el .env', 503);
  }

  const payload = {
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: maxTokens,
    temperature,
  };

  let ultimo = { status: 429, body: null };

  for (const model of env.openrouter.modelos) {
    // Un reintento por modelo: si el 429 es un pico pasajero, esto lo salva; si
    // el endpoint esta realmente saturado, insistir mas es perder el tiempo y es
    // mejor pasar al siguiente modelo.
    for (let intento = 0; intento <= 1; intento += 1) {
      let r;
      try {
        r = await intentar(model, payload);
      } catch {
        break; // fallo de red con este modelo: probar el siguiente
      }

      const texto = r.ok ? r.body?.choices?.[0]?.message?.content?.trim() : null;

      // Un 200 con contenido VACIO es un fallo del proveedor disfrazado de exito:
      // pasa con los endpoints :free saturados. Se trata como reintentable (y, si
      // insiste, se cambia de modelo) en vez de reventarle la peticion al usuario.
      if (r.ok && !texto) {
        console.warn(`[llm] ${model} devolvio contenido vacio; reintentando`);
        if (intento === 0) {
          await dormir(1200);
          continue;
        }
        break; // siguiente modelo
      }

      if (r.ok) {
        const uso = r.body.usage || {};
        consumo.peticiones += 1;
        consumo.tokensEntrada += uso.prompt_tokens || 0;
        consumo.tokensSalida += uso.completion_tokens || 0;
        consumo.porModelo[model] = (consumo.porModelo[model] || 0) + 1;

        console.log(
          `[llm] ${model} | entrada=${uso.prompt_tokens ?? '?'} ` +
            `salida=${uso.completion_tokens ?? '?'} | total=${consumo.peticiones}`,
        );

        return { texto, uso, model };
      }

      ultimo = r;

      // Un 401/402/404 no mejora reintentando ni cambiando de modelo.
      const reintentable = r.status === 429 || r.status >= 500;
      if (!reintentable) throw traducirError(r.status, r.body);

      if (intento === 0) await dormir(1200);
    }

    console.warn(`[llm] ${model} saturado (${ultimo.status}); pasando al siguiente`);
  }

  // Ningun modelo de la cadena respondio.
  throw traducirError(ultimo.status, ultimo.body);
}

module.exports = { chat, consumo, LlmError };
