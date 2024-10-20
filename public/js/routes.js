// ============================
// SECTION: Global Variables
// ============================
let segmentCounter = 0; // Counter for unique segment IDs
let markers = [];
let segmentsGeoJSON = {
    type: 'FeatureCollection',
    features: []
};
let selectedColor = '#FFFFFF'; // Default color
let selectedLineStyle = 'solid'; // Default to solid line
let originalPins = []; // Store user-added pins

// Gravel type color mapping
const gravelColors = {
    0: '#00a8ff', // Blue for rough asphalt
    1: '#4cd137', // Green for smooth gravel
    2: '#fbc531', // Yellow for slightly technical
    3: '#f0932b', // Orange for technical
    4: '#c23616', // Dark Red for very technical
    5: '#470002' // Black Red for hike-a-bike
};

// ============================
// SECTION: Apply Drawing Options
// ============================
document.getElementById('applyDrawingOptionsButton').addEventListener('click', function () {
    const selectedGravelType = document.querySelector('input[name="gravelType"]:checked').value;
    selectedColor = gravelColors[selectedGravelType];
    selectedLineStyle = document.querySelector('input[name="roadType"]:checked').value;
    document.getElementById('drawingOptionsModal').style.display = 'none';
});

// ============================
// SECTION: Enable/Disable Drawing Mode
// ============================
let drawingEnabled = false; // Track whether drawing mode is enabled

function enableDrawingMode() {
    console.log("Drawing mode enabled.");
    document.getElementById('control-panel').style.display = 'block';
    map.on('click', drawPoint);  // Start capturing clicks to draw points
    map.getCanvas().style.cursor = 'crosshair';  // Change cursor to crosshair
}

function disableDrawingMode() {
    console.log("Drawing mode disabled.");
    map.off('click', drawPoint);  // Stop capturing clicks
    map.getCanvas().style.cursor = '';  // Reset cursor
    document.getElementById('control-panel').style.display = 'none';  // Hide the control panel
}

// ============================
// SECTION: Toggle Drawing Mode
// ============================
function toggleDrawingMode() {
    if (drawingEnabled) {
        disableDrawingMode();  // Disable drawing if it’s enabled
    } else {
        enableDrawingMode();  // Enable drawing if it’s disabled
    }
    drawingEnabled = !drawingEnabled;  // Toggle the drawing state
}

// ============================
// SECTION: Draw Point
// ============================
async function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    console.log("Point drawn at:", coords);  // Log the coordinates of each point
    originalPins.push(coords);  // Add the point to the originalPins array

    // If there are at least two points, attempt to draw the segment
    if (originalPins.length > 1) {
        let snappedSegment = await snapToRoads([originalPins[originalPins.length - 2], coords]);
        
        // If snapping fails, use original coordinates as fallback
        if (!snappedSegment) {
            console.warn('Snapping failed, using original coordinates');
            snappedSegment = [originalPins[originalPins.length - 2], coords];  // Fallback to non-snapped
        }
        
        console.log("Snapped or Fallback Segment:", snappedSegment);  // Log the segment to be drawn
        addSegment(snappedSegment);  // Add the segment to GeoJSON
        drawSegmentsOnMap();  // Draw the segment on the map
    }
    createMarker(coords);  // Create a marker at the clicked point
}



// ============================
// SECTION: Snap to Road Function
// ============================
async function snapToRoads(points) {
    try {
        const coordinatesString = points.map(coord => coord.join(',')).join(';');
        const url = `https://api.mapbox.com/matching/v5/mapbox/cycling/${coordinatesString}?access_token=${mapboxgl.accessToken}&geometries=geojson&steps=true&tidy=true`;

        console.log('Sending request to Mapbox Matching API:', url);  // Log the request URL
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Error fetching snapped points:', response.statusText);
            return null;  // Handle API error
        }

        const data = await response.json();
        console.log('Mapbox API Response Data:', data);  // Log the full response from Mapbox

        if (data && data.matchings && data.matchings.length > 0 && data.matchings[0].geometry && data.matchings[0].geometry.coordinates.length > 0) {
            console.log('Snapped Segment Coordinates:', data.matchings[0].geometry.coordinates);
            return data.matchings[0].geometry.coordinates;
        } else {
            console.error('No valid matchings from Mapbox API:', data);
            return null;  // Return null if no valid match
        }
    } catch (error) {
        console.error('Error calling Mapbox Matching API:', error);
        return null;  // Return null on error
    }
}




// ============================
// SECTION: Add Segment
// ============================
function addSegment(snappedSegment) {
    const segmentFeature = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: snappedSegment
        },
        properties: {
            color: selectedColor,  // Use the selected color
            lineStyle: selectedLineStyle,  // Use the selected line style
            id: `segment-${segmentCounter++}`  // Unique ID for each segment
        }
    };
    segmentsGeoJSON.features.push(segmentFeature);
}


// ============================
// SECTION: Draw Segments on Map
// ============================
function drawSegmentsOnMap() {
    const source = map.getSource('drawnSegments');
    if (source) {
        console.log('GeoJSON Data before updating source:', JSON.stringify(segmentsGeoJSON, null, 2));  // Log the data to be set
        source.setData(segmentsGeoJSON);  // Ensure this is updating the map's source
    } else {
        console.error('GeoJSON source "drawnSegments" not found on the map');
    }
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
// SECTION: Undo Last Segment
// ============================
function undoLastSegment() {
    if (segmentsGeoJSON.features.length > 0) {
        segmentsGeoJSON.features.pop(); // Remove the last segment
        drawSegmentsOnMap(); // Update the map
        if (markers.length > 0) {
            const lastMarker = markers.pop();
            lastMarker.remove();
            originalPins.pop();
        }
    } else {
        console.log('No segments to undo.');
    }
}

// ============================
// SECTION: Reset Route
// ============================
function resetRoute() {
    console.log("Resetting route...");
    segmentsGeoJSON.features = [];
    drawSegmentsOnMap();
    markers.forEach(marker => marker.remove());
    markers = [];
    originalPins = [];
    console.log("Route reset.");
}

// ============================
// SECTION: Save Drawn Route
// ============================
function saveDrawnRoute() {
    if (segmentsGeoJSON.features.length > 0) {
        // Open the modal for gravel/surface type selection
        const modal = document.getElementById('routeSaveModal');
        modal.style.display = 'block';

        // Set up the event listener for the save button
        document.getElementById('saveRouteButton').addEventListener('click', function () {
            // Collect data for saving
            const gravelTypes = Array.from(document.querySelectorAll('input[name="gravelType"]:checked')).map(input => input.value);
            const surfaceType = document.querySelector('input[name="surfaceType"]:checked').value;

            // Add gravel and surface type information to each segment feature
            segmentsGeoJSON.features.forEach(feature => {
                feature.properties.gravelType = gravelTypes; // Store selected gravel types
                feature.properties.surfaceType = surfaceType; // Store selected surface type
            });

            // Save the updated GeoJSON data
            fetch('/api/save-drawn-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geojson: segmentsGeoJSON })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Route saved successfully!');
                } else {
                    alert('Error saving route: ' + data.error);
                }
                modal.style.display = 'none'; // Close the modal after saving
            })
            .catch(error => {
                console.error('Error saving route:', error);
                alert('An error occurred while saving the route.');
                modal.style.display = 'none';
            });
        }, { once: true }); // Add the listener once to avoid multiple calls
    } else {
        console.log("No segments to save.");
        alert('No route to save.');
    }
}
