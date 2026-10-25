import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// En producción, un fallback silencioso a localhost haría que todo falle sin explicación
if (!API_URL && import.meta.env.PROD) {
  throw new Error('Falta VITE_API_URL en las variables de entorno del build');
}

export const api = axios.create({
  baseURL: API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});