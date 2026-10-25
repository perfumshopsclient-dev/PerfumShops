import { api } from "./api";

export const getPerfumes = async () => {
  const response = await api.get('/perfumes')

  return response.data;
}

export const getPerfumeById = async (perfumeId) => {
  const response = await api.get(`/perfumes/${perfumeId}`);
  return response.data;
}

export const getAcordes = async () => {
  const response = await api.get('/acordes')

  return response.data;
}

export const updatePerfume = async (perfumeId, formData) => {
  const response = await api.put(`/perfumes/${perfumeId}`, formData);
  return response.data;
};

export const deletePerfume = async (perfumeId) => {
  const response = await api.delete(`/perfumes/${perfumeId}`);
  return response.data;
}

export const createPerfume = async (formData) => {
  const response = await api.post('/perfumes', formData);
  return response.data;
}

export const mensajeError = (e) =>
  e?.response?.data?.message ?? e?.message ?? "Ocurrió un error inesperado.";

export async function listarAcordes() {
  const { data } = await api.get("/acordes");
  return data;
}
