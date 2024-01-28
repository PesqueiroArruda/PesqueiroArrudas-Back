const CommandsRepository = require('../repositories/CommandsRepository');
const PaymentsRepository = require('../repositories/PaymentsRepository');
const ProductsRepository = require('../repositories/ProductsRepository');
const { someIsEmpty } = require('../utils/someIsEmpty');
const { verifyChanges } = require('../utils/verifyIfProductsChange');

class CommandController {
  async index(req, res) {
    const { isActive } = req.query;
    const commands = await CommandsRepository.findCurrentDayCommands({
      isActive,
    });
    res.send(commands);
  }

  async store(req, res) {
    const socket = req.io;
    const { table, waiter, fishingType } = req.body;

    const hasFieldEmpty = someIsEmpty([table, waiter, fishingType]);
    if (hasFieldEmpty) {
      return res.status(400).json({
        message: 'Campos obrigatórios foram esquecidos.',
        product: null,
      });
    }

    // If one command that it's active has the same name, we throw an error
    const tableExists = await CommandsRepository.findByTable({ table });
    if (tableExists) {
      return res.status(400).json({
        message: 'O nome da mesa já está em uso.',
        product: null,
      });
    }

    const products = [];

    if (fishingType.toLowerCase() === 'pesca esportiva') {
      const [{ _id, name, imageURL, category, unitPrice }] =
        await ProductsRepository.findByName('Pesca Esportiva');
      products.push({ _id, name, imageURL, category, unitPrice, amount: 1 });
    }

    if (fishingType.toLowerCase() === 'pesque pague') {
      const [{ _id, name, imageURL, category, unitPrice }] =
        await ProductsRepository.findByName('Pesque Pague');
      products.push({ _id, name, imageURL, category, unitPrice, amount: 1 });
    }

    const commandTotal = products
      ?.reduce(
        (amount, current) => amount + current.amount * current.unitPrice,
        0
      )
      .toFixed(2);

    const newCommand = await CommandsRepository.create({
      table,
      waiter,
      fishingType,
      products,
      total: Number(commandTotal) || 0,
    });

    // SOCKET
    socket.emit('command-created', newCommand);

    return res.json({ message: 'Comanda adicionada', command: newCommand });
  }

  async update(req, res) {
    const socket = req.io;
    const { id } = req.params;
    const { updateTotal } = req.query;
    const {
      table,
      waiter,
      fishingType,
      isActive,
      products,
      total,
      paymentType,
      discount
    } = req.body;


    if (!id) {
      return res
        .status(400)
        .json({ message: 'ID é necessário. ', command: null });
    }

    const commandToUpdate = await CommandsRepository.findById(id);
    if (!commandToUpdate) {
      return res
        .status(400)
        .json({ message: 'Esta comanda não existe', command: null });
    }

    const newProducts = products
      .filter((item) => item.category === 'Pratos' || item.category === "Bebidas-Cozinha" || item.category === "Porções")
      .map((product) => ({
        name: product.name,
        amount: product.amount,
        id: product._id,
      })) || [];


    const hasSomeProductToSendToKitchen = verifyChanges(commandToUpdate.products, newProducts)

    let hasPendingOrders
    if (hasSomeProductToSendToKitchen) {
      hasPendingOrders = true
    }


    const tableExists = await CommandsRepository.findByTable({ table });
    if (tableExists && tableExists._id.valueOf() !== id) {
      return res
        .status(400)
        .json({ message: 'Já existe uma mesa com este nome', command: null });
    }

    const commandTotal = products?.reduce(
      (amount, current) => amount + current.amount * current.unitPrice,
      0
    );

    // When decreasing the R$ total of command, I'm verifying if is less than the amount already payed
    if (commandTotal < commandToUpdate.totalPayed) {
      return res.status(400).json({
        message: 'O total da comanda ficará menor do que já foi pago',
      });
    }

    // If any products were sended this variable will be undefined
    // so the total of the command will not be changed
    const commandTotalFormatted =
      commandTotal && Number(commandTotal).toFixed(2);

    const newTotalPayed =
      Math.round((commandToUpdate.totalPayed + total + Number.EPSILON) * 100) /
      100;

    if (newTotalPayed > commandToUpdate.total) {
      return res.status(400).json({
        message: 'Valor pago maior que o necessário para a comanda',
        command: null,
      });
    }

    const paymentTypes = [...commandToUpdate.paymentTypes, paymentType];


    console.log({
      _id: id,
      table,
      waiter,
      fishingType,
      total: commandTotalFormatted,
      isActive,
      products,
      discount,
      totalPayed: updateTotal === 'true' ? newTotalPayed : undefined,
      paymentTypes: paymentTypes.filter(Boolean),
      hasPendingOrders: hasPendingOrders || false
    })

    const updatedCommand = await CommandsRepository.update({
      _id: id,
      table,
      waiter,
      fishingType,
      total: commandTotalFormatted,
      isActive,
      products,
      discount,
      totalPayed: updateTotal === 'true' ? newTotalPayed : undefined,
      paymentTypes: paymentTypes.filter(Boolean),
      hasPendingOrders: hasPendingOrders || false
    });

    if (updatedCommand === null) {
      return res
        .status(500)
        .json({ message: 'Erro Interno. Recarregue a página.', command: null });
    }

    // SOCKET
    socket.emit('command-updated', updatedCommand);

    res.json({ message: 'Comanda atualizada', command: updatedCommand });
  }

  async delete(req, res) {
    const socket = req.io;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'O ID da comanda precisa ser informado para sua deleção.',
      });
    }

    const commandToDelete = await CommandsRepository.findById(id);
    if (!commandToDelete?.isActive) {
      // delete payment
      const paymentResult = await PaymentsRepository.deleteByCommandId(
        commandToDelete?._id
      );
      if (paymentResult === null) {
        return res.status(400).json({
          message: 'Algo deu errado. Reinicie a página',
        });
      }
    }

    await CommandsRepository.delete(id);

    // SOCKET
    socket.emit('command-deleted', id);

    res.status(200).json({ message: 'Comanda deletada' });
  }

  async show(req, res) {
    const { id } = req.params;

    const command = await CommandsRepository.findById(id);

    if (!command) {
      return res
        .status(404)
        .json({ message: 'Comanda não encontrada', command: null });
    }

    return res.json({ message: 'Comanda encontrada ', command });
  }
}

module.exports = new CommandController();
