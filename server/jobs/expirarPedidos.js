import cron from 'node-cron';
import { expirarVencidos } from '../services/pedidos.service.js';

// Llama a iniciarJobExpiracion() una vez al arrancar el servidor (después de conectar la BD)
export function iniciarJobExpiracion() {
  cron.schedule('* * * * *', async () => {
    try {
      const n = await expirarVencidos();
      if (n) console.log(`[pedidos] ${n} pedido(s) expirado(s), stock repuesto`);
    } catch (e) {
      console.error('[pedidos] error en el job de expiración', e);
    }
  });
}
