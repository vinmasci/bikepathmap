const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { points } = req.body;

    const coordinatesString = points.map(coord => coord.join(',')).join(';');
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;  // Use environment variable for security

    try {
        const response = await fetch(`https://api.mapbox.com/matching/v5/mapbox/driving/${coordinatesString}?access_token=${mapboxToken}&geometries=geojson`);
        const data = await response.json();

        if (data && data.code === "Ok") {
            res.status(200).json(data);
        } else {
            res.status(400).json({ error: 'Map Matching API Error', message: data.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
