import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Falta JWT_SECRET en las variables de entorno');

const EXPIRACION_SEGUNDOS = 60 * 60; // igual que tu prototipo
export const COOKIE_NAME = 'access_token';

export const crearJWT = (user) =>
  jwt.sign({}, JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(user.id),   // "sub" debe ser un string (el id)
    expiresIn: EXPIRACION_SEGUNDOS,
  });

export const verifyJWT = (token) =>
  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }); // fija el algoritmo

export const opcionesCookie = {
  httpOnly: true,                                   // JS no puede leerla
  secure: process.env.NODE_ENV === 'production',    // solo HTTPS en producción
  sameSite: 'lax',                                  // protección CSRF básica
  maxAge: EXPIRACION_SEGUNDOS * 1000,               // en ms
  path: '/',
};

export const datosPublicos = (u) => ({
  id: u.id,
  nombre: u.nombre,
  apellido: u.apellido,
  email: u.email,
  edad: u.edad,
  rol: u.rol,
  verificado: u.verificado
});