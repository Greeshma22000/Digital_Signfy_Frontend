import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
console.log('✅ axios baseURL:', api.defaults.baseURL);

 export const postSignature = async ({ documentId, x, y, page, name, font, fontSize }) => {
  const token = localStorage.getItem('token');
  const res = await api.post('/signatures', { documentId, x, y, page, name, font, fontSize }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

/* 
export const postSignature = async ({ documentId, x, y, page }) => {
  const res = await api.post('/signatures', { documentId, x, y, page });
  return res.data;
};

*/