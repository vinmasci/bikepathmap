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
    console.log("[API] Received request to /api/save-drawn-route");

    if (req.method !== 'POST') {
        console.warn("[API] Invalid request method:", req.method);
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Get gpxData, geojson, and metadata from the request body
    const { gpxData, geojson, metadata } = req.body;
    if (!gpxData || !geojson || !metadata) {
        console.error("[API] Invalid input data. Missing gpxData, geojson, or metadata.");
        return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    try {
        const collection = await connectToMongo();
        const insertData = {
            gpxData,
            geojson,
            metadata,
            createdAt: new Date()
        };
        console.log("[API] Inserting data into MongoDB:", insertData);

        const result = await collection.insertOne(insertData);

        if (result.insertedId) {
            console.log("[API] Route saved successfully with identifier:", result.insertedId);
            res.status(200).json({ success: true, message: 'Route saved successfully!', identifier: result.insertedId });
        } else {
            console.error("[API] Failed to insert route into MongoDB.");
            res.status(500).json({ success: false, message: 'Failed to save route' });
        }
    } catch (error) {
        console.error("[API] Error saving drawn route:", error);
        res.status(500).json({ success: false, message: 'Failed to save drawn route' });
    }
};
