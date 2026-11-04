import api from './client';

export const getAgenda    = (desde, hasta) => api.get('/agenda', { params: { desde, hasta } }).then(r => r.data);
export const createEvento = (data) => api.post('/agenda', data).then(r => r.data);
export const updateEvento = (id, data) => api.put(`/agenda/${id}`, data).then(r => r.data);
export const deleteEvento = (id) => api.delete(`/agenda/${id}`).then(r => r.data);

export const TIPOS_EVENTO = { reunion: 'Reunión', entrega: 'Entrega', capacitacion: 'Capacitación' };
