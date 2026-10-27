import api from './client';

export const getModulos    = (params) => api.get('/modulos', { params }).then(r => r.data);
export const createModulo  = (data) => api.post('/modulos', data).then(r => r.data);
export const updateModulo  = (id, data) => api.put(`/modulos/${id}`, data).then(r => r.data);

export const getLeads      = (params) => api.get('/leads', { params }).then(r => r.data);
export const getLead       = (id) => api.get(`/leads/${id}`).then(r => r.data);
export const createLead    = (data) => api.post('/leads', data).then(r => r.data);
export const updateLead    = (id, data) => api.put(`/leads/${id}`, data).then(r => r.data);
export const deleteLead    = (id) => api.delete(`/leads/${id}`).then(r => r.data);
export const createCotizacion = (leadId, data) => api.post(`/leads/${leadId}/cotizaciones`, data).then(r => r.data);
export const deleteCotizacion = (leadId, id) => api.delete(`/leads/${leadId}/cotizaciones/${id}`).then(r => r.data);

export const ETAPAS = [
  { key: 'nuevo',      label: 'Nuevo',               color: '#6B7280' },
  { key: 'reunion',    label: 'Reunión',             color: '#8B5CF6' },
  { key: 'cotizacion', label: 'Cotización enviada',  color: '#5B21B6' },
  { key: 'ganado',     label: 'Ganado',              color: '#15803D' },
  { key: 'perdido',    label: 'Perdido',             color: '#B91C1C' },
];
export const etapa = (key) => ETAPAS.find(e => e.key === key) || ETAPAS[0];

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const dinero = (v) => (v === null || v === undefined || v === '' ? '—' : mxn.format(Number(v)));

export const getMateriales   = () => api.get('/materiales').then(r => r.data);
export const createMaterial  = (formData) => api.post('/materiales', formData).then(r => r.data);
export const updateMaterial  = (id, data) => api.put(`/materiales/${id}`, data).then(r => r.data);
export const deleteMaterial  = (id) => api.delete(`/materiales/${id}`).then(r => r.data);

export const TIPOS_MATERIAL = {
  logo: 'Logo', presentacion: 'Presentación', video: 'Video', documento: 'Documento', imagen: 'Imagen', otro: 'Otro',
};
// Liga absoluta para mandar al lead: archivo subido, liga externa o archivo de /marca
export const ligaMaterial = (m) =>
  m.archivo ? `${window.location.origin}/uploads/${m.archivo}`
  : m.url.startsWith('/') ? `${window.location.origin}${m.url}` : m.url;
