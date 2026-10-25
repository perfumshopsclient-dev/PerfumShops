// server/middleware/requireRole.js
import { COOKIE_NAME } from '../utils/auth.js';

export const requireRole = (userModel, ...rolesPermitidos) => async (req, res, next) => {
  try {
    const user = await userModel.findByPk(req.auth.sub);

    if (!user) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ message: 'Sesión inválida' });
    }
    if (!rolesPermitidos.includes(user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esto' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};