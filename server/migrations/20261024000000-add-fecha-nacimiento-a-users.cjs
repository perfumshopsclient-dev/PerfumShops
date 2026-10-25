'use strict';

// Guarda la fecha de nacimiento y elimina la columna "edad".
// Motivo: "edad" nunca se llenaba desde el registro (todos quedaban con el valor por
// defecto, 18) y un número guardado se desactualiza cada cumpleaños. Ahora la edad se
// calcula en el modelo a partir de "fechaNacimiento".
//
// Los usuarios que ya existían quedan con fechaNacimiento = NULL (no se inventa el dato).
const TABLA = 'users';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        TABLA,
        'fechaNacimiento',
        { type: Sequelize.DATEONLY, allowNull: true },
        { transaction },
      );
      await queryInterface.removeColumn(TABLA, 'edad', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        TABLA,
        'edad',
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 18 },
        { transaction },
      );
      await queryInterface.removeColumn(TABLA, 'fechaNacimiento', { transaction });
    });
  },
};
