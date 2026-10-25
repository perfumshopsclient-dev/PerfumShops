import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './database.js';

const carpeta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');

// Acepta migraciones ESM (.js con export) y CommonJS (.cjs con module.exports).
const cargar = async (ruta) => {
  const m = await import(pathToFileURL(ruta).href);
  return { up: m.up ?? m.default?.up, down: m.down ?? m.default?.down };
};

export const umzug = new Umzug({
  migrations: {
    glob: ['*.{js,cjs}', { cwd: carpeta, absolute: true }],
    resolve: ({ name, path: ruta }) => ({
      name,
      up: async () => (await cargar(ruta)).up(sequelize.getQueryInterface(), Sequelize),
      down: async () => (await cargar(ruta)).down(sequelize.getQueryInterface(), Sequelize),
    }),
  },
  storage: new SequelizeStorage({ sequelize }), // tabla "SequelizeMeta": qué migraciones ya corrieron
  logger: console,
});
