const passport = require('./setup');

export default function handler(req, res) {
    passport.authenticate('google', {
        failureRedirect: '/'
    })(req, res, () => {
        // Redirect to the homepage after successful login
        res.redirect('/');
    });
}
