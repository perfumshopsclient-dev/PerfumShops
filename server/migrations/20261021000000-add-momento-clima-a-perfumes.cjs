'use strict';

// Copia a propósito (no se importa del código de la app): una migración describe
// cómo era el esquema EN ESE MOMENTO y no debe cambiar si luego editas perfumeEnums.js.
const MOMENTOS = ['día', 'noche', 'día y noche'];
const CLIMAS = ['cálido', 'fresco', 'frío intenso', 'húmedo', 'seco', 'calor extremo', 'versátil'];
const TABLA = 'perfumes';

const lista = (valores) => valores.map((v) => `'${v}'`).join(', ');

// Idempotente a propósito: sequelize.sync() (que corre al arrancar el servidor) ya crea los
// tipos ENUM del modelo aunque la tabla exista, así que un CREATE TYPE a secas fallaría con
// "already exists". Con esto da igual si el servidor arrancó antes o después de migrar.
const crearTipo = (nombre, valores) => `
  DO $$ BEGIN
    CREATE TYPE "${nombre}" AS ENUM (${lista(valores)});
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction });

      await q(crearTipo('enum_perfumes_momento', MOMENTOS));
      await q(crearTipo('enum_perfumes_clima', CLIMAS));
      // El DEFAULT rellena los perfumes que ya existen
      await q(`ALTER TABLE "${TABLA}" ADD COLUMN IF NOT EXISTS "momento" "enum_perfumes_momento" NOT NULL DEFAULT 'día y noche'`);
      await q(`ALTER TABLE "${TABLA}" ADD COLUMN IF NOT EXISTS "clima" "enum_perfumes_clima" NOT NULL DEFAULT 'versátil'`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction });

      await q(`ALTER TABLE "${TABLA}" DROP COLUMN IF EXISTS "clima"`);
      await q(`ALTER TABLE "${TABLA}" DROP COLUMN IF EXISTS "momento"`);
      await q('DROP TYPE IF EXISTS "enum_perfumes_clima"');
      await q('DROP TYPE IF EXISTS "enum_perfumes_momento"');
    });
  },
};
