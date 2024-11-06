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
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ message: "Invalid token" });
        }

        console.log("Token successfully verified:", user); // Debugging statement

// Fetch user profile from MongoDB here
const collection = await connectToMongo();
const profile = await collection.findOne({ _id: user.id }); // Use the string directly


        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({ user: profile }); // Respond with user information
    });
}
