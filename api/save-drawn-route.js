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
            parseFloat(coord[0]?.$numberDouble || coord[0]), // Convert $numberDouble to float if present
            parseFloat(coord[1]?.$numberDouble || coord[1])  // Convert $numberDouble to float if present
        ]);
    });
    return geojson;
}

module.exports = async (req, res) => {
    console.log("Received request to save drawn route:", req.body); // Log incoming request data

    let { geojson, lineStyle, color } = req.body;  // Expect lineStyle and color in the request

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

    // Add the lineStyle and color to each feature's properties
    geojson.features.forEach(feature => {
        feature.properties.lineStyle = lineStyle || 'solid'; // Default to solid if not provided
        feature.properties.color = color || '#0050c1';  // Default color if not provided
    });

    // Format the coordinates before saving
    geojson = formatCoordinates(geojson);

    console.log("GeoJSON being saved:", JSON.stringify(geojson, null, 2)); // Log full structure

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
