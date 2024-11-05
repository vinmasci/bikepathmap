const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://bikepathmap.vercel.app/api/auth/callback'
},
(accessToken, refreshToken, profile, done) => {
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    console.log("Google Profile:", profile);  // Log profile data to confirm
    return done(null, profile);  // Passes the profile to req.user
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
