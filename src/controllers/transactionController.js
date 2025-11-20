const Transaction = require('../models/Transaction');
const { categorizeTransaction } = require('../services/cohereService');

const createTransaction = async (req, res, next) => {
  try {
    const { amount, description, date, type = 'debit' } = req.body;
    if (!amount || !description) {
      return res.status(400).json({ message: 'Amount and description required' });
    }

    if (!['debit', 'credit'].includes(type)) {
      return res.status(400).json({ message: 'Type must be debit or credit' });
    }

    const category = await categorizeTransaction(description);
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      description,
      category,
      type,
      date: date || Date.now(),
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      date: -1,
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, description, date } = req.body;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (amount !== undefined) transaction.amount = amount;
    if (description) {
      transaction.description = description;
      transaction.category = await categorizeTransaction(description);
    }
    if (date) transaction.date = date;
    if (req.body.type) {
      if (!['debit', 'credit'].includes(req.body.type)) {
        return res.status(400).json({ message: 'Type must be debit or credit' });
      }
      transaction.type = req.body.type;
    }

    await transaction.save();

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};

