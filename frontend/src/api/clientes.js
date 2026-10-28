import api from './client';

export const getClientes     = () => api.get('/clientes').then(r => r.data);
export const getCliente      = (id) => api.get(`/clientes/${id}`).then(r => r.data);
export const createCliente   = (data) => api.post('/clientes', data).then(r => r.data);
export const updateCliente   = (id, data) => api.put(`/clientes/${id}`, data).then(r => r.data);
export const deleteCliente   = (id) => api.delete(`/clientes/${id}`).then(r => r.data);
export const clienteDesdeLead = (leadId) => api.post(`/clientes/desde-lead/${leadId}`).then(r => r.data);

export const createSistema = (clienteId, data) => api.post(`/clientes/${clienteId}/sistemas`, data).then(r => r.data);
export const updateSistema = (clienteId, id, data) => api.put(`/clientes/${clienteId}/sistemas/${id}`, data).then(r => r.data);
export const deleteSistema = (clienteId, id) => api.delete(`/clientes/${clienteId}/sistemas/${id}`).then(r => r.data);

export const getCobros    = (estado) => api.get('/finanzas/cobros', { params: { estado } }).then(r => r.data);
export const createCobro  = (data) => api.post('/finanzas/cobros', data).then(r => r.data);
export const updateCobro  = (id, data) => api.put(`/finanzas/cobros/${id}`, data).then(r => r.data);
export const deleteCobro  = (id) => api.delete(`/finanzas/cobros/${id}`).then(r => r.data);

export const getGastos    = (mes) => api.get('/finanzas/gastos', { params: { mes } }).then(r => r.data);
export const createGasto  = (data) => api.post('/finanzas/gastos', data).then(r => r.data);
export const updateGasto  = (id, data) => api.put(`/finanzas/gastos/${id}`, data).then(r => r.data);
export const deleteGasto  = (id) => api.delete(`/finanzas/gastos/${id}`).then(r => r.data);

export const getReporte   = (anio) => api.get('/finanzas/reporte', { params: { anio } }).then(r => r.data);

export const TIPOS_COBRO = { desarrollo: 'Desarrollo', mensualidad: 'Mensualidad', otro: 'Otro' };
export const CATEGORIAS_GASTO = {
  servidor: 'Servidor', dominio: 'Dominio', licencia: 'Licencia', cuenta_dev: 'Cuenta de desarrollador', otro: 'Otro',
};

// Las columnas DATE llegan como timestamp; se usa solo la parte de fecha para no correrse un día
export const dia = (v) => (v ? String(v).slice(0, 10) : '');
export const fechaCorta = (v) => (v ? dia(v).split('-').reverse().join('/') : '—');
export const hoy = () => new Date().toLocaleDateString('en-CA');  // YYYY-MM-DD en hora local
