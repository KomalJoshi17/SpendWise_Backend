const { CohereClient } = require('cohere-ai');

const COHERE_API_KEY = process.env.COHERE_API_KEY?.trim();
const cohere = COHERE_API_KEY && COHERE_API_KEY !== 'your_cohere_api_key_here' 
  ? new CohereClient({ token: COHERE_API_KEY }) 
  : null;

/**
 * Categorize a transaction description using Cohere AI
 * @param {string} description - Transaction description
 * @returns {Promise<string>} - Category name
 */
async function categorizeTransaction(description) {
  try {
    if (!cohere || !COHERE_API_KEY) {
      const { categorize } = require('./categorizer');
      return categorize(description);
    }

    const systemMessage = 'You are a helpful assistant that categorizes expenses. Always respond with only the category name from the list: food, travel, shopping, bills, entertainment, medical, education, other.';
    const userMessage = `Categorize this expense: "${description}". Respond with ONLY the category name.`;

    console.log('Using Cohere Chat API for categorization');
    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: `${systemMessage}\n\n${userMessage}`,
      maxTokens: 10,
      temperature: 0.3,
    });

    const category = response.text?.trim().toLowerCase() || 'other';

    const validCategories = ['food', 'travel', 'shopping', 'bills', 'entertainment', 'medical', 'education', 'other'];
    if (validCategories.includes(category)) {
      return category;
    }

    return 'other';
  } catch (error) {
    console.error('Cohere categorization error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode
    });

    const { categorize } = require('./categorizer');
    return categorize(description);
  }
}

/**
 * Get AI savings recommendations based on spending data
 * @param {Array} transactions - Array of transaction objects
 * @param {number} monthlyIncome - User's monthly income
 * @param {number} savingsGoal - User's savings goal
 * @returns {Promise<Array>} - Array of recommendation strings
 */

async function getSavingsRecommendations(transactions, monthlyIncome, savingsGoal) {
  try {
    if (!cohere || !COHERE_API_KEY) {
      return [
        'Track your daily expenses to identify unnecessary spending.',
        'Consider cooking at home more often to reduce food expenses.',
        'Review your subscriptions and cancel unused services.',
      ];
    }

    const categoryTotals = {};
    let totalSpent = 0;

    transactions.forEach((txn) => {
      if (txn.type === 'debit') {
        totalSpent += txn.amount;
        categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
      }
    });

    const systemMessage = 'You are a personal financial advisor specializing in helping Indian users save money. Provide practical, actionable advice based on spending patterns.';
    const userMessage = `Analyze this spending data and provide 3-5 specific, actionable recommendations for saving money based on Indian spending habits.

Monthly Income: ₹${monthlyIncome}
Savings Goal: ₹${savingsGoal}
Total Spent: ₹${totalSpent}
Category Breakdown: ${JSON.stringify(categoryTotals)}

Provide recommendations in this format:
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

Focus on:
- Where to cut expenses
- Where overspending occurred
- How to reach the savings goal
- Indian context (local prices, habits, etc.)

Keep each recommendation concise (1-2 sentences).`;

    console.log('Using Cohere Chat API for savings recommendations');
    const startTime = Date.now();
    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: `${systemMessage}\n\n${userMessage}`,
      maxTokens: 300,
      temperature: 0.7,
    });
    const duration = Date.now() - startTime;
    console.log(`Savings recommendations API response time: ${duration}ms`);

    const text = response.text || '';

    const recommendations = text
      .split('\n')
      .filter((line) => /^\d+\./.test(line.trim()))
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 5); 

    return recommendations.length > 0 ? recommendations : [
      'Track your expenses daily to stay within budget.',
      'Set aside savings at the start of the month.',
      'Review and reduce unnecessary subscriptions.',
    ];
  } catch (error) {
    console.error('Cohere savings recommendations error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode
    });
    return [
      'Track your daily expenses to identify unnecessary spending.',
      'Consider cooking at home more often to reduce food expenses.',
      'Review your subscriptions and cancel unused services.',
    ];
  }
}

module.exports = {
  categorizeTransaction,
  getSavingsRecommendations,
};
