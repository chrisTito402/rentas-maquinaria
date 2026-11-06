// BASE · No se toca. Formatos para mostrar en pantalla.

export const dinero = (n) =>
  Number(n ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

// '2026-10-14' -> '14/10/2026'
export const fecha = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
