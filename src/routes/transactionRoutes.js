const express = require('express');
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.route('/').post(createTransaction).get(getTransactions);
router.route('/:id').put(updateTransaction).delete(deleteTransaction);

module.exports = router;

