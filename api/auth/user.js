const jwt = require('jsonwebtoken');

export default function handler(req, res) {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "

    if (!token) {
        console.error("Token not provided in Authorization header.");
        return res.status(401).json({ message: "Token not provided" });
    }

    console.log("Token received:", token); // Debugging statement

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ message: "Invalid token" });
        }

        console.log("Token successfully verified:", user); // Debugging statement
        res.json({ user }); // Respond with user information
    });
}
