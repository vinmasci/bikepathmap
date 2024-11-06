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

async function ensureProfileDocument(userId, displayName) {
    const collection = await connectToMongo();
    const existingProfile = await collection.findOne({ _id: new ObjectId(userId) });

    if (!existingProfile) {
        console.log("Creating new profile document for user:", userId);
        await collection.insertOne({ _id: new ObjectId(userId), name: displayName, profileImage: "" });
    } else {
        console.log("Profile document already exists for user:", userId);
    }
}

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
            await ensureProfileDocument(user.id, user.displayName);

            // Redirect to home page with token as URL parameter
            res.redirect(`/?token=${token}`);
        } catch (error) {
            console.error("Error during login process:", error);
            res.status(500).json({ error: "Login processing failed" });
        }
    })(req, res);
}
