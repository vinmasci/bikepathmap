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
    0: '#01bf11', // Easiest // Green
    1: '#0050c1', // Blue // Intermediate
    2: '#2c2c54', // Diamond // Midnight Blue
    3: '#444444', // White // Expert 
    4: '#FFD43B', // Rail trail // yellow
    5: '#831100' // Red // Closed or Private
};

// ============================
// SECTION: Apply Drawing Options
// ============================
document.getElementById('applyDrawingOptionsButton').addEventListener('click', function () {
    const selectedGravelType = document.querySelector('input[name="gravelType"]:checked').value;
    selectedColor = gravelColors[selectedGravelType];
    document.getElementById('drawingOptionsModal').style.display = 'none';
});

// Global flag to track if drawing mode is enabled
let drawingEnabled = false;

// ============================
// SECTION: Toggle Drawing Mode with Tab Highlight
// ============================
function toggleDrawingMode() {
    const drawRouteTab = document.getElementById('draw-route-tab');
    
    if (drawingEnabled) {
        // Disable drawing mode
        disableDrawingMode();  
        updateTabHighlight('draw-route-tab', false);  // Remove tab highlight (deactivate)
        document.getElementById('control-panel').style.display = 'none';  // Hide control panel
    } else {
        // Enable drawing mode
        enableDrawingMode();  
        updateTabHighlight('draw-route-tab', true);  // Highlight the tab (activate)
        document.getElementById('control-panel').style.display = 'block';  // Show control panel
    }
    drawingEnabled = !drawingEnabled;  // Toggle the drawing state
}


// ============================
// SECTION: Enable Drawing Mode
// ============================
function enableDrawingMode() {
    console.log("Drawing mode enabled.");
    document.getElementById('control-panel').style.display = 'block';  // Show the control panel
    map.on('click', drawPoint);  // Start capturing clicks to draw points
    map.getCanvas().style.cursor = 'crosshair';  // Change cursor to crosshair

    // Set the default route color to 'easy' (gravel type 0, green)
    selectedColor = gravelColors[0];  // Set to the color defined for gravel type 0 (easy, green)
    selectedLineStyle = 'solid';  // Ensure the line style is set to solid for easy

    console.log("Default color set to 'easy' (green) for drawing mode.");
}

// ============================
// SECTION: Disable Drawing Mode
// ============================
function disableDrawingMode() {
    console.log("Drawing mode disabled.");
    map.off('click', drawPoint);  // Stop capturing clicks
    map.getCanvas().style.cursor = '';  // Reset cursor
    document.getElementById('control-panel').style.display = 'none';  // Hide the control panel
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
    let lineColor = selectedColor;  // Default to the selected color
    let lineDashArray = [1, 0];  // Default to solid line

    // Gravel Type 3: Dashed black and white
    if (selectedColor === gravelColors[3]) {
        lineColor = '#eeeeee';  // Black line for Gravel Type 3
        lineDashArray = [2, 2];  // Dashed pattern
    }

    const segmentFeature = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: snappedSegment
        },
        properties: {
            color: lineColor,  // Use the selected color or black
            dashArray: lineDashArray,  // Apply the dash pattern (solid or dashed)
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
        // Flatten the GeoJSON data before setting it
        const flattenedGeoJSON = {
            type: 'FeatureCollection',
            features: flattenFeatureCollection(segmentsGeoJSON)  // Use the helper function
        };

        // Set the source with the flattened data
        source.setData(flattenedGeoJSON);

        // Apply the line color and dash array
        map.setPaintProperty('drawn-segments-layer', 'line-color', ['get', 'color']);
        map.setPaintProperty('drawn-segments-layer', 'line-dasharray', ['get', 'dashArray']);
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
    markerElement.style.border = '2px solid white';
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
// SECTION: Save Drawn Route (with route name prompt)
// ============================
function saveDrawnRoute() {
    if (segmentsGeoJSON.features.length > 0) {
        // Collect gravel types from the modal
        const gravelTypes = Array.from(document.querySelectorAll('input[name="gravelType"]:checked')).map(input => input.value);

        // Add gravel type information to each segment feature
        segmentsGeoJSON.features.forEach(feature => {
            feature.properties.gravelType = gravelTypes;  // Store selected gravel types
        });

        // Convert GeoJSON to GPX, ensure togpx is correctly imported
        const gpxData = togpx ? togpx(segmentsGeoJSON) : null;
        if (!gpxData) {
            console.error("GPX conversion failed. 'togpx' is not defined.");
            return;
        }

        // Prompt user to enter a route name before saving
        openRouteNameModal();

        // Save button inside the modal to confirm route name input
        document.getElementById('confirmSaveBtn').addEventListener('click', function() {
            const routeName = document.getElementById('routeNameInput').value;

            if (!routeName) {
                alert('Please enter a road/path name for your route.');
                return;
            }

            // Add the route name to each segment feature's properties as "title"
            segmentsGeoJSON.features.forEach(feature => {
                feature.properties.title = routeName;  // Store the route name as "title"
            });

            // Send the drawn route data to the backend API
            fetch('/api/save-drawn-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gpxData: gpxData,  // Converted GPX data
                    geojson: segmentsGeoJSON,  // GeoJSON data with the route title
                    metadata: {
                        color: selectedColor,
                        lineStyle: selectedLineStyle,
                        gravelType: gravelTypes,  // Send gravel types metadata
                        title: routeName  // Include the route title in the metadata
                    }
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Route saved successfully!');
                    closeRouteNameModal();  // Close the modal after saving
                } else {
                    alert('Error saving route: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error saving route:', error);
                alert('An error occurred while saving the route.');
            });
        });
    } else {
        alert('No route to save.');
    }
}



// ============================
// Helper function to flatten FeatureCollection
// ============================
function flattenFeatureCollection(featureCollection) {
    if (featureCollection.type === 'FeatureCollection') {
        return featureCollection.features.flatMap(feature => {
            // If the feature is a FeatureCollection, flatten its features
            if (feature.type === 'FeatureCollection') {
                return flattenFeatureCollection(feature);  // Recursive call
            }
            return feature;  // Return individual feature
        });
    }
    return featureCollection;  // Return as-is if not a FeatureCollection
}

