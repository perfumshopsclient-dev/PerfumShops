import { verifyJWT, COOKIE_NAME } from '../utils/auth.js';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'No autenticado' });
  try {
    req.auth = verifyJWT(token);
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ message: 'Sesión inválida o expirada' });
  }
};