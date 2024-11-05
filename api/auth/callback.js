const jwt = require('jsonwebtoken');
const passport = require('./setup');

export default function handler(req, res) {
    passport.authenticate('google', { session: false }, (err, user) => {
        if (err || !user) {
            console.error("Authentication failed:", err || "No user profile received");
            return res.status(500).json({ error: "Authentication failed" });
        }
        
        try {
            const token = jwt.sign(
                { id: user.id, displayName: user.displayName },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Redirect to home page with token as URL parameter
            res.redirect(`/?token=${token}`);
        } catch (error) {
            console.error("Error generating token:", error);
            res.status(500).json({ error: "Token generation failed" });
        }
    })(req, res);
}
