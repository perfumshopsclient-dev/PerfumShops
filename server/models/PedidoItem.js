import { DataTypes } from 'sequelize';
import { sequelize } from '../db/database.js'; // <- ajusta

export const PedidoItem = sequelize.define(
  'PedidoItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    id_pedido: { type: DataTypes.UUID, allowNull: false },
    id_perfume: { type: DataTypes.UUID, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  },
  {
    tableName: 'pedido_items',
    timestamps: false,
    indexes: [{ fields: ['id_pedido'] }],
  }
);