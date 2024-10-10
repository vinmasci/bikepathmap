let drawnPoints = [];
let currentLine = null; // Current drawn line
let drawingEnabled = false; // Flag for drawing mode
let markers = []; // Store all point markers

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
                // Add source for each route only if it doesn't already exist
                if (!map.getSource(`route-${route.routeId}`)) {
                    map.addSource(`route-${route.routeId}`, {
                        type: 'geojson',
                        data: route.geojson
                    });

                    // Add layer for the stroke
                    map.addLayer({
                        'id': `route-${route.routeId}-layer-stroke`,
                        'type': 'line',
                        'source': `route-${route.routeId}`,
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': 'black', // Black color for the stroke
                            'line-width': 5 // Stroke width to create an offset effect
                        }
                    });

                    // Add layer for the route
                    map.addLayer({
                        'id': `route-${route.routeId}-layer`,
                        'type': 'line',
                        'source': `route-${route.routeId}`,
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': 'cyan', // Cyan color for the line
                            'line-width': 3 // Width of the route line
                        }
                    });

                    // Add click event listener for the route layer
                    map.on('click', `route-${route.routeId}-layer`, function (e) {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: [`route-${route.routeId}-layer`]
                        });
                        if (features.length) {
                            const segmentId = route.routeId; // Get the segment ID
                            openSegmentModal(segmentId); // Open modal with the segment ID
                        }
                    });
                }
            });
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
