const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongo() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    return client.db('roadApp').collection('drawnRoutes');
}

module.exports = async (req, res) => {
    console.log("Received request to save drawn route:", req.body); // Log incoming request data

    const { geojson } = req.body;

    if (!geojson || geojson.type !== 'FeatureCollection') {
        console.error('Invalid route data:', geojson); // Log the error
        return res.status(400).json({ error: 'Invalid route data' });
    }

    // Optional validation
    const { gravelType, surfaceType } = geojson.features[0].properties;
    if (![0, 1, 2, 3, 4, 5].includes(gravelType) || !['cobbles', 'gravel', 'singletrack'].includes(surfaceType)) {
        console.error('Invalid gravelType or surfaceType:', gravelType, surfaceType);
        return res.status(400).json({ error: 'Invalid gravel or surface type' });
    }

    try {
        const collection = await connectToMongo();
        const result = await collection.insertOne({
            geojson: geojson,
            gravelType,
            surfaceType,
            createdAt: new Date()
        });

        console.log('Route saved successfully with ID:', result.insertedId); // Log successful save

        return res.status(200).json({
            success: true,
            message: 'Route saved successfully!',
            routeId: result.insertedId
        });
    } catch (error) {
        console.error('Error saving drawn route:', error); // Log the error.
        return res.status(500).json({ error: 'Failed to save route' });
    }
};
