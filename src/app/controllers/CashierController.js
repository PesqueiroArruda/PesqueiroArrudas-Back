/* eslint-disable no-shadow */
const { DateTime } = require('luxon');
const CashiersRepository = require('../repositories/CashiersRepository');
const PaymentsRepository = require('../repositories/PaymentsRepository');

class CashierController {
  async index(req, res) {
    const { date } = req.query;

    const cashiers = await CashiersRepository.findAll(date);
    res.send(cashiers);
  }

  async closeCashier(req, res) {
    const socket = req.io;
    const { payments, date } = req.body;

    if (!date || !payments) {
      return res.status(400).json({
        message: 'Informe a data e os pagamentos para o fechamento do caixa.',
        cashier: null,
      });
    }

    if (payments.length === 0) {
      return res.status(400).json({
        message: 'Nenhum pagamento foi realizado. Impossível fechar o caixa.',
        cashier: null,
      });
    }

    const cashierDate = DateTime.fromISO(date, {
      zone: 'pt-BR',
      setZone: true,
    });
    const dateDay = cashierDate.day;
    const dateMonth = cashierDate.month;
    const dateYear = cashierDate.year;

    const cashiers = await CashiersRepository.findAll();
    const hasSomeCashierInThisDate = cashiers.find(({ date }) => {
      const dt = DateTime.fromISO(date, { zone: 'pt-BR', setZone: true });
      if (
        dt.day === dateDay &&
        dt.month === dateMonth &&
        dt.year === dateYear
      ) {
        return true;
      }
      return false;
    });

    if (hasSomeCashierInThisDate) {
      await CashiersRepository.delete(hasSomeCashierInThisDate._id.valueOf());
    }

    const cashierTotal = payments.reduce(
      (total, cur) =>
        Number(((total * 100 + cur.totalPayed * 100) / 100).toFixed(2)),
      0
    );

    const cashierCreated = await CashiersRepository.create({
      total: cashierTotal,
      date: cashierDate.toISO(),
      payments,
    });

    // Delete all payment of 10 days ago
    const past10Day = cashierDate.minus({ days: 10 }).setLocale('pt-BR');
    await PaymentsRepository.dropPayments({ date: past10Day });

    // SOCKET
    socket.emit('cashier-created', cashierCreated);

    res.json({ cashier: cashierCreated, message: 'Caixa fechado! ' });
  }

  async show(req, res) {
    const { id } = req.params;

    const cashier = await CashiersRepository.findById(id);
    if (!cashier) {
      return res.status(400).json({
        message: 'Não existe nenhum caixa fechado com este ID',
        cashier: null,
      });
    }

    res.json({
      message: 'Caixa fechado encontrado com sucesso.',
      cashier,
    });
  }
}

module.exports = new CashierController();
