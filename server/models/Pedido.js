import { DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js'; // <- ajusta a tu instancia de Sequelize

export const Pedido = sequelize.define(
  'Pedido',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    id_cliente: { type: DataTypes.UUID, allowNull: false }, // <- cambia a INTEGER si tus usuarios usan id numérico
    estado: {
      type: DataTypes.ENUM('pendiente', 'finalizado', 'rechazado', 'expirado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    expira_en: { type: DataTypes.DATE, allowNull: false },
    codigo: {
      type: DataTypes.VIRTUAL,
      get() {
        const id = this.getDataValue('id');
        return id ? `#${id.slice(0, 6).toUpperCase()}` : null;
      },
    },
  },
  {
    tableName: 'pedidos',
    createdAt: 'fecha',
    updatedAt: 'actualizado_en',
    indexes: [{ fields: ['estado', 'expira_en'] }, { fields: ['id_cliente'] }],
  }
);
