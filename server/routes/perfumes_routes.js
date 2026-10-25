import { Router } from 'express';

import { PerfumeController } from '../controllers/perfumes_controllers.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { listarNombresAcordes } from '../services/acordes.js';
import { upload, verificarImagen } from '../middlewares/subidaImagen.js';

export function createPerfumesRouter({ perfumeModel, userModel }) {
  const controller = new PerfumeController({ perfumeModel });
  const router = Router();

  const soloAdmin = [requireAuth, requireRole(userModel, 'admin')];

  router.get('/', controller.listar); // público: la página de esencias también lo usa
  router.post('/', soloAdmin, upload.single('imagen'), verificarImagen, controller.crear);
  router.get('/seleccion', controller.seleccion)
  router.get('/:id', controller.obtenerPorId);
  router.put('/:id', soloAdmin, upload.single('imagen'), verificarImagen, controller.actualizar);
  router.delete('/:id', soloAdmin, controller.eliminar);

  return router;
}

// GET /acordes -> ["amaderado", "floral", ...]  (sugerencias del formulario)
export function createAcordesRouter() {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await listarNombresAcordes());
    } catch (e) {
      next(e);
    }
  });

  return router;
}
