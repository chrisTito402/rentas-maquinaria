// Dueño: Chris · HU-02a Fechas ocupadas (KAN-9)
// Funciones puras para saber si un rango de fechas choca con los días en que un equipo ya está apartado.
// Las fechas son texto 'AAAA-MM-DD', así que se comparan como texto sin líos de zona horaria.
import { fecha } from './formato.js';

// Se cuentan el día de inicio y el de fin: 25–27 y 27–29 SÍ chocan; 25–27 y 28–30 no.
export const chocan = (a, b) => a.inicio <= b.fin && b.inicio <= a.fin;

// ocupados: [{ inicio, fin }] · regresa true si ese día está dentro de algún rango
export const estaOcupado = (dia, ocupados = []) => ocupados.some((o) => dia >= o.inicio && dia <= o.fin);

// linea: { fechaInicio, fechaFin } · regresa el primer rango ocupado con el que choca, o null
export const buscarChoque = (linea, ocupados = []) =>
  ocupados.find((o) => chocan({ inicio: linea.fechaInicio, fin: linea.fechaFin }, o)) || null;

export const mensajeChoque = (o) => `Este equipo ya está rentado del ${fecha(o.inicio)} al ${fecha(o.fin)}.`;
