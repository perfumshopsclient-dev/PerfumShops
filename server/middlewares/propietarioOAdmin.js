export const propietarioOAdmin = (userModel) => async (req, res, next) => {
  if (String(req.params.id) === String(req.auth.sub)) return next();
  const u = await userModel.findByPk(req.auth.sub, { attributes: ['rol'] });
  if (u?.rol === 'admin') return next();
  return res.status(403).json({ message: 'No autorizado' });
};  