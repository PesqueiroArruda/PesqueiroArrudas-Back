const CommandsRepository = require('../repositories/CommandsRepository');
const KitchenOrdersRepository = require('../repositories/KitchenOrdersRepository');

const gatherKitchenOrder = require('../utils/gatherKitchenOrder');
const { someIsEmpty } = require('../utils/someIsEmpty');

class KitchenOrderController {
  async index(req, res) {
    const { made } = req.query;
    const kitchenOrders = await KitchenOrdersRepository.findAll({
      made: made === 'true',
    });
    res.send(kitchenOrders);
  }

  async store(req, res) {
    const socket = req.io;
    const { commandId, table, waiter, products, observation, isMade, orderCategory, orderWaiter  } =
      req.body;

    const someFieldIsEmpty = someIsEmpty([table, waiter, commandId]);
    if (someFieldIsEmpty) {
      return res.status(400).json({
        message: 'Campos obrigatórios não foram informados.',
        kitchenOrder: null,
      });
    }

    if (products?.length === 0 || !products) {
      return res.status(400).json({
        message: 'Nenhum produto para ser preparado foi informado',
        kitchenOrder: null,
      });
    }

    const commandOfOrder = await CommandsRepository.findById(commandId);
    if (!commandOfOrder) {
      return res.status(400).json({
        message: 'Não existe nenhum pedido com esta comanda',
        kitchenOrder: null,
      });
    }

    // Grab the orders of this command that already was being sended to kitchen
    const commandKitchenOrders = await KitchenOrdersRepository.findByCommandId({
      commandId,
    });

    // This all orders with products gathered
    const completeCommandKitchenOrders =
      commandKitchenOrders.length > 0
        ? gatherKitchenOrder(commandKitchenOrders)
        : null;

    const commandProductsSendedToKitchen =
      completeCommandKitchenOrders?.products;

    // Verify if nothing changed;
    const preparedProductsStr = commandProductsSendedToKitchen
      ?.map(({ name, amount }) => Object.values({ name, amount }).join(''))
      ?.join('');
    const toPrepareProductsStr = products
      .map(({ name, amount }) => Object.values({ name, amount }).join(''))
      .join('');

    if (preparedProductsStr === toPrepareProductsStr) {
      return res.status(400).json({
        message: 'Nenhum produto diferente foi adicionado para ser preparado.',
        kitchenOrder: null,
      });
    }

    const productsToPrepare = products
      .map((product) => {
        const productPrepared = commandProductsSendedToKitchen?.find(
          ({ _id }) => _id === product._id
        );

        // If one same product is sended again to prepare I grabb the difference of amount of old ordering to new one
        // In past 3 Coca was ordered. Then the customer orders more 2. Here the amount of coca will be 5 (total of coca of command);
        // But from this 5 Coca's, 3 already was ordered to kitchen, so in this new order will has only 2 Coca's
        if (productPrepared) {
          const amountToPrepare = product.amount - productPrepared.amount;

          // If one product of command comes with amount less than old order returns null.
          // It's impossible to unprepare something.
          if (amountToPrepare < 0) {
            return null;
          }
          return amountToPrepare === 0
            ? null
            : { ...product, amount: amountToPrepare };
        }

        return product;
      })
      .filter(Boolean);

    if (productsToPrepare.length === 0) {
      return res.status(200).json({
        message: 'Nada a preparar.',
        kitchenOrder: null,
      });
    }

    await CommandsRepository.update({
      _id: commandId,
      hasPendingOrders: false
    });

    const kitchenOrderCreated = await KitchenOrdersRepository.create({
      commandId,
      table,
      waiter,
      products: productsToPrepare,
      observation,
      isMade,
      orderCategory,
      orderWaiter
    });

    // SOCKET
    if (!isMade) {
      socket.emit('kitchen-order-created', kitchenOrderCreated);
    }

    res.json({
      message: 'Pedido registrado na cozinha',
      kitchenOrder: kitchenOrderCreated,
    });
  }

  async update(req, res) {
    const socket = req.io;
    const { id } = req.params;
    const { isMade, products } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'Id do pedido precisa ser informado',
        kitchenOrder: null,
      });
    }

    const updatedKitchenOrder = await KitchenOrdersRepository.update({
      orderId: id,
      isMade: products?.length === 0 ? true : isMade,
      products,
    });

    // SOCKET
    socket.emit('kitchen-order-updated', updatedKitchenOrder);

    res.json({
      message: 'Pedido da cozinha atualizado',
      kitchenOrder: updatedKitchenOrder,
    });
  }

  async show(req, res) {
    const { id } = req.params;

    const kitchenOrder = await KitchenOrdersRepository.findById(id);

    if (!kitchenOrder) {
      return res.status(400).json({
        message: 'Pedido da cozinha não encontrado',
        kitchenOrder: null,
      });
    }

    return res.json({
      kitchenOrder,
      message: 'Pedido da cozinha encontrado',
    });
  }

  async delete(req, res) {
    const socket = req.io;
    const { commandId } = req.params;

    if (!commandId) {
      return res.status(400).json({
        message: 'Id da comanda precisa ser informado',
      });
    }

    await KitchenOrdersRepository.delete({ commandId });

    socket.emit('kitchen-order-deleted', { commandId });

    res.json({ message: 'Pedidos da cozinha desta comanda foram deletados' });
  }

  async getCommandOrders(req, res) {
    const { commandId } = req.params;

    if (!commandId) {
      return res.status(400).json({
        message: 'Id da comanda precisa ser informado',
      });
    }

    // Grab the orders of this command that already was being sended to kitchen
    const commandKitchenOrders = await KitchenOrdersRepository.findByCommandId({
      commandId,
    });

    // This all orders with products gathered
    const completeCommandKitchenOrders =
      commandKitchenOrders.length > 0
        ? gatherKitchenOrder(commandKitchenOrders)
        : null;

    const commandProductsSendedToKitchen =
      completeCommandKitchenOrders?.products;

    res.send(commandProductsSendedToKitchen);
  }
}

module.exports = new KitchenOrderController();
