let drawnPoints = [];
let snappedPoints = [];
let currentLine = null; // Track the current drawn line
let markers = [];
let selectedColor = '#FFFFFF'; // Default color
let selectedLineStyle = 'solid'; // Default to solid line
let segmentColorStyle = []; // Store the color and style of each segment
let previousPoint = null; // Store the last drawn point to start new segments
let segmentCounter = 0; // Counter for unique segment IDs
let originalPins = [];  // Store user-added pins


// Gravel type color mapping (last GOOD)
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

//2 ================================
// SECTION: Snap to Road Function (streamlined, no retries, no fallback)
// ================================
async function snapToRoads(points) {
    try {
        // Convert the points array to a string for Mapbox's API
        const coordinatesString = points.map(coord => coord.join(',')).join(';');
        const url = `https://api.mapbox.com/matching/v5/mapbox/cycling/${coordinatesString}?access_token=${mapboxgl.accessToken}&geometries=geojson&steps=true&tidy=true`;

        // Fetch data from Mapbox API
        const response = await fetch(url);

        // Parse the API response
        const data = await response.json();

        // Check if we received matchings and valid geometry data
        if (data && data.matchings && data.matchings.length > 0 && data.matchings[0].geometry && data.matchings[0].geometry.coordinates.length) {
            return data.matchings[0].geometry.coordinates; // Return snapped coordinates
        } else {
            console.error('No valid matchings from Mapbox API', data);
            return null;
        }
    } catch (error) {
        console.error('Error calling Mapbox API:', error);
        return null; // Return null on error
    }
}

// ============================
// SECTION: Snap to Road (Handles snapping points to the road)
// ============================
async function snapToRoad() {
    if (drawnPoints.length > 1) {
        const snappedSegment = await snapToRoads(drawnPoints); // Snap all drawn points

        if (snappedSegment && snappedSegment.length >= 2) {
            // Clear previously drawn segments
            removePreviousSegments(); // Ensures older lines don't overlap with new ones

            // Return the snapped points for drawing
            return snappedSegment;
        } else {
            console.error('Snapping failed, no line drawn');
            return null;
        }
    }
    return null;
}

// ============================
// SECTION: Preserve Colors and Draw Segments (Draws the segments and handles colors)
// ============================
function preserveColorsAndDrawSegments(snappedSegment) {
    // Iterate over the snappedSegment, but only draw from the last saved snapped point to the new one
    let lastIndex = snappedPoints.length > 0 ? snappedPoints.length - 1 : 0;  // Find the last snapped point

    for (let i = lastIndex; i < snappedSegment.length - 1; i++) {
        let color = selectedColor;
        let lineStyle = selectedLineStyle;

        // If there's an existing segment, use its color and style
        const existingSegment = segmentColorStyle.find(segment =>
            segment.coordinates[0][0] === snappedSegment[i][0] &&
            segment.coordinates[0][1] === snappedSegment[i][1] &&
            segment.coordinates[1][0] === snappedSegment[i + 1][0] &&
            segment.coordinates[1][1] === snappedSegment[i + 1][1]
        );

        if (existingSegment) {
            color = existingSegment.color;
            lineStyle = existingSegment.lineStyle;
        }

        drawSegment(snappedSegment[i], snappedSegment[i + 1], color, lineStyle);
    }

    // Store the new snapped points
    snappedPoints.push(...snappedSegment.slice(lastIndex + 1));  // Append only the new points
}




// ============================
// SECTION: Draw Point (Combines snapping and drawing with color preservation)
// ============================
async function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];

    // Add the current point to drawnPoints
    drawnPoints.push(coords);
    originalPins.push(coords);  // Store the actual user-clicked pin

    // Snap to road and draw segments if valid snapping occurs
    const snappedSegment = await snapToRoad();

    if (snappedSegment) {
        preserveColorsAndDrawSegments(snappedSegment); // Handle the drawing and color preservation
    }

    // Update the previous point to the current one for future connections
    previousPoint = coords;

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

    // Store the marker for future reference
    markers.push(marker);

    // If there's a previous marker, store the segment created between the two
    if (originalPins.length > 1) {
        const previousMarker = originalPins[originalPins.length - 2];
        segmentColorStyle.push({
            coordinates: [previousMarker, coords],
            color: selectedColor,
            lineStyle: selectedLineStyle,
            id: `segment-${segmentCounter++}`  // Create a unique segment ID
        });
    }
}

// ============================
// 1SECTION: Remove Previous Segments
// ============================
function removePreviousSegments() {
    // This function removes previously drawn segments from the map
    const layers = map.getStyle().layers.filter(layer => layer.id.startsWith('segment-'));
    layers.forEach(layer => {
        const sourceId = layer.id.replace('-layer', '');
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);  // Remove the corresponding source
        }
        map.removeLayer(layer.id);  // Remove the segment layer
    });
}


// ================================
// SECTION: Draw Individual Segment (Handles drawing lines on the map)
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

       // Store the segment's color and style
       segmentColorStyle.push({
        id: segmentId,
        coordinates: [start, end],
        color: color,
        lineStyle: lineStyle
    });

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
// SECTION: Reset Logic
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

    // Also remove all previously stored segments
    segmentColorStyle = []; // Clear the stored segment colors and styles
    drawnPoints = [];       // Clear drawn points
    snappedPoints = [];     // Clear snapped points
    markers.forEach(marker => marker.remove()); // Remove all markers from the map
    markers = [];           // Clear the markers array

    console.log("Route reset.");
}

// ============================
// SECTION: Undo Logic (refined)
// ============================

async function undoLastPoint() {
    if (originalPins.length > 1) {
        // Remove the last marker and its corresponding segment
        originalPins.pop();  // Remove the last user pin
        const lastMarker = markers.pop();
        if (lastMarker) lastMarker.remove();  // Remove the last marker

        // Get the last drawn segment and remove it
        const lastSegment = segmentColorStyle.pop();  // Remove the last drawn segment
        if (lastSegment) {
            const lastSegmentId = lastSegment.id;
            if (map.getLayer(lastSegmentId)) {
                map.removeLayer(lastSegmentId);  // Remove the segment layer
                if (map.getSource(lastSegmentId)) {
                    map.removeSource(lastSegmentId);  // Remove the source
                }
            }
            segmentCounter--;  // Decrement the segment counter
        }

        // Redraw the remaining route from snapped points (if any)
        removePreviousSegments();  // Clear existing segments

        if (snappedPoints.length > 1) {
            // Redraw the remaining segments
            preserveColorsAndDrawSegments(snappedPoints);
        } else {
            console.log('No more points to snap.');
        }
    } else if (originalPins.length === 1) {
        // If there's only one pin left, reset everything
        resetRoute();  // Reset everything when only one pin remains
    } else {
        console.log('Nothing to undo.');
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
