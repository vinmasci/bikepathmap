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

// Helper function to assign colors based on gravelType
function assignColors(geojson) {
    geojson.features.forEach(feature => {
        const gravelType = feature.properties.gravelType || '0';
        let color;

        // Assign color based on gravelType
        switch (gravelType) {
            case '0':
                color = '#01bf11';  // Green
                break;
            case '1':
                color = '#0050c1';  // Blue
                break;
            case '2':
                color = '#000000';  // Black
                break;
            case '3':
                color = '#FF0000';  // Red
                break;
            case '4':
                color = '#FFD43B';  // Yellow
                break;
            default:
                color = '#888888';  // Default gray
                break;
        }

        feature.properties.color = color;  // Assign color
        feature.properties.lineStyle = feature.properties.lineStyle || 'solid';  // Default to solid line style
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

    // Assign colors and format coordinates before saving
    geojson = assignColors(geojson);
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
