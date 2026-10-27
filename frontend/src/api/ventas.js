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
