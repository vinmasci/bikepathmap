// Helper function to ensure coordinates and properties are in the correct format
function formatGeoJSON(geojson) {
    geojson.features.forEach(feature => {
        // Convert coordinates to simple arrays of numbers
        feature.geometry.coordinates = feature.geometry.coordinates.map(coord => [
            parseFloat(coord[0]), // Ensure longitude is a number
            parseFloat(coord[1])  // Ensure latitude is a number
        ]);

        // Ensure gravelType is a single value, not an array
        feature.properties.gravelType = Array.isArray(feature.properties.gravelType) 
            ? feature.properties.gravelType[0] 
            : feature.properties.gravelType;

        // Ensure dashArray is an array of integers
        feature.properties.dashArray = feature.properties.dashArray.map(value => parseInt(value));
    });

    return geojson;
}

module.exports = async (req, res) => {
    console.log("Received request to save drawn route:", req.body); // Log incoming request data

    let { geojson } = req.body;

    if (!geojson || geojson.type !== 'FeatureCollection') {
        console.error('Invalid route data:', geojson); // Log the error
        return res.status(400).json({ error: 'Invalid route data' });
    }

    // Format the GeoJSON (coordinates and properties)
    geojson = formatGeoJSON(geojson);

    try {
        const collection = await connectToMongo();
        const result = await collection.insertOne({
            geojson: geojson,
            gravelType: geojson.features[0].properties.gravelType,  // Save gravelType only
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
