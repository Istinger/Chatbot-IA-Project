const { detectSkills } = require('./skills.catalog');

/** Horas laborables al ano: para anualizar sueldos por hora. */
const HORAS_ANUALES = 2080;

/**
 * Adzuna NO devuelve la moneda: la implica el pais. Sin este mapa, un sueldo
 * mexicano de 1.080.000 MXN parecia pagar 4x mas que uno de 276.013 USD.
 */
const MONEDA_POR_PAIS = {
  'Estados Unidos': 'USD',
  Ecuador: 'USD', // Ecuador esta dolarizado
  'Reino Unido': 'GBP',
  Espana: 'EUR',
  Alemania: 'EUR',
  Francia: 'EUR',
  Italia: 'EUR',
  'Paises Bajos': 'EUR',
  Mexico: 'MXN',
  Brasil: 'BRL',
  Canada: 'CAD',
  Australia: 'AUD',
  India: 'INR',
  Colombia: 'COP',
  Argentina: 'ARS',
};

/**
 * Tasas de cambio a USD. Estaticas a proposito: para rankear ofertas no hace
 * falta precision de tesoreria, y una API de divisas seria otra dependencia que
 * puede caerse. Revisar de vez en cuando.
 */
const A_USD = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  MXN: 0.055,
  BRL: 0.18,
  INR: 0.012,
  COP: 0.00024,
  ARS: 0.001,
};

function monedaDe(country) {
  return MONEDA_POR_PAIS[country] || 'USD';
}

/** Convierte un importe anual en `currency` a USD. Devuelve null si no se puede. */
function aUsd(amount, currency) {
  if (amount == null) return null;
  const tasa = A_USD[currency];
  if (!tasa) return null;
  return Math.round(amount * tasa);
}

/** Quita etiquetas HTML (ArbeitNow devuelve la descripcion en HTML). */
function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Jooble devuelve el salario como STRING libre y a menudo vacio:
 *   "$85 per hour"  ·  "$120,000 - $150,000 a year"  ·  "2.000 € al mes"  ·  ""
 * Adzuna, en cambio, ya lo da numerico. Este parser es solo para Jooble.
 *
 * Devuelve importes ANUALIZADOS y la moneda detectada por su simbolo.
 */
function parseSalaryString(raw, monedaPorDefecto = 'USD') {
  const vacio = { salaryMin: null, salaryMax: null, currency: null };
  if (!raw || typeof raw !== 'string') return vacio;

  const text = raw.toLowerCase();

  // La moneda se detecta por el simbolo; si no hay, manda la del indice del pais.
  let currency = monedaPorDefecto;
  if (text.includes('€')) currency = 'EUR';
  else if (text.includes('£')) currency = 'GBP';
  else if (text.includes('$')) currency = monedaPorDefecto === 'USD' ? 'USD' : monedaPorDefecto;

  const numeros = (text.match(/\d[\d.,]*/g) || [])
    .map((n) => {
      // Si tiene separadores de miles, quitarlos antes de parsear.
      const limpio = n.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.');
      return Number.parseFloat(limpio);
    })
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numeros.length === 0) return vacio;

  let min = Math.min(...numeros);
  let max = Math.max(...numeros);

  // Anualizar segun la unidad que declare el texto.
  let factor = 1;
  if (/(per hour|\/hora|por hora|hourly|la hora|an hour)/.test(text)) factor = HORAS_ANUALES;
  else if (/(per month|al mes|mensual|monthly|\/mes|a month)/.test(text)) factor = 12;
  else if (/(per week|semanal|weekly|a week)/.test(text)) factor = 52;

  min *= factor;
  max *= factor;

  // Cordura: un sueldo anual fuera de rango es basura parseada.
  const usdMax = aUsd(max, currency);
  if (usdMax == null || usdMax < 1000 || usdMax > 1_000_000) return vacio;

  return { salaryMin: min, salaryMax: max, currency };
}

/**
 * Convierte un RawJob (formato de la fuente) al modelo Job comun.
 * Toda fuente pasa por aqui: es el unico sitio donde se decide isForeign y
 * donde se normaliza el salario a USD.
 */
function toJob({
  source,
  externalId,
  title,
  company,
  location,
  country,
  salaryMin,
  salaryMax,
  currency,
  salaryPredicted = false,
  description,
  url,
  extraSkillText = '',
}) {
  const limpia = stripHtml(description);
  const moneda = currency || (salaryMin != null ? monedaDe(country) : null);

  return {
    externalId: `${source}:${externalId}`,
    source,
    title: (title || '').trim(),
    company: (company || 'Sin empresa').trim(),
    location: location || null,
    country: country || null,
    salaryMin: salaryMin ?? null,
    salaryMax: salaryMax ?? null,
    currency: moneda,
    salaryUsdMin: aUsd(salaryMin, moneda),
    salaryUsdMax: aUsd(salaryMax, moneda),
    salaryPredicted: Boolean(salaryPredicted),
    description: limpia,
    url,
    skills: detectSkills(`${title} ${limpia || ''} ${extraSkillText}`),
    // Regla unica: si no es Ecuador, es oferta del exterior.
    isForeign: country !== 'Ecuador',
  };
}

module.exports = { toJob, stripHtml, parseSalaryString, monedaDe, aUsd, MONEDA_POR_PAIS, A_USD };
