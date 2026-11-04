// npm test — ida y vuelta del .ics y lectura de eventos del bot (TZ local -06:00)
const test = require('node:test');
const assert = require('node:assert');
const { ics, leerIcs } = require('../src/utils/caldav');

test('ics propio se lee igual', () => {
  const ev = { id: 7, titulo: 'Reunión, ATA; demo', notas: 'línea 1\nlínea 2', inicio: '2026-11-05T16:00:00Z', fin: '2026-11-05T17:00:00Z' };
  const r = leerIcs(ics(ev));
  assert.equal(r.uid, 'havoc-control-7');
  assert.equal(r.titulo, 'Reunión, ATA; demo');
  assert.equal(r.inicio.toISOString(), '2026-11-05T16:00:00.000Z');
  assert.equal(r.fin.toISOString(), '2026-11-05T17:00:00.000Z');
});

test('evento con TZID y sin DTEND (como los del celular)', () => {
  const r = leerIcs(['BEGIN:VCALENDAR', 'BEGIN:VTIMEZONE', 'DTSTART:19700101T000000', 'END:VTIMEZONE', 'BEGIN:VEVENT',
    'UID:abc', 'DTSTART;TZID=America/Mexico_City:20261105T100000', 'SUMMARY:Llamada con lead', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
  assert.equal(r.inicio.toISOString(), '2026-11-05T16:00:00.000Z');
  assert.equal(r.fin.toISOString(), '2026-11-05T17:00:00.000Z');
  assert.equal(r.titulo, 'Llamada con lead');
});
