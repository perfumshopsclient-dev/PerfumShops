import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middlewares/requireAuth.js'; // <- ajusta a tus middlewares JWT
import { requireRole } from '../middlewares/requireRole.js'; // <- ajusta a tus middlewares JWT
import { crear, listar, aceptar, rechazar } from '../controllers/pedidos.controller.js';
import { User } from '../models/User.js';

const router = Router();

const soloAdmin = [requireAuth, requireRole(User, 'admin')];

const limitarCreacion = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10, // en versiones antiguas de express-rate-limit se llama "max"
  message: { message: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' },
});

router.post('/', requireAuth, limitarCreacion, crear);
router.get('/', requireAuth, soloAdmin, listar);
router.patch('/:id/aceptar', requireAuth, soloAdmin, aceptar);
router.patch('/:id/rechazar', requireAuth, soloAdmin, rechazar);

export default router;
