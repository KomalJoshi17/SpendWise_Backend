const { categories } = require('./categorizer');

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const sumTransactions = (transactions = []) =>
  transactions.reduce((total, txn) => total + txn.amount, 0);

const buildCategorySummary = (transactions = [], totalSpent = 0) => {
  const summary = {};
  transactions.forEach((txn) => {
    const key = txn.category || 'others';
    if (!summary[key]) {
      summary[key] = { amount: 0, percentage: 0 };
    }
    summary[key].amount += txn.amount;
  });

  Object.keys(summary).forEach((key) => {
    summary[key].percentage = totalSpent
      ? Number(((summary[key].amount / totalSpent) * 100).toFixed(1))
      : 0;
  });

  return summary;
};

const percentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const generateTips = ({
  totalSpent,
  income,
  currentSummary,
  currentTotal,
  previousSummary,
}) => {
  const tips = [];
  const foodSpent = currentSummary.food?.amount || 0;
  const shoppingNow = currentSummary.shopping?.amount || 0;
  const shoppingPrev = previousSummary.shopping?.amount || 0;
  const shoppingIncrease = percentageChange(shoppingNow, shoppingPrev);

  if (totalSpent && foodSpent > 0.25 * totalSpent) {
    tips.push('Food expenses are high this month.');
  }

  if (shoppingIncrease > 15) {
    tips.push('Shopping increased significantly.');
  }

  if (totalSpent > income * 0.7) {
    tips.push('You are close to your spending limit.');
  }

  const orderedCategories = Object.entries(currentSummary).sort(
    (a, b) => b[1].percentage - a[1].percentage
  );

  if (orderedCategories.length) {
    const [topCategory] = orderedCategories;
    tips.push(
      `You are spending the most on ${topCategory[0]} (${topCategory[1].percentage}%).`
    );
  }

  Object.keys(categories).forEach((category) => {
    const currentAmount = currentSummary[category]?.amount || 0;
    const previousAmount = previousSummary[category]?.amount || 0;
    const change = percentageChange(currentAmount, previousAmount);
    if (change > 20) {
      tips.push(`${category} expenses grew ${change}% compared to last month.`);
    }
  });

  if (!tips.length && currentTotal === 0) {
    tips.push('No spending recorded yet. Add your first transaction!');
  }

  return [...new Set(tips)].slice(0, 5);
};

const buildMonthlyInsights = ({
  currentTransactions,
  previousTransactions,
  income = 2000,
}) => {
  const totalSpent = sumTransactions(currentTransactions);
  const previousSpent = sumTransactions(previousTransactions);
  const changeFromLastMonth = percentageChange(totalSpent, previousSpent);

  const categoryBreakdown = buildCategorySummary(
    currentTransactions,
    totalSpent
  );
  const previousBreakdown = buildCategorySummary(
    previousTransactions,
    previousSpent
  );

  const tips = generateTips({
    totalSpent,
    income,
    currentSummary: categoryBreakdown,
    currentTotal: totalSpent,
    previousSummary: previousBreakdown,
  });

  return {
    totalSpent,
    previousMonthTotal: previousSpent,
    changeFromLastMonth,
    categoryBreakdown,
    monthLabel: MONTH_NAMES[new Date().getMonth()],
    tips,
  };
};

module.exports = { buildMonthlyInsights };

