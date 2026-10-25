// Mueve perfumes.acordes (VARCHAR[]) a dos tablas:
//   acordes(id, nombre UNIQUE)  +  perfume_acordes(perfume_id, acorde_id)
// Todo ocurre en UNA transacción (el DDL de Postgres es transaccional): si algo
// falla, no queda nada a medias. Aun así, haz un pg_dump antes de correrla.
//
// Si no usas sequelize-cli/umzug, puedes pegar el SQL de cada query en psql.

export async function up(queryInterface) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const sql = (q) => queryInterface.sequelize.query(q, { transaction });

    await sql(`
      CREATE TABLE IF NOT EXISTS acordes (
        id     SERIAL PRIMARY KEY,
        nombre VARCHAR(60) NOT NULL UNIQUE
      )
    `);

    await sql(`
      CREATE TABLE IF NOT EXISTS perfume_acordes (
        perfume_id UUID    NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
        acorde_id  INTEGER NOT NULL REFERENCES acordes(id)  ON DELETE CASCADE,
        PRIMARY KEY (perfume_id, acorde_id)
      )
    `);

    // Para consultas del tipo "perfumes que tienen el acorde X"
    await sql(`
      CREATE INDEX IF NOT EXISTS perfume_acordes_acorde_idx
      ON perfume_acordes (acorde_id)
    `);

    // 1) Catálogo: los acordes distintos que ya existen en los perfumes
    await sql(`
      INSERT INTO acordes (nombre)
      SELECT DISTINCT lower(btrim(a.nombre))
      FROM perfumes p
      CROSS JOIN LATERAL unnest(p.acordes) AS a(nombre)
      WHERE btrim(a.nombre) <> ''
      ON CONFLICT (nombre) DO NOTHING
    `);

    // 2) Enlaces perfume <-> acorde
    await sql(`
      INSERT INTO perfume_acordes (perfume_id, acorde_id)
      SELECT DISTINCT p.id, ac.id
      FROM perfumes p
      CROSS JOIN LATERAL unnest(p.acordes) AS a(nombre)
      JOIN acordes ac ON ac.nombre = lower(btrim(a.nombre))
      ON CONFLICT DO NOTHING
    `);

    // 3) Ya no hace falta la columna
    await sql(`ALTER TABLE perfumes DROP COLUMN acordes`);
  });
}

// Nota: al volver atrás se pierde el ORDEN original de cada arreglo
// (queda alfabético), porque la tabla intermedia no guarda orden.
export async function down(queryInterface) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const sql = (q) => queryInterface.sequelize.query(q, { transaction });

    await sql(`ALTER TABLE perfumes ADD COLUMN acordes VARCHAR(255)[] NOT NULL DEFAULT '{}'`);

    await sql(`
      UPDATE perfumes p
      SET acordes = COALESCE((
        SELECT array_agg(ac.nombre ORDER BY ac.nombre)
        FROM perfume_acordes pa
        JOIN acordes ac ON ac.id = pa.acorde_id
        WHERE pa.perfume_id = p.id
      ), '{}')
    `);

    await sql(`DROP TABLE perfume_acordes`);
    await sql(`DROP TABLE acordes`);
  });
}
