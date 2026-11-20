import test from 'node:test';
import assert from 'node:assert/strict';
import { imagenEquipo, tieneIlustracion } from '../frontend/src/logica/imagenEquipo.js';

test('HU-01b · toma la URL persistida del equipo, no una ilustración según su nombre', () => {
  const equipo = { nombre: 'Montacargas Toyota 8FG25', tipo: 'Montacargas', foto: 'https://ejemplo.org/maquina.jpg' };
  assert.equal(imagenEquipo(equipo), equipo.foto);
  assert.equal(tieneIlustracion(equipo), true);
  assert.equal(imagenEquipo({ ...equipo, foto: 'https://ejemplo.org/otra.jpg' }), 'https://ejemplo.org/otra.jpg');
});

test('HU-01b · un equipo sin foto usa el ícono genérico', () => {
  assert.equal(tieneIlustracion({ nombre: 'Excavadora', foto: '' }), false);
  assert.equal(imagenEquipo({ nombre: 'Excavadora', foto: '' }), '/img/iconos/logo.svg');
});
