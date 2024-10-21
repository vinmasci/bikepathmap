export function parseTrackPoints(gpxDoc, trackColor, trackGravelType, trackLineStyle) {
    const trackPoints = [];

    // Loop through GPX track points and extract coordinates
    const trackPointElements = gpxDoc.getElementsByTagName('trkpt');
    for (let i = 0; i < trackPointElements.length; i++) {
        const trkpt = trackPointElements[i];
        const lat = parseFloat(trkpt.getAttribute('lat'));
        const lon = parseFloat(trkpt.getAttribute('lon'));
        if (!isNaN(lat) && !isNaN(lon)) {
            trackPoints.push([lon, lat]);  // Push coordinates as [lon, lat]
        }
    }

    // Return a FeatureCollection with dynamic color, gravelType, and lineStyle properties
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
                    color: trackColor || "#ff0000",        // Pass dynamic color or default to red
                    gravelType: trackGravelType || 2,      // Pass dynamic gravelType or default to 2
                    lineStyle: trackLineStyle || 'solid'   // Pass dynamic lineStyle or default to 'solid'
                }
            }
        ]
    };
}
