import { crearPedido } from "./pedidosInformation";

export async function enviarPedido(items) {
  return crearPedido(items.map(({ id, cantidad }) => ({ id_perfume: id, cantidad })));
}
