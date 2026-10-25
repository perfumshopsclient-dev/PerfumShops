import nodemailer from 'nodemailer';

// --- Configuración -----------------------------------------------------------
// Funciona con cualquier proveedor SMTP transaccional (Resend, Brevo, SES...).
// Solo cambian las variables de entorno; el código es el mismo.
const APP_NAME = process.env.APP_NAME ?? 'PerfumShops';

let transporter;

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = TLS directo; 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      pool: true,              // reutiliza conexiones
      maxConnections: 3,
      connectionTimeout: 10_000, // no dejar colgada la petición si el SMTP no responde
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
};

const isProd = () => process.env.NODE_ENV === 'production';

// Llamar una vez al arrancar (opcional): falla pronto si las credenciales son erróneas.
export const verifyMailTransport = async () => {
  if (!process.env.SMTP_HOST) return false;
  await getTransporter().verify();
  return true;
};

const escapeHtml = (texto = '') =>
  String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

// Colores provisionales (azul del logo + dorado de la gota): ajústalos a tu paleta.
const plantillaVerificacion = ({ nombre, url, logoUrl }) => {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#0f1f3d;padding:28px;">
              <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(APP_NAME)}" height="40" style="display:block;height:40px;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;color:#1c2333;font-size:15px;line-height:1.6;">
              <h1 style="margin:0 0 12px;font-size:22px;">Hola, ${escapeHtml(nombre)}</h1>
              <p style="margin:0 0 8px;">Gracias por unirte a ${escapeHtml(APP_NAME)}. Confirma tu correo electrónico para activar tu cuenta.</p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${safeUrl}" style="display:inline-block;background:#c9a24b;color:#0f1f3d;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:8px;">Verificar mi correo</a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#667085;">Este enlace caduca en 24 horas. Si el botón no funciona, copia y pega esta dirección en tu navegador:</p>
              <p style="margin:0 0 20px;font-size:13px;color:#667085;word-break:break-all;">${safeUrl}</p>
              <p style="margin:0;font-size:13px;color:#667085;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const sendVerificationEmail = async ({ to, nombre, token }) => {
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
  const url = `${frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;

  if (!process.env.SMTP_HOST) {
    if (isProd()) {
      throw new Error('SMTP no configurado (faltan SMTP_HOST, SMTP_USER y SMTP_PASS)');
    }
    console.log(`[mail:dev] Enlace de verificación para ${to}: ${url}`);
    return;
  }

  // En producción el remitente DEBE ser una dirección de tu dominio verificado
  // (p. ej. "PerfumShops <no-reply@dominio.com>"). Con Resend/Brevo, SMTP_USER
  // no es una dirección de correo, así que no sirve como respaldo.
  const from = process.env.MAIL_FROM;
  if (!from) {
    throw new Error('Falta MAIL_FROM (p. ej. "PerfumShops <no-reply@dominio.com>")');
  }

  await getTransporter().sendMail({
    from,
    to,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    subject: `Verifica tu correo en ${APP_NAME}`,
    headers: { 'Auto-Submitted': 'auto-generated' },
    text:
      `Hola, ${nombre}.\n\n` +
      `Confirma tu correo para activar tu cuenta en ${APP_NAME}:\n${url}\n\n` +
      `El enlace caduca en 24 horas. Si no creaste esta cuenta, ignora este mensaje.`,
    html: plantillaVerificacion({
      nombre,
      url,
      logoUrl: `${frontendUrl}/img/logo-perfumshops.png`,
    }),
  });
};

// Se envía cuando alguien intenta registrarse con un correo que YA tiene cuenta verificada.
// Sustituye al antiguo "409: correo ya registrado" (que permitía averiguar quién tiene cuenta).
export const sendAccountExistsEmail = async ({ to, nombre }) => {
  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
  const url = `${frontendUrl}/login`;

  if (!process.env.SMTP_HOST) {
    if (isProd()) throw new Error('SMTP no configurado (faltan SMTP_HOST, SMTP_USER y SMTP_PASS)');
    console.log(`[mail:dev] Aviso "ya tienes cuenta" para ${to}: ${url}`);
    return;
  }

  const from = process.env.MAIL_FROM;
  if (!from) throw new Error('Falta MAIL_FROM (p. ej. "PerfumShops <no-reply@dominio.com>")');

  await getTransporter().sendMail({
    from,
    to,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    subject: `Ya tienes una cuenta en ${APP_NAME}`,
    headers: { 'Auto-Submitted': 'auto-generated' },
    text:
      `Hola, ${nombre}.\n\n` +
      `Alguien intentó crear una cuenta en ${APP_NAME} con este correo, pero ya tienes una.\n` +
      `Puedes iniciar sesión aquí: ${url}\n\n` +
      `Si no fuiste tú, ignora este mensaje: tu cuenta sigue segura.`,
    html:
      `<p>Hola, ${escapeHtml(nombre)}.</p>` +
      `<p>Alguien intentó crear una cuenta en ${escapeHtml(APP_NAME)} con este correo, pero <strong>ya tienes una</strong>.</p>` +
      `<p><a href="${escapeHtml(url)}">Iniciar sesión</a></p>` +
      `<p style="color:#667085;font-size:13px;">Si no fuiste tú, ignora este mensaje: tu cuenta sigue segura.</p>`,
  });
};
