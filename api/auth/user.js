const jwt = require('jsonwebtoken');

export default function handler(req, res) {
    // Get token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

    if (!token) {
        return res.status(401).json({ message: "Token not provided" });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Token is valid, respond with user info
        res.json({ user });
    });
}
