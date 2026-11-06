import api from './client';

export const getRecados         = () => api.get('/recados').then(r => r.data);
export const getUsuariosRecados = () => api.get('/recados/usuarios').then(r => r.data);
export const createRecado       = (data) => api.post('/recados', data).then(r => r.data);
export const recadoHecho        = (id) => api.post(`/recados/${id}/hecho`).then(r => r.data);
