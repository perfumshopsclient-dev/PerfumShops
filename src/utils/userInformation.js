import { api } from "./api";

export const registrarUsuario = async (data) => {
  
  const response = await api.post('/users/register', data)

  return response.data;
}

export const logeoUsuario = async (email, password) => {
  const response = await api.post('/users/login', {
    email,
    password
  });

  return response.data;
}

export const cerrarSesion = () => api.post('/users/logout')

export const obtenerSesion = async () => {
  try {
    const { data } = await api.get('/users/me');
    return data;
  } catch {
    return null;
  }
};

export const verificarEmail = async (token) => {
  const { data } = await api.post('/users/verify-email', { token });
  return data;
};

export const reenviarVerificacion = async (email) => {
  const { data } = await api.post('/users/resend-verification', { email });
  return data;
};