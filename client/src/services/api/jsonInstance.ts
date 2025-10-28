import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 60000, // 1 minute for general requests
});

export default api;
