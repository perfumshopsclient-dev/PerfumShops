'use strict';

// Ajusta TABLA al nombre real de tu tabla de usuarios. Si tu modelo usa
// `underscored: true`, cambia los nombres de columna a snake_case.
const TABLA = 'users';
const INDICE = `${TABLA}_token_verificacion_hash_uq`;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        TABLA,
        'verificado',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLA,
        'verificadoEn',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLA,
        'tokenVerificacionHash',
        { type: Sequelize.STRING(64), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLA,
        'tokenVerificacionExpira',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(TABLA, ['tokenVerificacionHash'], {
        unique: true,
        name: INDICE,
        transaction,
      });

      // Los usuarios que ya existían (incluido el admin) se consideran verificados;
      // si no, nadie podría volver a iniciar sesión al desplegar.
      await queryInterface.sequelize.query(
        `UPDATE "${TABLA}" SET "verificado" = true, "verificadoEn" = NOW()`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(TABLA, INDICE, { transaction });
      for (const columna of [
        'tokenVerificacionExpira',
        'tokenVerificacionHash',
        'verificadoEn',
        'verificado',
      ]) {
        await queryInterface.removeColumn(TABLA, columna, { transaction });
      }
    });
  },
};
