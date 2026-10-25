import { api } from "./api";

// ---- Cliente (carrito) ----
// items: [{ id_perfume, cantidad }]  →  { id, codigo, total, expira_en, whatsapp_url }
export const crearPedido = async (items) => {
  const { data } = await api.post('/pedidos', { items });
  return data;
};

// ---- Admin (dashboard) ----
export const getPedidos = async (estado = 'pendiente') => {
  const { data } = await api.get('/pedidos', { params: { estado } });
  return data;
};

export const aceptarPedido = async (id) => (await api.patch(`/pedidos/${id}/aceptar`)).data;
export const rechazarPedido = async (id) => (await api.patch(`/pedidos/${id}/rechazar`)).data;
