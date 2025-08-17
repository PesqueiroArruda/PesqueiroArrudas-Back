// src/repositories/KitchenOrdersRepository.js
const KitchenOrder = require('../models/KitchenOrder');

/**
 * Helpers internos
 */
async function getNextPosition(category) {
  // Maior 'position' entre pedidos ABERTOS da categoria
  const last = await KitchenOrder
    .findOne({ orderCategory: category, isMade: false })
    .sort({ position: -1 })
    .select('position')
    .lean();

  return last ? last.position + 1 : 0;
}

async function compactPositions(category) {
  // Opcional: normaliza posições para 0..n-1 após remoções/baixas
  const open = await KitchenOrder
    .find({ orderCategory: category, isMade: false })
    .sort({ position: 1, createdAt: 1 })
    .select('_id')
    .lean();

  const ops = open.map((d, idx) => ({
    updateOne: { filter: { _id: d._id }, update: { $set: { position: idx } } }
  }));

  if (ops.length) {
    await KitchenOrder.bulkWrite(ops, { ordered: false });
  }
}

class KitchenOrdersRepository {
  /**
   * Lista pedidos com filtros opcionais:
   *  - made: boolean (true = baixados, false = abertos)
   *  - category: 'kitchen' | 'bar'
   * Sempre ordena por position (fallback createdAt).
   */
  async findAll({ made, category } = {}) {
    const query = {};
    if (typeof made === 'boolean') query.isMade = made;
    if (category) query.orderCategory = category;

    const kitchenOrders = await KitchenOrder
      .find(query)
      .sort({ position: 1, createdAt: 1 });

    return kitchenOrders;
  }

  /**
   * Cria um pedido. Se for criado como "aberto" (isMade !== true),
   * define position como o próximo índice da categoria.
   */
  async create({ commandId, table, waiter, products, observation, isMade, isThawed, orderCategory, orderWaiter }) {
    const category = orderCategory || 'kitchen';
    const position = isMade === true ? null : await getNextPosition(category);

    const newKitchenOrder = new KitchenOrder({
      commandId,
      table,
      waiter,
      products,
      observation,
      isMade,
      isThawed,
      orderCategory: category,
      orderWaiter,
      position,
    });

    const kitchenOrder = await newKitchenOrder.save();
    return kitchenOrder;
  }

  /**
   * Atualiza um pedido.
   * Ao baixar (isMade === true), limpa a position e (opcional) compacta as demais.
   */
  async update({ orderId, isMade, products, isThawed }) {
    // Monta update básico
    const update = {};
    if (typeof isMade === 'boolean') update.isMade = isMade;
    if (typeof isThawed === 'boolean') update.isThawed = isThawed;
    if (products) update.products = products;

    // Se baixou, tira da lista ordenável
    if (isMade === true) {
      update.position = null;
    }

    await KitchenOrder.updateOne({ _id: orderId }, { $set: update });

    // Se baixou, compata posições dos abertos da mesma categoria (opcional)
    if (isMade === true) {
      const doc = await KitchenOrder.findOne({ _id: orderId }).select('orderCategory').lean();
      if (doc?.orderCategory) {
        await compactPositions(doc.orderCategory);
      }
    }

    const updatedKitchenOrder = await KitchenOrder.findOne({ _id: orderId });
    return updatedKitchenOrder;
  }

  async delete({ commandId }) {
    await KitchenOrder.deleteMany({ commandId });
  }

  async findByCommandId({ commandId }) {
    const kitchenOrders = await KitchenOrder.find({ commandId }).sort({ position: 1, createdAt: 1 });
    return kitchenOrders;
  }

  async findById(_id) {
    const kitchenOrder = await KitchenOrder.findOne({ _id });
    return kitchenOrder;
  }

  /**
   * Reordena os pedidos ABERTOS de uma categoria.
   * Recebe os IDs na nova ordem (apenas dos ABERTOS visíveis).
   * Retorna a lista atualizada e ordenada.
   */
  async reorder({ category, ids }) {
    if (!category || !Array.isArray(ids)) {
      throw new Error('bad request');
    }

    // Garante que todos são ABERTOS daquela categoria
    const open = await KitchenOrder.find(
      { _id: { $in: ids }, orderCategory: category, isMade: false },
      { _id: 1 }
    ).lean();

    const valid = new Set(open.map(o => String(o._id)));
    const filtered = ids.filter(id => valid.has(String(id)));

    // Aplica position = índice
    const ops = filtered.map((id, idx) => ({
      updateOne: { filter: { _id: id }, update: { $set: { position: idx } } }
    }));

    if (ops.length) {
      await KitchenOrder.bulkWrite(ops, { ordered: false });
    }

    // Retorna lista atualizada
    const updated = await KitchenOrder
      .find({ orderCategory: category, isMade: false })
      .sort({ position: 1, createdAt: 1 });

    return updated;
  }
}

module.exports = new KitchenOrdersRepository();
