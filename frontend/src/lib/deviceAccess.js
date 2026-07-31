export function codigoEquipo(id) {
  const limpio = String(id || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (!limpio) return 'PC-SIN-CODIGO';
  const codigo = limpio.slice(0, 12).padEnd(12, '0');
  return `PC-${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${codigo.slice(8, 12)}`;
}

export function nombreEquipo(userAgent) {
  const ua = String(userAgent || '');
  const navegador = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Firefox/')
      ? 'Firefox'
      : ua.includes('Chrome/')
        ? 'Chrome'
        : ua.includes('Safari/')
          ? 'Safari'
          : 'Navegador';
  const sistema = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS')
      ? 'macOS'
      : ua.includes('Linux')
        ? 'Linux'
        : 'PC';
  return `${navegador} · ${sistema}`;
}
