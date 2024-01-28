const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const { Schema } = mongoose;

const commandSchema = new Schema({
  createdAt: {
    type: String,
    default: () => DateTime.local().setZone('UTC-3').toISO(),
  },
  table: {
    type: String,
    required: true,
    maxLength: 128,
  },
  waiter: {
    type: String,
    required: true,
  },
  fishingType: String,
  total: { type: Number, default: 0 },
  totalPayed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  hasPendingOrders: { type: Boolean, default: false },
  paymentTypes: [String],
  discount: {
    type: Number,
    default: 0,
  },
  products: [
    {
      _id: {
        type: String,
        required: true,
      },
      name: String,
      amount: Number,
      unitPrice: Number,
      category: String,
      totalPayed: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  ],
});

const Command = mongoose.model('Command', commandSchema);

module.exports = Command;
