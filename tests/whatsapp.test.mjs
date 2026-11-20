import test from 'node:test';
import assert from 'node:assert/strict';
import { enlaceWhatsApp } from '../frontend/src/logica/enlaceWhatsApp.js';

test('HU-07 · abre WhatsApp con prefijo de México y mensaje de folio y total', () => {
  const url = new URL(enlaceWhatsApp({
    folio: 'COT-0048', total: 9512, cliente: { nombre: 'Ana Valenzuela', telefono: '6441234567' },
  }));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/526441234567');
  assert.match(url.searchParams.get('text'), /Ana Valenzuela/);
  assert.match(url.searchParams.get('text'), /COT-0048/);
  assert.match(url.searchParams.get('text'), /9,512/);
});

test('HU-07 · no ofrece WhatsApp si el teléfono del cliente es inválido', () => {
  assert.equal(enlaceWhatsApp({ cliente: { telefono: '0123' } }), null);
});
