// ============================
// SECTION: Variables Initialization
// ============================

let drawnPoints = [];
let snappedPoints = [];
let currentLine = null; // Track the current drawn line
let markers = [];
let selectedColor = '#FFFFFF'; // Default color
let selectedLineStyle = 'solid'; // Default to solid line
let segmentCounter = 0; // Counter for unique segment IDs
let segments = []; // Store complete segment information

// Gravel type color mapping
const gravelColors = {
    0: '#00a8ff', // Blue for rough asphalt
    1: '#4cd137', // Green for smooth gravel
    2: '#fbc531', // Yellow for slightly technical
    3: '#f0932b', // Orange for technical
    4: '#c23616', // Dark Red for very technical
    5: '#470002'  // Black Red for hike-a-bike
};

// ============================
// SECTION: Apply Drawing Options
// ============================
document.getElementById('applyDrawingOptionsButton').addEventListener('click', function() {
    const selectedGravelType = document.querySelector('input[name="gravelType"]:checked').value;
    selectedColor = gravelColors[selectedGravelType];
    selectedLineStyle = document.querySelector('input[name="roadType"]:checked').value;
    document.getElementById('drawingOptionsModal').style.display = 'none';
});

// ============================
// SECTION: Enable and Disable Drawing Mode
// ============================
function enableDrawingMode() {
    console.log("Drawing mode enabled.");
    document.getElementById('control-panel').style.display = 'block';
    map.on('click', drawPoint);
    map.getCanvas().style.cursor = 'crosshair';
}

function disableDrawingMode() {
    console.log("Drawing mode disabled.");
    map.off('click', drawPoint);
    map.getCanvas().style.cursor = '';
    document.getElementById('control-panel').style.display = 'none';
}

// ============================
// SECTION: Snap to Road Function
// ============================
async function snapToRoads(points) {
    try {
        const coordinatesString = points.map(coord => coord.join(',')).join(';');
        const url = `https://api.mapbox.com/matching/v5/mapbox/cycling/${coordinatesString}?access_token=${mapboxgl.accessToken}&geometries=geojson&steps=true&tidy=true`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.matchings && data.matchings.length > 0 && data.matchings[0].geometry && data.matchings[0].geometry.coordinates.length) {
            return data.matchings[0].geometry.coordinates;
        } else {
            console.error('No valid matchings from Mapbox API', data);
            return null;
        }
    } catch (error) {
        console.error('Error calling Mapbox API:', error);
        return null;
    }
}

// ============================
// SECTION: Draw Point and Segment
// ============================
async function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    drawnPoints.push(coords);

    // Snap to road and draw segments if valid snapping occurs
    const snappedSegment = await snapToRoad();
    if (snappedSegment) {
        drawSegment(snappedSegment[0], snappedSegment[snappedSegment.length - 1], selectedColor, selectedLineStyle);
        segments.push({
            id: `segment-${segmentCounter++}`,
            start: snappedSegment[0],
            end: snappedSegment[snappedSegment.length - 1],
            snappedPoints: snappedSegment,
            color: selectedColor,
            lineStyle: selectedLineStyle
        });
    }

    // Create and add a marker for the current point
    const markerElement = document.createElement('div');
    markerElement.style.width = '16px';
    markerElement.style.height = '16px';
    markerElement.style.backgroundColor = selectedColor;
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '1px solid white';

    const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coords)
        .addTo(map);
    markers.push(marker);
}

// ============================
// SECTION: Draw Segment
// ============================
function drawSegment(start, end, color, lineStyle) {
    const segmentId = `segment-${segmentCounter++}`;
    const segmentLine = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': [start, end]
        }
    };

    segments.push({
        id: segmentId,
        start: start,
        end: end,
        snappedPoints: [start, end],
        color: color,
        lineStyle: lineStyle
    });

    map.addSource(segmentId, { 'type': 'geojson', 'data': segmentLine });
    map.addLayer({
        'id': segmentId,
        'type': 'line',
        'source': segmentId,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': color,
            'line-width': 4,
            'line-dasharray': lineStyle === 'dashed' ? [2, 4] : [1]
        }
    });
}

// ============================
// SECTION: Undo Last Point
// ============================
async function undoLastPoint() {
    if (segments.length > 0) {
        const lastSegment = segments.pop();
        const lastSegmentId = lastSegment.id;

        markers.pop().remove();
        if (map.getLayer(lastSegmentId)) {
            map.removeLayer(lastSegmentId);
        }
        if (map.getSource(lastSegmentId)) {
            map.removeSource(lastSegmentId);
        }

        console.log('Removed segment:', lastSegment);
    } else {
        console.log('Nothing to undo.');
    }
}

// ============================
// SECTION: Reset Route
// ============================
function resetRoute() {
    console.log("Resetting route...");

    segments.forEach(segment => {
        if (map.getLayer(segment.id)) {
            map.removeLayer(segment.id);
        }
        if (map.getSource(segment.id)) {
            map.removeSource(segment.id);
        }
    });

    segments = [];
    drawnPoints = [];
    snappedPoints = [];
    markers.forEach(marker => marker.remove());
    markers = [];
    console.log("Route reset.");
}
