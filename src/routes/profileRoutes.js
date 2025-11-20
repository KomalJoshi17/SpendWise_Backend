const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  requestEmailOtp,
  verifyEmailOtp
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);

router.post('/request-email-change', requestEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);

module.exports = router;
