// Respuestas de error siempre en JSON (Express, por defecto, devuelve una página HTML
// con el stack en desarrollo y texto suelto en producción).

export const notFound = (_req, res) => res.status(404).json({ message: 'Ruta no encontrada' });

// Los 4 parámetros son obligatorios: así Express lo reconoce como manejador de errores.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origen no permitido' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La petición es demasiado grande' });
  }
  if (err?.name === 'MulterError') {
    return err.code === 'LIMIT_FILE_SIZE'
      ? res.status(413).json({ message: 'La imagen supera el máximo de 2 MB' })
      : res.status(400).json({ message: 'No se pudo procesar el archivo enviado' });
  }

  // Errores 4xx lanzados a propósito por el código (con err.expose = true) se muestran tal cual.
  const status = Number(err?.status ?? err?.statusCode);
  if (status >= 400 && status < 500 && err.expose) {
    return res.status(status).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Error en el servidor' });
};
