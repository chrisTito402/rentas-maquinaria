// BASE · No se toca. Si necesitas un cambio, pídelo en el grupo.
// Constantes del negocio que usan el backend y el frontend.

export const IVA = 0.16;                 // 16 % sobre la renta y el envío
export const MAX_CANTIDAD = 20;          // unidades por equipo
export const MAX_NOTAS = 500;            // caracteres en las notas
export const MUNICIPIOS = [
  'Cajeme', 'Navojoa', 'Guaymas', 'Empalme', 'Bácum',
  'San Ignacio Río Muerto', 'Etchojoa', 'Huatabampo', 'Hermosillo',
];

// "Rechazada" la decide el personal comercial; "No aceptada" la decide el cliente.
export const ESTADOS = ['Pendiente', 'Aprobada', 'Rechazada', 'Aceptada', 'No aceptada'];
export const ORIGENES = ['Web', 'Panel'];
// Una cotización Aprobada o Aceptada aparta los equipos en sus fechas (HU-02a).
export const ESTADOS_QUE_APARTAN = ['Aprobada', 'Aceptada'];

// HU-13b · Envío por unidad según la distancia del municipio al patio en Cd. Obregón.
// Montos de prueba: se cambian aquí cuando la empresa confirme los oficiales.
export const ZONAS_ENVIO = [
  { zona: 1, hastaKm: 30, tarifa: 500 },
  { zona: 2, hastaKm: 80, tarifa: 1200 },
  { zona: 3, hastaKm: 150, tarifa: 2000 },
];
// Km aproximados al patio. Navojoa (zona 2) y Hermosillo (fuera de zona) los fijó
// la retrospectiva del Sprint 1; los demás los confirma el PO.
export const KM_MUNICIPIO = {
  'Cajeme': 0,
  'Bácum': 20,
  'San Ignacio Río Muerto': 45,
  'Navojoa': 67,
  'Etchojoa': 90,
  'Huatabampo': 100,
  'Empalme': 125,
  'Guaymas': 130,
  'Hermosillo': 250,
};
