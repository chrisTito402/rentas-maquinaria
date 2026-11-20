// Calendario para elegir el rango de renta: primer clic = inicio, segundo clic = fin.
// Uso: <CalendarioRango inicio="2026-10-12" fin="2026-10-15" onCambio={(inicio, fin) => ...}
//                       ocupados={[{ inicio, fin }]} onChoque={(mensaje) => ...} />
// HU-02a (Chris): los días ocupados se ven marcados y no se pueden elegir. Con el inicio ya elegido,
// el rango se detiene antes del siguiente día ocupado (frame «Ficha · Estado fechas ocupadas (HU-02a)»);
// si aun así el rango brinca un día ocupado, no se acepta y se avisa con onChoque.
import { useState } from 'react';
import { chocan, estaOcupado, limiteFin, mensajeChoque } from '@compartido/ocupadas.js';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const iso = (anio, mes, dia) => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

function mesInicial(inicio) {
  const base = inicio ? new Date(`${inicio}T12:00:00`) : new Date();
  return { anio: base.getFullYear(), mes: base.getMonth() };
}

export default function CalendarioRango({ inicio, fin, onCambio, ocupados = [], onChoque }) {
  const [vista, setVista] = useState(() => mesInicial(inicio));
  const { anio, mes } = vista;
  const primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7;   // lunes = 0
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const mesTexto = new Date(anio, mes, 1).toLocaleDateString('es-MX', { month: 'long' });
  const nombreMes = `${mesTexto.charAt(0).toUpperCase()}${mesTexto.slice(1)} ${anio}`;

  function mover(delta) {
    const fecha = new Date(anio, mes + delta, 1);
    setVista({ anio: fecha.getFullYear(), mes: fecha.getMonth() });
  }

  function elegir(dia) {
    if (estaOcupado(dia, ocupados)) return;
    if (!inicio || fin || dia < inicio) return onCambio(dia, '');
    const choque = ocupados.find((o) => chocan({ inicio, fin: dia }, o));
    if (choque) {
      onCambio(dia, '');                     // el día tocado queda como nuevo inicio
      return onChoque?.(mensajeChoque(choque));   // y se avisa después, para que el aviso no se borre
    }
    return onCambio(inicio, dia);
  }

  const tope = inicio && !fin ? limiteFin(inicio, ocupados) : null;
  const celdas = [];
  for (let i = 0; i < primerDia; i += 1) celdas.push(<span key={`v${i}`} />);
  for (let d = 1; d <= totalDias; d += 1) {
    const dia = iso(anio, mes, d);
    const extremo = dia === inicio || dia === fin;
    const enRango = inicio && fin && dia > inicio && dia < fin;
    const ocupado = estaOcupado(dia, ocupados);
    const fuera = Boolean(tope) && dia > tope.hasta;   // después del bloque ocupado: no puede ser el fin
    const nombre = new Date(anio, mes, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    celdas.push(
      <button
        type="button" key={dia} onClick={() => elegir(dia)} disabled={ocupado || fuera}
        className={`calendario__dia${enRango ? ' calendario__dia--rango' : ''}${extremo ? ' calendario__dia--extremo' : ''}${ocupado ? ' calendario__dia--ocupado' : ''}${fuera ? ' calendario__dia--fuera' : ''}`}
        aria-pressed={extremo || Boolean(enRango)}
        aria-label={ocupado ? `${nombre}, ocupado` : nombre}
      >
        {d}
      </button>,
    );
  }

  return (
    <div className="calendario">
      <div className="calendario__cabecera">
        <button type="button" className="calendario__nav" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button>
        <strong aria-live="polite">{nombreMes}</strong>
        <button type="button" className="calendario__nav" onClick={() => mover(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="calendario__rejilla">
        {DIAS.map((d, i) => <span className="calendario__dia-semana" key={i}>{d}</span>)}
        {celdas}
      </div>
      <div className="calendario__leyenda">
        <span><i />Tu selección</span>
        {ocupados.length > 0 && <span><i className="calendario__leyenda--ocupado" />Ocupado</span>}
      </div>
    </div>
  );
}
