// node --test frontend/src/lib/diagnostico.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { temperatura, faltantes, demosSugeridas } from './diagnostico.js';

test('temperatura', () => {
  assert.equal(temperatura({ decide: 'el', presupuesto: '20a50', cuando: '1a3' }).label, 'Caliente');
  assert.equal(temperatura({ decide: 'socio', presupuesto: 'mas50', cuando: 'ya' }).label, 'Tibio');
  assert.equal(temperatura({ decide: 'otro', presupuesto: 'nosabe', cuando: 'explora' }).label, 'Frío');
  assert.equal(temperatura({ decide: 'el' }), null);
});

test('faltantes y demos', () => {
  assert.equal(faltantes({}).length, 10);
  const completo = { rubro: 'Agro', empleados: 5, base: ['dueno'], dolor_palabras: 'x', costo_mes: 1000,
                     una_cosa: 'x', riesgos: ['ninguno'], decide: 'el', presupuesto: 'nosabe', cuando: 'ya' };
  assert.deepEqual(faltantes(completo), []);
  assert.deepEqual(demosSugeridas({ dolores: ['personal', 'asistencia'] }), ['Checador biométrico', 'Recursos Humanos']);
});
