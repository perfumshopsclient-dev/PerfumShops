import { z } from 'zod';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { COOKIE_NAME, crearJWT, datosPublicos, opcionesCookie } from '../utils/auth.js';
import {
  generarTokenVerificacion,
  hashTokenVerificacion,
  RESEND_COOLDOWN_MS,
  VERIFICATION_TTL_MS,
} from '../utils/emailVerification.js';
import { edadPermitida, EDAD_MIN, EDAD_MAX } from '../utils/edad.js';
import { sendVerificationEmail, sendAccountExistsEmail } from '../services/mail.service.js';

const BCRYPT_COST = 12;
// Hash de una contraseña que nadie conoce: se compara cuando el usuario no existe
// para que el login tarde lo mismo exista o no la cuenta.
const HASH_FALSO = bcrypt.hashSync('contraseña-que-nadie-usa', BCRYPT_COST);

const normalizarEmail = (valor) => (typeof valor === 'string' ? valor.trim().toLowerCase() : '');
const esTexto = (valor) => typeof valor === 'string' && valor.length > 0;

const registerSchema = z.object({
      nombre: z.string().trim().min(2).max(50),
      apellido: z.string().trim().min(2).max(50),
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(8).max(72).regex(/^(?=.*[A-Z])(?=.*\d)/),
      fechaNacimiento: z.string().date().refine(edadPermitida, `Debes tener entre ${EDAD_MIN} y ${EDAD_MAX} años`),
    });

export class UsersController {
  constructor({ userModel }){
    this.userModel = userModel;
  }

  login = async (req, res) => {
    const email = normalizarEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !esTexto(password)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    try {
      const user = await this.userModel.findOne({ where: { email } });

      const coincide = await bcrypt.compare(password, user?.contraseña ?? HASH_FALSO);
      const ok = Boolean(user) && coincide;

      if(!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

      // Se comprueba DESPUÉS de validar la contraseña: así no se revela
      // a un desconocido si un correo está registrado o pendiente.
      if (!user.verificado) {
        return res.status(403).json({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Debes verificar tu correo antes de iniciar sesión',
        });
      }

      res.cookie(COOKIE_NAME, crearJWT(user), opcionesCookie);
      return res.json(datosPublicos(user))

    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor' });
    }
  } 

  create = async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

    const { nombre, apellido, email, password, fechaNacimiento } = parsed.data;

    // Misma respuesta (y mismo trabajo de bcrypt) exista o no el correo: así el registro
    // no sirve para averiguar quién tiene cuenta. Quien YA la tiene recibe un aviso por correo.
    const respuestaGenerica = {
      message: 'Si el correo es válido, recibirás un mensaje para continuar. Revisa tu bandeja.',
      email,
    };

    try {
      const contraseñaHash = await bcrypt.hash(password, BCRYPT_COST);
      let user = await this.userModel.findOne({ where: { email } });

      if (user?.verificado) {
        try {
          await sendAccountExistsEmail({ to: user.email, nombre: user.nombre });
        } catch (mailError) {
          console.error('No se pudo enviar el aviso de cuenta existente:', mailError);
        }
        return res.status(201).json(respuestaGenerica);
      }

      const { token, tokenHash, expira } = generarTokenVerificacion();
      const datos = {
        nombre,
        apellido,
        fechaNacimiento,
        contraseña: contraseñaHash,
        tokenVerificacionHash: tokenHash,
        tokenVerificacionExpira: expira,
      };

      if (user) {
        // Cuenta sin verificar: se reemplaza. Así nadie puede "reservar" el correo
        // de otra persona con una contraseña suya y quedarse con la cuenta.
        await user.update(datos);
      } else {
        user = await this.userModel.create({ email, ...datos });
      }

      try {
        await sendVerificationEmail({ to: user.email, nombre: user.nombre, token });
      } catch (mailError) {
        // La cuenta ya existe; el usuario puede pedir el reenvío desde la web.
        console.error('No se pudo enviar el correo de verificación:', mailError);
      }

      // Sin cookie: no hay sesión hasta que el correo esté verificado.
      return res.status(201).json(respuestaGenerica);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        // Dos registros simultáneos con el mismo correo: misma respuesta, sin revelar nada.
        return res.status(201).json(respuestaGenerica);
      }
      console.error(error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  }

  verifyEmail = async (req, res) => {
    const token = req.body?.token;

    if (!esTexto(token) || token.length > 200) {
      return res.status(400).json({ code: 'TOKEN_INVALIDO', message: 'Enlace inválido o expirado' });
    }

    try {
      // Una sola consulta atómica: valida hash + expiración, marca verificado
      // e invalida el token (un solo uso) sin ventana para condiciones de carrera.
      const [filas] = await this.userModel.update(
        {
          verificado: true,
          verificadoEn: new Date(),
          tokenVerificacionHash: null,
          tokenVerificacionExpira: null,
        },
        {
          where: {
            tokenVerificacionHash: hashTokenVerificacion(token),
            tokenVerificacionExpira: { [Op.gt]: new Date() },
          },
        },
      );

      if (filas === 0) {
        return res.status(400).json({ code: 'TOKEN_INVALIDO', message: 'Enlace inválido o expirado' });
      }

      return res.json({ message: 'Correo verificado correctamente' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  }

  resendVerification = async (req, res) => {
    const email = normalizarEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: 'Correo inválido' });

    // Misma respuesta exista o no la cuenta (evita enumerar usuarios)
    const respuesta = {
      message: 'Si el correo está pendiente de verificación, recibirás un nuevo enlace.',
    };

    try {
      const user = await this.userModel.findOne({ where: { email } });

      if (user && !user.verificado) {
        // El momento del último envío se deduce de la expiración (expira = envío + TTL)
        const ultimoEnvio = user.tokenVerificacionExpira
          ? user.tokenVerificacionExpira.getTime() - VERIFICATION_TTL_MS
          : 0;

        if (Date.now() - ultimoEnvio >= RESEND_COOLDOWN_MS) {
          const { token, tokenHash, expira } = generarTokenVerificacion();
          await user.update({ tokenVerificacionHash: tokenHash, tokenVerificacionExpira: expira });
          await sendVerificationEmail({ to: user.email, nombre: user.nombre, token });
        }
      }

      return res.json(respuesta);
    } catch (error) {
      console.error('Error al reenviar la verificación:', error);
      return res.json(respuesta);
    }
  }

  logout = (req, res) => {
    // las opciones deben coincidir (salvo maxAge) para que el navegador la borre
    const { maxAge, ...opciones } = opcionesCookie;
    res.clearCookie(COOKIE_NAME, opciones);
    return res.status(204).end();
  };
  
  me = async (req, res) => {
    try {
      const user = await this.userModel.findByPk(req.auth.sub);
      if (!user) return res.status(401).json({ message: 'Sesión inválida' });
      return res.json(datosPublicos(user));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };
}
