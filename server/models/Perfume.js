import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../db/database.js';
import { MOMENTOS, CLIMAS } from './perfumeEnums.js';

export class Perfume extends Model {}

// Los acordes ya no son una columna: viven en la tabla "acordes" y se enlazan
// mediante "perfume_acordes" (ver models/associations.js).
Perfume.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ml: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
  precio_unitario: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 0 } },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 0 } },
  genre: { type: DataTypes.ENUM('M', 'F', 'U'), allowNull: false },
  imagen: DataTypes.TEXT,
  momento: { type: DataTypes.ENUM(...MOMENTOS), allowNull: false, defaultValue: 'día y noche' },
  clima: { type: DataTypes.ENUM(...CLIMAS), allowNull: false, defaultValue: 'versátil' },
}, { sequelize, modelName: 'Perfume', tableName: 'perfumes', paranoid: true });
