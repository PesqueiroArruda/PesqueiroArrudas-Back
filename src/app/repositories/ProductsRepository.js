const ProductModel = require('../models/product');

class ProductsRepository {
  async findAll() {
    const products = await ProductModel.find({}).sort({
      isFavorite: -1,
      name: 1,
    });
    return products;
  }

  async create({ name, category, unitPrice, amount, imageURL }) {
    const newProduct = new ProductModel({
      name,
      category,
      unitPrice,
      amount,
      imageURL,
    });

    const product = await newProduct.save();
    return product;
  }

  async delete(productId) {
    await ProductModel.deleteOne({ _id: productId });
  }

  async findByName(name) {
    const product = await ProductModel.find({ name });
    return product;
  }

  async findByNameAndId({ name, id }) {
    const hasProduct = await ProductModel.find().nor({ name, _id: id });
    console.log({ hasProduct });
  }

  async update({
    id,
    name,
    category,
    unitPrice,
    amount,
    imageURL,
    isFavorite,
  }) {
    const oldProduct = await ProductModel.findOne({ _id: id });
    if (isFavorite === false || isFavorite === true) {
      await ProductModel.updateOne(
        { _id: id },
        {
          $set: {
            isFavorite,
          },
        }
      );
      const updatedProduct = await ProductModel.findOne({ _id: id });
      return updatedProduct;
    }

    oldProduct.overwrite({
      name,
      category,
      unitPrice,
      amount,
      imageURL,
    });

    const updatedProduct = await oldProduct.save();
    return updatedProduct;
  }

  async findById(_id) {
    const product = await ProductModel.findOne({ _id });
    return product;
  }

  async updateAmount({ productId, amount }) {
    try {
      await ProductModel.updateOne(
        { _id: productId },
        {
          $set: {
            amount: Number(amount),
          },
        }
      );
      const updatedProduct = await ProductModel.findById({
        _id: productId.toString(),
      });
      return updatedProduct;
    } catch (error) {
      console.log('updateProductAmount Error', error.messaeg);
    }
  }
}

module.exports = new ProductsRepository();
