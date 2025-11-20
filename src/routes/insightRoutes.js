const express = require('express');
const { getInsights } = require('../controllers/insightController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/monthly', authMiddleware, getInsights);

module.exports = router;

