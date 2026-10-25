import crypto from 'node:crypto';

export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // el enlace dura 24 h
export const RESEND_COOLDOWN_MS = 60 * 1000;            // mínimo entre reenvíos

// SHA-256 basta aquí: el token ya es aleatorio de 256 bits (no es una contraseña),
// así que no hace falta un hash lento como bcrypt.
export const hashTokenVerificacion = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generarTokenVerificacion = () => {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,                                  // viaja en el correo
    tokenHash: hashTokenVerificacion(token), // lo único que se guarda en la BD
    expira: new Date(Date.now() + VERIFICATION_TTL_MS),
  };
};
