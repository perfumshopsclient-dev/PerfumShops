import { Acorde } from './Acorde.js';
import { Perfume } from './Perfume.js';
// Importa este archivo UNA vez (p. ej. en tu models/index.js o server.js) antes de sequelize.sync()
import { Pedido } from './Pedido.js';
import { PedidoItem } from './PedidoItem.js';
import { User } from './User.js';       // <- tu modelo de usuarios (necesita nombre, apellido, email)

// Importa este archivo UNA vez al arrancar (por ejemplo en app.js:
//   import './models/associations.js';
// ) antes de usar los modelos en consultas o en sequelize.sync().
//
// La tabla intermedia "perfume_acordes" tiene PK compuesta (perfume_id, acorde_id)
// y FKs con ON DELETE CASCADE, así que no puede haber enlaces huérfanos.


Pedido.hasMany(PedidoItem, { foreignKey: 'id_pedido', as: 'items', onDelete: 'CASCADE' });
PedidoItem.belongsTo(Pedido, { foreignKey: 'id_pedido' });

// RESTRICT: no se puede borrar un perfume que ya aparece en pedidos (ver nota de soft delete)
PedidoItem.belongsTo(Perfume, { foreignKey: 'id_perfume', as: 'perfume', onDelete: 'RESTRICT' });
Perfume.hasMany(PedidoItem, { foreignKey: 'id_perfume' });

Pedido.belongsTo(User, { foreignKey: 'id_cliente', as: 'cliente', onDelete: 'RESTRICT' });
User.hasMany(Pedido, { foreignKey: 'id_cliente' });

export { Pedido, PedidoItem, Perfume, User };


Perfume.belongsToMany(Acorde, {
  through: 'perfume_acordes',
  as: 'acordes',
  foreignKey: 'perfume_id',
  otherKey: 'acorde_id',
  timestamps: false,
});

Acorde.belongsToMany(Perfume, {
  through: 'perfume_acordes',
  as: 'perfumes',
  foreignKey: 'acorde_id',
  otherKey: 'perfume_id',
  timestamps: false,
});
