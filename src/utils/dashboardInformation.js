import { api } from "./api";

export const getMostSaledPerfume = async () => {
  const response = await api.get('/ventas/perfumes')
  return response.data;
}

export const getResumen = async () => {
  console.log('Se llamó a getResumen')
  const response = await api.get('/ventas/resumen');
  console.log(response.data)
  return response.data
};
export const getStock = async () => (await api.get('/ventas/stock')).data;