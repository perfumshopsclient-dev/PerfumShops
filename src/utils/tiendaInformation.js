import { api } from './api'

export const getMasVendidas = async () => (await api.get('/ventas/mas-vendidas')).data;

export const getSeleccion = async (momento) =>
  (await api.get('/perfumes/seleccion', { params: { momento } })).data;