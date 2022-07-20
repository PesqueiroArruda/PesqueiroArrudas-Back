/* eslint-disable array-callback-return */
function gatherKitchenOrder(commandsKitchenOrder) {
  return commandsKitchenOrder.reduce((acc, cur) => {
    const accProducts = acc.products;
    const curProducts = cur.products;

    let gatheredProducts;

    if (accProducts.length >= curProducts.length) {
      const sameProductsUpdated = accProducts.map((accProduct) => {
        const product = curProducts.find(({ _id }) => _id === accProduct._id);
        if (product) {
          const amountPrepared = accProduct.amount + product.amount;
          return {
            _id: accProduct._id,
            name: accProduct.name,
            amount: Number(amountPrepared),
            isMade: accProduct.isMade,
          };
        }

        return {
          _id: accProduct._id,
          name: accProduct.name,
          amount: accProduct.amount,
          isMade: accProduct.isMade,
        };
      });

      const diffProducts = curProducts.filter((curProduct) =>
        accProducts.every((accProduct) => accProduct._id !== curProduct._id)
      );

      gatheredProducts = [...sameProductsUpdated, ...diffProducts];
      return {
        _id: cur._id,
        commandId: cur.commandId,
        table: cur.table,
        waiter: cur.waiter,
        observation: cur.observation,
        products: gatheredProducts,
        isMade: cur.isMade,
      };
    }

    if (curProducts.length > accProducts.length) {
      const sameProductsUpdated = curProducts.map((curProduct) => {
        const product = accProducts.find(({ _id }) => _id === curProduct._id);
        if (product) {
          const amountPrepared = curProduct.amount + product.amount;
          // return { ...curProduct, amount: amountPrepared };

          return {
            _id: curProduct._id,
            name: curProduct.name,
            amount: Number(amountPrepared),
            isMade: curProduct.isMade,
          };
        }

        return {
          _id: curProduct._id,
          name: curProduct.name,
          amount: curProduct.amount,
          isMade: curProduct.isMade,
        };
      });

      const diffProducts = accProducts.filter((accProduct) =>
        curProducts.every((curProduct) => curProduct._id !== accProduct._id)
      );

      gatheredProducts = [...sameProductsUpdated, ...diffProducts];
      return {
        _id: acc._id,
        commandId: acc.commandId,
        table: acc.table,
        waiter: acc.waiter,
        observation: acc.observation,
        products: gatheredProducts,
        isMade: acc.isMade,
      };
    }
  });
}

module.exports = gatherKitchenOrder;
