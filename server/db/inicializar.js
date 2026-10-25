// Solo para una BD NUEVA y vacía (producción la primera vez, o tu PC desde cero):
//   node server/db/inicializar.js
// 1) crea todas las tablas a partir de los modelos actuales (único uso legítimo de sync)
// 2) marca como "ya aplicadas" las migraciones existentes, porque describen cambios que
//    los modelos actuales ya incluyen. Desde aquí, todo cambio de esquema = migración nueva.
import '../models/Associations.js';
import '../models/Acorde.js';
import { sequelize } from './database.js';
import { umzug } from './migraciones.js';

try {
  const [[{ existe }]] = await sequelize.query(`SELECT to_regclass('public."SequelizeMeta"') IS NOT NULL AS existe`);
  if (existe && (await umzug.executed()).length > 0) {
    throw new Error('Esta BD ya tiene migraciones registradas; usa "npm run migrate".');
  }

  const qi = sequelize.getQueryInterface();
  if (await qi.tableExists('perfumes')) {
    const cols = await qi.describeTable('perfumes');
    if ('acordes' in cols || !('momento' in cols)) {
      throw new Error('La tabla perfumes existe pero está desactualizada. No se marca nada: revisa a mano.');
    }
  }

  await sequelize.sync({ force: false }); // crea lo que falte; nunca modifica tablas existentes

  const pendientes = await umzug.pending();
  for (const m of pendientes) await umzug.storage.logMigration({ name: m.name });
} catch (e) {
  console.error('inicializar falló');
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
