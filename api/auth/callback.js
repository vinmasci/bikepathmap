const jwt = require('jsonwebtoken');
const passport = require('./setup');

export default function handler(req, res) {
    passport.authenticate('google', { failureRedirect: '/' })(req, res, () => {
        if (!req.user) {
            console.error("Authentication failed: req.user is undefined");  // Log if req.user is missing
            return res.status(500).json({ error: "Authentication failed" });
        }
        
        try {
            const user = req.user;
            console.log("Authenticated user:", user);  // Log user data for debugging
            
            const token = jwt.sign(
                { id: user.id, displayName: user.displayName },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({ token });
        } catch (error) {
            console.error("Error generating token:", error);
            res.status(500).json({ error: "Token generation failed" });
        }
    });
}
