const mongoose = require('mongoose');
const { Schema } = mongoose;
const { DateTime } = require('luxon');

const kitchenOrderSchema = new Schema({
  createdAt: {
    type: String,
    // Dica: "UTC-3" não é IANA válido; se quiser manter string, use "America/Sao_Paulo".
    default: () => DateTime.local().setZone('America/Sao_Paulo').toISO(),
  },
  commandId: { type: String, required: true },
  table: { type: String, required: true },
  waiter: { type: String, required: true },
  observation: { type: String, default: '' },
  products: [
    {
      _id: String,
      name: String,
      amount: Number,
      isMade: { type: Boolean, default: false },
      isThawed: { type: Boolean, default: false },
    },
  ],
  isMade: { type: Boolean, default: false },
  isThawed: { type: Boolean, default: false },
  orderCategory: { type: String, default: 'kitchen' },
  orderWaiter: { type: String, default: '' },

  // >>> NOVO: posição para ordenar via drag-n-drop
  position: { type: Number, default: 0, index: true },
});

// Índice para ordenar e paginar de forma eficiente
kitchenOrderSchema.index({ orderCategory: 1, position: 1, createdAt: 1 });

const KitchenOrder = mongoose.model('KitchenOrder', kitchenOrderSchema);
module.exports = KitchenOrder;
