const jwt = require('jsonwebtoken');
const passport = require('./setup');

export default function handler(req, res) {
    passport.authenticate('google', { session: false }, (err, user) => {
        if (err || !user) {
            console.error("Authentication failed:", err || "No user profile received");
            return res.status(500).json({ error: "Authentication failed" });
        }
        
        // Log user object to confirm fields
        console.log("Authenticated user object:", user);

        // Handle potential missing fields with fallback values
        const userId = user.id || user.sub; // or other field based on the structure
        const displayName = user.displayName || user.name || "Anonymous";

        if (!userId || !displayName) {
            console.error("User ID or display name missing from the Google profile.");
            return res.status(500).json({ error: "Incomplete user profile" });
        }

        try {
            const token = jwt.sign(
                { id: userId, displayName },
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
