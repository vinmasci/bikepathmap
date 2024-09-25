// /public/js/geojson.js

export function parseTrackPoints(gpxDoc) {
    const trackPoints = [];

    const trackPointElements = gpxDoc.getElementsByTagName('trkpt');
    for (let i = 0; i < trackPointElements.length; i++) {
        const trkpt = trackPointElements[i];
        const lat = parseFloat(trkpt.getAttribute('lat'));
        const lon = parseFloat(trkpt.getAttribute('lon'));
        if (!isNaN(lat) && !isNaN(lon)) {
            trackPoints.push([lon, lat]);
        }
    }

    return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: trackPoints },
        properties: {}
    };
}
