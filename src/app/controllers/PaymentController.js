const PaymentsRepository = require('../repositories/PaymentsRepository');
const CommandsRepository = require('../repositories/CommandsRepository');
const { someIsEmpty } = require('../utils/someIsEmpty');
const KitchenOrdersRepository = require('../repositories/KitchenOrdersRepository');

class PaymentController {
  async index(req, res) {
    const { date } = req.query;
    const payments = await PaymentsRepository.findAll({ date });
    res.send(payments);
  }

  async pay(req, res) {
    const socket = req.io;
    const { commandId, paymentTypes, waiterExtra, observation, discount } =
      req.body;

    const hasSomeEmpty = someIsEmpty([commandId, paymentTypes]);
    if (hasSomeEmpty) {
      return res.status(400).json({
        message: 'Campos necessários não foram informados',
        paymentInfos: null,
      });
    }

    const commandToPay = await CommandsRepository.findById(commandId);

    if (!commandToPay) {
      return res
        .status(400)
        .json({ message: 'Comanda não existe', paymentInfos: null });
    }

    if (discount && Number.isNaN(discount)) {
      return res.status(400).json({
        message: 'Valor de desconto inválido',
        paymentInfos: null,
      });
    }

    // Update the command.totalPayed to the total value to be payed
    const updatedCommad = await CommandsRepository.update({
      _id: commandId,
      isActive: false,
      totalPayed: commandToPay.total,
    });

    // SOCKET -> emit that command updated
    socket.emit('command-updated', updatedCommad);

    const totalPayed = discount
      ? (commandToPay.total * 100 - discount * 100) / 100
      : commandToPay.total;

    // Create the payment
    const [paymentCreated] = await PaymentsRepository.create({
      commandId,
      paymentTypes,
      totalPayed,
      waiterExtra: Number(waiterExtra),
      observation,
    });

    // SOCKET -> emit to Home page that one payment was added
    socket.emit('payment-created', paymentCreated);

    // Delete all of kitchenOrders of command payed
    await KitchenOrdersRepository.delete({ commandId });

    res.json({ message: 'Comanda paga!', paymentInfos: paymentCreated });
  }
}

module.exports = new PaymentController();
