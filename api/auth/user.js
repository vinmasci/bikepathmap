const jwt = require('jsonwebtoken');
const { connectToMongo } = require('../user/profile'); // Adjusted path to reach profile.js
const authenticateJWT = require('./authMiddleware'); // Import the authentication middleware

export default function handler(req, res) {
    // Use the authentication middleware to handle JWT verification
    authenticateJWT(req, res, async () => {
        const userId = req.user.id; // Get user ID from authenticated request
        console.log("Fetching profile for user ID:", userId);

        try {
            const collection = await connectToMongo(); // Connect to the MongoDB collection
            const profile = await collection.findOne({ _id: userId }); // Fetch the user profile using the string ID
            
            if (!profile) {
                return res.status(404).json({ message: "Profile not found" }); // Return 404 if no profile exists
            }

            res.json({ user: profile }); // Respond with the user profile data
        } catch (error) {
            console.error("Database error:", error); // Log any database errors
            res.status(500).json({ message: "Database error" }); // Return 500 status for server errors
        }
    });
}
