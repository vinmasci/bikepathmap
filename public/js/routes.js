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
// SECTION: Draw Individual Segment (Handles drawing lines on the map)
// ============================
function drawSegment(start, end, color, lineStyle) {
    const segmentFeature = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [start, end]
        },
        properties: {
            color: color,
            lineStyle: lineStyle
        }
    };

    // Update the drawnSegments GeoJSON source
    const drawnSegmentsSource = map.getSource('drawnSegments');
    const currentData = { ...drawnSegmentsSource._data }; // Make a copy to avoid direct modification
    currentData.features.push(segmentFeature);
    drawnSegmentsSource.setData(currentData);
}



// ============================
// SECTION: Undo Logic (Undo Last Segment)
// ============================
function undoLastSegment() {
    const drawnSegmentsSource = map.getSource('drawnSegments');
    const currentData = { ...drawnSegmentsSource._data }; // Make a copy to avoid direct modification

    if (currentData.features.length > 0) {
        currentData.features.pop(); // Remove the last segment
        drawnSegmentsSource.setData(currentData);
    } else {
        console.log('No segments to undo.');
    }
}




// ============================
// SECTION: Reset Route
// ============================
function resetRoute() {
    console.log("Resetting route...");

    // Reset the GeoJSON source for all drawn segments
    const drawnSegmentsSource = map.getSource('drawnSegments');
    const emptyGeoJSON = {
        type: 'FeatureCollection',
        features: []
    };
    drawnSegmentsSource.setData(emptyGeoJSON);

    // Clear markers and reset arrays
    markers.forEach(marker => marker.remove());
    markers = [];
    drawnPoints = [];
    snappedPoints = [];
    originalPins = [];
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
