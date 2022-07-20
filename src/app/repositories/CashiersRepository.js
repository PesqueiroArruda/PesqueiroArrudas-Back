const { DateTime } = require('luxon');
const Cashier = require('../models/Cashier');

class CashiersRepository {
  async findAll(date) {
    const cashiers = await Cashier.find({}).sort({ date: -1 });

    const dt = DateTime.fromISO(date, { zone: 'pt-BR', setZone: true });
    if (date) {
      return cashiers.filter((cashier) => {
        const cdt = DateTime.fromJSDate(cashier.date);

        if (
          dt.day === cdt.day &&
          dt.month === cdt.month &&
          dt.year === cdt.year
        ) {
          return true;
        }
        return false;
      });
    }

    return cashiers;
  }

  async create({ total, date, payments }) {
    const cashier = new Cashier({
      total,
      date,
      payments,
    });

    const cashierCreated = await cashier.save();
    return cashierCreated;
  }

  async delete(_id) {
    await Cashier.deleteOne({ _id });
  }

  async findById(_id) {
    const cashier = await Cashier.findOne({ _id });
    return cashier;
  }
}

module.exports = new CashiersRepository();
