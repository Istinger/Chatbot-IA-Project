const test = require('node:test');
const assert = require('node:assert/strict');
const { debeMostrarOfertas } = require('./chat.intencion');

test('muestra ofertas cuando la peticion realmente busca vacantes', () => {
  assert.equal(debeMostrarOfertas('Busco trabajo remoto de backend'), true);
  assert.equal(debeMostrarOfertas('Muestrame ofertas junior de Python'), true);
  assert.equal(debeMostrarOfertas('backend remoto junior'), true);
});

test('oculta ofertas usadas solo como contexto de otra ayuda', () => {
  assert.equal(debeMostrarOfertas('Simula una entrevista tecnica junior'), false);
  assert.equal(debeMostrarOfertas('Simula una entrevista para esta oferta de AWS'), false);
  assert.equal(debeMostrarOfertas('Que preguntas tecnicas hacen para backend?'), false);
  assert.equal(debeMostrarOfertas('Que certificaciones me convienen para cloud?'), false);
  assert.equal(debeMostrarOfertas('Ayudame a mejorar mi CV de desarrollador'), false);
});
