let drawnPoints = [];
let snappedPoints = [];
let currentLine = null;
let markers = [];
let selectedColor = '#FFFFFF'; // Default color
let selectedLineStyle = 'solid'; // Default to solid line

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
// SECTION: Toggle Functionality
// ============================
function toggleSegmentsLayer() {
    layerVisibility.segments = !layerVisibility.segments;

    if (layerVisibility.segments) {
        loadSegments(); // Load segments when toggled on
    } else {
        removeSegments(); // Remove segments when toggled off
    }

    updateTabHighlight('segments-tab', layerVisibility.segments);
}

// ============================
// SECTION: Enable Drawing Mode
// ============================
function enableDrawingMode() {
    console.log("Drawing mode enabled.");
    map.on('click', drawPoint); // Bind click event to draw points
    map.getCanvas().style.cursor = 'crosshair'; // Set the cursor to crosshair when drawing

    // Show the control panel when drawing mode is active
    document.getElementById('control-panel').style.display = 'block';
}

function disableDrawingMode() {
    console.log("Drawing mode disabled.");
    map.off('click', drawPoint); // Unbind the click event
    map.getCanvas().style.cursor = ''; // Reset cursor to default

    // Hide the control panel when drawing mode is disabled
    document.getElementById('control-panel').style.display = 'none';
}

// ================================
// SECTION: Snap to Road Function with Selected Style
// ================================
async function snapToRoads(points) {
    try {
        const coordinatesString = points.map(coord => coord.join(',')).join(';');

        // Request to Mapbox's Map Matching API with 'cycling' profile
        const response = await fetch(`https://api.mapbox.com/matching/v5/mapbox/cycling/${coordinatesString}?access_token=${mapboxgl.accessToken}&geometries=geojson&steps=true`);

        const data = await response.json();

        if (data && data.matchings) {
            snappedPoints = data.matchings[0].geometry.coordinates;

            if (currentLine) {
                map.removeLayer('drawn-route');
                map.removeSource('drawn-route');
            }

            currentLine = {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': snappedPoints
                }
            };

            map.addSource('drawn-route', { 'type': 'geojson', 'data': currentLine });

            map.addLayer({
                'id': 'drawn-route',
                'type': 'line',
                'source': 'drawn-route',
                'layout': { 
                    'line-join': 'round', 
                    'line-cap': 'round' 
                },
                'paint': {
                    'line-color': selectedColor, // Set the selected color
                    'line-width': 4,
                    'line-dasharray': selectedLineStyle === 'dashed' ? [2, 4] : [1] // Dashed or solid based on selection
                }
            });
        } else {
            console.error('Error snapping to road:', data.message);
        }
    } catch (error) {
        console.error('Error calling Mapbox API:', error);
    }
}

// ============================
// SECTION: Draw Point and Snap to Road
// ============================
function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    drawnPoints.push(coords);

    const markerElement = document.createElement('div');
    markerElement.style.width = '16px';
    markerElement.style.height = '16px';
    markerElement.style.backgroundColor = '#FFA500'; // Marker color
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '1px solid white';

    const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coords)
        .addTo(map);

    markers.push(marker);

    if (drawnPoints.length > 1) {
        snapToRoads(drawnPoints); // Snap to roads after the second point
    }
}


// ============================
// SECTION: Save Drawn Route
// ============================
function saveDrawnRoute() {
    if (snappedPoints.length > 1) {
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
                            'coordinates': snappedPoints
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

    if (currentLine) {
        map.removeLayer('drawn-route');
        map.removeSource('drawn-route');
        currentLine = null;
    }

    markers.forEach(marker => marker.remove());
    markers = [];
    drawnPoints = [];
    snappedPoints = [];
}

function undoLastPoint() {
    if (drawnPoints.length > 1) {
        drawnPoints.pop();
        const lastMarker = markers.pop();
        if (lastMarker) lastMarker.remove();
        if (drawnPoints.length > 1) {
            snapToRoads(drawnPoints);
        } else if (currentLine) {
            map.removeLayer('drawn-route');
            map.removeSource('drawn-route');
            currentLine = null;
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

                    // Add click event listener for the route layer
                    map.on('click', `${routeId}-layer`, function (e) {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: [`${routeId}-layer`]
                        });
                        if (features.length) {
                            const segmentId = route.routeId; // Get the segment ID
                            openSegmentModal(segmentId); // Open modal with the segment ID
                        }
                    });
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
            closeModal(); // Close the modal after deletion
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
