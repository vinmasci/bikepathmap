let drawnPoints = [];
let snappedPoints = [];
let currentLine = null; // Track the current drawn line
let markers = [];
let selectedColor = '#FFFFFF'; // Default color
let selectedLineStyle = 'solid'; // Default to solid line
let segmentColorStyle = []; // Store the color and style of each segment
let previousPoint = null; // Store the last drawn point to start new segments
let segmentCounter = 0; // Counter for unique segment IDs

// Gravel type color mapping
const gravelColors = {
    0: '#00a8ff', // Blue for rough asphalt
    1: '#4cd137', // Green for smooth gravel
    2: '#fbc531', // Yellow for slightly technical
    3: '#e84118', // Red for technical
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
    
    // Close the modal after applying
    document.getElementById('drawingOptionsModal').style.display = 'none';
});

// ============================
// SECTION: Enable Drawing Mode
// ============================
function enableDrawingMode() {
    console.log("Drawing mode enabled.");

    // Show the control panel when drawing mode is active
    document.getElementById('control-panel').style.display = 'block';
    
    // Wait for the user to apply drawing options
    document.getElementById('applyDrawingOptionsButton').addEventListener('click', function() {
        // Apply drawing mode once options are set
        map.on('click', drawPoint); // Bind click event to draw points after user applies options
        map.getCanvas().style.cursor = 'crosshair'; // Set the cursor to crosshair when drawing

        console.log("Drawing options applied, ready to draw.");
    }, { once: true }); // Ensure this event listener is only added once
}

function disableDrawingMode() {
    console.log("Drawing mode disabled.");
    map.off('click', drawPoint); // Unbind the click event to stop drawing points
    map.getCanvas().style.cursor = ''; // Reset cursor to default

    // Hide the control panel when drawing mode is disabled
    document.getElementById('control-panel').style.display = 'none';
}

// ================================
// SECTION: Snap to Road Function (updated to keep all segments)
// ================================
async function snapToRoads(points) {
    try {
        const coordinatesString = points.map(coord => coord.join(',')).join(';');

        // Request to Mapbox's Map Matching API with 'cycling' profile
        const response = await fetch(`https://api.mapbox.com/matching/v5/mapbox/cycling/${coordinatesString}?access_token=${mapboxgl.accessToken}&geometries=geojson&steps=true`);

        const data = await response.json();

        if (data && data.matchings && data.matchings[0].geometry.coordinates.length) {
            // Return the snapped coordinates for the segment
            return data.matchings[0].geometry.coordinates;
        } else {
            console.error('Error snapping to road:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error calling Mapbox API:', error);
        return null;
    }
}


// ============================
// SECTION: Draw Point and Snap to Road (Updated to support multiple segments)
// ============================
async function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];

    // Store the previous point before adding the new one
    if (previousPoint) {
        // Snap the segment between the previous point and the current point
        const snappedSegment = await snapToRoads([previousPoint, coords]);

        if (snappedSegment && snappedSegment.length === 2) {
            // Store the snapped segment's color and style
            segmentColorStyle.push({
                color: selectedColor,
                style: selectedLineStyle,
                points: [snappedSegment[0], snappedSegment[1]]
            });

            // Draw the snapped segment with the current selected color and style
            drawSegment(snappedSegment[0], snappedSegment[1], selectedColor, selectedLineStyle);
        }
    }

    // Update the previous point to the current point
    previousPoint = coords;
    drawnPoints.push(coords);

    // Create a new marker element with the current color
    const markerElement = document.createElement('div');
    markerElement.style.width = '16px';
    markerElement.style.height = '16px';
    markerElement.style.backgroundColor = selectedColor; // Set marker color to match current color
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '1px solid white';

    // Add the marker to the map
    const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coords)
        .addTo(map);

    markers.push(marker); // Store the marker
}


// ================================
// SECTION: Draw Individual Segment
// ================================
function drawSegment(start, end, color, lineStyle) {
    // Create a unique ID for the segment
    const segmentId = `segment-${segmentCounter++}`; // Increment segmentCounter to ensure uniqueness

    // Prepare the segment data
    const segmentLine = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': [start, end]
        }
    };

    // Add the segment as a unique source to the map
    map.addSource(segmentId, { 'type': 'geojson', 'data': segmentLine });

    // Add the segment as a unique layer to the map with the selected color and style
    map.addLayer({
        'id': segmentId,
        'type': 'line',
        'source': segmentId,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': color, // Use the passed color
            'line-width': 4,
            'line-dasharray': lineStyle === 'dashed' ? [2, 4] : [1] // Use dashed or solid line
        }
    });
}

// ============================
// SECTION: Save Drawn Route
// ============================
function saveDrawnRoute() {
    if (drawnPoints.length > 1) {
        // Open the modal for gravel/surface type selection
        const modal = document.getElementById('routeSaveModal');
        modal.style.display = 'block';

        // Set up the event listener for the save button
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
                            'gravelType': gravelTypes, // Store gravel type(s)
                            'surfaceType': surfaceType // Store surface type
                        }
                    }
                ]
            };

            // Make the request to save the route and metadata
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
                modal.style.display = 'none'; // Close the modal after saving
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

// ============================
// SECTION: Reset and Undo Logic
// ============================
function resetRoute() {
    console.log("Resetting route...");

    // Remove all segment layers and sources
    map.getStyle().layers
        .filter(layer => layer.id.startsWith('segment-'))
        .forEach(layer => {
            map.removeLayer(layer.id); // Remove the layer
            const sourceId = layer.id.replace('-layer', '');
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId); // Remove the corresponding source
            }
        });

    markers.forEach(marker => marker.remove()); // Remove all markers
    markers = [];
    drawnPoints = [];
    snappedPoints = [];
    console.log("Route reset.");
}

function undoLastPoint() {
    if (drawnPoints.length > 1) {
        drawnPoints.pop();
        const lastMarker = markers.pop();
        if (lastMarker) lastMarker.remove();
        if (drawnPoints.length > 1) {
            snapToRoads(drawnPoints);
        } else {
            console.log('No more points to snap.');
        }
    }
}

// ============================
// SECTION: Load Segments
// ============================
async function loadSegments() {
    try {
        const response = await fetch('/api/get-drawn-routes');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data && data.routes) {
            // Clear existing segments
            removeSegments();

            data.routes.forEach(route => {
                const routeId = `route-${route.routeId}`;

                // Add source for each route only if it doesn't already exist
                if (!map.getSource(routeId)) {
                    map.addSource(routeId, {
                        type: 'geojson',
                        data: route.geojson
                    });

                    // Determine the color based on gravel type
                    const routeColor = gravelColors[route.gravelType[0]] || '#FFFFFF'; // Default to white if undefined

                    // Add stroke layer (black outline)
                    map.addLayer({
                        'id': `${routeId}-layer-stroke`,
                        'type': 'line',
                        'source': routeId,
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': 'black', // Black color for the stroke
                            'line-width': 5 // Stroke width to create an offset effect
                        }
                    });

                    // Add colored layer for the route itself
                    map.addLayer({
                        'id': `${routeId}-layer`,
                        'type': 'line',
                        'source': routeId,
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': routeColor, // Set the route color based on gravel type
                            'line-width': 3 // Width of the route line
                        }
                    });

                    console.log(`Added route: ${route.routeId}, color: ${routeColor}`);
                }
            });
        } else {
            console.error("No routes found in the response data.");
        }
    } catch (error) {
        console.error('Error loading segments:', error);
    }
}

// ============================
// SECTION: Remove Segments
// ============================
function removeSegments() {
    const existingLayers = map.getStyle().layers.filter(layer => layer.id.startsWith('route-'));
    existingLayers.forEach(layer => {
        map.removeLayer(layer.id); // Remove the layer
        const sourceId = layer.id.replace('-layer', '');
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId); // Remove the corresponding source only if it exists
        }
    });
}

// ============================
// SECTION: DELETE SEGMENT
// ============================
async function deleteSegment(segmentId) {
    try {
        const response = await fetch(`/api/delete-drawn-route?id=${segmentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Segment deleted:', data);
            alert('Segment deleted successfully!');
            removeSegments(); // Update the map to remove the deleted segment
        } else {
            console.error('Failed to delete segment:', response.statusText);
            alert('Failed to delete segment.');
        }
    } catch (error) {
        console.error('Error deleting segment:', error);
        alert('An error occurred while deleting the segment.');
    }
}
