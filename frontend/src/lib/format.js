/**
 * Presentacion del salario.
 *
 * Dos reglas que vienen del backend y que la UI NO puede ignorar:
 *
 *  1. salaryMin/Max estan en la MONEDA DE CADA PAIS (pesos, euros, dolares).
 *     Para comparar o mostrar algo homogeneo se usa salaryUsd*.
 *  2. salaryPredicted = true significa que la fuente ESTIMO el sueldo; la
 *     empresa no lo publico. Presentarlo como un hecho seria enganar al usuario.
 */
export function formatearSalario(job) {
  const min = job.salaryUsdMin;
  const max = job.salaryUsdMax;

  if (!min && !max) return null;

  const miles = (n) => `$${Math.round(n / 1000)}k`;
  const rango =
    min && max && Math.abs(max - min) > 1000
      ? `${miles(min)} – ${miles(max)}`
      : miles(max || min);

  return {
    texto: `${rango} USD`,
    estimado: Boolean(job.salaryPredicted),
  };
}

export const nombreDe = (email) => {
  if (!email) return '';
  const base = email.split('@')[0].replace(/[._-]+/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
};
