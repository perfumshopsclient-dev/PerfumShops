import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UsersController } from '../controllers/users_controllers.js';
import { requireAuth } from '../middlewares/requireAuth.js';
//import { requireRole } from '../middlewares/requireRole.js';

const limitar = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos. Intenta de nuevo más tarde.' },
  });

export const createUsersRouter = ({ userModel }) => {
  const usersRouter = Router();

  const usersController = new UsersController({ userModel });

  //const soloAdmin = [requireAuth, requireRole(userModel, 'admin')];
  usersRouter.post('/login', limitar(10), usersController.login);
  usersRouter.post('/register', limitar(10), usersController.create);
  usersRouter.post('/verify-email', limitar(20), usersController.verifyEmail);
  usersRouter.post('/resend-verification', limitar(5), usersController.resendVerification);
  usersRouter.post('/logout', usersController.logout);
  usersRouter.get('/me', requireAuth, usersController.me);

  return usersRouter;
}
