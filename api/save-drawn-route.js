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
        console.error('Invalid input data. Missing gpxData, geojson, or metadata.');
        return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    // Log metadata and type of routeId to check if it's correctly passed as a string
    console.log('Metadata received:', metadata);
    console.log('Route ID type:', typeof metadata.routeId);
    console.log('Route ID value:', metadata.routeId);

    // Check if routeId is present and correctly formatted
    if (!metadata.routeId || typeof metadata.routeId !== 'string') {
        console.error('Route ID is missing or not a string.');
        return res.status(400).json({ success: false, message: 'No route ID provided or route ID is not a string.' });
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
            console.log('Route saved successfully with routeId:', result.insertedId);
            res.status(200).json({ success: true, message: 'Route saved successfully!', routeId: result.insertedId });
        } else {
            console.error('Failed to insert route into MongoDB.');
            res.status(500).json({ success: false, message: 'Failed to save route' });
        }
    } catch (error) {
        console.error('Error saving drawn route:', error);
        res.status(500).json({ success: false, message: 'Failed to save drawn route' });
    }
};
