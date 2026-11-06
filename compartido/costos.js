// Dueño: Chris · HU-13a Costo de la renta (KAN-10)
// VERSIÓN FALSA: ya tiene los nombres, lo que reciben y lo que regresan definitivos,
// pero todo da 0. Chris la reemplaza por la real (ver la guía).

// contarDias('2026-10-14', '2026-10-16') -> 3
export function contarDias(fechaInicio, fechaFin) {
  return 0;
}

// lineas: [{ tarifaDia, cantidad, fechaInicio, fechaFin, ...lo que sea }]
// regresa: { lineas: [{ ...cada línea, dias, importe }], subtotal, iva, total }
export function calcularCostos(lineas) {
  return {
    lineas: lineas.map((l) => ({ ...l, dias: 0, importe: 0 })),
    subtotal: 0,
    iva: 0,
    total: 0,
  };
}
