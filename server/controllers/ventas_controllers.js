import { z } from 'zod';
import { masVendidasPublico } from '../services/ventas.service.js';
import {
  resumenDashboard,
  stockPerfumes,
  ventasPorPerfume,
} from '../services/ventas.service.js';

const limiteSchema = z.coerce.number().int().min(1).max(50);
const uuidSchema = z.string().uuid();

const falloServidor = (res, contexto, error) => {
  console.error(`Error al obtener ${contexto}:`, error);
  return res.status(500).json({ message: 'Error en el servidor' });
};

export class VentasController {
  // GET /ventas/perfumes            → todos los perfumes vendidos (de mayor a menor)
  // GET /ventas/perfumes?limite=1   → el más vendido
  // GET /ventas/perfumes?limite=5   → los 5 más vendidos
  porPerfume = async (req, res) => {
    let limite;
    if (req.query.limite !== undefined) {
      const parsed = limiteSchema.safeParse(req.query.limite);
      if (!parsed.success) {
        return res.status(400).json({ message: 'limite debe ser un entero entre 1 y 50' });
      }
      limite = parsed.data;
    }

    try {
      return res.json(await ventasPorPerfume({ limite }));
    } catch (error) {
      return falloServidor(res, 'las ventas por perfume', error);
    }
  };

  // GET /ventas/perfumes/:id        → ventas de un solo perfume
  deUnPerfume = async (req, res) => {
    const parsed = uuidSchema.safeParse(req.params.id);
    if (!parsed.success) return res.status(400).json({ message: 'Id de perfume inválido' });

    try {
      const [fila] = await ventasPorPerfume({ perfumeId: parsed.data });
      return res.json({
        id: parsed.data,
        nombre: fila?.nombre ?? null,
        total_vendido: fila?.total_vendido ?? 0,
        ingresos: fila?.ingresos ?? 0,
      });
    } catch (error) {
      return falloServidor(res, 'las ventas del perfume', error);
    }
  };

  // GET /ventas/resumen → { totales, semanas, dias }
  resumen = async (req, res) => {
    try {
      console.log("Resumen de ventas")
      return res.json(await resumenDashboard());
    } catch (error) {
      return falloServidor(res, 'el resumen de ventas', error);
    }
  };

  // GET /ventas/stock → stock de cada perfume
  stock = async (req, res) => {
    try {
      return res.json(await stockPerfumes());
    } catch (error) {
      return falloServidor(res, 'el stock', error);
    }
  };

  masVendidas = async (req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json(await masVendidasPublico());
    } catch (error) {
      return falloServidor(res, 'las más vendidas', error);
    }
  };
}
