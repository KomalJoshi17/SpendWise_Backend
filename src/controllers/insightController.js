const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { buildMonthlyInsights } = require('../services/insightService');

const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getInsights = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const income = user?.monthlyIncome || 2000;
    const now = new Date();
    const currentRange = getMonthRange(now);
    const previousRange = getMonthRange(
      new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );

    const [currentTransactions, previousTransactions] = await Promise.all([
      Transaction.find({
        userId: req.user._id,
        date: { $gte: currentRange.start, $lte: currentRange.end },
      }),
      Transaction.find({
        userId: req.user._id,
        date: { $gte: previousRange.start, $lte: previousRange.end },
      }),
    ]);

    const insights = buildMonthlyInsights({
      currentTransactions,
      previousTransactions,
      income: Number(income),
    });

    res.json(insights);
  } catch (error) {
    next(error);
  }
};

module.exports = { getInsights };