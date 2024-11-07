const { MongoClient } = require('mongodb');
require('dotenv').config();

let client;

async function connectToMongo() {
    if (!client) {
        console.log("[API] Initializing MongoDB Client");
        client = new MongoClient(process.env.MONGODB_URI_DRAWN, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("[API] MongoDB Client Connected");
    }
    return client.db('drawnRoutes').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    console.log("[API] Received request to /api/save-drawn-route");

    if (req.method !== 'POST') {
        console.warn("[API] Invalid request method:", req.method);
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    console.log("[API] Request body received:", JSON.stringify(req.body, null, 2));

    const { gpxData, geojson, metadata } = req.body;
    
    if (!gpxData || !geojson || !metadata) {
        if (!gpxData) console.error("[API] Missing gpxData.");
        if (!geojson) console.error("[API] Missing geojson.");
        if (!metadata) console.error("[API] Missing metadata.");
        return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    try {
        console.log("[API] Connecting to MongoDB...");
        const collection = await connectToMongo();

        const insertData = {
            gpxData,
            geojson,
            metadata,
            createdAt: new Date()
        };
        console.log("[API] Inserting data into MongoDB:", JSON.stringify(insertData, null, 2));

        const result = await collection.insertOne(insertData);

        if (result.insertedId) {
            console.log("[API] Route saved successfully with ID:", result.insertedId);
            res.status(200).json({ success: true, message: 'Route saved successfully!', id: result.insertedId });
        } else {
            console.error("[API] Failed to insert route into MongoDB.");
            res.status(500).json({ success: false, message: 'Failed to save route' });
        }
    } catch (error) {
        console.error("[API] Error saving drawn route:", error.message);
        res.status(500).json({ success: false, message: 'Failed to save drawn route' });
    }
};
