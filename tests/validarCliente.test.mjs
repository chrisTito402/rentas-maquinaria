import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCliente } from '../compartido/validarCliente.js';

// HU-06 · Registrar datos del cliente
const correcto = {
  nombre: 'Juan Pérez López',
  telefono: '6441234567',
  correo: 'juan@correo.com',
  empresa: '',
  municipio: 'Cajeme',
  codigoPostal: '85000',
  colonia: 'Ciudad Obregón Centro',
  direccion: 'Calle 5 de Febrero 100, Centro',
};

test('con datos correctos no hay errores y la empresa es opcional', () => {
  assert.deepEqual(validarCliente(correcto), {});
});

test('el nombre lleva nombre y apellido, solo letras y máximo 150 caracteres', () => {
  assert.ok(validarCliente({ ...correcto, nombre: '' }).nombre);
  assert.ok(validarCliente({ ...correcto, nombre: 'Juan' }).nombre);
  assert.ok(validarCliente({ ...correcto, nombre: 'Juan 123' }).nombre);
  assert.ok(validarCliente({ ...correcto, nombre: 'Juan ' + 'a'.repeat(150) }).nombre);
});

test('el teléfono tiene 10 dígitos y no empieza con 0 ni 1', () => {
  assert.ok(validarCliente({ ...correcto, telefono: '644123456' }).telefono);
  assert.ok(validarCliente({ ...correcto, telefono: '0441234567' }).telefono);
  assert.ok(validarCliente({ ...correcto, telefono: '1441234567' }).telefono);
  assert.ok(validarCliente({ ...correcto, telefono: '644-123-45' }).telefono);
});

test('el correo tiene formato válido y máximo 100 caracteres', () => {
  assert.ok(validarCliente({ ...correcto, correo: '' }).correo);
  assert.ok(validarCliente({ ...correcto, correo: 'juan@correo' }).correo);
  assert.ok(validarCliente({ ...correcto, correo: 'a'.repeat(95) + '@correo.com' }).correo);
});

test('el municipio debe ser de la lista', () => {
  assert.ok(validarCliente({ ...correcto, municipio: '' }).municipio);
  assert.ok(validarCliente({ ...correcto, municipio: 'Tijuana' }).municipio);
});

test('la dirección es obligatoria y de máximo 200 caracteres', () => {
  assert.ok(validarCliente({ ...correcto, direccion: '   ' }).direccion);
  assert.ok(validarCliente({ ...correcto, direccion: 'a'.repeat(201) }).direccion);
});

test('los errores se regresan por campo', () => {
  const errores = validarCliente({ ...correcto, telefono: '123', correo: 'mal' });
  assert.deepEqual(Object.keys(errores).sort(), ['correo', 'telefono']);
});

// A4 · código postal y colonia
test('el código postal debe tener 5 dígitos', () => {
  assert.ok(validarCliente({ ...correcto, codigoPostal: '' }).codigoPostal);
  assert.ok(validarCliente({ ...correcto, codigoPostal: '8500' }).codigoPostal);
  assert.ok(validarCliente({ ...correcto, codigoPostal: '85a00' }).codigoPostal);
  assert.equal(validarCliente({ ...correcto, codigoPostal: '85000' }).codigoPostal, undefined);
});

test('la colonia es obligatoria y de máximo 100 caracteres', () => {
  assert.ok(validarCliente({ ...correcto, colonia: '  ' }).colonia);
  assert.ok(validarCliente({ ...correcto, colonia: 'a'.repeat(101) }).colonia);
});
