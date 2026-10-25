import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../db/database.js';

export class Acorde extends Model {}

Acorde.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // Siempre en minúsculas y sin espacios sobrantes (ver normalizarAcordes en services/acordes.js).
  // El UNIQUE evita "Floral" y "floral" como dos acordes distintos.
  nombre: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true },
  },
}, { sequelize, modelName: 'Acorde', tableName: 'acordes', timestamps: false });
