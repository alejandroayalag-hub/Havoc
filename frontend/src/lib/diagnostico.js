// Cuestionario de diagnóstico que Lili aplica a un lead. Cambiar preguntas = editar este archivo (no toca la BD).

export const ORIGENES = ['Anuncio Facebook', 'Anuncio Instagram', 'Anuncio Google', 'Recomendación', 'WhatsApp directo', 'Sitio web', 'Otro'];
export const RUBROS = ['Comercio', 'Servicios', 'Transporte / logística', 'Salud', 'Educación', 'Agro', 'Seguridad', 'Industria', 'Despacho / oficina', 'Otro'];

export const BASE = [
  ['rh', 'Departamento de RH'], ['contador_interno', 'Contador interno'], ['contador_externo', 'Contador externo'],
  ['sistemas', 'Alguien de sistemas'], ['dueno', 'El dueño hace casi todo'],
];

// Cada dolor sugiere módulos del catálogo (por nombre exacto en la tabla modulos)
export const DOLORES = [
  { key: 'asistencia', label: 'Asistencia / nómina',              modulos: ['Checador biométrico', 'Recursos Humanos'] },
  { key: 'personal',   label: 'Expedientes y contratos de personal', modulos: ['Recursos Humanos'] },
  { key: 'campo',      label: 'Personal en campo / rutas',        modulos: ['Rondines', 'Servicio en campo HVAC'] },
  { key: 'inventario', label: 'Inventario / ventas de mostrador', modulos: ['Punto de venta'] },
  { key: 'cobranza',   label: 'Cobranza / finanzas',              modulos: [] },
  { key: 'citas',      label: 'Citas / pacientes',                modulos: ['Clínica'] },
  { key: 'alumnos',    label: 'Alumnos / colegiaturas',           modulos: ['Control escolar'] },
  { key: 'vehiculos',  label: 'Vehículos / servicios a unidades', modulos: ['Bitácora automotriz'] },
  { key: 'documentos', label: 'Papeles legales / documentos',     modulos: ['Expediente MX'] },
  { key: 'internet',   label: 'No lo encuentran en internet',     modulos: ['Landing / sitio web'] },
];

export const RIESGOS = [
  ['demanda', 'Demanda laboral'], ['inspeccion', 'Inspección IMSS / STPS'], ['contratos', 'Problema con contratos'], ['ninguno', 'Ninguno'],
];
export const HERRAMIENTAS = [['excel', 'Excel'], ['whatsapp', 'WhatsApp'], ['papel', 'Papel'], ['sistema', 'Otro sistema']];
export const INTERNET = [['si', 'Sí'], ['falla', 'Falla'], ['no', 'No']];
export const CELULARES = [['todos', 'Todos'], ['algunos', 'Algunos'], ['ninguno', 'Ninguno']];
export const DECIDE = [['el', 'Él / ella misma'], ['socio', 'Con socio(s)'], ['otro', 'Otra persona']];
export const PRESUPUESTO = [['menos20', 'Menos de $20k'], ['20a50', '$20k – $50k'], ['mas50', 'Más de $50k'], ['nosabe', 'No sabe']];
export const CUANDO = [['ya', 'Ya'], ['1a3', '1 – 3 meses'], ['explora', 'Solo explora']];

export const etiqueta = (lista, k) => lista.find(([key]) => key === k)?.[1] || '';
export const etiquetas = (lista, ks = []) => ks.map(k => etiqueta(lista, k)).filter(Boolean).join(', ');

const lleno = v => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');

// Bloques ⭐ que deben estar para "Enviar a Alejandro". Devuelve los que faltan.
export function faltantes(r) {
  const f = [];
  if (!lleno(r.rubro)) f.push('Rubro');
  if (!lleno(r.empleados)) f.push('Número de empleados');
  if (!lleno(r.base)) f.push('Base administrativa');
  if (!lleno(r.dolores) && !lleno(r.dolor_palabras)) f.push('Dolor real');
  if (!lleno(r.horas_semana) && !lleno(r.costo_mes) && !lleno(r.perdidas)) f.push('Cuánto le cuesta');
  if (!lleno(r.una_cosa)) f.push('Una sola cosa');
  if (!lleno(r.riesgos)) f.push('Riesgo laboral / legal');
  if (!lleno(r.decide)) f.push('Quién decide');
  if (!lleno(r.presupuesto)) f.push('Presupuesto');
  if (!lleno(r.cuando)) f.push('Para cuándo');
  return f;
}

// Caliente = decide él + presupuesto ≥ $20k + lo quiere en ≤ 3 meses. Un punto por cada uno.
export function temperatura(r) {
  if (!r.decide || !r.presupuesto || !r.cuando) return null;
  const pts = (r.decide === 'el') + ['20a50', 'mas50'].includes(r.presupuesto) + ['ya', '1a3'].includes(r.cuando);
  return pts === 3 ? { label: 'Caliente', color: '#DC2626' } : pts === 2 ? { label: 'Tibio', color: '#F59E0B' } : { label: 'Frío', color: '#38BDF8' };
}

// Módulos sugeridos sin repetir, en el orden de los dolores marcados
export function demosSugeridas(r) {
  const marcados = new Set(r.dolores || []);
  return [...new Set(DOLORES.filter(d => marcados.has(d.key)).flatMap(d => d.modulos))];
}
