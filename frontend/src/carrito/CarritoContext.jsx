// BASE · No se toca. "Mi cotización" del cliente, guardada en el navegador.
// Cada línea: { equipoId, nombre, foto, tarifaDia, cantidad, fechaInicio, fechaFin }
//   const { lineas, agregar, quitar, vaciar, municipio, setMunicipio } = useCarrito();
// HU-13b (Chris): el municipio de entrega se elige una vez en el catálogo y se recuerda.
import { createContext, useContext, useEffect, useState } from 'react';
import { agregarLinea } from '../logica/agregarLinea.js';   // Héctor · HU-04

const Contexto = createContext(null);
const CLAVE = 'mi-cotizacion';
const CLAVE_MUNICIPIO = 'municipio-entrega';

function leerGuardado() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) ?? []; } catch { return []; }
}

export function CarritoProvider({ children }) {
  const [lineas, setLineas] = useState(leerGuardado);
  const [municipio, setMunicipio] = useState(() => {
    try { return localStorage.getItem(CLAVE_MUNICIPIO) ?? ''; } catch { return ''; }
  });

  useEffect(() => {
    try { localStorage.setItem(CLAVE_MUNICIPIO, municipio); } catch { /* sin almacenamiento */ }
  }, [municipio]);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(lineas)); } catch { /* sin almacenamiento */ }
  }, [lineas]);

  const valor = {
    lineas,
    agregar: (linea) => setLineas((actuales) => agregarLinea(actuales, linea)),
    quitar: (indice) => setLineas((actuales) => actuales.filter((_, i) => i !== indice)),
    vaciar: () => setLineas([]),
    municipio,
    setMunicipio,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useCarrito = () => useContext(Contexto);
