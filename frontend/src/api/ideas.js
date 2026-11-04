import api from './client';

export const getIdeas        = (params) => api.get('/ideas', { params }).then(r => r.data);
export const getIdea         = (id) => api.get(`/ideas/${id}`).then(r => r.data);
export const createIdea      = (data) => api.post('/ideas', data).then(r => r.data);
export const updateIdea      = (id, data) => api.put(`/ideas/${id}`, data).then(r => r.data);
export const deleteIdea      = (id) => api.delete(`/ideas/${id}`).then(r => r.data);
export const addSolicitud    = (id, data) => api.post(`/ideas/${id}/solicitudes`, data).then(r => r.data);
export const deleteSolicitud = (id, sid) => api.delete(`/ideas/${id}/solicitudes/${sid}`).then(r => r.data);

export const ESTADOS_IDEA = [
  { key: 'nueva',      label: 'Nueva',          color: '#A78BFA' },
  { key: 'evaluacion', label: 'En evaluación',  color: '#38BDF8' },
  { key: 'empaquetar', label: 'Empaquetar',     color: '#FBBF24' },
  { key: 'catalogo',   label: 'En catálogo',    color: '#34D399' },
  { key: 'descartada', label: 'Descartada',     color: '#71717A' },
];
export const estadoIdea = (k) => ESTADOS_IDEA.find(e => e.key === k) || ESTADOS_IDEA[0];
