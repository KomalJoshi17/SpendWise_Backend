const categories = {
  food: ['food', 'pizza', 'restaurant', 'burger', 'meal'],
  travel: ['uber', 'bus', 'train', 'flight', 'taxi'],
  shopping: ['amazon', 'flipkart', 'clothes', 'mall'],
  bills: ['wifi', 'electricity', 'water', 'recharge'],
};

function categorize(description) {
  const text = description.toLowerCase();

  for (const category in categories) {
    if (categories[category].some((word) => text.includes(word))) {
      return category;
    }
  }

  return 'others';
}

module.exports = { categories, categorize };

