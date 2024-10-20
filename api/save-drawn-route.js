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

// Helper function to ensure coordinates are in the correct format
function formatCoordinates(geojson) {
    geojson.features.forEach(feature => {
        feature.geometry.coordinates = feature.geometry.coordinates.map(coord => [
            parseFloat(coord[0]), // Ensure longitude is a number
            parseFloat(coord[1])  // Ensure latitude is a number
        ]);
    });
    return geojson;
}

module.exports = async (req, res) => {
    console.log("Received request to save drawn route:", req.body); // Log incoming request data

    let { geojson, lineStyle } = req.body;  // Expect lineStyle in the request

    if (!geojson || geojson.type !== 'FeatureCollection') {
        console.error('Invalid route data:', geojson); // Log the error
        return res.status(400).json({ error: 'Invalid route data' });
    }

    // Optional validation for gravelType only (surfaceType is no longer required)
    const { gravelType } = geojson.features[0].properties;
    if (!gravelType) {
        console.error('Invalid gravelType:', gravelType);
        return res.status(400).json({ error: 'Invalid gravel type' });
    }

    // Add the lineStyle to each feature's properties
    geojson.features.forEach(feature => {
        feature.properties.lineStyle = lineStyle || 'solid'; // Default to solid if not provided
    });

    console.log("GeoJSON being saved:", JSON.stringify(geojson, null, 2)); // Log full structure

    // Format the coordinates before saving
    geojson = formatCoordinates(geojson);

    try {
        const collection = await connectToMongo();
        const result = await collection.insertOne({
            geojson: geojson,
            gravelType,  // Save gravelType only
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
