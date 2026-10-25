import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sequelize } from 'sequelize';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

const { DATABASE_URL, DB_NAME, DB_USER, DB_PW, DB_HOST, DB_PORT, DB_SSL } = process.env;

if (!DATABASE_URL && !DB_NAME) {
  throw new Error('Falta la conexión a la BD: define DATABASE_URL o DB_NAME/DB_USER/DB_PW/DB_HOST');
}

// Solo verifica el certificado si lo pides explícitamente
const verificarCert = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

const opciones = {
  dialect: 'postgres',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
  dialectOptions:
    DB_SSL === 'true'
      ? { connectTimeout: 15000, ssl: { require: true, rejectUnauthorized: verificarCert } }
      : { connectTimeout: 15000 },
};

export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, opciones)
  : new Sequelize(DB_NAME, DB_USER, DB_PW, {
      ...opciones,
      host: DB_HOST ?? 'localhost',
      port: Number(DB_PORT ?? 5432),
    });