const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection setup
let client;

async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
    }
    return client.db('drawnRoutes').collection('drawnRoutes');  // Update to your collection
}

module.exports = async (req, res) => {
    try {
        const collection = await connectToMongo();

        // Fetch all routes from the MongoDB collection
        const routes = await collection.find({}).toArray();

        // Log the raw routes before processing them
        console.log("Raw routes from MongoDB:", JSON.stringify(routes, null, 2));

        // Send the formatted routes to the client
        res.status(200).json({ routes });
    } catch (error) {
        console.error('Error retrieving routes:', error);
        res.status(500).json({ error: 'Failed to retrieve routes' });
    }
};
