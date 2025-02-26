const mongoose = require('mongoose');

const { Schema } = mongoose;
const { DateTime } = require('luxon');

const kitchenOrderSchema = new Schema({
  createdAt: {
    type: String,
    default: () => DateTime.local().setZone('UTC-3').toISO(),
  },
  commandId: {
    type: String,
    required: true,
  },
  table: {
    type: String,
    required: true,
  },
  waiter: {
    type: String,
    required: true,
  },
  observation: {
    type: String,
    default: '',
  },
  products: [
    {
      _id: String,
      name: String,
      amount: Number,
      isMade: {
        type: Boolean,
        default: false,
      },
    },
  ],
  isMade: {
    type: Boolean,
    default: false,
  },
  orderCategory: {
    type: String,
    default: 'kitchen'
  },
  orderWaiter: {
    type: String,
    default: ''
  }
});

const KitchenOrder = mongoose.model('KitchenOrder', kitchenOrderSchema);

module.exports = KitchenOrder;
