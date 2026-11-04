// Espejo de la Agenda en el calendario CalDAV de ventas@ (el mismo donde el bot de WhatsApp agenda llamadas).
// Sin CALDAV_URL en .env queda apagado y la Agenda funciona solo con la base.
const { createDAVClient } = require('tsdav');

const PREFIJO_UID = 'havoc-control-';
const activo = () => Boolean(process.env.CALDAV_URL && process.env.CALDAV_USER && process.env.CALDAV_PASS);

let ctx;  // cliente y calendario, se resuelven una vez
async function calendario() {
  if (!ctx) {
    const client = await createDAVClient({
      serverUrl: process.env.CALDAV_URL,
      credentials: { username: process.env.CALDAV_USER, password: process.env.CALDAV_PASS },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });
    const cals = await client.fetchCalendars();
    const cal = cals.find(c => c.displayName === process.env.CALDAV_CALENDARIO) ?? cals[0];
    if (!cal) throw new Error('CalDAV: no hay calendarios');
    ctx = { client, cal };
  }
  return ctx;
}

function conTiempo(p, ms = 10000) {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('CalDAV timeout')), ms); })])
    .finally(() => clearTimeout(t));
}

const utc = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const desesc = s => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

function ics(ev) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HAVOC//control//ES', 'BEGIN:VEVENT',
    `UID:${PREFIJO_UID}${ev.id}`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(ev.inicio)}`, `DTEND:${utc(ev.fin)}`,
    `SUMMARY:${esc(ev.titulo)}`, `DESCRIPTION:${esc(ev.notas)}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}

// ponytail: TZID se asume -06:00 (México sin horario de verano) y RRULE se ignora; usar ical.js si llegan recurrentes
function fechaIcs(linea) {
  const v = linea.slice(linea.lastIndexOf(':') + 1).trim();
  const [, y, mo, d, h = '00', mi = '00', s = '00', z] = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/) ?? [];
  return y ? new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${z ? 'Z' : '-06:00'}`) : null;
}

function leerIcs(texto) {
  const todas = texto.replace(/\r\n[ \t]/g, '').split(/\r?\n/);
  const lineas = todas.slice(todas.indexOf('BEGIN:VEVENT') + 1);  // salta VTIMEZONE
  const campo = k => lineas.find(l => l.startsWith(k + ':') || l.startsWith(k + ';'));
  const inicio = fechaIcs(campo('DTSTART') ?? '');
  if (!inicio) return null;
  const finL = campo('DTEND');
  const sum = campo('SUMMARY');
  return {
    uid: (campo('UID') ?? '').slice(4).trim(),
    titulo: sum ? desesc(sum.slice(sum.indexOf(':') + 1)) : '(sin título)',
    inicio,
    fin: finL ? fechaIcs(finL) : new Date(inicio.getTime() + 3600e3),
  };
}

// Crea o actualiza el evento en el calendario y regresa su URL. Sin etag: la Agenda pisa cambios hechos en el celular.
async function guardar(ev) {
  const { client, cal } = await conTiempo(calendario());
  const iCalString = ics(ev);
  if (ev.caldav_url) {
    const r = await conTiempo(client.updateCalendarObject({ calendarObject: { url: ev.caldav_url, data: iCalString } }));
    if (r && r.ok === false) throw new Error(`CalDAV ${r.status}`);
    return ev.caldav_url;
  }
  const filename = `${PREFIJO_UID}${ev.id}.ics`;
  const r = await conTiempo(client.createCalendarObject({ calendar: cal, filename, iCalString }));
  if (r && r.ok === false) throw new Error(`CalDAV ${r.status}`);
  return new URL(filename, cal.url).href;
}

async function borrar(ev) {
  if (!ev.caldav_url) return;
  const { client } = await conTiempo(calendario());
  await conTiempo(client.deleteCalendarObject({ calendarObject: { url: ev.caldav_url } }));
}

// Eventos del calendario que no vienen de esta plataforma (ej. llamadas que agenda el bot).
async function externos(desde, hasta) {
  const { client, cal } = await conTiempo(calendario());
  const objs = await conTiempo(client.fetchCalendarObjects({
    calendar: cal, timeRange: { start: new Date(desde).toISOString(), end: new Date(hasta).toISOString() },
  }));
  return objs.map(o => leerIcs(o.data ?? '')).filter(e => e && !e.uid.startsWith(PREFIJO_UID));
}

module.exports = { activo, guardar, borrar, externos, leerIcs, ics };
