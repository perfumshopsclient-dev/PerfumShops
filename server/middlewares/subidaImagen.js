import multer from 'multer';

const MIME_PERMITIDOS = new Set(['image/png', 'image/jpeg', 'image/webp']);

const errorImagen = (message) => Object.assign(new Error(message), { status: 400, expose: true });

// multer es OBLIGATORIO aunque no subas archivos: el frontend envía multipart/form-data
// y sin multer req.body llega vacío.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  // El tipo MIME lo declara el cliente (se puede falsificar): este filtro es solo la
  // primera barrera. La comprobación real es verificarImagen(), que mira los bytes.
  fileFilter: (_req, file, cb) =>
    MIME_PERMITIDOS.has(file.mimetype)
      ? cb(null, true)
      : cb(errorImagen('La imagen debe ser PNG, JPG o WebP.')),
});

// Firmas ("magic bytes") de cada formato
const esPNG = (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const esJPG = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const esWebP = (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';

// Va DESPUÉS de upload.single(...). Si no hay archivo (el frontend manda una URL), pasa de largo.
export const verificarImagen = (req, _res, next) => {
  if (!req.file) return next();
  const b = req.file.buffer;
  if (esPNG(b) || esJPG(b) || esWebP(b)) return next();
  return next(errorImagen('El archivo no es una imagen PNG, JPG o WebP válida.'));
};
