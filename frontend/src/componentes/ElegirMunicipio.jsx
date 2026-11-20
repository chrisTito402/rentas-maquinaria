// Dueño: Chris · HU-13b Costo de envío por zona (KAN-53)
// Diálogo «¿A dónde llevamos el equipo?»: frame «2d · Elegir municipio al agregar (diálogo)» y, en celular,
// hoja inferior del frame «M4 · Elegir municipio (móvil, hoja inferior)».
// Uso: <ElegirMunicipio abierto valor={municipio} accion="Agregar a mi cotización"
//                       onElegir={(m) => ...} onCerrar={() => ...} />
import { useEffect, useRef, useState } from 'react';
import { MUNICIPIOS } from '@compartido/constantes.js';
import { calcularEnvio } from '@compartido/costos.js';
import { dinero } from '@compartido/formato.js';

const tarifa = (municipio) => {
  const envio = calcularEnvio(municipio, 1);
  return envio.fueraDeZona ? 'Fuera de zona' : `${dinero(envio.tarifa).replace('.00', '')} / u.`;
};

export default function ElegirMunicipio({ abierto, valor = '', accion = 'Guardar', onElegir, onCerrar }) {
  const [elegido, setElegido] = useState(valor);
  const dialogo = useRef(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  // Al abrir: parte del municipio actual, enfoca la lista y cierra con Esc.
  useEffect(() => {
    if (!abierto) return undefined;
    setElegido(valor);
    const cerrarConEsc = (e) => { if (e.key === 'Escape') cerrar.current(); };
    document.addEventListener('keydown', cerrarConEsc);
    dialogo.current?.querySelector('input:checked, input')?.focus();
    return () => document.removeEventListener('keydown', cerrarConEsc);
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!abierto) return null;
  const fuera = elegido && calcularEnvio(elegido, 1);

  return (
    <div className="dialogo-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <form
        ref={dialogo} className="dialogo" role="dialog" aria-modal="true" aria-labelledby="titulo-municipio"
        onSubmit={(e) => { e.preventDefault(); if (elegido && !fuera.fueraDeZona) onElegir(elegido); }}
      >
        <span className="dialogo__asa" aria-hidden="true" />
        <h2 id="titulo-municipio">¿A dónde llevamos el equipo?</h2>
        <p>Lo necesitamos para calcular el envío de tu cotización. Puedes cambiarlo después.</p>
        <fieldset className="municipios">
          <legend>Municipio de entrega</legend>
          {MUNICIPIOS.map((m) => {
            const sinServicio = calcularEnvio(m, 1).fueraDeZona;
            return (
              <label key={m} className={`municipios__opcion${elegido === m ? ' municipios__opcion--elegida' : ''}${sinServicio ? ' municipios__opcion--fuera' : ''}`}>
                <input type="radio" name="municipio" value={m} checked={elegido === m} onChange={() => setElegido(m)} />
                <span>{m}</span>
                <small>{elegido === m && !sinServicio ? '✓ ' : ''}{tarifa(m)}</small>
              </label>
            );
          })}
        </fieldset>
        {fuera?.fueraDeZona && <p className="f-alerta f-alerta--error" role="alert">{fuera.motivo}</p>}
        <div className="dialogo__acciones">
          <button type="button" className="f-btn f-btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="f-btn f-btn--primario" disabled={!elegido || fuera?.fueraDeZona}>{accion}</button>
        </div>
      </form>
    </div>
  );
}
