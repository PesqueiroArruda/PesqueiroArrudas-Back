const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    // unique: true,
  },
  imageURL: String,
  category: String,
  isFavorite: {
    type: Boolean,
    default: false,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    min: 0,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
