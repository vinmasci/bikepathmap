const jwt = require('jsonwebtoken');
const passport = require('./setup');

export default function handler(req, res) {
    passport.authenticate('google', { failureRedirect: '/' })(req, res, () => {
        // Generate a JWT with the user’s information
        const user = req.user;  // Assuming `req.user` contains user data
        const token = jwt.sign(
            { id: user.id, displayName: user.displayName },  // Payload
            process.env.JWT_SECRET,  // Secret key for signing the token
            { expiresIn: '1h' }  // Token expiration time
        );

        // Send the token to the client (consider setting it as an HTTP-only cookie)
        res.json({ token });
    });
}
