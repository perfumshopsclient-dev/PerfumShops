import * as svc from '../services/pedidos.service.js';

const manejar = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e instanceof svc.AppError) return res.status(e.status).json({ message: e.message });
    console.error('[pedidos]', e);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /pedidos  (cliente autenticado: solo requireAuth, por eso se usa req.auth y no req.user)
export const crear = manejar(async (req, res) => {
  const { pedido, filas } = await svc.crearPedido(req.auth.sub, req.body?.items); // req.auth.sub = id del usuario (lo deja requireAuth)

  // El mensaje lo arma el backend con los datos reales (no los del frontend)
  const lineas = filas.map((f) => `• ${f.nombre} (${f.ml} ml) x${f.cantidad}`).join('\n');
  const texto = `Hola, quiero confirmar mi pedido ${pedido.codigo}\n${lineas}\nTotal: $${Number(pedido.total).toFixed(2)}`;

  res.status(201).json({
    id: pedido.id,
    codigo: pedido.codigo,
    total: Number(pedido.total),
    expira_en: pedido.expira_en,
    whatsapp_url: `https://wa.me/${process.env.WS}?text=${encodeURIComponent(texto)}`,
  });
});

// GET /api/pedidos?estado=pendiente|todos|...  (admin)
export const listar = manejar(async (req, res) => {
  res.json(await svc.listarPedidos(req.query.estado));
});

// PATCH /api/pedidos/:id/aceptar | rechazar  (admin)
export const aceptar = manejar(async (req, res) => {
  await svc.resolverPedido(req.params.id, 'finalizado');
  res.json({ ok: true });
});
export const rechazar = manejar(async (req, res) => {
  await svc.resolverPedido(req.params.id, 'rechazado');
  res.json({ ok: true });
});
