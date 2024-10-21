export function parseTrackPoints(gpxDoc) {
    const trackPoints = [];

    const trackPointElements = gpxDoc.getElementsByTagName('trkpt');
    for (let i = 0; i < trackPointElements.length; i++) {
        const trkpt = trackPointElements[i];
        const lat = parseFloat(trkpt.getAttribute('lat'));
        const lon = parseFloat(trkpt.getAttribute('lon'));
        if (!isNaN(lat) && !isNaN(lon)) {
            trackPoints.push([lon, lat]);  // Push coordinates as [lon, lat]
        }
    }

    // Return a FeatureCollection with properties
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: trackPoints  // Use the track points here
                },
                properties: {
                    color: "#ff0000",        // Add color property (can be dynamic)
                    gravelType: 2            // Add gravelType property (can be dynamic)
                }
            }
        ]
    };
}
