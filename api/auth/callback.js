// ============================
// SECTION: Imports and MongoDB Connection
// ============================
const jwt = require('jsonwebtoken');
const passport = require('./setup');
const { MongoClient, ObjectId } = require('mongodb');

let client;
async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
    }
    console.log('MongoDB connected');
    return client.db('roadApp').collection('profileDoc'); // Connect to the profileDoc collection
}

// ============================
// SECTION: Ensure Profile Document
// ============================
async function ensureProfileDocument(userId, displayName, googleProfileImage) {
    const collection = await connectToMongo();
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    // Find the existing profile
    const existingProfile = await collection.findOne({ _id: userObjectId });

    if (!existingProfile) {
        // Create a new document if none exists
        console.log("Creating new profile document for user:", userId);
        await collection.insertOne({
            _id: userObjectId,
            name: displayName,
            profileImage: googleProfileImage || "" // Use Google image if available
        });
    } else if (!existingProfile.profileImage && googleProfileImage) {
        // Update the document if the profile image is missing
        console.log("Adding missing profile image for user:", userId);
        await collection.updateOne(
            { _id: userObjectId },
            { $set: { profileImage: googleProfileImage } }
        );
    } else {
        console.log("Profile document already exists and is up-to-date for user:", userId);
    }
}

// ============================
// SECTION: Authentication Callback
// ============================
export default function handler(req, res) {
    passport.authenticate('google', { session: false }, async (err, user) => {
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

            // Ensure a profile document exists for this user
            const googleProfileImage = user.photos && user.photos[0]?.value; // Get Google profile image if available
            await ensureProfileDocument(user.id, user.displayName, googleProfileImage);

            // Redirect to home page with token as URL parameter
            res.redirect(`/?token=${token}`);
        } catch (error) {
            console.error("Error during login process:", error);
            res.status(500).json({ error: "Login processing failed" });
        }
    })(req, res);
}
