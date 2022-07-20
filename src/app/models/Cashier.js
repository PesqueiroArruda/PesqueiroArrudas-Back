const mongoose = require('mongoose');

const { Schema } = mongoose;

const cashierSchema = new Schema({
  total: {
    type: Number,
    required: true,
  },
  date: String,
  payments: [
    {
      _id: String,
      total: Number,
      paymentTypes: [String],
      totalPayed: Number,
      waiterExtra: {
        type: Number,
        default: 0,
      },
      command: {
        _id: String,
        table: String,
        waiter: String,
        total: Number,
        products: [
          {
            _id: String,
            name: String,
            amount: Number,
          },
        ],
      },
    },
  ],
});

const Cashier = mongoose.model('Cashier', cashierSchema);

module.exports = Cashier;
