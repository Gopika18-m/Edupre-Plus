import axios from 'axios';

// Use environment variable if provided, or default to relative '/api' so it works seamlessly on Vercel, Render, or localhost
let API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}
if (API_BASE_URL.startsWith('http') && !API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('edupre_plus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('edupre_plus_token');
      localStorage.removeItem('edupre_plus_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
