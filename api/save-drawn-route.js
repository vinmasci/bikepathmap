const { MongoClient } = require('mongodb');
require('dotenv').config();

let client;

async function connectToMongo() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI_DRAWN, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
    }
    return client.db('drawnRoutes').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Log the incoming request body for debugging
    console.log('Request Body:', req.body);

    // Ensure the body contains the necessary data
    const { gpxData, geojson, metadata } = req.body;
    if (!gpxData || !geojson || !metadata) {
        return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    // Log metadata to check for routeId
    console.log('Metadata:', metadata);

    // Check if routeId is present
    if (!metadata.routeId) {
        return res.status(400).json({ success: false, message: 'No route ID provided.' });
    }

    try {
        const collection = await connectToMongo();

        // Insert the drawn route into the collection
        const result = await collection.insertOne({
            gpxData,
            geojson,
            metadata,
            createdAt: new Date() // Optionally add a timestamp
        });

        if (result.insertedId) {
            res.status(200).json({ success: true, message: 'Route saved successfully!', routeId: result.insertedId });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save route' });
        }
    } catch (error) {
        console.error('Error saving drawn route:', error);
        res.status(500).json({ success: false, message: 'Failed to save drawn route' });
    }
};
