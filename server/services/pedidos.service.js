import { Op, fn, col } from 'sequelize';
import { sequelize } from '../db/database.js'; // <- ajusta
import { Pedido } from '../models/Pedido.js';
import { PedidoItem } from '../models/PedidoItem.js';
import { User } from '../models/User.js';
import { Perfume } from '../models/Perfume.js';


// ---- Reglas (ajústalas a tu negocio) ----
export const MINUTOS_RESERVA = 30;
const MAX_PENDIENTES_POR_CLIENTE = 2;
const MAX_UNIDADES_POR_PERFUME = 5;
const MAX_PERFUMES_DISTINTOS = 10;
const ESTADOS = ['pendiente', 'finalizado', 'rechazado', 'expirado'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const esUUID = (v) => typeof v === 'string' && UUID_RE.test(v);

// ---------------------------------------------------------------
// CREAR PEDIDO: valida, bloquea filas, descuenta stock y reserva
// ---------------------------------------------------------------
export async function crearPedido(idCliente, itemsEntrada) {
  if (!Array.isArray(itemsEntrada) || itemsEntrada.length === 0) {
    throw new AppError(400, 'El carrito está vacío');
  }

  // Fusiona duplicados y valida cada línea (nunca confíes en el frontend)
  const mapa = new Map();
  for (const it of itemsEntrada) {
    const cantidad = Number(it?.cantidad);
    if (!esUUID(it?.id_perfume) || !Number.isInteger(cantidad) || cantidad < 1) {
      throw new AppError(400, 'Hay un producto inválido en el carrito');
    }
    mapa.set(it.id_perfume, (mapa.get(it.id_perfume) ?? 0) + cantidad);
  }
  if (mapa.size > MAX_PERFUMES_DISTINTOS) {
    throw new AppError(400, `Máximo ${MAX_PERFUMES_DISTINTOS} perfumes distintos por pedido`);
  }
  for (const cantidad of mapa.values()) {
    if (cantidad > MAX_UNIDADES_POR_PERFUME) {
      throw new AppError(400, `Máximo ${MAX_UNIDADES_POR_PERFUME} unidades por perfume`);
    }
  }
  // Orden fijo de bloqueo → evita deadlocks entre pedidos simultáneos
  const items = [...mapa].map(([id_perfume, cantidad]) => ({ id_perfume, cantidad })).sort((a, b) => a.id_perfume.localeCompare(b.id_perfume));

  await expirarVencidos(); // libera reservas caducadas antes de mirar el stock

  return sequelize.transaction(async (t) => {
    // Bloquea al cliente: sus pedidos simultáneos se ejecutan uno tras otro
    const cliente = await User.findByPk(idCliente, { attributes: ['id'], lock: t.LOCK.UPDATE, transaction: t });
    if (!cliente) throw new AppError(401, 'Sesión inválida');

    const pendientes = await Pedido.count({ where: { id_cliente: idCliente, estado: 'pendiente' }, transaction: t });
    if (pendientes >= MAX_PENDIENTES_POR_CLIENTE) {
      throw new AppError(429, 'Ya tienes pedidos pendientes. Espera a que se procesen antes de crear otro.');
    }

    let total = 0;
    const filas = [];
    for (const { id_perfume, cantidad } of items) {
      const perfume = await Perfume.findByPk(id_perfume, { lock: t.LOCK.UPDATE, transaction: t });
      if (!perfume) throw new AppError(404, 'Uno de los perfumes ya no existe');
      if (perfume.cantidad < cantidad) {
        throw new AppError(409, `Stock insuficiente de ${perfume.nombre} (quedan ${perfume.cantidad})`);
      }
      await perfume.update({ cantidad: perfume.cantidad - cantidad }, { transaction: t });

      const precio = Number(perfume.precio_unitario);
      total += precio * cantidad;
      filas.push({ id_perfume, cantidad, precio_unitario: precio, nombre: perfume.nombre, ml: perfume.ml });
    }

    const pedido = await Pedido.create(
      {
        id_cliente: idCliente,
        total: Math.round(total * 100) / 100,
        expira_en: new Date(Date.now() + MINUTOS_RESERVA * 60_000),
      },
      { transaction: t }
    );
    await PedidoItem.bulkCreate(
      filas.map(({ id_perfume, cantidad, precio_unitario }) => ({ id_pedido: pedido.id, id_perfume, cantidad, precio_unitario })),
      { transaction: t }
    );
    return { pedido, filas };
  });
}

// ---------------------------------------------------------------
// RESOLVER: finalizado | rechazado | expirado (idempotente)
// ---------------------------------------------------------------
export async function resolverPedido(idPedido, nuevoEstado) {
  if (!esUUID(idPedido)) throw new AppError(404, 'Pedido no encontrado');

  return sequelize.transaction(async (t) => {
    const pedido = await Pedido.findByPk(idPedido, { lock: t.LOCK.UPDATE, transaction: t });
    if (!pedido) throw new AppError(404, 'Pedido no encontrado');
    // Si dos acciones llegan a la vez, la segunda ve el estado ya cambiado y no repone stock dos veces
    if (pedido.estado !== 'pendiente') throw new AppError(409, `Este pedido ya está ${pedido.estado}`);

    if (nuevoEstado !== 'finalizado') {
      const items = await PedidoItem.findAll({ where: { id_pedido: idPedido }, order: [['id_perfume', 'ASC']], transaction: t });
      for (const it of items) {
        await Perfume.increment('cantidad', { by: it.cantidad, where: { id: it.id_perfume }, transaction: t });
      }
    }
    await pedido.update({ estado: nuevoEstado }, { transaction: t });
    return pedido;
  });
}

// Marca como expirados los pendientes vencidos y devuelve su stock
export async function expirarVencidos() {
  const vencidos = await Pedido.findAll({
    where: { estado: 'pendiente', expira_en: { [Op.lt]: new Date() } },
    attributes: ['id'],
  });
  for (const { id } of vencidos) {
    try {
      await resolverPedido(id, 'expirado');
    } catch (e) {
      if (!(e instanceof AppError)) throw e; // el admin se adelantó: no pasa nada
    }
  }
  return vencidos.length;
}

// ---------------------------------------------------------------
// LISTAR (dashboard): ?estado=pendiente (defecto) | todos | finalizado | rechazado | expirado
// ---------------------------------------------------------------
export async function listarPedidos(filtro = 'pendiente') {
  await expirarVencidos();

  const where = ESTADOS.includes(filtro) ? { estado: filtro } : filtro === 'todos' ? {} : { estado: 'pendiente' };
  const soloPendientes = where.estado === 'pendiente';

  const pedidos = await Pedido.findAll({
    where,
    include: [
      { model: User, as: 'cliente', attributes: ['id', 'nombre', 'apellido', 'email'] },
      { model: PedidoItem, as: 'items', include: [{ model: Perfume, as: 'perfume', attributes: ['id', 'nombre', 'ml'] }] },
    ],
    order: soloPendientes ? [['expira_en', 'ASC']] : [['fecha', 'DESC']],
  });

  // Historial de rechazos/expiraciones por cliente (ayuda a detectar sabotaje)
  const ids = [...new Set(pedidos.map((p) => p.id_cliente))];
  const filas = ids.length
    ? await Pedido.findAll({
        attributes: ['id_cliente', 'estado', [fn('COUNT', col('id')), 'n']],
        where: { id_cliente: { [Op.in]: ids }, estado: { [Op.in]: ['rechazado', 'expirado'] } },
        group: ['id_cliente', 'estado'],
        raw: true,
      })
    : [];
  const hist = {};
  for (const f of filas) (hist[f.id_cliente] ??= {})[f.estado] = Number(f.n);

  return pedidos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    estado: p.estado,
    fecha: p.fecha,
    expira_en: p.expira_en,
    total: Number(p.total),
    cliente: {
      nombre: p.cliente.nombre,
      apellido: p.cliente.apellido,
      email: p.cliente.email,
      rechazados: hist[p.id_cliente]?.rechazado ?? 0,
      expirados: hist[p.id_cliente]?.expirado ?? 0,
    },
    items: p.items.map((i) => ({
      perfume: i.perfume.nombre,
      ml: i.perfume.ml,
      cantidad: i.cantidad,
      precio_unitario: Number(i.precio_unitario),
      subtotal: Math.round(Number(i.precio_unitario) * i.cantidad * 100) / 100,
    })),
  }));
}
