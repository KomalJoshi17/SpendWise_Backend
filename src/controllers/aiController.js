const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    res.json({
      success: true,
      reply: result.response.text(),
    });
  } catch (err) {
    console.error("Gemini Chat Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.aiSavingsAdvice = async (req, res) => {
  try {
    const { transactions, income, savingsGoal } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
Analyze the user's financial habits.
Income: ${income}
Savings Goal: ${savingsGoal}
Transactions:
${JSON.stringify(transactions, null, 2)}
Provide personalized advice for an Indian user.
`;
    const result = await model.generateContent(prompt);

    res.json({
      success: true,
      advice: result.response.text(),
    });
  } catch (err) {
    console.error("Gemini Savings Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.aiCategorize = async (req, res) => {
  try {
    const { description } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
Categorize this expense into one of:
food, travel, shopping, bills, entertainment, medical, education, other.
Only return the category (one word).
"${description}"
`;
    const result = await model.generateContent(prompt);
    res.json({
      success: true,
      category: result.response.text().toLowerCase(),
    });
  } catch (err) {
    console.error("Gemini Categorization Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.aiTest = async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello! Test successful.");
    res.json({
      success: true,
      keyLoaded: !!process.env.GEMINI_API_KEY,
      reply: result.response.text(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
