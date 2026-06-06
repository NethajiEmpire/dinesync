import api from './api';

export const getProducts = () => api.get('/menu');
export const getProductById = (id) => api.get(`/menu/${id}`);