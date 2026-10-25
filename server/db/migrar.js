import 'dotenv/config'
import { umzug } from './migraciones.js';
import { sequelize } from './database.js';

const accion = process.argv[2] ?? 'up';

try {
  if (accion === 'up') {
    const hechas = await umzug.up();
    console.log(hechas.length ? `Aplicadas: ${hechas.map((m) => m.name).join(', ')}` : 'Nada pendiente.');
  } else if (accion === 'down') {
    const revertidas = await umzug.down();
    console.log(`Revertida: ${revertidas.map((m) => m.name).join(', ') || 'ninguna'}`);
  } else if (accion === 'status') {
    console.log('Ejecutadas:', (await umzug.executed()).map((m) => m.name));
    console.log('Pendientes:', (await umzug.pending()).map((m) => m.name));
  } else {
    throw new Error(`Acción desconocida: ${accion} (usa up, down o status)`);
  }
} catch (e) {
  console.error('Migración fallida:', e.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
