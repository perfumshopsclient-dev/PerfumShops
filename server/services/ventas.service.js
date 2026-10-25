import { Acorde } from '../models/Acorde.js';
import { Op, col, fn, literal } from 'sequelize';
import { DateTime } from 'luxon';
import { Perfume } from '../models/Perfume.js';
import { Pedido } from '../models/Pedido.js';
import { PedidoItem } from '../models/PedidoItem.js';

// Zona horaria del negocio: decide qué es "lunes" y a qué día pertenece cada pedido.
const TZ = process.env.APP_TZ ?? 'America/Bogota';
// Columna de fecha de Pedido. Con `underscored: true` sería 'Pedido.created_at'.
const FECHA_PEDIDO = 'Pedido.fecha';
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const UNIDADES = col('PedidoItem.cantidad');
const INGRESO = literal('"PedidoItem"."cantidad" * "perfume"."precio_unitario"');

const dinero = (v) => Math.round(Number(v ?? 0) * 100) / 100;

// JOIN interno con perfume y con pedidos finalizados (lo mismo que tu SQL original)
const joinsFinalizados = ({ perfume = {}, pedidoWhere = {} } = {}) => [
  { model: Perfume, as: 'perfume', attributes: [], required: true, ...perfume },
  {
    model: Pedido,
    attributes: [],
    required: true,
    where: { estado: 'finalizado', ...pedidoWhere },
  },
];

/**
 * Unidades e ingresos por perfume (solo pedidos 'finalizado'), de mayor a menor.
 *  - sin parámetros              → todos los perfumes que se han vendido
 *  - { limite: 5 }               → los 5 más vendidos ({ limite: 1 } → el más vendido)
 *  - { perfumeId }               → un solo perfume
 *  - { incluirEliminados: true } → cuenta también perfumes borrados (soft delete)
 */
export const ventasPorPerfume = async ({ limite, perfumeId, incluirEliminados = false } = {}) => {
  const filas = await PedidoItem.findAll({
    attributes: [
      [col('perfume.id'), 'id'],
      [col('perfume.nombre'), 'nombre'],
      [col('perfume.genre'), 'genero'],
      [col('perfume.precio_unitario'), 'precio_unitario'],
      [fn('SUM', UNIDADES), 'total_vendido'],
      [fn('SUM', INGRESO), 'ingresos'],
    ],
    include: joinsFinalizados({
      perfume: {
        paranoid: !incluirEliminados, // Perfume es paranoid: por defecto un perfume borrado NO cuenta
        ...(perfumeId && { where: { id: perfumeId } }),
      },
    }),
    group: ['perfume.id', 'perfume.nombre', 'perfume.genre', 'perfume.precio_unitario'],
    order: [
      [literal('total_vendido'), 'DESC'],
      [col('perfume.nombre'), 'ASC'], // desempate estable
    ],
    limit: limite, // undefined = sin LIMIT
    subQuery: false,
    raw: true,
  });

  // En Postgres SUM() llega como string: se convierte a número
  return filas.map((f) => ({
    ...f,
    total_vendido: Number(f.total_vendido),
    ingresos: dinero(f.ingresos),
  }));
};

// --- Series por periodo (día o semana), agrupadas en la zona horaria del negocio ---

// date_trunc('week', ...) en Postgres devuelve el LUNES de esa semana (semana ISO);
// to_char lo convierte a texto 'YYYY-MM-DD' para evitar líos de zona horaria con pg.
const periodo = (unidad) =>
  fn('to_char', fn('date_trunc', unidad, fn('timezone', TZ, col(FECHA_PEDIDO))), 'YYYY-MM-DD');

const serie = async ({ unidad, desde, hasta }) => {
  const filas = await PedidoItem.findAll({
    attributes: [
      [periodo(unidad), 'periodo'],
      [fn('SUM', UNIDADES), 'ventas'],
      [fn('SUM', INGRESO), 'ingresos'],
    ],
    include: joinsFinalizados({
      pedidoWhere: { fecha: { [Op.gte]: desde.toJSDate(), [Op.lt]: hasta.toJSDate() } },
    }),
    group: [literal('periodo')],
    order: [[literal('periodo'), 'ASC']],
    subQuery: false,
    raw: true,
  });

  return new Map(
    filas.map((f) => [f.periodo, { ventas: Number(f.ventas), ingresos: dinero(f.ingresos) }]),
  );
};

const SIN_VENTAS = { ventas: 0, ingresos: 0 };

const lunesActual = () => DateTime.now().setZone(TZ).startOf('week');

export const ventasSemanales = async ({ semanas = 4 } = {}) => {
  const lunes = lunesActual();
  const inicio = lunes.minus({ weeks: semanas - 1 });
  const datos = await serie({ unidad: 'week', desde: inicio, hasta: lunes.plus({ weeks: 1 }) });

  return Array.from({ length: semanas }, (_, i) => {
    const desde = inicio.plus({ weeks: i }).toISODate();
    return { semana: `Sem ${i + 1}`, desde, ...(datos.get(desde) ?? SIN_VENTAS) };
  });
};

export const ventasDiarias = async () => {
  const lunes = lunesActual();
  const datos = await serie({ unidad: 'day', desde: lunes, hasta: lunes.plus({ weeks: 1 }) });

  return DIAS.map((dia, i) => {
    const fecha = lunes.plus({ days: i }).toISODate();
    return { dia, fecha, ...(datos.get(fecha) ?? SIN_VENTAS) };
  });
};

export const totalesHistoricos = async () => {
  const [fila] = await PedidoItem.findAll({
    attributes: [
      [fn('COALESCE', fn('SUM', UNIDADES), 0), 'unidades'],
      [fn('COALESCE', fn('SUM', INGRESO), 0), 'ingresos'],
    ],
    include: joinsFinalizados(),
    raw: true,
  });
  console.log('Datos de ventas históricos: ',{ unidades: Number(fila.unidades), ingresos: dinero(fila.ingresos) })
  return { unidades: Number(fila.unidades), ingresos: dinero(fila.ingresos) };
};

export const resumenDashboard = async () => {
  const [totales, semanas, dias] = await Promise.all([
    totalesHistoricos(),
    ventasSemanales({ semanas: 4 }),
    ventasDiarias(),
  ]);
  return { totales, semanas, dias };
};

export const stockPerfumes = () =>
  Perfume.findAll({
    attributes: ['id', 'nombre', 'cantidad', 'stock_minimo'],
    order: [[literal('cantidad - stock_minimo'), 'ASC'], ['nombre', 'ASC']],
    raw: true,
  });


const TTL_MS = 5 * 60 * 1000;
let memo = { hasta: 0, datos: [] };

export const masVendidasPublico = async () => {
  // La home la ve cualquiera: se cachea 5 min para no lanzar la consulta agregada en cada visita
  if (Date.now() < memo.hasta) return memo.datos;

  const top = await ventasPorPerfume({ limite: 4 });
  let datos = [];

  if (top.length > 0) {
    const perfumes = await Perfume.findAll({
      where: { id: top.map((t) => t.id) },
      attributes: ['id', 'imagen'],
      include: [{ model: Acorde, as: 'acordes', attributes: ['nombre'], through: { attributes: [] } }],
    });
    
    const infoPorId = new Map(
      perfumes.map((p) => [p.id, { imagen: p.imagen, acordes: p.acordes.map((a) => a.nombre) }]),
    );

    datos = top.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      genero: t.genero, // 'M' | 'F' | 'U'
      imagen: infoPorId.get(t.id)?.imagen ?? null,
      acordes: infoPorId.get(t.id)?.acordes ?? [],
    }));
  }

  memo = { hasta: Date.now() + TTL_MS, datos };
  return datos;
};