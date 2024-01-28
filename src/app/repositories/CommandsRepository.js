/* eslint-disable no-unused-vars */
const { DateTime } = require('luxon');
const CommandModel = require('../models/command');

class CommandRepository {
  async create({ table, waiter, fishingType, products, total }) {
    try {
      const newCommand = new CommandModel({
        table,
        waiter,
        fishingType,
        products,
        total,
      });

      const command = await newCommand.save();

      return command;
    } catch (error) {
      console.log(error?.message);
      return null;
    }
  }

  async update({
    _id,
    table,
    waiter,
    fishingType,
    total,
    isActive,
    products,
    totalPayed,
    paymentTypes,
    discount,
    hasPendingOrders
  }) {
    try {
      await CommandModel.updateOne(
        { _id },
        {
          $set: {
            table,
            waiter,
            fishingType,
            total,
            isActive,
            products,
            discount,
            totalPayed: totalPayed && Number(totalPayed),
            paymentTypes,
            hasPendingOrders
          },
        }
      );

      const updatedCommand = await CommandModel.findOne({ _id });
      return updatedCommand;
    } catch (error) {
      console.log(error.message);
      // process.exit(1);
      return null;
    }
  }

  async delete(commandId) {
    await CommandModel.deleteOne({ _id: commandId });
  }

  async findAll() {
    const commands = await CommandModel.find({});
    return commands;
  }

  async findCurrentDayCommands({ isActive }) {
    // const todayDayInMonth = new Date().getDate();
    // const todayMonth = new Date().getMonth();
    // const todayYear = new Date().getFullYear();
    const todayDate = DateTime.local().setZone('UTC-3');

    const allCommands = await CommandModel.find({}).sort({
      table: 1,
      createdAt: -1,
    });
    const todayCommands = allCommands.filter((command) => {
      const createdAtDate = DateTime.fromISO(command.createdAt, {
        zone: 'pt-BR',
        setZone: true,
      });

      return (
        createdAtDate.day === todayDate.day &&
        createdAtDate.month === todayDate.month &&
        createdAtDate.year === todayDate.year
      );
    });

    if (isActive) {
      const status = isActive === 'true' ? true : 'false';

      if (status === true) {
        return todayCommands.filter((com) => com.isActive === true);
      }
      return todayCommands.filter((com) => com.isActive === false);
    }

    return todayCommands;
  }

  async findByTable({ table }) {
    const commands = await CommandModel.find({ table, isActive: true });

    const todayDayInMonth = new Date().getDate();
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();

    const [todayCommand] = await commands.filter((command) => {
      const createdAtDate = new Date(command.createdAt);
      return (
        createdAtDate.getDate() === todayDayInMonth &&
        createdAtDate.getMonth() === todayMonth &&
        createdAtDate.getFullYear() === todayYear
      );
    });

    if (todayCommand) {
      return todayCommand;
    }
    return null;
  }

  async findById(id) {
    try {
      const command = await CommandModel.findOne({ _id: id });
      return command;
    } catch (error) {
      console.log(error.message);
      return null;
    }
  }

  async deleteAll() {
    await CommandModel.deleteMany({});
  }
}

module.exports = new CommandRepository();
