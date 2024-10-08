const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongo() {
    if (!client.isConnected()) {
        await client.connect();
    }
    return client.db('roadApp').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    const { geojson } = req.body;

    if (!geojson || geojson.type !== 'FeatureCollection') {
        return res.status(400).json({ error: 'Invalid route data' });
    }

    try {
        // Save the drawn route to MongoDB
        const collection = await connectToMongo();
        const result = await collection.insertOne({
            geojson: geojson,
            createdAt: new Date()
        });

        return res.status(200).json({
            success: true,
            message: 'Route saved successfully!',
            routeId: result.insertedId
        });
    } catch (error) {
        console.error('Error saving drawn route:', error);
        return res.status(500).json({ error: 'Failed to save route' });
    }
};
