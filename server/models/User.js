import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../db/database.js';
import { calcularEdad } from '../utils/edad.js';

export class User extends Model {}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY, // 'YYYY-MM-DD', sin hora ni zona horaria
    allowNull: true,          // NULL en usuarios anteriores a esta columna
  },
  // La edad no se guarda: se calcula, así nunca queda desactualizada.
  edad: {
    type: DataTypes.VIRTUAL(DataTypes.INTEGER),
    get() {
      const fecha = this.getDataValue('fechaNacimiento');
      return fecha ? calcularEdad(fecha) : null;
    },
  },
  rol: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user',
  },
  verificado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  verificadoEn: { type: DataTypes.DATE, allowNull: true },
  tokenVerificacionHash: { type: DataTypes.STRING(64), allowNull: true },
  tokenVerificacionExpira: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'Users',
  tableName: 'users',
  timestamps: true, // Agrega campos createdAt y updatedAt
})