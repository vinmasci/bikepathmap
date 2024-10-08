const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { points } = req.body;

    // Check if points array exists and contains enough data
    if (!points || points.length < 2) {
        return res.status(400).json({ error: 'Insufficient points provided' });
    }

    // Create the semicolon-separated string for coordinates
    const coordinatesString = points.map(coord => coord.join(',')).join(';');
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;  // Make sure this is defined in your environment variables

    try {
        // Fetch the snapped route using Mapbox's Map Matching API
        const response = await fetch(`https://api.mapbox.com/matching/v5/mapbox/driving/${coordinatesString}?access_token=${mapboxToken}&geometries=geojson`);
        const data = await response.json();

        // Check if the Mapbox API call was successful
        if (data && data.code === "Ok") {
            res.status(200).json(data);  // Return the snapped route data
        } else {
            // Handle errors returned from the Map Matching API
            res.status(400).json({ error: 'Map Matching API Error', message: data.message });
        }
    } catch (error) {
        // Handle server errors or issues with the request
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
