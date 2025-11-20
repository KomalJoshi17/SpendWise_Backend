const express = require("express");
const { CohereClient } = require("cohere-ai");
const { categorizeTransaction, getSavingsRecommendations } = require("../services/cohereService");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const COHERE_API_KEY = process.env.COHERE_API_KEY?.trim();

let cohere = null;
if (COHERE_API_KEY && COHERE_API_KEY.length > 20) {
  cohere = new CohereClient({ token: COHERE_API_KEY });
  console.log("✅ Cohere API initialized successfully");
} else {
  console.warn("❌ COHERE_API_KEY missing or invalid in .env");
}

const router = express.Router();
router.use(authMiddleware);

router.post("/chat", async (req, res) => {
  try {
    if (!cohere) {
      return res.json({
        response:
          "AI features require a valid COHERE_API_KEY. Please set it in your backend .env file.",
      });
    }

    const { message, context } = req.body;

    const systemMessage = context || 'You are a friendly Indian financial advisor helping users save money. Give practical, actionable advice.';

    console.log('Using Cohere Chat API for chat');
    const startTime = Date.now();
    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: `${systemMessage}\n\nUser: ${message}\n\nAssistant:`,
      maxTokens: 500,
      temperature: 0.7,
    });
    const duration = Date.now() - startTime;
    console.log(`Chat API response time: ${duration}ms`);

    const text = response.text || 'I apologize, but I could not generate a response.';

    res.json({ response: text.trim() });
  } catch (error) {
    console.error("Chat Error:", error.message);
    console.error("Error details:", error);
    res.json({ response: "I apologize, but I'm having trouble processing your request. Please try again later." });
  }
});

router.get("/savings", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    const recommendations = await getSavingsRecommendations(
      transactions,
      user.monthlyIncome || 0,
      user.savingsGoal || 0
    );

    res.json({ recommendations });
  } catch (error) {
    console.error("Savings Error:", error.message);
    res.json({ 
      recommendations: [
        'Track your daily expenses to identify unnecessary spending.',
        'Consider cooking at home more often to reduce food expenses.',
        'Review your subscriptions and cancel unused services.'
      ]
    });
  }
});

router.post("/categorize", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: 'Description required' });
    }
    
    const category = await categorizeTransaction(description);
    res.json({ category });
  } catch (error) {
    console.error("Category Error:", error.message);
    res.json({ category: "other" });
  }
});

router.get("/twin", async (req, res) => {
  try {
    if (!cohere) {
      return res.status(503).json({
        message: "AI features require a valid COHERE_API_KEY. Please set it in your backend .env file.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: ninetyDaysAgo },
    }).sort({ date: -1 });

    let totalCredit = 0;
    let totalDebit = 0;
    const categoryCounts = {};
    let weekendCount = 0;
    let weekdayCount = 0;
    let lateNightCount = 0;
    const categoryTotals = {};
    const weeklySpends = {};
    const spendingSpikes = [];

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();

      if (txn.type === 'credit') {
        totalCredit += txn.amount;
      } else {
        totalDebit += txn.amount;
      }

      categoryCounts[txn.category] = (categoryCounts[txn.category] || 0) + 1;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCount++;
      } else {
        weekdayCount++;
      }

      if (hour >= 20 || hour < 2) {
        lateNightCount++;
      }

      if (txn.type === 'debit') {
        categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
      }

      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      if (!weeklySpends[weekKey]) {
        weeklySpends[weekKey] = 0;
      }
      if (txn.type === 'debit') {
        weeklySpends[weekKey] += txn.amount;
      }
    });

    const mostFrequentCategory = Object.keys(categoryCounts).reduce((a, b) =>
      categoryCounts[a] > categoryCounts[b] ? a : b, 'other'
    );

    const biggestCategory = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b, 'other'
    );

    const weekKeys = Object.keys(weeklySpends);
    const avgSpendPerWeek = weekKeys.length > 0
      ? weekKeys.reduce((sum, key) => sum + weeklySpends[key], 0) / weekKeys.length
      : 0;

    weekKeys.forEach((key) => {
      if (weeklySpends[key] > avgSpendPerWeek * 1.5) {
        spendingSpikes.push({
          week: key,
          amount: weeklySpends[key],
        });
      }
    });

    const weekendRatio = transactions.length > 0
      ? ((weekendCount / transactions.length) * 100).toFixed(1)
      : 0;

    const transactionSummary = `
Total Credit: ₹${totalCredit}
Total Debit: ₹${totalDebit}
Most Frequent Category: ${mostFrequentCategory}
Total Transactions: ${transactions.length}
Weekend vs Weekday Ratio: ${weekendRatio}% weekend
Late Night Spends (8 PM - 2 AM): ${lateNightCount} transactions
Biggest Spending Category: ${biggestCategory} (₹${categoryTotals[biggestCategory] || 0})
Average Spend per Week: ₹${avgSpendPerWeek.toFixed(2)}
Spending Spikes: ${spendingSpikes.length} weeks with unusually high spending
Monthly Income: ₹${user.monthlyIncome || 0}
Savings Goal: ₹${user.savingsGoal || 0}
Category Breakdown: ${JSON.stringify(categoryTotals)}
`;

    const aiPrompt = `You are an advanced financial behavior analyst. Analyze the user's spending patterns and generate a detailed personality profile.

Based on the data below, respond ONLY in structured JSON:

{
  "personalityName": "",
  "description": "",
  "strengths": [],
  "weaknesses": [],
  "riskScore": "",
  "habitToImprove": "",
  "predictedSavings": 0
}

Data:
${transactionSummary}`;

    console.log('Using Cohere Chat API for AI Spending Twin');
    const startTime = Date.now();
    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: aiPrompt,
      maxTokens: 800,
      temperature: 0.7,
    });
    const duration = Date.now() - startTime;
    console.log(`AI Twin API response time: ${duration}ms`);

    // Parse JSON response
    let twinData;
    try {
      const text = response.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        twinData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback data
      twinData = {
        personalityName: "The Balanced Spender",
        description: "You maintain a balanced approach to spending and saving.",
        strengths: ["Regular expense tracking", "Consistent spending patterns", "Good category distribution"],
        weaknesses: ["Could save more", "Some impulse purchases", "Room for optimization"],
        riskScore: "Medium",
        habitToImprove: "Set a monthly budget and stick to it",
        predictedSavings: Math.max(0, (user.monthlyIncome || 0) - totalDebit / 3)
      };
    }

    res.json(twinData);
  } catch (error) {
    console.error("AI Twin Error:", error.message);
    console.error("Error details:", error);
    res.status(500).json({
      message: "Failed to generate AI Spending Twin. Please try again later.",
      error: error.message
    });
  }
});

router.post("/tip", async (req, res) => {
  try {
    if (!cohere) {
      return res.json({
        tip: "Always track your expenses to manage your budget better.",
      });
    }

    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; 
    const timestamp = Date.now(); 
    
    const systemMessage = 'You are a financial advisor providing daily tips. Keep responses concise (1-2 sentences).';
    const userMessage = `Give one short, practical daily money-saving tip for Indian users for ${dateString}. Make it unique and different. Keep it concise (1-2 sentences).`;

    console.log('Using Cohere Chat API for tip');
    const startTime = Date.now();
    const response = await cohere.chat({
      model: 'command-r7b-12-2024',
      message: `${systemMessage}\n\n${userMessage}`,
      maxTokens: 100,
      temperature: 0.8,
    });
    const duration = Date.now() - startTime;
    console.log(`Tip API response time: ${duration}ms`);

    const text = response.text?.trim() || "Save money by tracking all daily expenses.";

    res.json({ tip: text });
  } catch (error) {
    console.error("Tip Error:", error.message);
    console.error("Error details:", error);
    res.json({ tip: "Save money by tracking all daily expenses." });
  }
});

module.exports = router;
