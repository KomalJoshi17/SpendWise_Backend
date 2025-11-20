const express = require('express');
const passport = require('passport');
const { googleCallback, googleFailure, logout } = require('../controllers/authGoogleController');

const router = express.Router();

const isGoogleOAuthEnabled = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

router.get(
  '/google',
  (req, res, next) => {
    if (!isGoogleOAuthEnabled) {
      return res.status(503).json({
        message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.',
      });
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // We use JWT, not sessions
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure',
    session: false,
  }),
  googleCallback
);

router.get('/google/failure', googleFailure);

router.post('/logout', logout);

module.exports = router;

