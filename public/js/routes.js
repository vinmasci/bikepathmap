// ============================
// SECTION: Global Variables
// ============================
let drawnPoints = [];
let snappedPoints = [];
let markers = [];
let selectedColor = '#FFFFFF'; // Default color
let selectedLineStyle = 'solid'; // Default to solid line
let segmentCounter = 0; // Counter for unique segment IDs
let originalPins = [];  // Store user-added pins
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
// SECTION: Enable/Disable Drawing Mode
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
// SECTION: Draw Point
// ============================
async function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    drawnPoints.push(coords);
    originalPins.push(coords);
    const snappedSegment = await snapToRoads(drawnPoints);
    if (snappedSegment) {
        drawSegments(snappedSegment);
    }
    createMarker(coords);
}

// ============================
// SECTION: Draw Segments
// ============================
function drawSegments(snappedSegment) {
    let lastIndex = snappedPoints.length > 0 ? snappedPoints.length - 1 : 0;
    for (let i = lastIndex; i < snappedSegment.length - 1; i++) {
        drawSegment(snappedSegment[i], snappedSegment[i + 1], selectedColor, selectedLineStyle);
    }
    snappedPoints.push(...snappedSegment.slice(lastIndex + 1));
}

// ============================
// SECTION: Create Marker
// ============================
function createMarker(coords) {
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
// SECTION: Draw Individual Segment
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
// SECTION: Undo Logic (Simplified to Remove Entire Segment and All Snapped Points)
// ============================
async function undoLastPoint() {
    if (segments.length > 0) {
        // Get the last segment
        const lastSegment = segments.pop();
        const lastSegmentId = lastSegment.id;

        // Remove the segment's markers and lines
        if (markers.length > 0) {
            const lastMarker = markers.pop();
            if (lastMarker) lastMarker.remove(); // Remove the last marker from the map
        }

        // Remove the last original pin
        if (originalPins.length > 0) {
            originalPins.pop();
        }

        // Remove the segment layer and source from the map
        if (map.getLayer(lastSegmentId)) {
            map.removeLayer(lastSegmentId);
        }
        if (map.getSource(lastSegmentId)) {
            map.removeSource(lastSegmentId);
        }

        // Remove all snapped points associated with the last segment
        if (lastSegment.snappedPoints && lastSegment.snappedPoints.length > 0) {
            snappedPoints.splice(-lastSegment.snappedPoints.length);
        }

        // Remove from drawnPoints as well
        if (drawnPoints.length >= 2) {
            drawnPoints.pop();  // Remove the last point to keep drawnPoints consistent
        }

        console.log('Undo operation completed. Entire segment, markers, and snapped points removed.');
    } else {
        console.log('Nothing to undo.');
    }
}



// ============================
// SECTION: Reset Route
// ============================
function resetRoute() {
    console.log("Resetting route...");
    map.getStyle().layers
        .filter(layer => layer.id.startsWith('segment-'))
        .forEach(layer => {
            map.removeLayer(layer.id);
            const sourceId = layer.id.replace('-layer', '');
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        });
    segments = [];
    drawnPoints = [];
    snappedPoints = [];
    markers.forEach(marker => marker.remove());
    markers = [];
    console.log("Route reset.");
}

// ============================
// SECTION: Save Drawn Route
// ============================
function saveDrawnRoute() {
    if (drawnPoints.length > 1) {
        const modal = document.getElementById('routeSaveModal');
        modal.style.display = 'block';
        document.getElementById('saveRouteButton').addEventListener('click', function() {
            const gravelTypes = Array.from(document.querySelectorAll('input[name="gravelType"]:checked')).map(input => input.value);
            const surfaceType = document.querySelector('input[name="surfaceType"]:checked').value;
            const geojsonData = {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': drawnPoints
                        },
                        'properties': {
                            'gravelType': gravelTypes,
                            'surfaceType': surfaceType
                        }
                    }
                ]
            };
            fetch('/api/save-drawn-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geojson: geojsonData })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Route saved successfully!');
                } else {
                    alert('Error saving route: ' + data.error);
                }
                modal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error saving route:', error);
                alert('An error occurred while saving the route.');
                modal.style.display = 'none';
            });
        });
    } else {
        console.log("No points to save.");
        alert('No route to save.');
    }
}
