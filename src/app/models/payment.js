const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const { Schema } = mongoose;

const paymentSchema = new Schema({
  createdAt: {
    type: String,
    default: () => DateTime.now().toISO(),
  },
  totalPayed: {
    type: Number,
    required: true,
  },
  command: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Command',
  },
  paymentTypes: [String],
  waiterExtra: {
    type: Number,
    default: 0,
  },
  observation: String,
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
