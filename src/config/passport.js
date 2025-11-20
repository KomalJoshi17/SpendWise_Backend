const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const { id, displayName, emails, photos } = profile;
          const email = emails && emails[0] ? emails[0].value : null;
          const picture = photos && photos[0] ? photos[0].value : null;

          if (!email) {
            return done(new Error('Email not provided by Google'), null);
          }

          // Pass user data to callback
          return done(null, {
            id,
            email,
            name: displayName,
            picture,
          });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy configured');
} else {
  console.warn('⚠️  Google OAuth credentials not found. Google sign-in will be disabled.');
  console.warn('   Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to enable Google OAuth');
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;

