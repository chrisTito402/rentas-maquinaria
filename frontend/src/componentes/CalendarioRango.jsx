// Calendario para elegir el rango de renta: primer clic = inicio, segundo clic = fin.
// Uso: <CalendarioRango inicio="2026-10-12" fin="2026-10-15" onCambio={(inicio, fin) => ...} />
import { useState } from 'react';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const iso = (anio, mes, dia) => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

function mesInicial(inicio) {
  const base = inicio ? new Date(`${inicio}T12:00:00`) : new Date();
  return { anio: base.getFullYear(), mes: base.getMonth() };
}

export default function CalendarioRango({ inicio, fin, onCambio }) {
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
    if (!inicio || fin) return onCambio(dia, '');
    if (dia < inicio) return onCambio(dia, '');
    return onCambio(inicio, dia);
  }

  const celdas = [];
  for (let i = 0; i < primerDia; i += 1) celdas.push(<span key={`v${i}`} />);
  for (let d = 1; d <= totalDias; d += 1) {
    const dia = iso(anio, mes, d);
    const extremo = dia === inicio || dia === fin;
    const enRango = inicio && fin && dia > inicio && dia < fin;
    celdas.push(
      <button
        type="button" key={dia} onClick={() => elegir(dia)}
        className={`calendario__dia${enRango ? ' calendario__dia--rango' : ''}${extremo ? ' calendario__dia--extremo' : ''}`}
        aria-pressed={extremo || Boolean(enRango)}
        aria-label={new Date(anio, mes, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
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
      <div className="calendario__leyenda"><span><i />Tu selección</span></div>
    </div>
  );
}
