const passport = require('./setup');

export default function handler(req, res) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
}
