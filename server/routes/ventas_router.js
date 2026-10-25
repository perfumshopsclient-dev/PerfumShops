import { Router } from 'express';
import { VentasController } from '../controllers/ventas_controllers.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import rateLimit from 'express-rate-limit';

const limitarPublico = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

export const createVentasRouter = ({ userModel }) => {
  const router = Router();
  const controller = new VentasController();
  const soloAdmin = [requireAuth, requireRole(userModel, 'admin')];

  router.get('/perfumes', ...soloAdmin, controller.porPerfume);
  router.get('/mas-vendidas', limitarPublico, controller.masVendidas);
  router.get('/perfumes/:id', ...soloAdmin, controller.deUnPerfume);
  router.get('/resumen', ...soloAdmin, controller.resumen);
  router.get('/stock', ...soloAdmin, controller.stock);

  return router;
};