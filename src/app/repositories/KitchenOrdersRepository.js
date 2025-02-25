const KitchenOrder = require('../models/KitchenOrder');

class KitchenOrdersRepository {
  async findAll({ made }) {
    const kitchenOrders = await KitchenOrder.find({ isMade: made });
    return kitchenOrders;
  }

  async create({ commandId, table, waiter, products, observation, isMade, orderCategory }) {
    const newKitchenOrder = new KitchenOrder({
      commandId,
      table,
      waiter,
      products,
      observation,
      isMade,
      orderCategory
    });

    const kitchenOrder = newKitchenOrder.save();
    return kitchenOrder;
  }

  async update({ orderId, isMade, products }) {
    await KitchenOrder.updateOne(
      { _id: orderId },
      {
        $set: {
          isMade,
          products,
        },
      }
    );

    const updatedKitchenOrder = await KitchenOrder.find({ _id: orderId });
    return updatedKitchenOrder;
  }

  async delete({ commandId }) {
    await KitchenOrder.deleteMany({ commandId });
  }

  async findByCommandId({ commandId }) {
    const kitchenOrders = await KitchenOrder.find({ commandId });
    return kitchenOrders;
  }

  async findById(_id) {
    const kitchenOrder = await KitchenOrder.findOne({ _id });
    return kitchenOrder;
  }
}

module.exports = new KitchenOrdersRepository();
