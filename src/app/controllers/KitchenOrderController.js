// src/controllers/KitchenOrderController.js
const CommandsRepository = require('../repositories/CommandsRepository');
const KitchenOrdersRepository = require('../repositories/KitchenOrdersRepository');

const gatherKitchenOrder = require('../utils/gatherKitchenOrder');
const { someIsEmpty } = require('../utils/someIsEmpty');

class KitchenOrderController {
  async index(req, res) {
    const { made, category } = req.query;

    // Não force 'made' quando não vier na query
    const hasMade = typeof made !== 'undefined';
    const filters = {
      ...(hasMade ? { made: made === 'true' } : {}),
      ...(category ? { category } : {}),
    };

    const kitchenOrders = await KitchenOrdersRepository.findAll(filters);
    res.send(kitchenOrders);
  }

  async store(req, res) {
    const socket = req.io;
    const {
      commandId,
      table,
      waiter,
      products,
      observation,
      isMade,
      isThawed,
      orderCategory,
      orderWaiter
    } = req.body;

    const someFieldIsEmpty = someIsEmpty([table, waiter, commandId]);
    if (someFieldIsEmpty) {
      return res.status(400).json({
        message: 'Campos obrigatórios não foram informados.',
        kitchenOrder: null,
      });
    }

    if (!products || products.length === 0) {
      return res.status(200).json({
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

    // Pedidos já enviados para a cozinha dessa comanda
    const commandKitchenOrders = await KitchenOrdersRepository.findByCommandId({ commandId });

    const completeCommandKitchenOrders =
      commandKitchenOrders.length > 0
        ? gatherKitchenOrder(commandKitchenOrders)
        : null;

    const commandProductsSendedToKitchen = completeCommandKitchenOrders?.products;

    // Verifica se houve mudança real
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

    // Calcula diferença de quantidades a preparar
    const productsToPrepare = products
      .map((product) => {
        const productPrepared = commandProductsSendedToKitchen?.find(
          ({ _id }) => _id === product._id
        );
        if (productPrepared) {
          const amountToPrepare = product.amount - productPrepared.amount;
          if (amountToPrepare < 0) return null;
          return amountToPrepare === 0 ? null : { ...product, amount: amountToPrepare };
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
      isThawed,
      orderCategory,
      orderWaiter
    });

    // SOCKET — broadcast criação (apenas se não estiver baixado)
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
    const { isMade, products, isThawed } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'Id do pedido precisa ser informado',
        kitchenOrder: null,
      });
    }

    const updatedKitchenOrder = await KitchenOrdersRepository.update({
      orderId: id,
      isMade: products?.length === 0 ? true : isMade,
      isThawed,
      products,
    });

    // SOCKET — broadcast update
    socket.emit('kitchen-order-updated', updatedKitchenOrder);

    res.json({
      message: 'Pedido da cozinha atualizado',
      kitchenOrder: updatedKitchenOrder,
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

  async getCommandOrders(req, res) {
    const { commandId } = req.params;

    if (!commandId) {
      return res.status(400).json({
        message: 'Id da comanda precisa ser informado',
      });
    }

    const commandKitchenOrders = await KitchenOrdersRepository.findByCommandId({ commandId });

    const completeCommandKitchenOrders =
      commandKitchenOrders.length > 0
        ? gatherKitchenOrder(commandKitchenOrders)
        : null;

    const commandProductsSendedToKitchen =
      completeCommandKitchenOrders?.products;

    res.send(commandProductsSendedToKitchen);
  }

  /**
   * NOVO: reordenar pedidos abertos de uma categoria
   * POST /kitchen-orders/reorder
   * body: { category: 'kitchen'|'bar', ids: string[] }  // ids na nova ordem
   */
  async reorder(req, res) {
    const socket = req.io;
    const { category, ids } = req.body;

    if (!category || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'bad request' });
    }

    try {
      const updatedList = await KitchenOrdersRepository.reorder({ category, ids });

      // SOCKET — broadcast reordenação (sala global ou por categoria, se usar rooms)
      socket.emit('kitchen-orders-reordered', {
        category,
        ids: updatedList.map(o => String(o._id)),
      });

      return res.json({
        ok: true,
        category,
        orders: updatedList,
      });
    } catch (e) {
      return res.status(400).json({ message: e.message || 'reorder failed' });
    }
  }
}

module.exports = new KitchenOrderController();
